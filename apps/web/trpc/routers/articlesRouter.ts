import { verifyWebsiteAccess } from "@/lib/access";
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
  keyword: z.string().optional(),
  scheduled_at: z.date().optional().nullable(),
  backlinks: z.array(z.string()).optional(),
});

const articleUpdateSchema = z.object({
  articleId: z.number(),
  websiteSlug: z.string(),
  topic: z.string().optional(),
  title: z.string().optional(),
  markdown: z.string().optional(),
  scheduled_at: z.date().optional().nullable(),
  backlinks: z.array(z.string()).optional(),
});

const articleIdAndSlugSchema = z.object({
  articleId: z.number(),
  websiteSlug: z.string(),
});

const websiteSlugSchema = z.object({
  websiteSlug: z.string(),
});

export const articlesRouter = router({
  create: protectedProcedure
    .input(articleCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      let { websiteSlug, topic, title, markdown, scheduled_at, backlinks } =
        input; // Use let for scheduled_at

      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const websiteId = website.id;

      if (scheduled_at) {
        // User provided a specific date, check for conflicts on that day
        const scheduledDate = new Date(scheduled_at);
        scheduledDate.setUTCHours(0, 0, 0, 0);

        const nextDay = new Date(scheduledDate);
        nextDay.setUTCDate(scheduledDate.getUTCDate() + 1);

        const existingScheduledArticle = await prisma.article.findFirst({
          where: {
            website_id: websiteId,
            scheduled_at: {
              gte: scheduledDate,
              lt: nextDay,
            },
          },
          select: { id: true },
        });

        if (existingScheduledArticle) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An article is already scheduled for this day.",
          });
        }
      } else {
        // User did not provide a date, find the next available day starting from tomorrow
        const scheduledArticles = await prisma.article.findMany({
          where: {
            website_id: websiteId,
            scheduled_at: {
              not: null,
            },
          },
          select: { scheduled_at: true },
          orderBy: { scheduled_at: "asc" },
        });

        const scheduledDates = new Set(
          scheduledArticles
            .map((a) => {
              if (!a.scheduled_at) return null;
              const date = new Date(a.scheduled_at);
              date.setUTCHours(0, 0, 0, 0);
              return date.toISOString().split("T")[0]; // Store dates as YYYY-MM-DD strings
            })
            .filter((d): d is string => d !== null)
        );

        // Start searching from tomorrow
        let nextAvailableDate = new Date();
        nextAvailableDate.setUTCDate(nextAvailableDate.getUTCDate() + 1); // Start from tomorrow
        nextAvailableDate.setUTCHours(0, 0, 0, 0);

        while (
          scheduledDates.has(
            nextAvailableDate.toISOString().split("T")[0] || ""
          )
        ) {
          nextAvailableDate.setUTCDate(nextAvailableDate.getUTCDate() + 1);
        }
        scheduled_at = nextAvailableDate; // Assign the found date
      }

      try {
        const newArticle = await prisma.article.create({
          data: {
            website_id: websiteId,
            topic,
            title,
            markdown,
            scheduled_at, // Use the potentially updated scheduled_at
            backlinks: backlinks ?? [],
            keywords: input.keyword,
          },
        });

        return newArticle;
      } catch (error) {
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
      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const websiteId = website.id;
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

      const queueName = `new-article_${process.env.NODE_ENV || "development"}`;
      await boss.createQueue(queueName);

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

      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const websiteId = website.id;

      const dataToUpdate = {
        ...updateData,
        backlinks: updateData.backlinks ?? undefined,
      };

      try {
        const updatedArticle = await prisma.article.update({
          where: { id: articleId, website_id: websiteId },
          data: dataToUpdate,
        });
        return updatedArticle;
      } catch (error: any) {
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

      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const websiteId = website.id;

      const article = await prisma.article.findUnique({
        where: { id: articleId, website_id: websiteId },
      });

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found or does not belong to this website.",
        });
      }

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

      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const websiteId = website.id;

      const article = await prisma.article.findUnique({
        where: { id: articleId, website_id: websiteId },
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

      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const websiteId = website.id;

      const articles = await prisma.article.findMany({
        where: { website_id: websiteId },
        orderBy: { scheduled_at: "desc" },
      });
      return articles;
    }),
  publish: protectedProcedure
    .input(articleIdAndSlugSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { articleId, websiteSlug } = input;

      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const websiteId = website.id;

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
      const queueName = `publish-article_${process.env.NODE_ENV || "development"}`;
      await boss.createQueue(queueName);

      await boss.send(queueName, { id: article.id });
      await boss.stop();
    }),
});
