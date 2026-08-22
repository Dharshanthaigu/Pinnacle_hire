import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import { logger } from "./config/logger.js";
import { register, httpRequestDuration } from "./config/metrics.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

app.set("query parser", "extended");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"] || randomUUID(),
  })
);

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok", service: "auth-service" }));

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/api/uploads", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use(errorHandler);

export default app; 