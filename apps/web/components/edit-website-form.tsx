"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Website } from "../../../packages/database/generated/client";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Website name cannot be empty.",
  }),
  url: z.string().url({
    message: "Please enter a valid URL.",
  }),
  topic: z.string().min(1, {
    message: "Topic/Context cannot be empty.",
  }),
  customPromptEnabled: z.boolean(),
  prompt: z.string().optional().nullable(),
});

type EditWebsiteFormProps = {
  website: Website;
};

type FormValues = z.infer<typeof formSchema>;

export function EditWebsiteForm({ website }: EditWebsiteFormProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const updateWebsiteMutation = trpc.websites.update.useMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: website.name || "",
      url: website.url || "",
      topic: website.context || "",
      customPromptEnabled: website.prompt ? true : false,
      prompt: website.prompt ?? null,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const updatedWebsite = await updateWebsiteMutation.mutateAsync({
        slug: website.slug,
        name: values.name,
        url: values.url,
        topic: values.topic,
        prompt:
          (values.customPromptEnabled ?? false) ? values.prompt || "" : null, // Handle possible undefined
      });
      toast.success(`Website "${updatedWebsite.name}" updated successfully!`);
      await utils.websites.get.invalidate({ slug: website.slug });
      await utils.websites.all.invalidate();
    } catch (error) {
      toast.error(
        `Failed to update website: ${
          error instanceof Error ? error.message : "An unknown error occurred"
        }`
      );
    }
  }

  const watchCustomPromptEnabled = form.watch("customPromptEnabled");

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
              <FormLabel>Context</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Describe the main topic/context of your website..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="customPromptEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Enable Custom Prompt
                </FormLabel>
                <FormDescription>
                  Use your own prompt to generate your blog posts.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {watchCustomPromptEnabled && (
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    rows={6}
                    placeholder="e.g., Write in a witty and engaging tone, focusing on..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
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
