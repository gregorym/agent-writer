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
import { useRouter } from "next/navigation"; // Use next/navigation
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

interface GhostIntegrationFormProps {
  websiteId: string;
}

export function GhostIntegrationForm({ websiteId }: GhostIntegrationFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Fetch existing integration data
  const {
    data: integration,
    isLoading: isLoadingIntegration,
    error: integrationError,
  } = trpc.ghost.get.useQuery(
    { websiteId },
    {
      staleTime: Infinity, // Avoid refetching immediately after mutation
    }
  );

  const form = useForm<GhostIntegrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      // Fetch data once for default values
      const fetchedIntegration = await utils.ghost.get.fetch({
        websiteId,
      });
      return {
        apiKey: fetchedIntegration?.api_key ?? "",
        apiUrl: fetchedIntegration?.api_url ?? "",
      };
    },
    // Re-initialize form when integration data changes (e.g., after create/update/delete)
    values: integration
      ? { apiKey: integration.api_key, apiUrl: integration.api_url }
      : { apiKey: "", apiUrl: "" },
  });

  const createMutation = trpc.ghost.create.useMutation({
    onSuccess: async () => {
      toast.success("Ghost integration created successfully!");
      await utils.ghost.get.invalidate({ websiteId });
      // Optionally reset form or navigate
    },
    onError: (error) => {
      toast.error(`Failed to create integration: ${error.message}`);
    },
  });

  const updateMutation = trpc.ghost.update.useMutation({
    onSuccess: async () => {
      toast.success("Ghost integration updated successfully!");
      await utils.ghost.get.invalidate({ websiteId });
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error.message}`);
    },
  });

  const deleteMutation = trpc.ghost.delete.useMutation({
    onSuccess: async () => {
      toast.success("Ghost integration deleted successfully!");
      await utils.ghost.get.invalidate({ websiteId });
      form.reset({ apiKey: "", apiUrl: "" }); // Reset form after deletion
    },
    onError: (error) => {
      toast.error(`Failed to delete integration: ${error.message}`);
    },
  });

  function onSubmit(values: GhostIntegrationFormValues) {
    if (integration) {
      // Update existing integration
      updateMutation.mutate({
        websiteId,
        apiKey: values.apiKey,
        apiUrl: values.apiUrl,
      });
    } else {
      // Create new integration
      createMutation.mutate({
        websiteId,
        apiKey: values.apiKey,
        apiUrl: values.apiUrl,
      });
    }
  }

  function handleDelete() {
    if (integration) {
      deleteMutation.mutate({ websiteId });
    } else {
      toast.info("No integration exists to delete.");
    }
  }

  if (isLoadingIntegration) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-1/4" />
      </div>
    );
  }

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
              <FormControl>
                <Input
                  type="password" // Use password type for keys
                  placeholder="Enter your Ghost Admin API Key"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
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
