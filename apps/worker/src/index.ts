import "dotenv/config";
import PgBoss from "pg-boss";
import * as CreateArticle from "./create-article";
import * as WebsiteContext from "./website-context";

let isShuttingDown = false;
const boss = new PgBoss(process.env.DATABASE_URL_POOLING!);

async function start() {
  try {
    console.log("Starting PgBoss...");
    boss.on("error", console.error);
    await boss.start();

    const modules = [CreateArticle, WebsiteContext];
    for (const module of modules) {
      if (module.processAMQP) {
        await module.processAMQP(boss);
      }
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

start();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutdown initiated...");

  // Call shutdown on each consumer concurrently
  // await Promise.all(consumers.map((consumer) => consumer.shutdown()));

  await boss.stop();

  console.log("All consumers have finished processing.");
  process.exit(0);
}
