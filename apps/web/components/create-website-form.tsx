"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { trpc } from "@/trpc/client";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Website name cannot be empty.",
  }),
  url: z.string().url({
    message: "Please enter a valid URL.",
  }),
});

type CreateWebsiteFormProps = {
  onSuccess?: () => void;
};

export function CreateWebsiteForm({ onSuccess }: CreateWebsiteFormProps) {
  const router = useRouter();
  const createWebsiteMutation = trpc.websites.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Website "${data.name}" created successfully!`);
      form.reset(); // Reset form fields
      onSuccess?.(); // Call the success callback if provided
      router.push(`/w/${data.slug}`); // Navigate to the new website page
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
        <Button type="submit" disabled={createWebsiteMutation.isPending}>
          {createWebsiteMutation.isPending ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Plus className="mr-2" />
          )}
          {createWebsiteMutation.isPending ? "Creating..." : "Create Website"}
        </Button>
      </form>
    </Form>
  );
}
