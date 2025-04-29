"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns"; // Import date-fns for formatting
import { CalendarIcon } from "lucide-react"; // Import Calendar icon, PlusCircle, Trash2
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"; // Import Calendar
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
} from "@/components/ui/popover"; // Import Popover
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils"; // Import cn utility
import { trpc } from "@/trpc/client";
import { useEffect, useRef } from "react"; // Add useRef
import { toast } from "sonner";
import { BacklinksInput } from "./backlinks-input";

// Updated schema
const formSchema = z.object({
  topic: z.string().min(1, { message: "Topic cannot be empty." }), // Topic is now required
  scheduled_at: z.date().optional().nullable(), // Added scheduled_at
  backlinks: z
    .array(
      z.object({
        url: z.string().url({ message: "Please enter a valid URL." }),
        title: z.string().min(1, { message: "Title cannot be empty." }),
      })
    )
    .optional(), // Added backlinks array
});

interface CreateArticleFormProps {
  websiteSlug: string;
  onSuccess?: () => void;
}

export function CreateArticleForm({
  websiteSlug,
  onSuccess,
}: CreateArticleFormProps) {
  const { data: website } = trpc.websites.get.useQuery({ slug: websiteSlug });
  const queueArticleMutation = trpc.articles.retry.useMutation({});
  const createArticleMutation = trpc.articles.create.useMutation({
    // onSuccess and onError removed
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      scheduled_at: null, // Default to null
      backlinks: [], // Default to empty array
    },
  });

  // Use useFieldArray for backlinks
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "backlinks",
  });

  // Ref to track if the default backlink has been added
  const defaultBacklinkAdded = useRef(false);

  useEffect(() => {
    // Add website URL and name as the first backlink if available,
    // but only if backlinks are currently empty and it hasn't been added yet.
    if (
      website?.url &&
      website?.name &&
      fields.length === 0 &&
      !defaultBacklinkAdded.current // Check the ref
    ) {
      append({ url: website.url, title: website.name }); // Use website.name
      // Mark that the default backlink has been added
      defaultBacklinkAdded.current = true; // Set the ref
    }
    // Dependencies remain the same, the ref handles the "only once" logic
  }, [website, append, fields.length]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Format backlinks before sending
    const formattedBacklinks =
      values.backlinks?.map((link) => `${link.url} - ${link.title}`) ?? [];

    try {
      const article = await createArticleMutation.mutateAsync({
        topic: values.topic,
        scheduled_at: values.scheduled_at,
        websiteSlug,
        backlinks: formattedBacklinks, // Send formatted backlinks
      });

      // Handle success logic here
      toast.success(
        `Article based on topic "${article.topic || "Untitled"}" created successfully!`
      );
      form.reset(); // Reset form fields
      onSuccess?.(); // Call the success callback if provided

      if (article) {
        await queueArticleMutation.mutateAsync({
          websiteSlug,
          articleId: article.id,
        });
      }
    } catch (error) {
      // Handle error logic here
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
              <FormLabel>Topic</FormLabel> {/* Topic is required */}
              <FormControl>
                <Textarea
                  rows={3} // Set rows to 3
                  placeholder="Describe the main topic for the article..."
                  {...field}
                  className="bg-white" // Add white background
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
                    selected={field.value ?? undefined} // Handle null value for selected
                    onSelect={(date) => field.onChange(date ?? null)} // Pass null if date is undefined
                    disabled={
                      (date) => date < new Date(new Date().setHours(0, 0, 0, 0)) // Disable past dates
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Backlinks Section */}
        <BacklinksInput
          name="backlinks" // Pass the name prop
          control={form.control}
          fields={fields} // Pass fields
          append={append} // Pass append
          remove={remove} // Pass remove
        />
        <Button type="submit" disabled={createArticleMutation.isPending}>
          {createArticleMutation.isPending ? "Creating..." : "Create Article"}
        </Button>{" "}
      </form>
    </Form>
  );
}
