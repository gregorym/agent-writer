import { verifyWebsiteAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const notionIntegrationInputBaseSchema = z.object({
  websiteSlug: z.string(),
});

const notionIntegrationCreateSchema = notionIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty"),
  databaseId: z.string().min(1, "Database ID cannot be empty"),
});

const notionIntegrationUpdateSchema = notionIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty").optional(),
  databaseId: z.string().min(1, "Database ID cannot be empty").optional(),
});

export const notionIntegrationsRouter = router({
  get: protectedProcedure
    .input(notionIntegrationInputBaseSchema)
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);

      const integration = await prisma.notionIntegration.findUnique({
        where: { website_id: website.id },
      });

      return integration;
    }),

  create: protectedProcedure
    .input(notionIntegrationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug, apiKey, databaseId } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);

      const existingIntegration = await prisma.notionIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true },
      });

      if (existingIntegration) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Notion integration already exists for this website.",
        });
      }

      try {
        const newIntegration = await prisma.notionIntegration.create({
          data: {
            website_id: website.id,
            api_key: apiKey,
            database_id: databaseId,
          },
        });
        return newIntegration;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Notion integration",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(notionIntegrationUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug, apiKey, databaseId } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);

      if (!apiKey && !databaseId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "At least one field (apiKey or databaseId) must be provided for update.",
        });
      }

      const integration = await prisma.notionIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true },
      });

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notion integration not found for this website.",
        });
      }

      try {
        const updatedIntegration = await prisma.notionIntegration.update({
          where: { website_id: website.id },
          data: {
            ...(apiKey && { api_key: apiKey }),
            ...(databaseId && { database_id: databaseId }),
          },
        });
        return updatedIntegration;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update Notion integration",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(notionIntegrationInputBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);

      const integration = await prisma.notionIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true },
      });

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notion integration not found for this website.",
        });
      }

      try {
        await prisma.notionIntegration.delete({
          where: { website_id: website.id },
        });
        return {
          success: true,
          message: "Notion integration deleted successfully.",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete Notion integration",
          cause: error,
        });
      }
    }),
});
