"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation"; // Import useRouter
import { useCallback, useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form"; // Import useForm and FormProvider
import { toast } from "sonner"; // Import toast
import { z } from "zod"; // Import z

import { AppSidebar } from "@/components/app-sidebar";
import { ArticleMarkdownEditor } from "@/components/article-markdown-editor"; // Import the editor
import { ArticleSettingsSidebar } from "@/components/article-settings-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

// Define form schema here
const formSchema = z.object({
  topic: z.string().min(1, { message: "Topic cannot be empty." }),
  title: z.string().optional().nullable(),
  markdown: z.string().optional().nullable(),
  scheduled_at: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

// Debounce function
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

export default function EditArticlePage() {
  const params = useParams<{ slug: string; id: string }>();
  const websiteSlug = params.slug;
  const articleId = parseInt(params.id, 10);
  const utils = trpc.useUtils();
  const router = useRouter(); // Initialize router

  const {
    data: article,
    isLoading,
    error,
  } = trpc.articles.get.useQuery(
    { articleId, websiteSlug },
    {
      enabled: !!articleId && !!websiteSlug,
      refetchOnWindowFocus: false, // Prevent re-fetching on focus, rely on mutations/manual refresh
    }
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      title: "",
      markdown: "",
      scheduled_at: null,
    },
  });

  // Update form defaults when article data loads
  useEffect(() => {
    if (article) {
      form.reset({
        topic: article.topic || "",
        title: article.title || "",
        markdown: article.markdown || "",
        scheduled_at: article.scheduled_at || null,
      });
    }
  }, [article, form.reset]);

  const updateArticleMutation = trpc.articles.update.useMutation({
    onSuccess: (data) => {
      if (!article) return; // Add check for article
      utils.articles.get.invalidate({ articleId: article.id, websiteSlug });
      form.reset(
        {
          topic: data.topic ?? "",
          title: data.title,
          markdown: data.markdown,
          scheduled_at: data.scheduled_at,
        },
        { keepValues: true }
      ); // Keep potentially dirty values if user is still typing
    },
    onError: (error) => {
      toast.error(`Failed to save article: ${error.message}`);
    },
  });

  const retryArticleMutation = trpc.articles.retry.useMutation({
    onSuccess: () => {
      // Correct: onSuccess likely receives void
      if (!article) return;
      toast.success(
        `Retrying generation for "${article.topic || "Untitled"}".`
      ); // Use article.topic
      utils.articles.get.invalidate({ articleId: article.id, websiteSlug });
    },
    onError: (error) => {
      toast.error(`Failed to retry generation: ${error.message}`);
    },
  });

  const deleteArticleMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      toast.success(
        `Article "${article?.title || article?.topic || "Untitled"}" deleted.`
      );
      utils.articles.all.invalidate({ websiteSlug });
      router.push(`/w/${websiteSlug}`);
    },
    onError: (error) => {
      if (error.data?.code === "BAD_REQUEST") {
        toast.error(error.message);
      } else {
        toast.error(`Failed to delete article: ${error.message}`);
      }
    },
  });

  // --- Auto-save Logic ---
  const watchedFields = form.watch(); // Watch all fields
  const isSavingRef = useRef(false); // Ref to track if save is in progress
  const initialLoadDoneRef = useRef(false); // Ref to track initial load

  const debouncedSave = useCallback(
    debounce((data: FormData) => {
      if (!article || isSavingRef.current || !initialLoadDoneRef.current)
        return; // Don't save if no article, already saving, or initial load not done

      // Check if data actually changed compared to the fetched article data
      const changed =
        data.topic !== (article.topic || "") ||
        data.title !== (article.title || "") ||
        data.markdown !== (article.markdown || "") ||
        (data.scheduled_at?.toISOString() ?? null) !==
          (article.scheduled_at?.toISOString() ?? null);

      if (!changed) {
        // console.log("No changes detected, skipping auto-save.");
        return;
      }

      // console.log("Auto-saving...", data);
      isSavingRef.current = true;
      updateArticleMutation.mutate(
        {
          articleId: article.id,
          websiteSlug,
          topic: data.topic,
          title: data.title || undefined,
          markdown: data.markdown || undefined,
          scheduled_at: data.scheduled_at,
        },
        {
          onSettled: () => {
            isSavingRef.current = false; // Reset saving flag when mutation finishes
          },
        }
      );
    }, 1500), // Debounce time: 1.5 seconds
    [article, websiteSlug, updateArticleMutation] // Dependencies for useCallback
  );

  useEffect(() => {
    // Mark initial load as done once article is loaded and form is reset
    if (article && !initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      // console.log("Initial load complete, auto-save enabled.");
    }
  }, [article]); // Depend only on article loading

  useEffect(() => {
    if (initialLoadDoneRef.current && form.formState.isDirty) {
      // Only save if form is dirty after initial load
      debouncedSave(watchedFields);
    }
    // Cleanup function to cancel debounced call if component unmounts or dependencies change
    // return () => debouncedSave.cancel?.(); // Assuming debounce returns a cancel method
  }, [watchedFields, debouncedSave, form.formState.isDirty]); // Depend on watched fields and the debounced function

  // --- End Auto-save Logic ---

  // Manual submit handler (can be triggered by sidebar button)
  function onSubmit(values: FormData) {
    if (!article) return;
    // console.log("Manual save triggered", values);
    updateArticleMutation.mutate(
      {
        articleId: article.id,
        websiteSlug,
        topic: values.topic,
        title: values.title || undefined,
        markdown: values.markdown || undefined,
        scheduled_at: values.scheduled_at,
      },
      {
        onSuccess: (data) => {
          toast.success(
            `Article "${data.title || data.topic || "Untitled"}" saved successfully!`
          );
          // Re-invalidate and reset form as before
          utils.articles.get.invalidate({ articleId: article.id, websiteSlug });
          form.reset({
            topic: data.topic ?? "",
            title: data.title,
            markdown: data.markdown,
            scheduled_at: data.scheduled_at,
          });
        },
      }
    );
  }

  const handleDelete = () => {
    if (!article) return;
    // Add confirmation dialog here if desired
    deleteArticleMutation.mutate({ articleId: article.id, websiteSlug });
  };

  // Handle error state more explicitly if needed
  if (error) {
    return <div>Error loading article: {error.message}</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar /> {/* Left Sidebar */}
      <FormProvider {...form}>
        {" "}
        {/* Wrap relevant parts with FormProvider */}
        <SidebarInset>
          <SiteHeader /> {/* Header within the main content area */}
          {/* Form now wraps the main content area */}
          <form
            id="edit-article-form" // ID for the sidebar button to reference
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col" // Ensure form takes up space
          >
            <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
              {isLoading &&
                !article && ( // Show skeleton only during initial load
                  <div className="space-y-4 p-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-20 w-1/4" />
                  </div>
                )}
              {/* Render editor only when article data is available */}
              {article && (
                <ArticleMarkdownEditor
                  control={form.control}
                  initialMarkdown={article.markdown} // Pass initial markdown for placeholder logic
                />
              )}
              {!isLoading && !article && <div>Article not found.</div>}
            </div>
            {/* Form submission logic is handled by onSubmit, triggered by sidebar button */}
          </form>
        </SidebarInset>
        {/* Render sidebar outside the main content area but pass the form */}
        {article && (
          <ArticleSettingsSidebar
            form={form} // Pass the form object
            article={article}
            websiteSlug={websiteSlug}
            updateMutation={updateArticleMutation} // Pass mutations
            retryMutation={retryArticleMutation}
            deleteMutation={deleteArticleMutation}
            handleDelete={handleDelete} // Pass delete handler
          />
        )}
        {/* Optionally show a loading state for the sidebar */}
        {isLoading && !article && (
          <div className="sticky hidden lg:flex top-0 h-svh border-l w-80 p-4">
            <Skeleton className="h-full w-full" />
          </div>
        )}
      </FormProvider>{" "}
      {/* Close FormProvider */}
    </SidebarProvider>
  );
}
