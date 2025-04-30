import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import PgBoss from "pg-boss";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const websiteSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  url: z.string().url("Invalid URL format"),
  topic: z.string().min(1, "Topic cannot be empty"),
});

const updateWebsiteSchema = websiteSchema.extend({
  slug: z.string(),
  topic: z.string().min(1, "Topic cannot be empty"),
});

export const websitesRouter = router({
  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { slug } = input;
      const website = await prisma.website.findUnique({
        omit: {
          id: true,
        },
        where: { slug, user_id: userId },
        include: {
          ghostIntegration: {
            select: {
              id: true,
            },
          },
          githubIntegration: {
            select: {
              id: true,
            },
          },
        },
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
      omit: { id: true },
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });
    return websites;
  }),

  create: protectedProcedure
    .input(websiteSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { name, url, topic } = input;

      try {
        const newWebsite = await prisma.website.create({
          omit: { id: true },
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

        const queueName = `website-context_${process.env.NODE_ENV || "development"}`;
        await boss.createQueue(queueName);

        await boss.send(queueName, { id: newWebsite.id });
        await boss.stop();

        return newWebsite;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create website",
          cause: error,
        });
      }
    }),

  update: protectedProcedure
    .input(updateWebsiteSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { slug, name, url, topic } = input;

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
          omit: { id: true },
          where: {
            id: existingWebsite.id,
          },
          data: {
            name,
            url,
            context: topic,
          },
        });
        return updatedWebsite;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update website",
          cause: error,
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { slug } = input;

      const existingWebsite = await prisma.website.findUnique({
        where: { slug, user_id: userId },
        select: { id: true },
      });

      if (!existingWebsite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Website not found or you do not have permission to delete it.",
        });
      }

      try {
        const deletedData = await prisma.$transaction(async (tx) => {
          await tx.article.deleteMany({
            where: { website_id: existingWebsite.id },
          });

          const deletedWebsite = await tx.website.delete({
            where: {
              id: existingWebsite.id,
            },
          });
          return deletedWebsite;
        });

        return { success: true, deletedWebsiteId: deletedData.id };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete website",
          cause: error,
        });
      }
    }),
});
