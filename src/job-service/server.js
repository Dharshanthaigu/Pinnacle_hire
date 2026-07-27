import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { logger } from "./config/logger.js";
import { startDeadlineChecker } from "./cron/deadlineChecker.js";

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5002;

async function start() {
  await connectDB();
  startDeadlineChecker();
  app.listen(PORT, () => logger.info(`job-service running on port ${PORT}`));
}

start();