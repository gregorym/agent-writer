"use client";

import { trpc } from "@/trpc/client";
import { FileText, Plus } from "lucide-react"; // Import Plus icon
import Link from "next/link"; // Import Link
import { useState } from "react"; // Import useState
import { CreateArticleForm } from "./create-article-form"; // Import the new form
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"; // Import Dialog components
import { Skeleton } from "./ui/skeleton";

interface ArticlesListProps {
  websiteSlug: string;
}

export function ArticlesList({ websiteSlug }: ArticlesListProps) {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const utils = trpc.useUtils();
  const {
    data: articles,
    isLoading,
    error,
    refetch,
  } = trpc.articles.all.useQuery({ websiteSlug });

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    // utils.articles.all.invalidate({ websiteSlug }); // Invalidate query cache
    refetch(); // Or simply refetch the data
  };

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

  // Add a header with the Create Article button
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
          {/* Button moved to the header dialog trigger */}
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderHeader()} {/* Render header above the list */}
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/w/${websiteSlug}/articles/${article.id}`}
            className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {article.title || "Not generated yet"}{" "}
                    {/* Display topic if title is missing */}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(article.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {/* Removed placeholder button, whole item is clickable */}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
