import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const articleCreateSchema = z.object({
  websiteSlug: z.string(),
  topic: z.string().optional(),
  title: z.string().optional(),
  markdown: z.string().optional(),
  scheduled_at: z.date().optional().nullable(),
});

const articleUpdateSchema = z.object({
  articleId: z.number(),
  websiteSlug: z.string(),
  topic: z.string().optional(),
  title: z.string().optional(),
  markdown: z.string().optional(),
  scheduled_at: z.date().optional().nullable(),
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
      const { websiteSlug, topic, title, markdown, scheduled_at } = input;

      const websiteId = await verifyWebsiteAccess(userId, websiteSlug);

      try {
        const newArticle = await prisma.article.create({
          data: {
            website_id: websiteId,
            topic,
            title,
            markdown,
            scheduled_at,
          },
        });
        return newArticle;
      } catch (error) {
        console.error("Failed to create article:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create article",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(articleUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { articleId, websiteSlug, ...updateData } = input;

      const websiteId = await verifyWebsiteAccess(userId, websiteSlug);

      try {
        const updatedArticle = await prisma.article.update({
          where: { id: articleId, website_id: websiteId }, // Ensure article belongs to the website
          data: updateData,
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

      try {
        await prisma.article.delete({
          where: { id: articleId, website_id: websiteId }, // Ensure article belongs to the website
        });
        return { success: true };
      } catch (error: any) {
        // Check if the error is because the record was not found
        if (error.code === "P2025") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article not found or does not belong to this website.",
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
        where: { website_id: websiteId },
        orderBy: { created_at: "desc" },
      });
      return articles;
    }),
});
