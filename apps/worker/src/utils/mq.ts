import * as amqp from "amqplib";

let connection: amqp.Connection;
const channels: Record<string, amqp.Channel> = {};
const nodeEnv = process.env.NODE_ENV || "development";

export async function getConnection() {
  if (!connection) {
    const url = process.env.CLOUDAMQP_URL ?? "";
    connection = await amqp.connect(url);
  }
  return connection;
}

async function getChannel(name: string) {
  if (!channels[name]) {
    const conn = await getConnection();
    const channel = await conn.createChannel();
    await channel.assertQueue(name, { durable: true });
    channels[name] = channel;
  }
  return channels[name];
}

function generateUuid() {
  return Math.random().toString(16).substr(2, 8);
}

export async function enqueue(
  queueName: string,
  data: any,
  delayMs: number = 0
) {
  const finalName = `${queueName}_${nodeEnv}`;
  const channel = await getChannel(finalName);
  const exchange = `delayed_${finalName}_exchange`;

  const id = generateUuid();
  const messageCreatedAt = Date.now();
  const job = { id, messageCreatedAt, ...data };
  const messageBuffer = Buffer.from(JSON.stringify(job));

  if (delayMs > 0) {
    channel.publish(exchange, finalName, messageBuffer, {
      persistent: true,
      headers: { "x-delay": delayMs },
    });
  } else {
    channel.sendToQueue(finalName, messageBuffer, { persistent: true });
  }
}
