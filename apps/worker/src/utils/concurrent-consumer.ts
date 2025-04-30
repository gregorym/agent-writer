import Boss from "pg-boss";

const nodeEnv = process.env.NODE_ENV || "development";

type JobData = any;

export default async function concurrentConsumer(
  boss: Boss,
  queueName: string,
  maxConcurrentJobs: number,
  pollingIntervalSeconds: number = 10,
  processJob: (data: JobData) => Promise<any>
) {
  const finalQueueName = `${queueName}_${nodeEnv}`;
  await boss.createQueue(finalQueueName);

  const workOptions: Boss.WorkOptions = {
    pollingIntervalSeconds,
  };

  for (let i = 0; i < maxConcurrentJobs; i++) {
    await boss.work(finalQueueName, workOptions, async ([job]) =>
      processJob(job)
    );
  }

  console.log(`Worker started for queue: ${finalQueueName}`);

  return {
    shutdown: async () => {
      await boss.offWork(finalQueueName);
    },
  };
}
