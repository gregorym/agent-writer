import Boss from "pg-boss";
dotenv.config();

import * as dotenv from "dotenv";
import { Image } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import concurrentConsumer from "../utils/concurrent-consumer";
import { generateArticle, generateImage } from "../utils/llm";
import { prisma } from "../utils/prisma";
import trackJob from "../utils/track-job";

const CONCURRENCY = 1;
const INTERVAL = 10;

export async function processAMQP(
  boss: Boss
): Promise<{ shutdown: () => Promise<void> }> {
  return concurrentConsumer(
    boss,
    "new-article",
    CONCURRENCY,
    INTERVAL,
    async (data) => {
      return await trackJob("new-article", data, execute(data));
    }
  );
}

export async function execute(job: any): Promise<void> {
  const { id } = job.data;

  const article = await prisma?.article.findFirst({
    where: {
      id: id,
    },
    include: {
      website: true,
    },
  });

  if (!article) return;

  const prompt: string = `
  - Website: ${article.website.name} (${article.website.url})
  - Context: ${article.website.context}
  ${article.keywords ? `- SEO Keywords: ${article.keywords}` : ""}
  ${article.topic ? `- Article Details: ${article.topic}` : ""}

Include the following backlinks in the article:
  ${article.backlinks.map((link) => `- ${link}`).join("\n")}
  `;

  let initialMarkdown = article.markdown ?? (await generateArticle(prompt));
  if (!initialMarkdown) return;

  // Sanitize initialMarkdown to prevent parsing errors with attributes starting with numbers.
  // This replaces attributes like " 0attr=" with " _0attr="
  initialMarkdown = initialMarkdown.replace(/(\s)([0-9][\w:-]*=)/g, "$1_$2");

  // Parse the sanitized markdown directly
  const tree = unified().use(remarkParse).parse(initialMarkdown);

  const imagePromises: Promise<void>[] = [];

  visit(tree, "image", (node: Image) => {
    if (!node.url || !node.url.startsWith("http")) {
      const altText = node.alt || "";
      imagePromises.push(
        (async () => {
          try {
            const newImageUrl = await generateImage(altText);

            if (typeof newImageUrl === "string") {
              node.url = newImageUrl;
            }
          } catch (error: any) {}
        })()
      );
    }
  });

  await Promise.all(imagePromises);

  let title = "";
  visit(tree, "heading", (node) => {
    if (node.depth === 1 && !title) {
      title = toString(node);
    }
  });

  const updatedMarkdown = unified().use(remarkStringify).stringify(tree);

  await prisma?.article.update({
    where: {
      id: article.id,
    },
    data: {
      title: title,
      markdown: updatedMarkdown,
    },
  });
}
