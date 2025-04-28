import Boss from "pg-boss";
dotenv.config(); // Ensure environment variables are loaded

import * as dotenv from "dotenv";
import { Image } from "mdast"; // Import Image type for specific node check
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse"; // Changed from require
import remarkStringify from "remark-stringify"; // Changed from require
import { unified } from "unified"; // Changed from require
import { visit } from "unist-util-visit"; // Changed from require
import concurrentConsumer from "../utils/concurrent-consumer";
import { generateArticle, generateImage } from "../utils/llm";
import { prisma } from "../utils/prisma";
import trackJob from "../utils/track-job";

const CONCURRENCY = 5;
const INTERVAL = 10;
// Adjust return type to match concurrentConsumer
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
  - Article Detils: ${article.topic}

Include the following backlinks in the article:
  ${article.backlinks.map((link) => `- ${link}`).join("\n")}
  `;

  let initialMarkdown = article.markdown ?? (await generateArticle(prompt));
  if (!initialMarkdown) {
    console.error("Failed to generate article content.");
    return;
  }

  const tree = unified()
    .use(remarkParse)
    .use(remarkMdx) // Add remark-mdx for parsing
    .parse(initialMarkdown);

  const imagePromises: Promise<void>[] = [];

  visit(tree, "image", (node: Image) => {
    console.log("Image node:", node);

    if (!node.url || !node.url.startsWith("http")) {
      const altText = node.alt || "";
      imagePromises.push(
        (async () => {
          try {
            const newImageUrl = await generateImage(altText);
            // Add a check to ensure newImageUrl is a string before assigning
            if (typeof newImageUrl === "string") {
              node.url = newImageUrl;
            } else {
              console.warn(
                `Image generation for alt text "${altText}" did not return a valid URL.`
              );
              // Optionally, remove the image node or set a placeholder URL
              // For now, we'll leave the node as is, potentially without a URL
            }
          } catch (error) {
            console.error(
              `Failed to generate image for alt text "${altText}":`,
              error
            );
          }
        })()
      );
    }
  });

  await Promise.all(imagePromises);
  const updatedMarkdown = unified().use(remarkStringify).stringify(tree);

  await prisma?.article.update({
    where: {
      id: article.id,
    },
    data: {
      markdown: updatedMarkdown,
    },
  });
}
