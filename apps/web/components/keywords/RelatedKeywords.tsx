"use client";

import { addKeywordToHistoryAtom, keywordHistoryAtom } from "@/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { KeywordsTable } from "./KeywordsTable";

interface RelatedKeywordsProps {
  locationName: string | null | undefined;
  languageName: string | null | undefined;
  websiteSlug: string;
}

export function RelatedKeywords({
  locationName,
  languageName,
  websiteSlug,
}: RelatedKeywordsProps) {
  const [keyword, setKeyword] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addKeywordToHistory = useSetAtom(addKeywordToHistoryAtom);
  const keywordHistory = useAtomValue(keywordHistoryAtom);
  const searchHistory = keywordHistory[websiteSlug] || [];

  const { data: keywordsData, isLoading } = trpc.keywords.related.useQuery(
    {
      keyword: keyword!,
      locationName: locationName || "",
      languageName: languageName || "",
    },
    {
      enabled: isAnalyzing && !!keyword && !!locationName && !!languageName,
    }
  );

  const handleAnalyze = (searchKeyword: string = keyword) => {
    if (!searchKeyword) {
      setError("Please enter a keyword");
      return;
    }

    if (!locationName || !languageName) {
      setError("Website location or language settings not available");
      return;
    }

    setError(null);
    if (!searchHistory.includes(searchKeyword)) {
      addKeywordToHistory({ slug: websiteSlug, keyword: searchKeyword });
    }
    setKeyword(searchKeyword);
    setIsAnalyzing(true);
  };

  const handleReset = () => {
    setIsAnalyzing(false);
    setKeyword("");
  };

  const handleHistoryClick = (historyKeyword: string) => {
    handleAnalyze(historyKeyword);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Enter keyword (e.g., 'best seo tools')"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isAnalyzing && isLoading}
            className="flex-1"
          />
          {!isAnalyzing ? (
            <Button
              onClick={() => handleAnalyze()}
              disabled={!locationName || !languageName}
            >
              Find Related Keywords
            </Button>
          ) : (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
        {searchHistory.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm text-muted-foreground mr-2">History:</span>
            {searchHistory.map((histKeyword) => (
              <Button
                key={histKeyword}
                variant="outline"
                size="sm"
                className="h-auto py-0.5 px-2 text-xs"
                onClick={() => handleHistoryClick(histKeyword)}
                disabled={isAnalyzing && isLoading}
              >
                {histKeyword}
              </Button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {isAnalyzing && (
        <KeywordsTable
          data={keywordsData?.keywords || []}
          isLoading={isLoading}
          websiteSlug={websiteSlug}
        />
      )}
    </div>
  );
}
