"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Website name cannot be empty.",
  }),
  url: z.string().url({
    message: "Please enter a valid URL.",
  }),
  topic: z.string().min(1, {
    // Make topic required
    message: "Topic cannot be empty.",
  }),
});

type CreateWebsiteFormProps = {
  onSuccess?: () => void;
};

export function CreateWebsiteForm({ onSuccess }: CreateWebsiteFormProps) {
  const createWebsiteMutation = trpc.websites.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Website "${data.name}" created successfully!`);
      form.reset(); // Reset form fields
      onSuccess?.(); // Call the success callback if provided
    },
    onError: (error) => {
      toast.error(`Failed to create website: ${error.message}`);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      topic: "", // Keep default value empty
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createWebsiteMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Blog" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel> {/* Removed (Optional) */}
              <FormControl>
                <Textarea // Use Textarea instead of Input
                  rows={4} // Set rows to 4
                  placeholder="Describe the main topic of your website..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createWebsiteMutation.isPending}>
          {createWebsiteMutation.isPending ? "Creating..." : "Create Website"}
        </Button>
      </form>
    </Form>
  );
}
