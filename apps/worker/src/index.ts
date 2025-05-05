import "dotenv/config";
import PgBoss from "pg-boss";
import * as ArticleScheduler from "./article-scheduler";
import * as CreateArticle from "./create-article";
import * as PublishArticle from "./publish-article";
import * as WebsiteContext from "./website-context";

let isShuttingDown = false;
const boss = new PgBoss(process.env.DATABASE_URL_POOLING!);
const nodeEnv = process.env.NODE_ENV || "development";

async function start() {
  try {
    console.log("Starting PgBoss...");
    boss.on("error", console.error);
    await boss.start();

    const modules = [
      CreateArticle,
      WebsiteContext,
      PublishArticle,
      ArticleScheduler,
    ];
    for (const module of modules) {
      if (module.processAMQP) {
        await module.processAMQP(boss);
      }
    }

    await boss.schedule(
      `article-scheduler_${nodeEnv}`,
      `0 2 * * *`,
      {},
      {
        tz: "America/Los_Angeles",
      }
    );
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

  await boss.stop();

  console.log("All consumers have finished processing.");
  process.exit(0);
}
