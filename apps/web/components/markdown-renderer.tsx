"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  source: string;
}

export default function MarkdownRenderer({ source }: MarkdownRendererProps) {
  return (
    <article className="prose lg:prose-xl">
      <ReactMarkdown
        children={source}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      />
    </article>
  );
}
