"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { EditArticleForm } from "@/components/edit-article-form";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation"; // Import useParams

export default function EditArticlePage() {
  const params = useParams<{ slug: string; id: string }>(); // Get slug and id from params
  const websiteSlug = params.slug;
  const articleId = parseInt(params.id, 10); // Ensure id is a number

  // Fetch the specific article
  const {
    data: article,
    isLoading,
    error,
  } = trpc.articles.get.useQuery(
    { articleId, websiteSlug },
    {
      enabled: !!articleId && !!websiteSlug, // Only run query if ids are available
    }
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 p-4 md:p-6">
            {/* Remove the h1 title, it's now inside ArticlesList */}
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {isLoading && (
                <div className="space-y-4 p-4">
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-1/4" />
                </div>
              )}
              {article && (
                <div className="container mx-auto p-4">
                  <h1 className="mb-4 text-2xl font-bold">Edit Article</h1>
                  <EditArticleForm
                    websiteSlug={websiteSlug}
                    article={article}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
