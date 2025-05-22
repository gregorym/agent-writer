"use client";

import { type Article } from "@bloggy/database";
import { format } from "date-fns";
import {
  CalendarIcon,
  Download,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Send,
} from "lucide-react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { useMemo, useState } from "react";
import { BacklinksInput } from "./backlinks-input";
import { ImageRegenerationDialog } from "./image-regeneration-dialog";

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

interface ArticleSettingsSidebarProps {
  form: UseFormReturn<FormData>;
  article: Article;
  websiteSlug: string;
  isSaving: boolean;
}

export function ArticleSettingsSidebar({
  form,
  article,
  websiteSlug,
  isSaving,
}: ArticleSettingsSidebarProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "backlinks",
  });
  const retryMutation = trpc.articles.retry.useMutation();
  const publishMutation = trpc.articles.publish.useMutation();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  const images = useMemo(() => {
    const markdown = form.getValues("markdown");
    if (!markdown) return [];
    const imageUrls = markdown.match(/!\[.*?\]\((.*?)\)/g);
    return imageUrls
      ? imageUrls.map((img) => img.replace(/!\[.*?\]\((.*?)\)/, "$1"))
      : [];
  }, [form.getValues("markdown")]);

  const articleGenerated = !!article.markdown;
  const canDownload = !!article.markdown;
  const canPublish = !publishMutation.isPending && !article.published_at;
  const canRetry = !retryMutation.isPending && !article.markdown;

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageDialogOpen(true);
  };

  const handleReplaceImage = (prevUrl: string, newUrl: string) => {
    const currentMarkdown = form.getValues("markdown") || "";
    const updatedMarkdown = currentMarkdown.replace(prevUrl, newUrl);
    form.setValue("markdown", updatedMarkdown, { shouldDirty: true });
    setSelectedImage(newUrl);
    setIsImageDialogOpen(false);
  };

  return (
    <Sidebar
      collapsible="none"
      className="sticky hidden lg:flex top-0 h-svh border-l min-w-lg"
    >
      <SidebarHeader className="h-(--header-height) border-b border-sidebar-border">
        <h2 className="text-lg font-semibold">Article Settings</h2>
      </SidebarHeader>
      <SidebarContent className="p-4 space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter title (or leave blank)"
                  {...field}
                  value={field.value ?? ""}
                  className="bg-white"
                  disabled={articleGenerated}
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
              <FormLabel>Schedule Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild disabled={articleGenerated}>
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
                  placeholder="Describe the main topic..."
                  {...field}
                  value={field.value ?? ""}
                  className="bg-white"
                  disabled={articleGenerated}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <BacklinksInput
          name="backlinks"
          control={form.control}
          fields={fields}
          append={append}
          remove={remove}
          disabled={articleGenerated}
        />

        {images.length > 0 && (
          <>
            <FormLabel className="mb-0">Images</FormLabel>
            <div className="grid grid-cols-3 gap-1">
              {images.map((image, index) => (
                <img
                  src={image}
                  alt={`Generated image ${index + 1}`}
                  key={index}
                  className="rounded-md hover:opacity-50 transition-opacity duration-200 cursor-pointer"
                  onClick={() => handleImageClick(image)}
                />
              ))}
            </div>
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Button
            type="submit"
            form="edit-article-form"
            disabled={isSaving || !form.formState.isDirty}
            className="flex-grow"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  retryMutation.mutate({
                    articleId: article.id,
                    websiteSlug,
                  });
                }}
                disabled={!canRetry}
              >
                {retryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />{" "}
                    <span>Retry Generation</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canPublish}
                onClick={() => {
                  publishMutation.mutate({
                    articleId: article.id,
                    websiteSlug,
                  });
                }}
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    <span>Publish now</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const markdownContent = form.getValues("markdown") || "";
                  const title =
                    form.getValues("title") || article.title || "untitled";
                  const blob = new Blob([markdownContent], {
                    type: "text/markdown",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  const safeTitle = title.replace(/\s+/g, "_").toLowerCase();
                  link.download = `${safeTitle}.md`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                disabled={!canDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
      <ImageRegenerationDialog
        isOpen={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        imageUrl={selectedImage}
        onReplaceImage={handleReplaceImage}
      />
    </Sidebar>
  );
}
