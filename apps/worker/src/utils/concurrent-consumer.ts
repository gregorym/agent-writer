import Boss from "pg-boss";

const nodeEnv = process.env.NODE_ENV || "development";

// Define the expected shape of the job data if possible, otherwise use 'any'
// type JobData = { /* ... properties of your job data ... */ };
type JobData = any;

export default async function concurrentConsumer(
  boss: Boss, // Changed from amqp.Connection to Boss instance
  queueName: string,
  maxConcurrentJobs: number,
  pollingIntervalSeconds: number = 10,
  processJob: (data: JobData) => Promise<any>
) {
  const finalQueueName = `${queueName}_${nodeEnv}`;

  // Configure worker options
  const workOptions: Boss.WorkOptions = {
    pollingIntervalSeconds,
  };

  for (let i = 0; i < maxConcurrentJobs; i++) {
    await boss.work(finalQueueName, workOptions, async (job) =>
      processJob(job.data)
    );
  }

  console.log(`Worker started for queue: ${finalQueueName}`);

  return {
    shutdown: async () => {
      await boss.offWork(finalQueueName);
    },
  };
}
