import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  // Service-to-service path: for callers that have no user (e.g. the Stripe
  // webhook), a matching shared secret grants access instead of a JWT.
  // This does NOT set req.user - only real logged-in users get that.
  const internalKey = req.headers["x-internal-key"];
  if (internalKey && process.env.INTERNAL_SERVICE_KEY && internalKey === process.env.INTERNAL_SERVICE_KEY) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden: insufficient role" });
  }
  next();
};