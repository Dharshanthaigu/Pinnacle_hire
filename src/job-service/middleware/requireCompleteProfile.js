import fetch from "node-fetch";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

export const requireCompleteProfile = async (req, res, next) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/profile-status/${req.user.id}`, {
      headers: { Authorization: req.headers.authorization },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Unable to verify profile status" });
    }

    const data = await response.json();
    if (!data.profileComplete) {
      return res.status(403).json({ error: "Complete your profile before browsing jobs" });
    }

    next();
  } catch (err) {
    next(err);
  }
};