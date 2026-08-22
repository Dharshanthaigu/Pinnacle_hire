import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error({ err, reqId: req.id }, "Unhandled error");
  console.error("=== FULL ERROR STACK ===");
  console.error(err.stack || err);
  console.error("=========================");

  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format" });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
};