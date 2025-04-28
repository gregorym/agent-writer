import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import PgBoss from "pg-boss";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const articleCreateSchema = z.object({
  websiteSlug: z.string(),
  topic: z.string().optional(),
  title: z.string().optional(),
  markdown: z.string().optional(),
  scheduled_at: z.date().optional().nullable(),
  backlinks: z.array(z.string()).optional(), // Add backlinks schema
});

const articleUpdateSchema = z.object({
  articleId: z.number(),
  websiteSlug: z.string(),
  topic: z.string().optional(),
  title: z.string().optional(),
  markdown: z.string().optional(),
  scheduled_at: z.date().optional().nullable(),
  backlinks: z.array(z.string()).optional(), // Add backlinks schema
});

const articleIdAndSlugSchema = z.object({
  articleId: z.number(),
  websiteSlug: z.string(),
});

const websiteSlugSchema = z.object({
  websiteSlug: z.string(),
});

// Helper function to verify website ownership and existence
const verifyWebsiteAccess = async (userId: string, slug: string) => {
  const website = await prisma.website.findUnique({
    where: { slug, user_id: userId },
    select: { id: true }, // Only select the ID for efficiency
  });
  if (!website) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Website not found or access denied.",
    });
  }
  return website.id;
};

export const articlesRouter = router({
  create: protectedProcedure
    .input(articleCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug, topic, title, markdown, scheduled_at, backlinks } =
        input; // Destructure backlinks

      const websiteId = await verifyWebsiteAccess(userId, websiteSlug);

      // Check if an article is already scheduled for the same day
      if (scheduled_at) {
        const scheduledDate = new Date(scheduled_at);
        scheduledDate.setUTCHours(0, 0, 0, 0); // Start of the day in UTC

        const nextDay = new Date(scheduledDate);
        nextDay.setUTCDate(scheduledDate.getUTCDate() + 1); // Start of the next day

        const existingScheduledArticle = await prisma.article.findFirst({
          where: {
            website_id: websiteId,
            scheduled_at: {
              gte: scheduledDate,
              lt: nextDay,
            },
          },
          select: { id: true }, // Only need to check for existence
        });

        if (existingScheduledArticle) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An article is already scheduled for this day.",
          });
        }
      }

      try {
        const newArticle = await prisma.article.create({
          data: {
            website_id: websiteId,
            topic,
            title,
            markdown,
            scheduled_at,
            backlinks: backlinks ?? [], // Save backlinks, default to empty array if undefined
          },
        });

        return newArticle;
      } catch (error) {
        console.error("Failed to create article:", error);
        // Avoid re-throwing if it's the CONFLICT error we already handled
        if (error instanceof TRPCError && error.code === "CONFLICT") {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create article",
          cause: error,
        });
      }
    }),

  retry: protectedProcedure
    .input(articleIdAndSlugSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { articleId, websiteSlug } = input;
      const websiteId = await verifyWebsiteAccess(userId, websiteSlug);
      const article = await prisma.article.findUnique({
        where: { id: articleId, website_id: websiteId },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found or does not belong to this website.",
        });
      }

      const boss = new PgBoss(process.env.DATABASE_URL_POOLING!);
      await boss.start();
      // Ensure queue name is unique per environment if needed, or use a single queue
      const queueName = `new-article_${process.env.NODE_ENV || "development"}`;
      await boss.createQueue(queueName); // Might not be needed if auto-creation is handled

      const id = await boss.send(queueName, { id: article.id });
      await boss.stop();

      if (id) {
        await prisma.article.update({
          where: { id: article.id },
          data: { job_id: id },
        });
      }
    }),
  update: protectedProcedure
    .input(articleUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { articleId, websiteSlug, ...updateData } = input;

      const websiteId = await verifyWebsiteAccess(userId, websiteSlug);

      // Ensure backlinks is set to an empty array if undefined in the input
      const dataToUpdate = {
        ...updateData,
        backlinks: updateData.backlinks ?? undefined, // Prisma handles undefined correctly for optional fields
      };

      try {
        const updatedArticle = await prisma.article.update({
          where: { id: articleId, website_id: websiteId }, // Ensure article belongs to the website
          data: dataToUpdate, // Use the potentially modified data
        });
        return updatedArticle;
      } catch (error: any) {
        // Check if the error is because the record was not found
        if (error.code === "P2025") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found or does not belong to this website.",
          });
        }
        console.error("Failed to update article:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update article",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(articleIdAndSlugSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { articleId, websiteSlug } = input;

      const websiteId = await verifyWebsiteAccess(userId, websiteSlug);

      // Fetch the article to check its properties
      const article = await prisma.article.findUnique({
        where: { id: articleId, website_id: websiteId },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found or does not belong to this website.",
        });
      }

      // Check conditions for deletion
      const canDelete =
        !article.markdown &&
        article.scheduled_at &&
        article.scheduled_at > new Date();

      if (!canDelete) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Article cannot be deleted. It must have no content and be scheduled for the future.",
        });
      }

      try {
        await prisma.article.delete({
          where: { id: articleId, website_id: websiteId },
        });
        return { success: true };
      } catch (error: any) {
        // Check if the error is because the record was not found (shouldn't happen after the check above, but good practice)
        if (error.code === "P2025") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found during deletion attempt.",
          });
        }
        console.error("Failed to delete article:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete article",
          cause: error,
        });
      }
    }),

  get: protectedProcedure
    .input(articleIdAndSlugSchema)
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { articleId, websiteSlug } = input;

      const websiteId = await verifyWebsiteAccess(userId, websiteSlug);

      const article = await prisma.article.findUnique({
        where: { id: articleId, website_id: websiteId }, // Ensure article belongs to the website
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found or does not belong to this website.",
        });
      }
      return article;
    }),

  all: protectedProcedure
    .input(websiteSlugSchema)
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { websiteSlug } = input;

      const websiteId = await verifyWebsiteAccess(userId, websiteSlug);

      const articles = await prisma.article.findMany({
        where: { website_id: websiteId }, // Corrected: Removed trailing comma if any, ensured correct syntax
        orderBy: { scheduled_at: "desc" }, // Added comma before orderBy
      });
      return articles;
    }),
});
