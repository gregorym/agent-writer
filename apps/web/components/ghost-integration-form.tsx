"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react"; // Import icons
import { useParams, useRouter } from "next/navigation"; // Use next/navigation
import { useEffect, useState } from "react"; // Import useState and useEffect
import { useForm } from "react-hook-form";
import { toast } from "sonner"; // Assuming you use sonner for toasts
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";

// Schema matching the router's create/update inputs
const formSchema = z.object({
  apiKey: z.string().min(1, "API Key cannot be empty"),
  apiUrl: z.string().url("Invalid API URL format"),
});

type GhostIntegrationFormValues = z.infer<typeof formSchema>;

interface GhostIntegrationFormProps {}

export function GhostIntegrationForm({}: GhostIntegrationFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const params = useParams(); // Get raw params
  const [showApiKey, setShowApiKey] = useState(false);

  // Validate slug
  const slug = typeof params.slug === "string" ? params.slug : undefined;

  // Fetch existing integration data - disable query if slug is invalid
  const {
    data: integration,
    isLoading: isLoadingIntegration,
    error: integrationError,
  } = trpc.ghost.get.useQuery(
    { websiteSlug: slug! }, // Use validated slug, non-null assertion is safe here due to enabled flag
    { enabled: !!slug } // Only run query if slug is a valid string
  );

  const form = useForm<GhostIntegrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { apiKey: "", apiUrl: "" }, // Initialize with defaults
  });

  // Update form values when integration data loads or changes
  useEffect(() => {
    if (integration) {
      form.reset({
        apiKey: integration.api_key,
        apiUrl: integration.api_url,
      });
    } else {
      form.reset({ apiKey: "", apiUrl: "" }); // Reset if no integration
    }
  }, [integration, form]);

  const createMutation = trpc.ghost.create.useMutation({
    onSuccess: async () => {
      toast.success("Ghost integration created successfully!");
      if (slug) {
        await utils.ghost.get.invalidate({ websiteSlug: slug });
      }
      // Optionally reset form or navigate
    },
    onError: (error) => {
      toast.error(`Failed to create integration: ${error.message}`);
    },
  });

  const updateMutation = trpc.ghost.update.useMutation({
    onSuccess: async () => {
      toast.success("Ghost integration updated successfully!");
      if (slug) {
        await utils.ghost.get.invalidate({ websiteSlug: slug });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error.message}`);
    },
  });

  const deleteMutation = trpc.ghost.delete.useMutation({
    onSuccess: async () => {
      toast.success("Ghost integration deleted successfully!");
      if (slug) {
        await utils.ghost.get.invalidate({ websiteSlug: slug });
      }
      form.reset({ apiKey: "", apiUrl: "" }); // Reset form after deletion
    },
    onError: (error) => {
      toast.error(`Failed to delete integration: ${error.message}`);
    },
  });

  function onSubmit(values: GhostIntegrationFormValues) {
    if (!slug) {
      toast.error("Website slug is missing or invalid.");
      return;
    }
    if (integration) {
      // Update existing integration
      updateMutation.mutate({
        websiteSlug: slug,
        apiKey: values.apiKey,
        apiUrl: values.apiUrl,
      });
    } else {
      // Create new integration
      createMutation.mutate({
        websiteSlug: slug,
        apiKey: values.apiKey,
        apiUrl: values.apiUrl,
      });
    }
  }

  function handleDelete() {
    if (!slug) {
      toast.error("Website slug is missing or invalid.");
      return;
    }
    if (integration) {
      deleteMutation.mutate({ websiteSlug: slug });
    } else {
      toast.info("No integration exists to delete.");
    }
  }

  // Handle invalid slug case before rendering the form
  if (!slug) {
    return <p className="text-red-500">Invalid website identifier.</p>;
  }

  // Loading state based on query (only runs if slug is valid)
  if (isLoadingIntegration) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-1/4" />
      </div>
    );
  }

  // Error state from query
  if (integrationError) {
    return (
      <p className="text-red-500">
        Error loading integration details: {integrationError.message}
      </p>
    );
  }

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="apiUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghost Admin API URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://your-ghost-blog.com"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                The URL of your Ghost Admin API.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghost Admin API Key</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showApiKey ? "text" : "password"} // Toggle input type
                    placeholder="Enter your Ghost Admin API Key"
                    {...field}
                    disabled={isSubmitting}
                    className="pr-10" // Add padding to make space for the button
                    autoComplete="new-password" // Disable browser autocomplete
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={isSubmitting}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {showApiKey ? "Hide API key" : "Show API key"}
                  </span>
                </Button>
              </div>
              <FormDescription>
                Find this in your Ghost Admin under Integrations &gt; Custom
                Integrations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isDirty}
          >
            {isSubmitting
              ? "Saving..."
              : integration
                ? "Update Integration"
                : "Save Integration"}
          </Button>
          {integration && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Integration"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
