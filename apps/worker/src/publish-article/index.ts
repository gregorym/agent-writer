import Boss from "pg-boss";
dotenv.config();

import GhostAdminAPI from "@tryghost/admin-api";
import * as dotenv from "dotenv";
import { marked } from "marked"; // Import marked library
import concurrentConsumer from "../utils/concurrent-consumer";
import { prisma } from "../utils/prisma";
import trackJob from "../utils/track-job";

const CONCURRENCY = 1;
const INTERVAL = 10;
export async function processAMQP(
  boss: Boss
): Promise<{ shutdown: () => Promise<void> }> {
  return concurrentConsumer(
    boss,
    "publish-article",
    CONCURRENCY,
    INTERVAL,
    async (data) => {
      return await trackJob("publish-article", data, execute(data));
    }
  );
}

export async function execute(job: any): Promise<void> {
  const { id } = job.data;

  const article = await prisma?.article.findFirst({
    where: {
      id: id,
    },
  });

  if (!article) return;

  const ghost = await prisma?.ghostIntegration.findFirst({
    where: {
      website_id: article.website_id,
    },
  });
  if (ghost) {
    await publishToGhost(article, ghost);
  }
}

async function publishToGhost(
  article: any, // Use the full article object
  ghost: any // Use the full ghost integration object
): Promise<void> {
  try {
    const api = new GhostAdminAPI({
      url: ghost.api_url,
      key: ghost.api_key,
      version: "v5.0",
    });

    const html = await marked(article.markdown);

    await api.posts.add(
      {
        title: article.title!,
        status: "draft",
        html,
      },
      { source: "html" }
    );
  } catch (error) {
    console.error("Error publishing to Ghost:", error); // Log the error
    throw error; // Re-throw the error to be caught by the caller
  }
}
