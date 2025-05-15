"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { addArticleKeywordToHistoryAtom } from "@/atoms";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { BacklinksInput } from "./backlinks-input";
import { Input } from "./ui/input";

const formSchema = z
  .object({
    title: z.string().optional(),
    topic: z.string(),
    scheduled_at: z.date().optional().nullable(),
    keyword: z.string().optional(),
    backlinks: z
      .array(
        z.object({
          url: z.string().url({ message: "Please enter a valid URL." }),
          title: z.string().min(1, { message: "Title cannot be empty." }),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      return data.keyword || data.topic.trim().length >= 1;
    },
    {
      message: "Topic is required when keyword is not provided",
      path: ["topic"],
    }
  );

const transformBacklinksToString = (
  backlinks: { url: string; title: string }[] | null | undefined
) => {
  if (!backlinks) return [];
  return backlinks.map((link) => `${link.url} - ${link.title}`);
};

interface CreateArticleFormProps {
  websiteSlug: string;
  keyword?: string;
  onSuccess?: () => void;
}

export function CreateArticleForm({
  websiteSlug,
  onSuccess,
  keyword,
}: CreateArticleFormProps) {
  const { data: website } = trpc.websites.get.useQuery({
    slug: websiteSlug,
  });
  const createArticleMutation = trpc.articles.create.useMutation();
  const addArticleKeyword = useSetAtom(addArticleKeywordToHistoryAtom);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: undefined,
      topic: "",
      scheduled_at: null,
      backlinks: [],
      keyword: keyword || undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "backlinks",
  });

  const defaultBacklinkAdded = useRef(false);

  useEffect(() => {
    if (
      website?.url &&
      website?.name &&
      fields.length === 0 &&
      !defaultBacklinkAdded.current
    ) {
      append({ url: website.url, title: website.name });
      defaultBacklinkAdded.current = true;
    }
  }, [website, append, fields.length]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formattedBacklinks = transformBacklinksToString(values.backlinks);

    try {
      const article = await createArticleMutation.mutateAsync({
        topic: values.topic,
        scheduled_at: values.scheduled_at,
        websiteSlug,
        backlinks: formattedBacklinks,
        keyword: keyword || undefined,
      });

      if (keyword) {
        addArticleKeyword({
          slug: websiteSlug,
          keyword: keyword,
        });
      }

      toast.success(
        `Article based on topic "${article.topic || "Untitled"}" created successfully!`
      );
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(
        `Failed to create article: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Blog post title (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {keyword && (
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keywords</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Targeted keywords fro the article..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
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
                        <span>Auto-select</span>
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
        <BacklinksInput
          name="backlinks"
          control={form.control}
          fields={fields}
          append={append}
          remove={remove}
        />
        <Button type="submit" disabled={createArticleMutation.isPending}>
          {createArticleMutation.isPending ? "Creating..." : "Create Article"}
        </Button>{" "}
      </form>
    </Form>
  );
}
