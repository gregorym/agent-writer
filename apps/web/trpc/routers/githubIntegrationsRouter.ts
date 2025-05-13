import { verifyWebsiteAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { Octokit } from "@octokit/rest";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const getGithubRepos = async (apiKey: string): Promise<string[]> => {
  try {
    const octokit = new Octokit({ auth: apiKey });
    const repos = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
    });
    return repos.data.map((repo) => repo.full_name);
  } catch (error: any) {
    if (error.status === 401) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid GitHub API Key.",
        cause: error,
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch repositories from GitHub.",
      cause: error,
    });
  }
};

const githubIntegrationInputBaseSchema = z.object({
  websiteSlug: z.string(),
});

const githubIntegrationCreateSchema = githubIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty"),
});

const githubIntegrationUpdateSchema = githubIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty").optional(),
  dirPath: z.string().optional().nullable(),
  repoName: z.string().optional().nullable(),
});

export const githubIntegrationsRouter = router({
  get: protectedProcedure
    .input(githubIntegrationInputBaseSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { websiteSlug } = input;
      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const integration = await prisma.githubIntegration.findUnique({
        where: { website_id: website.id },
      });
      return integration;
    }),

  listRepos: protectedProcedure
    .input(githubIntegrationInputBaseSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { websiteSlug } = input;
      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const integration = await prisma.githubIntegration.findUnique({
        where: { website_id: website.id },
        select: { api_key: true },
      });
      if (!integration || !integration.api_key) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "GitHub integration or API key not found for this website.",
        });
      }
      const repoNames = await getGithubRepos(integration.api_key);
      return repoNames;
    }),

  create: protectedProcedure
    .input(githubIntegrationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { websiteSlug, apiKey } = input;
      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const existingIntegration = await prisma.githubIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true },
      });
      if (existingIntegration) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "GitHub integration already exists for this website.",
        });
      }
      const repoNames = await getGithubRepos(apiKey);
      if (repoNames.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The provided API key does not have access to any repositories or no repositories were found.",
        });
      }
      const firstRepoName = repoNames[0];
      try {
        const newIntegration = await prisma.githubIntegration.create({
          data: {
            website_id: website.id,
            api_key: apiKey,
            repo_name: firstRepoName,
          },
        });
        return newIntegration;
      } catch (error: unknown) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Github integration",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(githubIntegrationUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { websiteSlug, apiKey, dirPath, repoName } = input;
      const website = await verifyWebsiteAccess(userId, websiteSlug);

      if (
        apiKey === undefined &&
        dirPath === undefined &&
        repoName === undefined
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "At least one field (apiKey, dirPath, repoName) must be provided for update.",
        });
      }

      const currentIntegration = await prisma.githubIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true, api_key: true, repo_name: true },
      });

      if (!currentIntegration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Github integration not found for this website.",
        });
      }

      let validatedRepoName: string | null | undefined = repoName;
      let accessibleRepos: string[] = [];
      const keyToUse = apiKey || currentIntegration.api_key;

      if (!keyToUse) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Cannot validate repository without an API key.",
        });
      }

      try {
        accessibleRepos = await getGithubRepos(keyToUse);
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch repositories while validating update.",
          cause: error,
        });
      }

      if (repoName !== undefined) {
        if (repoName === null) {
          validatedRepoName = null;
        } else if (!accessibleRepos.includes(repoName)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Repository '${repoName}' is not accessible with the provided/existing API key.`,
          });
        } else {
          validatedRepoName = repoName;
        }
      } else if (apiKey) {
        const currentRepoName = currentIntegration.repo_name;
        if (currentRepoName && accessibleRepos.includes(currentRepoName)) {
          validatedRepoName = currentRepoName;
        } else if (accessibleRepos.length > 0) {
          validatedRepoName = accessibleRepos[0];
        } else {
          validatedRepoName = null;
        }
      } else {
        validatedRepoName = currentIntegration.repo_name;
      }

      const updateData: any = {};
      let needsUpdate = false;

      if (apiKey !== undefined && apiKey !== currentIntegration.api_key) {
        updateData.api_key = apiKey;
        needsUpdate = true;
      }

      if (dirPath !== undefined) {
        updateData.dir_path = dirPath;
        needsUpdate = true;
      }

      if (
        repoName !== undefined ||
        (apiKey && validatedRepoName !== currentIntegration.repo_name)
      ) {
        updateData.repo_name = validatedRepoName;
        needsUpdate = true;
      }

      if (!needsUpdate) {
        return await prisma.githubIntegration.findUnique({
          where: { id: currentIntegration.id },
        });
      }

      try {
        const updatedIntegration = await prisma.githubIntegration.update({
          where: { website_id: website.id },
          data: updateData,
        });
        return updatedIntegration;
      } catch (error: unknown) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update Github integration",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(githubIntegrationInputBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { websiteSlug } = input;
      const website = await verifyWebsiteAccess(userId, websiteSlug);

      try {
        await prisma.githubIntegration.deleteMany({
          where: { website_id: website.id },
        });
        return {
          success: true,
          message: "Github integration deleted successfully.",
        };
      } catch (error: unknown) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete Github integration",
          cause: error,
        });
      }
    }),
});
