import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const imageHistoryAtom = atomWithStorage<string[]>("history", []);

type SearchHistoryState = Record<string, string[]>;
type ArticleKeywordHistoryState = Record<string, string[]>; // New type for article keywords

export const keywordHistoryAtom = atomWithStorage<SearchHistoryState>(
  "keywordsHistory",
  {}
);

export const addKeywordToHistoryAtom = atom(
  null, // write-only atom
  (get, set, { slug, keyword }: { slug: string; keyword: string }) => {
    const currentHistory = get(keywordHistoryAtom);
    const slugHistory = currentHistory[slug] || [];

    const newSlugHistory = [
      keyword,
      ...slugHistory.filter((k) => k !== keyword),
    ];

    // Optional: Limit history size (e.g., keep last 10)
    const limitedHistory = newSlugHistory.slice(0, 10);

    set(keywordHistoryAtom, {
      ...currentHistory,
      [slug]: limitedHistory,
    });
  }
);

export const keywordsForSlugAtom = atom(
  (get) => (slug: string) => get(keywordHistoryAtom)[slug] || []
);

// --- New Atoms for Article Keyword History ---

export const articleKeywordHistoryAtom =
  atomWithStorage<ArticleKeywordHistoryState>("articleKeywordHistory", {});

export const addArticleKeywordToHistoryAtom = atom(
  null, // write-only atom
  (get, set, { slug, keyword }: { slug: string; keyword: string }) => {
    const currentHistory = get(articleKeywordHistoryAtom);
    const slugHistory = currentHistory[slug] || [];

    // Add keyword only if it's not already the most recent one
    if (slugHistory[0] !== keyword) {
      const newSlugHistory = [
        keyword,
        ...slugHistory.filter((k) => k !== keyword),
      ];

      // Optional: Limit history size (e.g., keep last 10)
      const limitedHistory = newSlugHistory.slice(0, 10);

      set(articleKeywordHistoryAtom, {
        ...currentHistory,
        [slug]: limitedHistory,
      });
    }
  }
);

export const articleKeywordsForSlugAtom = atom(
  (get) => (slug: string) => get(articleKeywordHistoryAtom)[slug] || []
);
