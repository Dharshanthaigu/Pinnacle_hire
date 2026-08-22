import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // required by BullMQ
});

export const reputationQueue = new Queue("reputation-updates", { connection });

export async function enqueueReputationUpdate(job) {
  await reputationQueue.add(
    "job-finalized",
    {
      acceptedBy: job.acceptedBy,
      postedBy: job.postedBy,
      commissionType: job.commission.type,
      commissionPaid: job.commission.paid,
    },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
    }
  );
}