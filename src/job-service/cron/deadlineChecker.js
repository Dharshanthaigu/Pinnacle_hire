import cron from "node-cron";
import { checkVerificationDeadlines, expireStaleOpenJobs } from "../services/verificationService.js";
import { logger } from "../config/logger.js";

export function startDeadlineChecker() {
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running verification deadline check");
    try {
      await checkVerificationDeadlines();
    } catch (err) {
      logger.error({ err }, "Deadline check failed");
    }
  });
}