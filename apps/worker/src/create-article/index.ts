import Boss from "pg-boss";
dotenv.config(); // Ensure environment variables are loaded

import * as dotenv from "dotenv";
import concurrentConsumer from "../utils/concurrent-consumer";
import { generateArticle, generateImage } from "../utils/llm";
import { prisma } from "../utils/prisma";
import trackJob from "../utils/track-job";
const { unified } = require("unified");
const remarkParse = require("remark-parse");
const visit = require("unist-util-visit");

const CONCURRENCY = 5;
const INTERVAL = 10;
export async function processAMQP(boss: Boss): Promise<void> {
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

  let markdown = await generateArticle(prompt);
  const images = await extractImagesFromMarkdown(markdown);

  for (const image of images) {
    const { alt } = image;
    const newImage = await generateImage(alt);
  }

  await prisma?.article.update({
    where: {
      id: article.id,
    },
    data: {
      markdown,
    },
  });
}

async function extractImagesFromMarkdown(markdown) {
  const tree = unified().use(remarkParse).parse(markdown);

  const images = [];

  visit(tree, "image", (node) => {
    images.push({
      url: node.url,
      alt: node.alt || "",
      title: node.title || "",
    });
  });

  return images;
}
