import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

type SearchHistoryState = Record<string, string[]>;

export const keywordHistoryAtom = atomWithStorage<SearchHistoryState>(
  "searchHistory",
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
