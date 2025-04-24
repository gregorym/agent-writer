type Job = {
  id: string;
  messageCreatedAt: number;
};

export default function trackJob(
  queueName: string,
  job: Job,
  promise: Promise<any>,
  { log = true } = {}
): Promise<any> {
  if (log) {
    console.log(`[${queueName} ${job.id}] started (${JSON.stringify(job)})`);
  }

  const start = Date.now();

  const track = (error?: Error) => {
    if (error) console.error(error);
    const duration = Date.now() - start;
    if (log) {
      console.log(
        `[${queueName} ${job.id}] ${
          error ? "failed" : "processed"
        } in ${duration}ms`
      );
    }
  };

  return promise.then((v) => (track(), v), track);
}
