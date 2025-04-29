import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

// Define allowed statuses
const GhostIntegrationStatus = z.enum(["draft", "published", "scheduled"]);
type GhostIntegrationStatusType = z.infer<typeof GhostIntegrationStatus>;

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

const ghostIntegrationInputBaseSchema = z.object({
  websiteSlug: z.string(),
});

const ghostIntegrationCreateSchema = ghostIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty"),
  apiUrl: z.string().url("Invalid API URL format"),
  // Status is not set on creation, defaults in DB or logic if needed
});

const ghostIntegrationUpdateSchema = ghostIntegrationInputBaseSchema.extend({
  apiKey: z.string().min(1, "API Key cannot be empty").optional(),
  apiUrl: z.string().url("Invalid API URL format").optional(),
  status: GhostIntegrationStatus.optional(), // Allow updating status
});

export const ghostIntegrationsRouter = router({
  get: protectedProcedure
    .input(ghostIntegrationInputBaseSchema)
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input;

      // 1. Verify ownership first
      const website = await verifyWebsiteOwnership(userId, websiteSlug);

      // 2. Fetch the integration including the status
      const integration = await prisma.ghostIntegration.findUnique({
        where: { website_id: website.id },
        // Select status field
      });

      // Integration might not exist, which is fine for a 'get' operation
      return integration;
    }),

  create: protectedProcedure
    .input(ghostIntegrationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug, apiKey, apiUrl } = input;

      // 1. Verify ownership
      const website = await verifyWebsiteOwnership(userId, websiteSlug);

      // 2. Check if integration already exists
      const existingIntegration = await prisma.ghostIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true }, // Only need to know if it exists
      });

      if (existingIntegration) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ghost integration already exists for this website.",
        });
      }

      // 3. Create the integration (status will have default or be null)
      try {
        const newIntegration = await prisma.ghostIntegration.create({
          data: {
            website_id: website.id,
            api_key: apiKey,
            api_url: apiUrl,
            // status: 'draft', // Optionally set a default status here if desired
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
      const { websiteSlug, apiKey, apiUrl, status } = input; // Include status

      // 1. Verify ownership
      const website = await verifyWebsiteOwnership(userId, websiteSlug);

      // 2. Check if at least one field is provided for update
      if (!apiKey && !apiUrl && !status) {
        // Add status check
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "At least one field (apiKey, apiUrl, or status) must be provided for update.",
        });
      }

      // 3. Check if integration exists before trying to update
      const integration = await prisma.ghostIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true }, // Only need ID to confirm existence
      });

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ghost integration not found for this website.",
        });
      }

      // 4. Update the integration
      try {
        const updatedIntegration = await prisma.ghostIntegration.update({
          where: { website_id: website.id },
          data: {
            ...(apiKey && { api_key: apiKey }),
            ...(apiUrl && { api_url: apiUrl }),
            ...(status && { status: status }), // Update status if provided
          },
        });
        return updatedIntegration;
      } catch (error) {
        console.error("Failed to update Ghost integration:", error);
        // Could add more specific error handling, e.g., for unique constraint violations if any
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update Ghost integration",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(ghostIntegrationInputBaseSchema) // Use base schema with websiteSlug
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input; // Use websiteSlug from input

      // 1. Verify ownership
      const website = await verifyWebsiteOwnership(userId, websiteSlug);

      // 2. Check if integration exists before trying to delete
      const integration = await prisma.ghostIntegration.findUnique({
        where: { website_id: website.id },
        select: { id: true }, // Only need ID to confirm existence
      });

      if (!integration) {
        // It's arguably okay to return success if it doesn't exist (idempotent delete)
        // But throwing NOT_FOUND might be clearer for the client.
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ghost integration not found for this website.",
        });
      }

      // 3. Delete the integration
      try {
        await prisma.ghostIntegration.delete({
          where: { website_id: website.id },
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
