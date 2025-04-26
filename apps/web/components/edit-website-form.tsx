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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import type { Website } from "@prisma/client"; // Import Website type
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Website name cannot be empty.",
  }),
  url: z.string().url({
    message: "Please enter a valid URL.",
  }),
  topic: z.string().min(1, {
    message: "Topic cannot be empty.",
  }),
});

type EditWebsiteFormProps = {
  website: Website; // Pass the website data to pre-fill the form
};

export function EditWebsiteForm({ website }: EditWebsiteFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const updateWebsiteMutation = trpc.websites.update.useMutation({
    onSuccess: async (data) => {
      toast.success(`Website "${data.name}" updated successfully!`);
      // Invalidate queries to refetch data
      await utils.websites.get.invalidate({ slug: website.slug });
      await utils.websites.all.invalidate();
      // Optionally redirect or perform other actions
      // router.push(`/w/${data.slug}`); // Redirect if slug changes, though not implemented here
    },
    onError: (error) => {
      toast.error(`Failed to update website: ${error.message}`);
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: website.name || "",
      url: website.url || "",
      topic: website.context || "", // Use 'context' field from prisma model
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateWebsiteMutation.mutate({
      ...values,
      slug: website.slug, // Pass the current slug to identify the website
    });
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
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Describe the main topic of your website..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updateWebsiteMutation.isPending}>
          {updateWebsiteMutation.isPending && (
            <Loader2 className="animate-spin mr-2" />
          )}
          {updateWebsiteMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
