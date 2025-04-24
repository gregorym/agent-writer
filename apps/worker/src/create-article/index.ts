import * as amqp from "amqplib";
import * as dotenv from "dotenv";
dotenv.config(); // Ensure environment variables are loaded

import concurrentConsumer from "../utils/concurrent-consumer";
import trackJob from "../utils/track-job";

const CONCURRENCY = 5;

// Initialize S3 Client

export async function processAMQP(connection: amqp.Connection) {
  return concurrentConsumer(
    connection,
    "CREATE_ARTICLE",
    CONCURRENCY,
    (data) => {
      return trackJob("CREATE_ARTICLE", data, execute(data));
    }
  );
}

export async function execute(job: any): Promise<void> {}
