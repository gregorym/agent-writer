import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

// Helper function to verify website ownership
const verifyWebsiteOwnership = async (userId: string, websiteSlug: string) => {
  const website = await prisma.website.findUnique({
    where: { slug: websiteSlug },
    select: { id: true, user_id: true }, // Select only necessary fields
  });

  if (!website) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Website not found.",
    });
  }

  if (website.user_id !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to access this website's resources.",
    });
  }

  return website; // Return website id for convenience
};

const githubIntegrationInputBaseSchema = z.object({
  websiteSlug: z.string(),
});

const githubIntegrationCreateSchema = githubIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty"),
});

const githubIntegrationUpdateSchema = githubIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty").optional(),
  dirPath: z.string().optional(),
});

export const githubIntegrationsRouter = router({
  get: protectedProcedure
    .input(githubIntegrationInputBaseSchema)
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input;

      // 1. Verify ownership first
      const website = await verifyWebsiteOwnership(userId, websiteSlug);

      // 2. Fetch the integration
      const integration = await prisma.githubIntegration.findUnique({
        where: { website_id: website.id },
        // No need to include website again, we already verified ownership
      });

      // Integration might not exist, which is fine for a 'get' operation
      return integration;
    }),

  create: protectedProcedure
    .input(githubIntegrationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      // Remove apiUrl from input destructuring
      const { websiteSlug, apiKey } = input;

      // 1. Verify ownership
      const website = await verifyWebsiteOwnership(userId, websiteSlug);

      // 2. Check if integration already exists
      const existingIntegration = await prisma.githubIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true }, // Only need to know if it exists
      });

      if (existingIntegration) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ghost integration already exists for this website.",
        });
      }

      // 3. Create the integration (remove apiUrl)
      try {
        const newIntegration = await prisma.githubIntegration.create({
          data: {
            website_id: website.id,
            api_key: apiKey,
            // api_url: apiUrl, // Removed
          },
        });
        return newIntegration;
      } catch (error) {
        console.error("Failed to create Github integration:", error); // Updated log message
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Github integration", // Updated error message
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(githubIntegrationUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug, apiKey, dirPath } = input;

      // 1. Verify ownership
      const website = await verifyWebsiteOwnership(userId, websiteSlug);

      // 2. Check if at least one field is provided for update (only apiKey now)
      // Remove check for apiUrl
      if (!apiKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The apiKey field must be provided for update.", // Updated message
        });
      }

      // 3. Check if integration exists before trying to update
      const integration = await prisma.githubIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true }, // Only need ID to confirm existence
      });

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ghost integration not found for this website.", // Corrected message
        });
      }

      // 4. Update the integration (remove apiUrl)
      try {
        const updatedIntegration = await prisma.githubIntegration.update({
          where: { website_id: website.id },
          data: {
            ...(apiKey && { api_key: apiKey }),
            ...(dirPath && { dir_path: dirPath }),
          },
        });
        return updatedIntegration;
      } catch (error) {
        console.error("Failed to update Github integration:", error); // Updated log message
        // Could add more specific error handling, e.g., for unique constraint violations if any
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update Github integration", // Updated error message
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(githubIntegrationInputBaseSchema) // Use base schema with websiteSlug
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input; // Use websiteSlug from input

      // 1. Verify ownership
      const website = await verifyWebsiteOwnership(userId, websiteSlug);

      // 2. Check if integration exists before trying to delete
      const integration = await prisma.githubIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true }, // Only need ID to confirm existence
      });

      if (!integration) {
        // It's arguably okay to return success if it doesn't exist (idempotent delete)
        // But throwing NOT_FOUND might be clearer for the client.
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Github integration not found for this website.", // Corrected message
        });
      }

      // 3. Delete the integration
      try {
        await prisma.githubIntegration.delete({
          where: { website_id: website.id },
        });
        return {
          success: true,
          message: "Github integration deleted successfully.", // Updated message
        };
      } catch (error) {
        console.error("Failed to delete Github integration:", error); // Updated log message
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete Github integration", // Updated error message
          cause: error,
        });
      }
    }),
});
