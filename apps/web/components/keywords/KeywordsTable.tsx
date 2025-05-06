// Create a new file: /Users/gregorymarcilhacy/code/bloggy-ai-bot/apps/web/components/keywords/RelatedKeywordsTable.tsx
import { articleKeywordHistoryAtom } from "@/atoms";
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
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useAtomValue } from "jotai";
import { ArrowUpDown, Check, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { CreateArticleForm } from "../create-article-form";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export type KeywordData = {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: string;
  competition: string;
};

interface KeywordsTableProps {
  data: KeywordData[];
  isLoading: boolean;
  websiteSlug: string;
}

export function KeywordsTable({
  data,
  isLoading,
  websiteSlug,
}: KeywordsTableProps) {
  const articleKeywordHistory = useAtomValue(articleKeywordHistoryAtom);
  const usedArticleKeywords = articleKeywordHistory[websiteSlug] || [];
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const handleCreateSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    setSelectedKeyword(null);
    utils.articles.all.invalidate({ websiteSlug });
  }, [utils, websiteSlug]);

  const handleActionClick = (keyword: string) => {
    setSelectedKeyword(keyword);
    setCreateDialogOpen(true);
  };

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
                onClick={() => handleActionClick(keyword)}
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
    [usedArticleKeywords, handleActionClick]
  );

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg border">
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
      <div className="rounded-lg border">
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
