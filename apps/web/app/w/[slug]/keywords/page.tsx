"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { RelatedKeywords } from "@/components/keywords/RelatedKeywords";
import { WebsiteKeywords } from "@/components/keywords/WebsiteKeywords";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";

export default function KeywordsPage() {
  const params = useParams<{ slug: string }>();
  const websiteSlug = params.slug;

  const { data: website } = trpc.websites.get.useQuery({ slug: websiteSlug });

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
              <h1 className="text-2xl font-bold">Keywords Analysis</h1>
              <Tabs defaultValue="website">
                <TabsList>
                  <TabsTrigger value="website">Website keywords</TabsTrigger>
                  <TabsTrigger value="related">Related keywords</TabsTrigger>
                </TabsList>
                <TabsContent value="website">
                  <WebsiteKeywords
                    locationName={website?.location_name}
                    languageName={website?.language_name}
                  />
                </TabsContent>
                <TabsContent value="related">
                  <RelatedKeywords
                    websiteSlug={websiteSlug}
                    locationName={website?.location_name}
                    languageName={website?.language_name}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
