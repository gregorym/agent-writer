import { verifyWebsiteAccess } from "@/lib/access";
import { z } from "zod";
import {
  keywordsByWebsite,
  keywordsByWebsiteLLM,
  keywordSuggestions,
} from "../../lib/seo";
import { protectedProcedure, router } from "../trpc";

export const keywordsRouter = router({
  byWebsite: protectedProcedure
    .input(
      z.object({
        url: z.string(),
        locationName: z.string(),
        languageName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { url, locationName, languageName } = input;
      try {
        const keywords = await keywordsByWebsite(
          url,
          locationName,
          languageName
        );
        return { keywords };
      } catch (error) {
        throw new Error(
          `Failed to fetch keywords: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }),

  aiGenerated: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const website = await verifyWebsiteAccess(userId, input.slug);

      const all = await prisma?.website.findUnique({
        where: {
          id: website.id,
        },
      });

      if (!all) {
        throw new Error("Website not found");
      }

      const keywords = await keywordsByWebsiteLLM(
        all.url,
        all.name,
        all.context ?? ""
      );
      return { keywords };
    }),
  related: protectedProcedure
    .input(
      z.object({
        keyword: z.string(),
        locationName: z.string(),
        languageName: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { keyword, locationName, languageName } = input;
      try {
        const keywords = await keywordSuggestions(
          keyword,
          locationName,
          languageName
        );
        return { keywords };
      } catch (error) {
        throw new Error(
          `Failed to fetch keywords: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }),
});
