import { Worker } from "bullmq";
import IORedis from "ioredis";
import User from "../models/User.js";
import { logger } from "../config/logger.js";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const reputationWorker = new Worker(
  "reputation-updates",
  async (job) => {
    const { acceptedBy, postedBy, commissionType, commissionPaid } = job.data;

    await User.findByIdAndUpdate(acceptedBy, {
      $inc: { completedJobs: 1, reputationScore: 1 },
    });

    if (commissionType === "flat" && !commissionPaid) {
      await User.findByIdAndUpdate(postedBy, { hasUnpaidInvoice: true });
    }

    logger.info({ jobId: job.id }, "Reputation update processed");
  },
  { connection }
);

reputationWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "Reputation update failed after retries");
});