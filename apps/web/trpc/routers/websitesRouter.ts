import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import PgBoss from "pg-boss";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const websiteSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  url: z.string().url("Invalid URL format"),
});

// Add schema for updating, including the slug
const updateWebsiteSchema = websiteSchema.extend({
  slug: z.string(),
  topic: z.string().min(1, "Topic cannot be empty"), // Make topic required
});

export const websitesRouter = router({
  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { slug } = input;
      const website = await prisma.website.findUnique({
        where: { slug, user_id: userId },
      });
      if (!website) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Website not found",
        });
      }
      return website;
    }),

  all: protectedProcedure.query(async ({ ctx }) => {
    const { id: userId } = ctx.session.user;

    const websites = await prisma.website.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });
    return websites;
  }),

  create: protectedProcedure
    .input(websiteSchema) // Use the updated schema
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { name, url, topic } = input;

      try {
        const newWebsite = await prisma.website.create({
          data: {
            user_id: userId,
            name,
            url,
            context: topic,
            slug: name.toLowerCase().replace(/\s+/g, "-"),
          },
        });

        const boss = new PgBoss(process.env.DATABASE_URL_POOLING!);
        await boss.start();
        // Ensure queue name is unique per environment if needed, or use a single queue
        const queueName = `website-context_${process.env.NODE_ENV || "development"}`;
        await boss.createQueue(queueName); // Might not be needed if auto-creation is handled

        const id = await boss.send(queueName, { id: newWebsite.id });
        await boss.stop();

        return newWebsite;
      } catch (error) {
        console.error("Failed to create website:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create website",
          cause: error,
        });
      }
    }),

  // Add the update procedure
  update: protectedProcedure
    .input(updateWebsiteSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { slug, name, url, topic } = input;

      // Verify the user owns the website
      const existingWebsite = await prisma.website.findUnique({
        where: { slug, user_id: userId },
      });

      if (!existingWebsite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Website not found or you do not have permission to edit it.",
        });
      }

      try {
        const updatedWebsite = await prisma.website.update({
          where: {
            id: existingWebsite.id, // Use the actual ID for update
          },
          data: {
            name,
            url,
            context: topic,
          },
        });
        return updatedWebsite;
      } catch (error) {
        console.error("Failed to update website:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update website",
          cause: error,
        });
      }
    }),

  // Add the delete procedure
  delete: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { slug } = input;

      // Verify the user owns the website
      const existingWebsite = await prisma.website.findUnique({
        where: { slug, user_id: userId },
        select: { id: true }, // Only select the ID
      });

      if (!existingWebsite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Website not found or you do not have permission to delete it.",
        });
      }

      try {
        // Use a transaction to delete articles and the website
        const deletedData = await prisma.$transaction(async (tx) => {
          // Delete associated articles first
          await tx.article.deleteMany({
            where: { website_id: existingWebsite.id },
          });

          // Then delete the website
          const deletedWebsite = await tx.website.delete({
            where: {
              id: existingWebsite.id,
            },
          });
          return deletedWebsite;
        });

        return { success: true, deletedWebsiteId: deletedData.id };
      } catch (error) {
        console.error("Failed to delete website and its articles:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete website",
          cause: error,
        });
      }
    }),
});
