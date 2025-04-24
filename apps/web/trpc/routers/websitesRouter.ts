import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const websiteSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  url: z.string().url("Invalid URL format"),
  topic: z.string().optional(),
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
    .input(websiteSchema)
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.session.user;
      const { name, url, topic } = input;

      try {
        const newWebsite = await prisma.website.create({
          data: {
            user_id: userId,
            name,
            url,
            topic,
          },
        });
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
});
