"use client";

import { trpc } from "@/trpc/client";
import { KeywordsTable } from "./KeywordsTable";

interface AIKeywordsProps {
  locationName: string | null | undefined;
  languageName: string | null | undefined;
  websiteSlug: string;
}

export function AIKeywords({
  locationName,
  languageName,
  websiteSlug,
}: AIKeywordsProps) {
  const { data: keywordsData, isLoading } = trpc.keywords.aiGenerated.useQuery(
    {
      slug: websiteSlug,
    },
    {
      enabled: !!locationName && !!languageName,
    }
  );

  return (
    <div className="space-y-4">
      <KeywordsTable
        data={keywordsData?.keywords || []}
        isLoading={isLoading}
        websiteSlug={websiteSlug}
      />
    </div>
  );
}
