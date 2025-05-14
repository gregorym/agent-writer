"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { EditWebsiteForm } from "@/components/edit-website-form"; // Import the new form
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";

export default function EditWebsiteSettingsPage() {
  const params = useParams<{ slug: string }>(); // Get slug from params
  const websiteSlug = params.slug;

  // Fetch the specific website data
  const {
    data: website,
    isLoading,
    error,
  } = trpc.websites.get.useQuery(
    { slug: websiteSlug },
    {
      enabled: !!websiteSlug, // Only run query if slug is available
    }
  );

  // Handle error state
  if (error) {
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
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            <p className="text-red-500">
              Error loading website settings: {error.message}
            </p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <h1 className="text-2xl font-bold">Website Settings</h1>
              {isLoading && (
                <div className="space-y-4 p-4">
                  {/* Skeletons for loading state */}
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-1/4" />
                </div>
              )}
              {website && (
                <div className="container mx-auto p-4">
                  {/* @ts-ignore */}
                  <EditWebsiteForm website={website} />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
