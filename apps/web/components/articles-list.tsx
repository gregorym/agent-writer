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
import { Clock, FileText, Loader2, Pencil, Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateArticleForm } from "./create-article-form";
import { Badge } from "./ui/badge";
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
} from "./ui/table";

interface ArticlesListProps {
  websiteSlug: string;
}

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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const article = row.original;
      let statusText = "Draft";
      let badgeVariant: "default" | "secondary" | "outline" | "destructive" =
        "secondary";
      let Icon = Pencil;

      if (
        article.markdown &&
        article.scheduled_at &&
        new Date(article.scheduled_at) > new Date()
      ) {
        statusText = "Scheduled";
        badgeVariant = "default";
        Icon = Clock;
      } else if (
        article.markdown &&
        article.published_at &&
        new Date(article.published_at) <= new Date()
      ) {
        statusText = "Published";
        badgeVariant = "default";
        Icon = Send;
      } else if (
        !article.markdown &&
        article.scheduled_at &&
        new Date(article.scheduled_at) > new Date()
      ) {
        statusText = "Pending Generation";
        badgeVariant = "outline";
        Icon = Loader2;
      } else if (!article.scheduled_at) {
        statusText = "Draft";
        badgeVariant = "secondary";
        Icon = Pencil;
      }

      return (
        <Badge variant={badgeVariant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {statusText}
        </Badge>
      );
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
  const router = useRouter();
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
    data: articles ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-red-500">Error loading articles: {error.message}</p>
    );
  }

  const renderHeader = () => (
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
    return (
      <div>
        {renderHeader()}
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
                  }
                  className="cursor-pointer"
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
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
