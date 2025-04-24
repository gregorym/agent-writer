"use client";

import { trpc } from "@/trpc/client";
import { FileText } from "lucide-react"; // Assuming you use lucide-react
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

interface ArticlesListProps {
  websiteSlug: string;
}

export function ArticlesList({ websiteSlug }: ArticlesListProps) {
  const {
    data: articles,
    isLoading,
    error,
  } = trpc.articles.all.useQuery({ websiteSlug });

  if (isLoading) {
    return (
      <div className="space-y-4">
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

  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">
          No articles yet
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Start creating articles for your website.
        </p>
        <Button className="mt-6">Create article</Button>{" "}
        {/* Add functionality later */}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <div
          key={article.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {article.title || "Untitled Article"}
              </p>
              <p className="text-sm text-muted-foreground">
                {/* Removed status display */}
                Created: {new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {/* Add action buttons (e.g., Edit, Delete) here */}
          <Button variant="ghost" size="sm">
            ...
          </Button>{" "}
          {/* Placeholder for actions */}
        </div>
      ))}
    </div>
  );
}
