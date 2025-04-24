import "dotenv/config";
import PgBoss from "pg-boss";

let isShuttingDown = false;

async function start() {
  try {
    const boss = new PgBoss(process.env.DATABASE_URL_POOLING);

    boss.on("error", console.error);

    await boss.start();

    console.log(`Worker started.`);
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
  await Promise.all(consumers.map((consumer) => consumer.shutdown()));

  // Close the connection
  if (connection) {
    await connection.close();
  }

  console.log("All consumers have finished processing.");
  process.exit(0);
}
