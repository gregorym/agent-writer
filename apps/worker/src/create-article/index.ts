import Boss from "pg-boss";
dotenv.config(); // Ensure environment variables are loaded

import * as dotenv from "dotenv";
import { Image } from "mdast"; // Import Image type for specific node check
import concurrentConsumer from "../utils/concurrent-consumer";
import { generateArticle, generateImage } from "../utils/llm";
import { prisma } from "../utils/prisma";
import trackJob from "../utils/track-job";
const { unified } = require("unified");
const remarkParse = require("remark-parse");
const remarkStringify = require("remark-stringify"); // Import remark-stringify
const visit = require("unist-util-visit");

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
  `;

  let initialMarkdown = article.markdown ?? (await generateArticle(prompt));
  const tree = unified().use(remarkParse).parse(initialMarkdown);

  const imagePromises: Promise<void>[] = [];

  visit(tree, "image", (node: Image) => {
    if (!node.url) {
      const altText = node.alt || "";
      imagePromises.push(
        (async () => {
          try {
            const newImageUrl = await generateImage(altText);
            node.url = newImageUrl; // Update the node's URL directly in the AST
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
