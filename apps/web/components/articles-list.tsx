"use client";

import { trpc } from "@/trpc/client";
import { Article } from "@bloggy/database";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter
import { useState } from "react";
import { CreateArticleForm } from "./create-article-form";
import { Badge } from "./ui/badge"; // Import Badge
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"; // Import Table components

interface ArticlesListProps {
  websiteSlug: string;
}

// Define columns for the table
const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title");
      return (
        title || (
          <span className="text-muted-foreground">Not generated yet</span>
        )
      );
    },
  },
  {
    accessorKey: "status", // Placeholder for status
    header: "Status",
    cell: ({ row }) => {
      // Determine status based on article properties (e.g., markdown content, scheduled_at)
      const article = row.original;
      let statusText = "Draft"; // Default status
      let badgeVariant: "default" | "secondary" | "outline" | "destructive" =
        "secondary"; // Default variant

      if (
        article.markdown &&
        article.scheduled_at &&
        new Date(article.scheduled_at) > new Date()
      ) {
        statusText = "Scheduled";
        badgeVariant = "default"; // Blue-ish default
      } else if (
        article.markdown &&
        article.published_at &&
        new Date(article.published_at) <= new Date()
      ) {
        // Assuming published if markdown exists and date is past (needs Ghost check ideally)
        statusText = "Published";
        badgeVariant = "default"; // Use default (often primary color) or create a green variant if needed
        // If you have a specific green variant, use it here. For now, using default.
      } else if (
        !article.markdown &&
        article.scheduled_at &&
        new Date(article.scheduled_at) > new Date()
      ) {
        statusText = "Pending Generation";
        badgeVariant = "outline"; // Orange-ish outline
      } else if (!article.scheduled_at) {
        statusText = "Draft";
        badgeVariant = "secondary"; // Greyish secondary
      }

      return <Badge variant={badgeVariant}>{statusText}</Badge>;
    },
  },
  {
    accessorKey: "scheduled_at",
    header: "Scheduled Date",
    cell: ({ row }) => {
      const date = row.getValue("scheduled_at");
      return date ? (
        format(new Date(date as string), "PPP")
      ) : (
        <span className="text-muted-foreground">Not scheduled</span>
      );
    },
  },
];

export function ArticlesList({ websiteSlug }: ArticlesListProps) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const router = useRouter(); // Initialize router
  const utils = trpc.useUtils();
  const {
    data: articles,
    isLoading,
    error,
    refetch,
  } = trpc.articles.all.useQuery({ websiteSlug });

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    refetch();
  };

  const table = useReactTable({
    data: articles ?? [], // Provide empty array if articles is undefined
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    // ... existing skeleton loading state ...
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" /> {/* Header skeleton */}
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    // ... existing error state ...
    return (
      <p className="text-red-500">Error loading articles: {error.message}</p>
    );
  }

  const renderHeader = () => (
    // ... existing header with Create button ...
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">Articles</h2>
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Article
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Article</DialogTitle>
          </DialogHeader>
          <CreateArticleForm
            websiteSlug={websiteSlug}
            onSuccess={handleCreateSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );

  if (!articles || articles.length === 0) {
    // ... existing empty state ...
    return (
      <div>
        {renderHeader()} {/* Render header even when empty */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">
            No articles yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Click the button above to create your first article.
          </p>
        </div>
      </div>
    );
  }

  // Render the table
  return (
    <div>
      {renderHeader()}
      <div className="rounded-md border">
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
                  onClick={() =>
                    router.push(`/w/${websiteSlug}/articles/${row.original.id}`)
                  } // Navigate on click
                  className="cursor-pointer" // Add cursor pointer
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
                  No results.{" "}
                  {/* This should ideally not be reached due to the check above */}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
