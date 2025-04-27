"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { GhostIntegrationForm } from "@/components/ghost-integration-form"; // We will create this next
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function IntegrationsPage() {
  const params = useParams<{ slug: string }>();
  const websiteSlug = params.slug;
  const [isGhostOpen, setIsGhostOpen] = useState(false);
  // Add states for other integrations later

  const {
    data: website,
    isLoading: isLoadingWebsite,
    error: websiteError,
  } = trpc.websites.get.useQuery(
    { slug: websiteSlug },
    {
      enabled: !!websiteSlug,
    }
  );

  // Handle error state for website loading
  if (websiteError) {
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
              Error loading website data: {websiteError.message}
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
              <h1 className="text-2xl font-bold">Integrations</h1>
              {isLoadingWebsite && (
                <div className="space-y-4 p-4">
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
              {website && (
                <div className="space-y-4">
                  {/* Ghost Integration */}
                  <Collapsible open={isGhostOpen} onOpenChange={setIsGhostOpen}>
                    <div className="flex items-center justify-between space-x-4 rounded-md border px-4 py-2">
                      <h4 className="text-sm font-semibold">
                        Ghost Integration
                      </h4>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isGhostOpen ? "Close" : "Configure"}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-2 p-4">
                      <GhostIntegrationForm websiteId={website.id} />
                    </CollapsibleContent>
                  </Collapsible>

                  {/* GitHub Integration (Placeholder) */}
                  <Collapsible disabled>
                    <div className="flex items-center justify-between space-x-4 rounded-md border px-4 py-2 opacity-50">
                      <h4 className="text-sm font-semibold">
                        GitHub Integration
                      </h4>
                      <Button variant="ghost" size="sm" disabled>
                        Configure
                      </Button>
                    </div>
                    {/* <CollapsibleContent>...</CollapsibleContent> */}
                  </Collapsible>

                  {/* Google Search Console Integration (Placeholder) */}
                  <Collapsible disabled>
                    <div className="flex items-center justify-between space-x-4 rounded-md border px-4 py-2 opacity-50">
                      <h4 className="text-sm font-semibold">
                        Google Search Console Integration
                      </h4>
                      <Button variant="ghost" size="sm" disabled>
                        Configure
                      </Button>
                    </div>
                    {/* <CollapsibleContent>...</CollapsibleContent> */}
                  </Collapsible>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
