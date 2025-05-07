import { verifyWebsiteAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const googleSearchIntegrationInputBaseSchema = z.object({
  websiteSlug: z.string(),
});

const googleSearchIntegrationCreateSchema =
  googleSearchIntegrationInputBaseSchema.extend({
    apiKey: z.string().min(1, "API Key cannot be empty"),
  });

const googleSearchIntegrationUpdateSchema =
  googleSearchIntegrationInputBaseSchema.extend({
    apiKey: z.string().min(1, "API Key cannot be empty").optional(),
    dirPath: z.string().optional().nullable(),
    repoName: z.string().optional().nullable(),
  });

export const googleSearchIntegrationsRouter = router({
  get: protectedProcedure
    .input(googleSearchIntegrationInputBaseSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { websiteSlug } = input;
      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const integration = await prisma.googleSearchIntegration.findUnique({
        where: { website_id: website.id },
      });
      return integration;
    }),

  delete: protectedProcedure
    .input(googleSearchIntegrationInputBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { websiteSlug } = input;
      const website = await verifyWebsiteAccess(userId, websiteSlug);

      try {
        await prisma.googleSearchIntegration.deleteMany({
          where: { website_id: website.id },
        });
        return {
          success: true,
          message: "Google Search integration deleted successfully.",
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
