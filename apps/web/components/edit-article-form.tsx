"use client";

import { type Article } from "@bloggy/database"; // Corrected import path
import { zodResolver } from "@hookform/resolvers/zod";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react"; // Import Trash2
import { useRouter } from "next/navigation"; // Import useRouter
import { useEffect, useState } from "react"; // Import useEffect and useState
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input"; // Import Input
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

// Schema for the edit form, including title and markdown
const formSchema = z.object({
  topic: z.string().min(1, { message: "Topic cannot be empty." }),
  title: z.string().optional().nullable(), // Title is optional
  markdown: z.string().optional().nullable(), // Markdown is optional
  scheduled_at: z.date().optional().nullable(),
});

interface EditArticleFormProps {
  websiteSlug: string;
  article: Article; // Pass the full article object
  onSuccess?: () => void;
}

export function EditArticleForm({
  websiteSlug,
  article,
  onSuccess,
}: EditArticleFormProps) {
  const router = useRouter(); // Initialize router
  const utils = trpc.useUtils(); // Get tRPC utils for cache invalidation

  const updateArticleMutation = trpc.articles.update.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Article "${data.title || data.topic || "Untitled"}" updated successfully!`
      );
      utils.articles.all.invalidate({ websiteSlug }); // Invalidate list query
      utils.articles.get.invalidate({ articleId: article.id, websiteSlug }); // Invalidate get query
      // Reset form with updated data, ensuring type compatibility
      form.reset({
        topic: data.topic ?? "", // Provide default empty string if null
        title: data.title,
        markdown: data.markdown,
        scheduled_at: data.scheduled_at,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to update article: ${error.message}`);
    },
  });

  const retryArticleMutation = trpc.articles.retry.useMutation({});
  const deleteArticleMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      toast.success(
        `Article "${article.title || article.topic || "Untitled"}" deleted.`
      );
      utils.articles.all.invalidate({ websiteSlug }); // Invalidate list query on delete
      router.push(`/w/${websiteSlug}`);
    },
    onError: (error) => {
      if (error.data?.code === "BAD_REQUEST") {
        toast.error(error.message); // Show the specific reason why deletion failed
      } else {
        toast.error(`Failed to delete article: ${error.message}`);
      }
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // Pre-populate form with existing article data
    defaultValues: {
      topic: article.topic || "",
      title: article.title || "",
      markdown: article.markdown || "",
      scheduled_at: article.scheduled_at || null,
    },
  });

  // Watch the markdown field to update word count dynamically
  const markdownValue = form.watch("markdown");
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (markdownValue) {
      // Simple word count: split by whitespace and filter empty strings
      const words = markdownValue.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
    } else {
      setWordCount(0);
    }
  }, [markdownValue]); // Re-run effect when markdownValue changes

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateArticleMutation.mutate({
      articleId: article.id, // Include article ID
      websiteSlug,
      topic: values.topic,
      title: values.title || undefined, // Convert null to undefined
      markdown: values.markdown || undefined, // Convert null to undefined
      scheduled_at: values.scheduled_at, // Date can be null
    });
  }

  // Function to handle deletion
  function handleDelete() {
    // Add confirmation dialog here if desired (e.g., using Shadcn's AlertDialog)
    // For simplicity, directly calling mutate now
    deleteArticleMutation.mutate({
      articleId: article.id,
      websiteSlug,
    });
  }

  // Determine if the article can be deleted based on the criteria
  const canDelete =
    !article.markdown && // No markdown content
    article.scheduled_at && // Has a scheduled date
    new Date(article.scheduled_at) > new Date(); // Scheduled date is in the future

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter the article title (will be generated if left empty)"
                  {...field}
                  // Ensure value is not null/undefined for Input
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_at"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Schedule Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ?? undefined}
                    onSelect={(date) => field.onChange(date ?? null)}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Describe the main topic for the article..."
                  {...field}
                  // Ensure value is not null/undefined for Textarea
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditionally render the entire Markdown section */}
        {article.markdown !== null && article.markdown !== undefined && (
          <FormField
            control={form.control}
            name="markdown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Markdown Content{" "}
                  <span className="text-xs text-muted-foreground">
                    ({wordCount} words)
                  </span>
                </FormLabel>{" "}
                {/* Removed (Optional) */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Editor Column */}
                  <FormControl className="flex-1">
                    <Textarea
                      rows={20}
                      placeholder="Enter the article content in Markdown..."
                      {...field}
                      value={field.value ?? ""} // Keep handling nullish value for textarea
                      className="min-h-[400px] md:min-h-[600px]"
                    />
                  </FormControl>
                  {/* Preview Column - Only show if there is content */}
                  {/* Check field.value for truthiness (not null, undefined, or empty string) */}
                  {!!field.value && (
                    <div className="flex-1 mt-4 md:mt-0 rounded-md border bg-muted p-4 min-h-[400px] md:min-h-[600px] overflow-auto">
                      <FormLabel className="mb-2 block">Preview</FormLabel>
                      <MarkdownPreview
                        source={field.value}
                        wrapperElement={{
                          "data-color-mode":
                            typeof document !== "undefined" &&
                            document.documentElement.classList.contains("dark")
                              ? "dark"
                              : "light",
                        }}
                      />
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-between items-center pt-4">
          <Button type="submit" disabled={updateArticleMutation.isPending}>
            {updateArticleMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button" // Ensure this is type button to prevent form submission
            onClick={() => {
              retryArticleMutation.mutate({
                articleId: article.id,
                websiteSlug,
              });
            }}
            disabled={retryArticleMutation.isPending} // Disable based on its own mutation state
          >
            {retryArticleMutation.isPending ? "Retrying..." : "Retry"}{" "}
            {/* Update loading text */}
          </Button>

          {/* Conditionally render the Delete button */}
          {canDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteArticleMutation.isPending}
              size="icon" // Make it an icon button
              aria-label="Delete article"
            >
              {deleteArticleMutation.isPending ? (
                <span className="animate-spin h-4 w-4">
                  <Loader2 className="h-4 w-4" />
                </span>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
