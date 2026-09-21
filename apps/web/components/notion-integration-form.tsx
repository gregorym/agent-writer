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
import { Eye, EyeOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  apiKey: z.string().min(1, "API Key cannot be empty"),
  databaseId: z.string().min(1, "Database ID cannot be empty"),
});

type NotionIntegrationFormValues = z.infer<typeof formSchema>;

interface NotionIntegrationFormProps {}

export function NotionIntegrationForm({}: NotionIntegrationFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const params = useParams();
  const [showApiKey, setShowApiKey] = useState(false);

  const slug = typeof params.slug === "string" ? params.slug : undefined;

  const {
    data: integration,
    isLoading: isLoadingIntegration,
    error: integrationError,
  } = trpc.notion.get.useQuery(
    { websiteSlug: slug! },
    { enabled: !!slug }
  );

  const form = useForm<NotionIntegrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { apiKey: "", databaseId: "" },
  });

  useEffect(() => {
    if (integration) {
      form.reset({
        apiKey: integration.api_key,
        databaseId: integration.database_id ?? "",
      });
    } else {
      form.reset({ apiKey: "", databaseId: "" });
    }
  }, [integration, form]);

  const createMutation = trpc.notion.create.useMutation({
    onSuccess: async () => {
      toast.success("Notion integration created successfully!");
      if (slug) {
        await utils.notion.get.invalidate({ websiteSlug: slug });
      }
    },
    onError: (error) => {
      toast.error(`Failed to create integration: ${error.message}`);
    },
  });

  const updateMutation = trpc.notion.update.useMutation({
    onSuccess: async () => {
      toast.success("Notion integration updated successfully!");
      if (slug) {
        await utils.notion.get.invalidate({ websiteSlug: slug });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error.message}`);
    },
  });

  const deleteMutation = trpc.notion.delete.useMutation({
    onSuccess: async () => {
      toast.success("Notion integration deleted successfully!");
      if (slug) {
        await utils.notion.get.invalidate({ websiteSlug: slug });
      }
      form.reset({ apiKey: "", databaseId: "" });
    },
    onError: (error) => {
      toast.error(`Failed to delete integration: ${error.message}`);
    },
  });

  function onSubmit(values: NotionIntegrationFormValues) {
    if (!slug) {
      toast.error("Website slug is missing or invalid.");
      return;
    }
    if (integration) {
      updateMutation.mutate({
        websiteSlug: slug,
        apiKey: values.apiKey,
        databaseId: values.databaseId,
      });
    } else {
      createMutation.mutate({
        websiteSlug: slug,
        apiKey: values.apiKey,
        databaseId: values.databaseId,
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

  if (!slug) {
    return <p className="text-red-500">Invalid website identifier.</p>;
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
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notion Integration Token</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="secret_..."
                    {...field}
                    disabled={isSubmitting}
                    className="pr-10"
                    autoComplete="new-password"
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
                Create an internal integration at{" "}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  notion.so/my-integrations
                </a>{" "}
                and share your target database with it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="databaseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notion Database ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 12345678-1234-1234-1234-123456789abc"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                The ID of the database articles are written to. Find it in the
                database URL (the 32-character segment after the workspace
                slug).
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
