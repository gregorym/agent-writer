import Boss from "pg-boss";
dotenv.config();

import * as dotenv from "dotenv";
import concurrentConsumer from "../utils/concurrent-consumer";
import { generateWebsiteContext } from "../utils/llm";
import { prisma } from "../utils/prisma";
import trackJob from "../utils/track-job";
const { unified } = require("unified");
const remarkParse = require("remark-parse");
const visit = require("unist-util-visit");

const CONCURRENCY = 1;
const INTERVAL = 10;
export async function processAMQP(boss: Boss): Promise<void> {
  return concurrentConsumer(
    boss,
    "website-context",
    CONCURRENCY,
    INTERVAL,
    async (data) => {
      return await trackJob("website-context", data, execute(data));
    }
  );
}

export async function execute(job: any): Promise<void> {
  const { id } = job.data;

  const website = await prisma?.website.findFirst({
    where: {
      id: id,
    },
  });

  if (!website) return;

  const reps = await fetch(
    `https://api.firecrawl.dev/v1/scrape?url=${website.url}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: website.url,
        formats: ["markdown"],
      }),
    }
  ).then((x) => x.json());
  if (!reps) return;

  const markdown = reps?.data?.markdown;
  if (!markdown) return;

  const context = await generateWebsiteContext(markdown);
  if (!context) return;
  await prisma?.website.update({
    where: {
      id: website.id,
    },
    data: {
      context,
    },
  });
}
