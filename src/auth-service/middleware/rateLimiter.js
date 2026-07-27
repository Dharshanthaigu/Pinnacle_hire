import { redisClient } from "../config/redis.js";

export const loginRateLimiter = async (req, res, next) => {
  try {
    const email = (req.body.email || "unknown").toLowerCase().trim();
    const key = `login-attempts:${email}`;
    const attempts = await redisClient.incr(key);
    if (attempts === 1) await redisClient.expire(key, 900); // 15 min window

    if (attempts > 5) {
      return res.status(429).json({ error: "Too many login attempts. Try again in 15 minutes." });
    }
    next();
  } catch (err) {
    next();
  }
};