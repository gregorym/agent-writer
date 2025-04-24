"use client"; // Add this if not present, needed for hooks

import { AppSidebar } from "@/components/app-sidebar";
import { ArticlesList } from "@/components/articles-list"; // Import the new component
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useParams } from "next/navigation"; // Import useParams

// Rename the page component for clarity
export default function WebsiteDashboardPage() {
  const params = useParams();
  const slug = params.slug as string; // Get slug from URL

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
            {/* Add page title or header here if needed */}
            <h1 className="text-2xl font-semibold">Articles</h1>
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Render the ArticlesList component */}
              {slug ? (
                <ArticlesList websiteSlug={slug} />
              ) : (
                <p>Loading website...</p>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
