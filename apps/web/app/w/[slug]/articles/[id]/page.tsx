"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Metadata } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppSidebar } from "@/components/app-sidebar";
import { ArticleMarkdownEditor } from "@/components/article-markdown-editor";
import { ArticleSettingsSidebar } from "@/components/article-settings-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

export const metadata: Metadata = {
  title: "Agent Writer - Article",
  description: "View and edit your article.",
};

const formSchema = z.object({
  topic: z.string().min(1, { message: "Topic cannot be empty." }),
  title: z.string().optional().nullable(),
  markdown: z.string().optional().nullable(),
  scheduled_at: z.date().optional().nullable(),
  backlinks: z
    .array(
      z.object({
        url: z.string().url({ message: "Please enter a valid URL." }),
        title: z.string().min(1, { message: "Title cannot be empty." }),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

const transformBacklinksToObject = (backlinks: string[] | null | undefined) => {
  if (!backlinks) return [];
  return backlinks.map((link) => {
    const parts = link.split(" - ");
    const url = parts[0] || "";
    const title = parts.slice(1).join(" - ") || "";
    return { url, title };
  });
};

const transformBacklinksToString = (
  backlinks: { url: string; title: string }[] | null | undefined
) => {
  if (!backlinks) return [];
  return backlinks.map((link) => `${link.url} - ${link.title}`);
};

export default function EditArticlePage() {
  const params = useParams<{ slug: string; id: string }>();
  const websiteSlug = params.slug;
  const articleId = parseInt(params.id, 10);
  const utils = trpc.useUtils();
  const router = useRouter();

  const {
    data: article,
    isLoading,
    error,
  } = trpc.articles.get.useQuery(
    { articleId, websiteSlug },
    {
      enabled: !!articleId && !!websiteSlug,
      refetchOnWindowFocus: false,
    }
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      title: "",
      markdown: "",
      scheduled_at: null,
      backlinks: [],
    },
  });

  useEffect(() => {
    if (article) {
      form.reset({
        topic: article.topic || "",
        title: article.title || "",
        markdown: article.markdown || "",
        scheduled_at: article.scheduled_at || null,
        backlinks: transformBacklinksToObject(article.backlinks),
      });
    }
  }, [article, form.reset]);

  const updateArticleMutation = trpc.articles.update.useMutation({
    onSuccess: (data) => {
      if (!article) return;
      toast.success(
        `Article "${data.title || data.topic || "Untitled"}" saved successfully!`
      );
      utils.articles.get.invalidate({ articleId: article.id, websiteSlug });
      // form.reset is handled by useEffect when article data changes
    },
    onError: (error) => {
      toast.error(`Failed to save article: ${error.message}`);
    },
  });

  const updateScheduleMutation = trpc.articles.updateSchedule.useMutation({
    onSuccess: (data) => {
      if (!article) return;
      toast.success("Article schedule updated successfully!");
      utils.articles.get.invalidate({ articleId: article.id, websiteSlug });
      // form.reset is handled by useEffect when article data changes
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });

  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (article && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
    }
  }, [article]);

  function onSubmit(values: FormData) {
    if (!article) return;

    const scheduleDidChange =
      (values.scheduled_at?.toISOString() ?? null) !==
      (article.scheduled_at?.toISOString() ?? null);
    const otherFieldsDidChange =
      values.topic !== (article.topic || "") ||
      values.title !== (article.title || "") ||
      values.markdown !== (article.markdown || "") ||
      JSON.stringify(transformBacklinksToString(values.backlinks)) !==
        JSON.stringify(article.backlinks || []);

    if (scheduleDidChange && !otherFieldsDidChange) {
      updateScheduleMutation.mutate({
        articleId: article.id,
        websiteSlug,
        scheduled_at: values.scheduled_at,
      });
    } else if (otherFieldsDidChange || scheduleDidChange) {
      // If other fields changed, or both types of fields changed
      updateArticleMutation.mutate({
        articleId: article.id,
        websiteSlug,
        topic: values.topic,
        title: values.title || undefined,
        markdown: values.markdown || undefined,
        scheduled_at: values.scheduled_at,
        backlinks: transformBacklinksToString(values.backlinks),
      });
    } else {
      // This case should ideally not be hit if save button is disabled when form is not dirty.
      toast.info("No changes to save.");
    }
  }

  const deleteArticleMutation = trpc.articles.delete.useMutation({
    // Assuming a similar structure for delete, ensure onSuccess/onError are handled
    onSuccess: () => {
      toast.success("Article deleted successfully");
      router.push(`/w/${websiteSlug}/articles`); // Redirect after delete
      utils.articles.all.invalidate({ websiteSlug }); // Invalidate list view
    },
    onError: (error) => {
      toast.error(`Failed to delete article: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (!article) return;
    deleteArticleMutation.mutate({ articleId: article.id, websiteSlug });
  };

  if (error) {
    return <div>Error loading article: {error.message}</div>;
  }

  const isSaving =
    updateArticleMutation.isPending || updateScheduleMutation.isPending;

  return (
    <SidebarProvider>
      <AppSidebar />
      <FormProvider {...form}>
        <SidebarInset>
          <SiteHeader />
          <form
            id="edit-article-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col"
          >
            <div className="flex flex-col gap-2 p-4 md:p-6">
              {isLoading && !article && (
                <div className="space-y-4 p-4">
                  <Skeleton className="h-8 w-1/4" />
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-10 w-1/4" />
                  <Skeleton className="h-10 w-1/4" />
                  <Skeleton className="h-20 w-1/4" />
                </div>
              )}
              {article && (
                <ArticleMarkdownEditor
                  control={form.control}
                  initialMarkdown={article.markdown}
                />
              )}
              {!isLoading && !article && <div>Article not found.</div>}
            </div>
          </form>
        </SidebarInset>
        {article && (
          <ArticleSettingsSidebar
            form={form}
            article={article}
            websiteSlug={websiteSlug}
            isSaving={isSaving}
          />
        )}
        {isLoading && !article && (
          <div className="sticky hidden lg:flex top-0 h-svh border-l w-80 p-4">
            <Skeleton className="h-full w-full" />
          </div>
        )}
      </FormProvider>
    </SidebarProvider>
  );
}
