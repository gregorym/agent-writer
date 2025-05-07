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

const createBoss = () => new PgBoss(process.env.DATABASE_URL_POOLING!);
const queueName = (action: "new-article" | "publish-article") =>
  `${action}_${process.env.NODE_ENV ?? "development"}`;

async function findNextScheduledDate(websiteId: number): Promise<Date> {
  const entries = await prisma.article.findMany({
    where: { website_id: websiteId, scheduled_at: { not: null } },
    select: { scheduled_at: true },
    orderBy: { scheduled_at: "asc" },
  });
  const occupied = new Set(
    entries
      .map((e) => e.scheduled_at!)
      .map((d) => {
        d.setUTCHours(0, 0, 0, 0);
        return d.toISOString().split("T")[0];
      })
  );

  const candidate = new Date();
  candidate.setUTCDate(candidate.getUTCDate() + 1);
  candidate.setUTCHours(9, 0, 0, 0);

  while (
    occupied.has(candidate.toISOString().split("T")[0]) ||
    candidate.getUTCDay() === 0 ||
    candidate.getUTCDay() === 6
  ) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate;
}

export const articlesRouter = router({
  create: protectedProcedure
    .input(articleCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const website = await verifyWebsiteAccess(userId, input.websiteSlug);
      const websiteId = website.id;

      if (input.scheduled_at && input.scheduled_at <= new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Scheduled date must be in the future.",
        });
      }

      let scheduledAt = input.scheduled_at;
      if (!scheduledAt) {
        scheduledAt = await findNextScheduledDate(websiteId);
      } else {
        const dayStart = new Date(scheduledAt);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayStart.getUTCDate() + 1);

        const conflict = await prisma.article.findFirst({
          where: {
            website_id: websiteId,
            scheduled_at: { gte: dayStart, lt: dayEnd },
          },
          select: { id: true },
        });
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An article is already scheduled for this day.",
          });
        }
      }

      const boss = createBoss();
      await boss.start();
      await boss.createQueue(queueName("new-article"));

      try {
        let article = await prisma.article.create({
          data: {
            website_id: websiteId,
            topic: input.topic,
            title: input.title,
            markdown: input.markdown,
            scheduled_at: scheduledAt,
            backlinks: input.backlinks ?? [],
            keywords: input.keyword,
          },
        });

        if (scheduledAt > new Date()) {
          const jobId = await boss.send(
            queueName("new-article"),
            { id: article.id },
            { startAfter: scheduledAt }
          );
          if (jobId) {
            article = await prisma.article.update({
              where: { id: article.id },
              data: { job_id: jobId },
            });
          }
        }

        return article;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create or schedule article",
          cause: err,
        });
      } finally {
        await boss.stop();
      }
    }),

  update: protectedProcedure
    .input(articleUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { articleId, websiteSlug, ...data } = input;
      const website = await verifyWebsiteAccess(userId, websiteSlug);
      const current = await prisma.article.findUnique({
        where: { id: articleId, website_id: website.id },
        select: { job_id: true, scheduled_at: true },
      });
      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found or does not belong to this website.",
        });
      }

      if (data.scheduled_at && data.scheduled_at <= new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Scheduled date must be in the future.",
        });
      }

      let newJobId = current.job_id;
      if (
        "scheduled_at" in data &&
        data.scheduled_at?.toISOString() !== current.scheduled_at?.toISOString()
      ) {
        const boss = createBoss();
        await boss.start();
        await boss.createQueue(queueName("new-article"));

        if (current.job_id) {
          await boss
            .cancel(queueName("new-article"), current.job_id)
            .catch(() => {});
          newJobId = null;
        }

        if (data.scheduled_at) {
          newJobId = await boss.send(
            queueName("new-article"),
            { id: articleId },
            { startAfter: data.scheduled_at }
          );
        }

        await boss.stop();
      }

      return await prisma.article.update({
        where: { id: articleId, website_id: website.id },
        data: {
          ...data,
          backlinks: data.backlinks ?? undefined,
          job_id: newJobId,
        },
      });
    }),

  retry: protectedProcedure
    .input(articleIdAndSlugSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const website = await verifyWebsiteAccess(userId, input.websiteSlug);
      const article = await prisma.article.findUnique({
        where: { id: input.articleId, website_id: website.id },
      });
      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found.",
        });
      }

      const boss = createBoss();
      await boss.start();
      await boss.createQueue(queueName("new-article"));

      if (article.job_id) {
        await boss
          .deleteJob(queueName("new-article"), article.job_id)
          .catch(() => {});
      }

      const jobId = await boss.send(queueName("new-article"), {
        id: article.id,
      });
      await boss.stop();

      if (jobId) {
        await prisma.article.update({
          where: { id: article.id },
          data: { job_id: jobId },
        });
      }
    }),

  delete: protectedProcedure
    .input(articleIdAndSlugSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const website = await verifyWebsiteAccess(userId, input.websiteSlug);
      const article = await prisma.article.findUnique({
        where: { id: input.articleId, website_id: website.id },
      });
      if (
        !article ||
        article.markdown ||
        !article.scheduled_at ||
        article.scheduled_at <= new Date()
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Article cannot be deleted.",
        });
      }

      await prisma.article.delete({
        where: { id: article.id, website_id: website.id },
      });
      return { success: true };
    }),

  get: protectedProcedure
    .input(articleIdAndSlugSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const website = await verifyWebsiteAccess(userId, input.websiteSlug);
      const article = await prisma.article.findUnique({
        where: { id: input.articleId, website_id: website.id },
      });
      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found.",
        });
      }
      return article;
    }),

  all: protectedProcedure
    .input(websiteSlugSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const website = await verifyWebsiteAccess(userId, input.websiteSlug);
      return prisma.article.findMany({
        where: { website_id: website.id },
        orderBy: { scheduled_at: "desc" },
      });
    }),

  publish: protectedProcedure
    .input(articleIdAndSlugSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const website = await verifyWebsiteAccess(userId, input.websiteSlug);
      const article = await prisma.article.findUnique({
        where: { id: input.articleId, website_id: website.id },
      });
      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Article not found.",
        });
      }
      const boss = createBoss();
      await boss.start();
      await boss.createQueue(queueName("publish-article"));

      await boss.send(queueName("publish-article"), {
        id: article.id,
      });
      await boss.stop();
    }),
});
