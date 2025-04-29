"use client";

// import { type Article } from "@bloggy/database";
import { Control } from "react-hook-form"; // Keep Control
import { z } from "zod"; // Keep z for FormData type definition

import { ArticleMarkdownEditor } from "@/components/article-markdown-editor"; // Keep the editor import

// Keep schema definition for type safety if FormData is used
const formSchema = z.object({
  topic: z.string().min(1, { message: "Topic cannot be empty." }),
  title: z.string().optional().nullable(),
  markdown: z.string().optional().nullable(),
  scheduled_at: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface EditArticleFormProps {
  control: Control<FormData>; // Receive control from parent
  initialMarkdown: string | null | undefined; // Receive initial markdown
}

// This component now only renders the editor part, controlled by the parent page
export function EditArticleForm({
  control,
  initialMarkdown,
}: EditArticleFormProps) {
  return (
    <ArticleMarkdownEditor
      control={control}
      initialMarkdown={initialMarkdown}
    />
  );
}
