import { AppSidebar } from "@/components/app-sidebar";
import { ArticlesList } from "@/components/articles-list";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { lucia } from "@/lib/auth";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Agent Writer - Website",
  description: "Manage your website content.",
};

export default async function WebsiteDashboardPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;
  if (!sessionId) {
    return redirect("/login");
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
              <ArticlesList />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
