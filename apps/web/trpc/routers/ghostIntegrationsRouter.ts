import { verifyWebsiteAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const GhostIntegrationStatus = z.enum(["draft", "published", "scheduled"]);
type GhostIntegrationStatusType = z.infer<typeof GhostIntegrationStatus>;

const ghostIntegrationInputBaseSchema = z.object({
  websiteSlug: z.string(),
});

const ghostIntegrationCreateSchema = ghostIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty"),
  apiUrl: z.string().url("Invalid API URL format"),
});

const ghostIntegrationUpdateSchema = ghostIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty").optional(),
  apiUrl: z.string().url("Invalid API URL format").optional(),
  status: GhostIntegrationStatus.optional(),
});

export const ghostIntegrationsRouter = router({
  get: protectedProcedure
    .input(ghostIntegrationInputBaseSchema)
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);

      const integration = await prisma.ghostIntegration.findUnique({
        where: { website_id: website.id },
      });

      return integration;
    }),

  create: protectedProcedure
    .input(ghostIntegrationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug, apiKey, apiUrl } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);

      const existingIntegration = await prisma.ghostIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true },
      });

      if (existingIntegration) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ghost integration already exists for this website.",
        });
      }

      try {
        const newIntegration = await prisma.ghostIntegration.create({
          data: {
            website_id: website.id,
            api_key: apiKey,
            api_url: apiUrl,
          },
        });
        return newIntegration;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Ghost integration",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(ghostIntegrationUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug, apiKey, apiUrl, status } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);

      if (!apiKey && !apiUrl && !status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "At least one field (apiKey, apiUrl, or status) must be provided for update.",
        });
      }

      const integration = await prisma.ghostIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true },
      });

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ghost integration not found for this website.",
        });
      }

      try {
        const updatedIntegration = await prisma.ghostIntegration.update({
          where: { website_id: website.id },
          data: {
            ...(apiKey && { api_key: apiKey }),
            ...(apiUrl && { api_url: apiUrl }),
            ...(status && { status: status }),
          },
        });
        return updatedIntegration;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update Ghost integration",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(ghostIntegrationInputBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);

      const integration = await prisma.ghostIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true },
      });

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ghost integration not found for this website.",
        });
      }

      try {
        await prisma.ghostIntegration.delete({
          where: { website_id: website.id },
        });
        return {
          success: true,
          message: "Ghost integration deleted successfully.",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete Ghost integration",
          cause: error,
        });
      }
    }),
});
