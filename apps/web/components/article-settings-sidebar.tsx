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
import { BacklinksInput } from "./backlinks-input";

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
}

export function ArticleSettingsSidebar({
  form,
  article,
  websiteSlug,
}: ArticleSettingsSidebarProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "backlinks",
  });
  const retryMutation = trpc.articles.retry.useMutation();
  const updateMutation = trpc.articles.update.useMutation();
  const publishMutation = trpc.articles.publish.useMutation();

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
                  placeholder="Describe the main topic..."
                  {...field}
                  value={field.value ?? ""}
                  className="bg-white"
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
        />
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Button
            type="submit"
            form="edit-article-form"
            disabled={updateMutation.isPending || !form.formState.isDirty}
            className="flex-grow"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon">
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
                disabled={retryMutation.isPending}
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
                onClick={() => {
                  publishMutation.mutate({
                    articleId: article.id,
                    websiteSlug,
                  });
                }}
                disabled={publishMutation.isPending}
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
              >
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
