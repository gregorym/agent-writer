import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function GoogleSearchConsoleIntegrationForm() {
  const params = useParams();
  const utils = trpc.useUtils();
  const slug = typeof params.slug === "string" ? params.slug : undefined;

  const {
    data: integration,
    isLoading: isLoadingIntegration,
    error: integrationError,
  } = trpc.googleSearch.get.useQuery(
    { websiteSlug: slug! },
    { enabled: !!slug }
  );

  const deleteMutation = trpc.googleSearch.delete.useMutation();

  const handleConnect = () => {
    if (!slug) {
      toast.error("Website slug is missing or invalid.");
      return;
    }
    window.location.href = "/api/auth/google/search-console/login?slug=" + slug;
  };

  const handleDelete = async () => {
    if (!slug) {
      toast.error("Website slug is missing or invalid.");
      return;
    }
    try {
      await deleteMutation.mutateAsync({ websiteSlug: slug });
      toast.success("Google Search Console integration deleted successfully!");
      await utils.googleSearch.get.invalidate({ websiteSlug: slug });
    } catch (error: any) {
      toast.error(`Failed to delete integration: ${error.message}`);
    }
  };

  useEffect(() => {
    // Invalidate query on mount to ensure fresh data after potential OAuth redirect
    if (slug) {
      utils.googleSearch.get.invalidate({ websiteSlug: slug });
    }
  }, [slug, utils]);

  if (!slug) {
    return <p className="text-red-500">Invalid website identifier.</p>;
  }

  if (isLoadingIntegration) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-1/4" />
      </div>
    );
  }

  if (integrationError) {
    return (
      <p className="text-red-500">
        Error loading Google Search Console integration details:{" "}
        {integrationError.message}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Google Search Console Integration</h3>
      {integration ? (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Connected to Google Search Console.
          </p>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? "Disconnecting..."
              : "Disconnect Google Search Console"}
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Connect your Google Account to allow submitting URLs to Google
            Search Console.
          </p>
          <Button onClick={handleConnect}>Connect Google Search Console</Button>
        </div>
      )}
    </div>
  );
}
