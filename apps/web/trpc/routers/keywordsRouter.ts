import { z } from "zod";
import { keywordsByWebsite, keywordSuggestions } from "../../lib/seo";
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
