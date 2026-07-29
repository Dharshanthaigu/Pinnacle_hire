import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { logger } from "./config/logger.js";
import "./workers/reputationWorker.js";

const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5001;

async function start() {
  await connectDB();
  await import("./workers/reputationWorker.js");
  app.listen(PORT, () => logger.info(`auth-service running on port ${PORT}`));
}

start();