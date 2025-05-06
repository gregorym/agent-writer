"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { KeywordsTable } from "./KeywordsTable";

type KeywordData = {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: string;
  competition: string;
};

interface WebsiteKeywordsProps {
  locationName: string | null | undefined;
  languageName: string | null | undefined;
  websiteSlug: string;
}

export function WebsiteKeywords({
  locationName,
  languageName,
  websiteSlug,
}: WebsiteKeywordsProps) {
  const [url, setUrl] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: keywordsData, isLoading } = trpc.keywords.byWebsite.useQuery(
    {
      url: url!,
      locationName: locationName || "",
      languageName: languageName || "",
    },
    {
      enabled: isAnalyzing && !!locationName && !!languageName,
    }
  );

  const handleAnalyze = () => {
    if (!url) {
      setError("Please enter a website URL");
      return;
    }

    if (!locationName || !languageName) {
      setError("Website location or language settings not available");
      return;
    }

    setError(null);
    setIsAnalyzing(true);
  };

  const handleReset = () => {
    setIsAnalyzing(false);
    setUrl("");
    setSorting([]); // Reset sorting on reset
  };

  const columns: ColumnDef<KeywordData>[] = [
    {
      accessorKey: "keyword",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Keyword
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("keyword")}</div>
      ),
    },
    {
      accessorKey: "volume",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-right w-full justify-end"
          >
            Search Volume
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("volume"));
        return <div className="text-right">{amount.toLocaleString()}</div>;
      },
    },
    {
      accessorKey: "difficulty",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-right w-full justify-end"
          >
            Difficulty
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("difficulty"));
        return <div className="text-right">{amount.toFixed(1)}</div>;
      },
    },
    {
      accessorKey: "intent",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-right w-full justify-end"
          >
            Intent
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-right">{row.getValue("intent")}</div>
      ),
    },
    {
      accessorKey: "competition",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-right w-full justify-end"
          >
            Competition
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-right">{row.getValue("competition")}</div>
      ),
    },
  ];

  const table = useReactTable({
    data: keywordsData?.keywords || [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Enter website URL (e.g., example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isAnalyzing && isLoading}
            className="flex-1"
          />
          {!isAnalyzing ? (
            <Button
              onClick={handleAnalyze}
              disabled={!locationName || !languageName}
            >
              Analyze Keywords
            </Button>
          ) : (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>

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
