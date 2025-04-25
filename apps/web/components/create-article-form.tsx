"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns"; // Import date-fns for formatting
import { CalendarIcon } from "lucide-react"; // Import Calendar icon
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";

// Updated schema
const formSchema = z.object({
  topic: z.string().min(1, { message: "Topic cannot be empty." }), // Topic is now required
  scheduled_at: z.date().optional().nullable(), // Added scheduled_at
});

interface CreateArticleFormProps {
  websiteSlug: string;
  onSuccess?: () => void;
}

export function CreateArticleForm({
  websiteSlug,
  onSuccess,
}: CreateArticleFormProps) {
  const createArticleMutation = trpc.articles.create.useMutation({
    onSuccess: (data) => {
      // Title might be null now, adjust toast message
      toast.success(
        `Article based on topic "${data.topic || "Untitled"}" created successfully!`
      );
      form.reset(); // Reset form fields
      onSuccess?.(); // Call the success callback if provided
    },
    onError: (error) => {
      toast.error(`Failed to create article: ${error.message}`);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      scheduled_at: null, // Default to null
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Only send topic and scheduled_at
    createArticleMutation.mutate({ ...values, websiteSlug });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Removed Title field */}
        {/* Removed Markdown field */}

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

        <Button type="submit" disabled={createArticleMutation.isPending}>
          {createArticleMutation.isPending ? "Creating..." : "Create Article"}
        </Button>
      </form>
    </Form>
  );
}
