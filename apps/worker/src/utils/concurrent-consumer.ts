// concurrentConsumer.js
import * as amqp from "amqplib";

const nodeEnv = process.env.NODE_ENV || "development";

export default async function concurrentConsumer(
  connection: amqp.Connection,
  queueName: string,
  maxConcurrentJobs: number,
  processJob: (data: any) => Promise<any>,
  { createExchange }: { createExchange?: boolean } = { createExchange: false }
) {
  const finalQueueName = `${queueName}_${nodeEnv}`;
  const channel = await connection.createChannel();
  await channel.assertQueue(finalQueueName, { durable: true });
  const exchangeName = `delayed_${finalQueueName}_exchange`;

  if (createExchange === true) {
    await channel.assertExchange(exchangeName, "direct", {
      durable: true,
      arguments: { "x-delayed-exchange": true, "x-delayed-type": "direct" },
    }); // Or 'fanout', etc.
    await channel.bindQueue(finalQueueName, exchangeName, finalQueueName); // Use queue name as routing key
  }

  channel.prefetch(maxConcurrentJobs);

  let inFlight = 0;
  let shutdownRequested = false;
  let consumerTag: string;
  let shutdownResolve: (val?: any) => void;

  const consumeMessage = async (msg: any) => {
    if (shutdownRequested) {
      // Reject new messages and requeue them
      channel.nack(msg, false, true);
      return;
    }

    inFlight++;
    let data = {};
    try {
      data = JSON.parse(msg.content.toString());
    } catch (error) {
      channel.nack(msg, false, false);
      inFlight--;
      if (shutdownRequested && inFlight === 0) {
        shutdownResolve();
      }
      return;
    }

    try {
      await processJob(data);
      channel.ack(msg);
    } catch (error) {
      channel.nack(msg, false, false); // Adjust based on your retry strategy
    } finally {
      inFlight--;
      if (shutdownRequested && inFlight === 0) {
        shutdownResolve();
      }
    }
  };

  const result = await channel.consume(finalQueueName, consumeMessage);
  consumerTag = result.consumerTag;

  function shutdown() {
    shutdownRequested = true;
    return new Promise<void>((resolve) => {
      shutdownResolve = resolve;
      channel.cancel(consumerTag);
      if (inFlight === 0) {
        resolve();
      }
    });
  }

  console.log(`Started consumer for ${finalQueueName}`);
  return { shutdown };
}
