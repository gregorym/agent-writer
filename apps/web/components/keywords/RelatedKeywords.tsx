"use client";

import {
  addKeywordToHistoryAtom,
  articleKeywordHistoryAtom,
  keywordHistoryAtom,
} from "@/atoms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAtomValue, useSetAtom } from "jotai";
import { ArrowUpDown, Check, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { CreateArticleForm } from "../create-article-form";

type KeywordData = {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: string;
  competition: string;
};

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const addKeywordToHistory = useSetAtom(addKeywordToHistoryAtom);
  const keywordHistory = useAtomValue(keywordHistoryAtom);
  const searchHistory = keywordHistory[websiteSlug] || [];
  const articleKeywordHistory = useAtomValue(articleKeywordHistoryAtom);
  const usedArticleKeywords = articleKeywordHistory[websiteSlug] || [];

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
    setSorting([]);
  };

  const handleHistoryClick = (historyKeyword: string) => {
    handleAnalyze(historyKeyword);
  };

  const handleCreateSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    setSelectedKeyword(null);
    utils.articles.all.invalidate({ websiteSlug });
  }, [utils, websiteSlug]);

  const columns = useMemo<ColumnDef<KeywordData>[]>(
    () => [
      {
        accessorKey: "keyword",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
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
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
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
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="text-right w-full justify-end"
            >
              Difficulty
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("difficulty"));
          return (
            <div
              className={cn(
                "w-fit p-1 rounded text-center ml-auto",
                amount <= 10 && "bg-green-100 text-green-900",
                amount > 10 && amount <= 30 && "bg-lime-200 text-lime-900",
                amount > 30 && amount <= 50 && "bg-yellow-200 text-yellow-900",
                amount > 50 && amount <= 70 && "bg-orange-300 text-orange-900",
                amount > 70 && amount <= 90 && "bg-red-300 text-red-900",
                amount > 90 && "bg-red-500 text-white"
              )}
            >
              {amount}
            </div>
          );
        },
      },
      {
        accessorKey: "intent",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
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
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
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
      {
        id: "actions",
        header: () => <div className="text-right">Action(s)</div>,
        cell: ({ row }) => {
          const keyword = row.original.keyword;
          const isUsed = usedArticleKeywords.includes(keyword);

          return (
            <div className="text-right">
              <Button
                variant="ghost"
                className="text-right"
                onClick={() => {
                  setSelectedKeyword(keyword);
                  setCreateDialogOpen(true);
                }}
                title={"Create article with this keyword"}
              >
                {isUsed && <Check className="h-4 w-4 mr-1" />}
                {!isUsed && <Plus className="h-4 w-4" />}
              </Button>
            </div>
          );
        },
      },
    ],
    [usedArticleKeywords]
  );

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
    <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
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
              <span className="text-sm text-muted-foreground mr-2">
                History:
              </span>
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
          <div className="rounded-lg border">
            {isLoading && (
              <div className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            )}

            {!isLoading && keywordsData && (
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Article</DialogTitle>
        </DialogHeader>
        <CreateArticleForm
          websiteSlug={websiteSlug}
          keyword={selectedKeyword ?? undefined}
          onSuccess={handleCreateSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
