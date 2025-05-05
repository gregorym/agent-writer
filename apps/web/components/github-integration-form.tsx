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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  apiKey: z.string().min(1, "API Key cannot be empty"),
  dirPath: z.string().optional().nullable(),
  repoName: z.string().optional().nullable(),
});

type GithubIntegrationFormValues = z.infer<typeof formSchema>;

interface GithubIntegrationFormProps {}

export function GithubIntegrationForm({}: GithubIntegrationFormProps) {
  const utils = trpc.useUtils();
  const params = useParams();
  const [showApiKey, setShowApiKey] = useState(false);

  const slug = typeof params.slug === "string" ? params.slug : undefined;

  const {
    data: integration,
    isLoading: isLoadingIntegration,
    error: integrationError,
  } = trpc.github.get.useQuery({ websiteSlug: slug! }, { enabled: !!slug });

  const { data: repoList, isLoading: isLoadingRepos } =
    trpc.github.listRepos.useQuery(
      { websiteSlug: slug! },
      { enabled: !!slug && !!integration?.api_key }
    );

  const form = useForm<GithubIntegrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { apiKey: "", dirPath: "", repoName: "" },
  });

  useEffect(() => {
    if (integration) {
      form.reset({
        apiKey: integration.api_key,
        dirPath: integration.dir_path ?? "",
        repoName: integration.repo_name ?? "",
      });
    } else {
      form.reset({ apiKey: "", dirPath: "", repoName: "" });
    }
  }, [integration, form]);

  const createMutation = trpc.github.create.useMutation({
    onSuccess: async (data) => {
      toast.success("GitHub integration created successfully!");
      if (slug) {
        await utils.github.get.invalidate({ websiteSlug: slug });
        await utils.github.listRepos.invalidate({ websiteSlug: slug });
      }
      form.setValue("repoName", data.repo_name);
    },
    onError: (error) => {
      toast.error(`Failed to create GitHub integration: ${error.message}`);
    },
  });

  const updateMutation = trpc.github.update.useMutation({
    onSuccess: async (data) => {
      toast.success("GitHub integration updated successfully!");
      if (slug) {
        await utils.github.get.invalidate({ websiteSlug: slug });
        if (form.getValues("apiKey") !== integration?.api_key) {
          await utils.github.listRepos.invalidate({ websiteSlug: slug });
        }
      }
      form.setValue("repoName", data.repo_name);
    },
    onError: (error) => {
      toast.error(`Failed to update GitHub integration: ${error.message}`);
    },
  });

  const deleteMutation = trpc.github.delete.useMutation({
    onSuccess: async () => {
      toast.success("GitHub integration deleted successfully!");
      if (slug) {
        await utils.github.get.invalidate({ websiteSlug: slug });
        await utils.github.listRepos.invalidate({ websiteSlug: slug });
      }
      form.reset({ apiKey: "", dirPath: "", repoName: "" });
    },
    onError: (error) => {
      toast.error(`Failed to delete GitHub integration: ${error.message}`);
    },
  });

  function onSubmit(values: GithubIntegrationFormValues) {
    if (!slug) {
      toast.error("Website slug is missing or invalid.");
      return;
    }
    const payload = {
      websiteSlug: slug,
      apiKey: values.apiKey,
      dirPath: values.dirPath || null,
      repoName: values.repoName || null,
    };
    if (integration) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
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
      toast.info("No GitHub integration exists to delete.");
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
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-1/4" />
      </div>
    );
  }

  if (integrationError) {
    return (
      <p className="text-red-500">
        Error loading GitHub integration details: {integrationError.message}
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
              <FormLabel>GitHub Personal Access Token (PAT)</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your GitHub PAT"
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
                Create a Fine-grained Personal Access Token with Repository
                read/write access.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="repoName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repository</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={!integration || isLoadingRepos || isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingRepos && (
                    <SelectItem value="loading" disabled>
                      Loading repositories...
                    </SelectItem>
                  )}
                  {repoList && repoList.length > 0
                    ? repoList.map((repo) => (
                        <SelectItem key={repo} value={repo}>
                          {repo}
                        </SelectItem>
                      ))
                    : !isLoadingRepos && (
                        <SelectItem value="norepos" disabled>
                          No repositories found or accessible
                        </SelectItem>
                      )}
                </SelectContent>
              </Select>
              <FormDescription>
                The GitHub repository to store your articles in.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dirPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Directory Path (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., content/posts or leave empty for root"
                  {...field}
                  value={field.value ?? ""}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                The path within your repository where article files should be
                created.
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
