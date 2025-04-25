import Boss from "pg-boss";
dotenv.config(); // Ensure environment variables are loaded

import * as dotenv from "dotenv";
import concurrentConsumer from "../utils/concurrent-consumer";
import { prisma } from "../utils/prisma";
import trackJob from "../utils/track-job";

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
  const article = await prisma?.article.findFirst({
    where: {
      id: job.id,
    },
    include: {
      website: true,
    },
  });

  if (!article) return;

  console.log(article);

  const prompt: string = `
  - Website: ${article.website.name} (${article.website.url})
  - Context: ${article.website.context}
  - Article Detils: ${article.topic}
  `;

  // const markdown = await generateArticle(prompt);
  // await prisma?.article.update({
  //   where: {
  //     id: article.id,
  //   },
  //   data: {
  //     markdown,
  //   },
  // });
}
