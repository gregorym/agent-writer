import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const websiteSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
  url: z.string().url("Invalid URL format"),
  topic: z.string().min(1, "Topic cannot be empty"), // Make topic required
});

// Add schema for updating, including the slug
const updateWebsiteSchema = websiteSchema.extend({
  slug: z.string(),
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
            // Optionally update the slug if the name changes, handle potential conflicts
            // slug: name.toLowerCase().replace(/\s+/g, "-"),
          },
        });
        return updatedWebsite;
      } catch (error) {
        console.error("Failed to update website:", error);
        // Handle potential unique constraint violation if slug is updated and conflicts
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "P2002" &&
          error.meta?.target?.includes("slug")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "A website with this name (resulting in the same slug) already exists.",
            cause: error,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update website",
          cause: error,
        });
      }
    }),
});
