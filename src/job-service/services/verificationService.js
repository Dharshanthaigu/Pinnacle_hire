import fetch from "node-fetch";
import Job from "../models/Job.js";

const RESPOND_DEADLINE_DAYS = 5;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

export async function runVerification(job, candidateId, authHeader) {
  if (job.workflowType === "daily_wage") {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/candidate-match-info/${candidateId}`, {
      headers: { Authorization: authHeader },
    });
    if (!response.ok) throw new Error("Unable to fetch candidate info");
    const candidate = await response.json();

    const distanceOk = isNearby(job.location, candidate.location);
    const skillOk = candidate.skills?.some(s => s.toLowerCase() === job.category.toLowerCase());

    if (!distanceOk || !skillOk) throw new Error("Candidate does not match job requirements");
    job.status = "confirmed";
    return job;
  }

  job.verification.respondBy = new Date(Date.now() + RESPOND_DEADLINE_DAYS * 86400000);
  job.status = "verifying";
  return job;
}

export async function checkVerificationDeadlines() {
  const now = new Date();
  const dueSoon = await Job.find({
    status: "verifying",
    "verification.respondBy": { $lte: now },
  });

  for (const job of dueSoon) {
    job.status = "expired";
    await job.save();
    // NOTE: ghostCount increment (Bug 4) now needs its own auth-service call too — see below
  }

  const dueForReminder = await Job.find({
    status: "verifying",
    "verification.reminderSent": false,
    "verification.respondBy": { $lte: new Date(now.getTime() + 2 * 86400000) },
  });

  for (const job of dueForReminder) {
    job.verification.reminderSent = true;
    await job.save();
  }
}

export async function expireStaleOpenJobs() {
  const now = new Date();
  const result = await Job.updateMany(
    { status: "open", expiresAt: { $lte: now } },
    { $set: { status: "expired" } }
  );
  return result.modifiedCount;
}

export function isNearby(jobLoc, userLoc, radiusKm = 15) {
  if (!userLoc?.lat || !userLoc?.lng) return false;
  const R = 6371;
  const dLat = ((userLoc.lat - jobLoc.lat) * Math.PI) / 180;
  const dLng = ((userLoc.lng - jobLoc.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((jobLoc.lat * Math.PI) / 180) * Math.cos((userLoc.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusKm;
}

export const verifyJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    await runVerification(job, job.acceptedBy, req.headers.authorization);
    await job.save();
    res.json(job);
  } catch (err) {
    next(err);
  }
};