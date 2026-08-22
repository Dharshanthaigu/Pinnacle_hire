import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error({ err, reqId: req.id }, "Unhandled error");

  if (err.name === "CastError") {
    return res.status(400).json({
      code: "INVALID_ID",
      message: "Invalid ID format",
      requestId: req.id,
    });
  }

  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";

  res.status(status).json({
    code,
    message: err.message || "Internal Server Error",
    requestId: req.id,
  });
};