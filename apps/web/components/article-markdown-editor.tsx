"use client";

import MarkdownPreview from "@uiw/react-markdown-preview";
import { useEffect, useState } from "react";
import { Control, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  topic: z.string().min(1),
  title: z.string().optional().nullable(),
  markdown: z.string().optional().nullable(),
  scheduled_at: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface ArticleMarkdownEditorProps {
  control: Control<FormData>;
  initialMarkdown: string | null | undefined;
}

export function ArticleMarkdownEditor({
  control,
  initialMarkdown,
}: ArticleMarkdownEditorProps) {
  const markdownValue = useWatch({ control, name: "markdown" });
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const currentMarkdown = markdownValue ?? "";
    const words = currentMarkdown.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [markdownValue]);

  const displayMarkdown = initialMarkdown ?? "";

  return (
    <div className="flex-1 space-y-4">
      {initialMarkdown !== null && initialMarkdown !== undefined ? (
        <FormField
          control={control}
          name="markdown"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Markdown Content{" "}
                <span className="text-xs text-muted-foreground">
                  ({wordCount} words)
                </span>
              </FormLabel>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview" disabled={!field.value}>
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <FormControl>
                    <Textarea
                      rows={20}
                      placeholder="Enter the article content in Markdown..."
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[400px] md:min-h-[600px] mt-2"
                    />
                  </FormControl>
                </TabsContent>
                <TabsContent value="preview">
                  {!!field.value && (
                    <div className="mt-2 rounded-md border p-8 min-h-[400px] md:min-h-[600px] overflow-auto bg-white">
                      <MarkdownPreview
                        source={field.value}
                        wrapperElement={{
                          "data-color-mode":
                            typeof document !== "undefined" &&
                            document.documentElement.classList.contains("dark")
                              ? "dark"
                              : "light",
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="flex items-center justify-center h-[600px] border rounded-md bg-muted text-muted-foreground">
          Article content is being generated or hasn't been created yet.
        </div>
      )}
    </div>
  );
}
