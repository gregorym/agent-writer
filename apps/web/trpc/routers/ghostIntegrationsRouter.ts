import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const ghostIntegrationSchema = z.object({
  websiteId: z.string(),
  apiKey: z.string().min(1, "API Key cannot be empty"),
  apiUrl: z.string().url("Invalid API URL format"),
});

const ghostIntegrationUpdateSchema = z.object({
  websiteId: z.string(),
  apiKey: z.string().min(1, "API Key cannot be empty").optional(),
  apiUrl: z.string().url("Invalid API URL format").optional(),
});

export const ghostIntegrationsRouter = router({
  create: protectedProcedure
    .input(ghostIntegrationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteId, apiKey, apiUrl } = input;

      // Verify user owns the website
      const website = await prisma.website.findUnique({
        where: { id: websiteId, user_id: userId },
      });

      if (!website) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Website not found or you do not have permission.",
        });
      }

      // Check if integration already exists
      const existingIntegration = await prisma.ghostIntegration.findUnique({
        where: { website_id: websiteId },
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
            website_id: websiteId,
            api_key: apiKey,
            api_url: apiUrl,
          },
        });
        return newIntegration;
      } catch (error) {
        console.error("Failed to create Ghost integration:", error);
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
      const { websiteId, apiKey, apiUrl } = input;

      // Verify user owns the website associated with the integration
      const integration = await prisma.ghostIntegration.findUnique({
        where: { website_id: websiteId },
        include: { website: true },
      });

      if (!integration || integration.website.user_id !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ghost integration not found or you do not have permission.",
        });
      }

      if (!apiKey && !apiUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "At least one field (apiKey or apiUrl) must be provided for update.",
        });
      }

      try {
        const updatedIntegration = await prisma.ghostIntegration.update({
          where: { website_id: websiteId },
          data: {
            ...(apiKey && { api_key: apiKey }),
            ...(apiUrl && { api_url: apiUrl }),
          },
        });
        return updatedIntegration;
      } catch (error) {
        console.error("Failed to update Ghost integration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update Ghost integration",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ websiteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteId } = input;

      // Verify user owns the website associated with the integration
      const integration = await prisma.ghostIntegration.findUnique({
        where: { website_id: websiteId },
        include: { website: true },
      });

      if (!integration || integration.website.user_id !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ghost integration not found or you do not have permission.",
        });
      }

      try {
        await prisma.ghostIntegration.delete({
          where: { website_id: websiteId },
        });
        return {
          success: true,
          message: "Ghost integration deleted successfully.",
        };
      } catch (error) {
        console.error("Failed to delete Ghost integration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete Ghost integration",
          cause: error,
        });
      }
    }),
});
