import Boss from "pg-boss";
dotenv.config();

import * as dotenv from "dotenv";
import concurrentConsumer from "../utils/concurrent-consumer";
import trackJob from "../utils/track-job";

const CONCURRENCY = 1;
const INTERVAL = 100;
export async function processAMQP(
  boss: Boss
): Promise<{ shutdown: () => Promise<void> }> {
  return concurrentConsumer(
    boss,
    "article-scheduler",
    CONCURRENCY,
    INTERVAL,
    async (data) => {
      return await trackJob("article-scheduler", data, execute(data));
    }
  );
}

export async function execute(job: any): Promise<void> {}
