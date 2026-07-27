import fetch from "node-fetch";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

// ---- Step 8: settlement — the only other branch point besides step 3 ----
export function finalizeJob(job) {
  const bothConfirmed =
    job.workflowType === "daily_wage"
      ? job.seekerConfirmed && job.posterConfirmed
      : job.connection.seekerConfirmedCall && job.connection.posterConfirmedCall;

  if (!bothConfirmed) throw new Error("Both parties must confirm before finalizing");

  if (job.workflowType === "daily_wage") {
    job.commission = { type: "percentage", amount: job.salary.amount * 0.1, invoiced: true, paid: true };
  } else {
    job.connection.contactRevealed = true;
    job.commission = {
      type: "flat",
      amount: job.workflowType === "leadership" ? 5000 : 1500,
      invoiced: true,
      paid: false,
    };
  }

  job.status = "completed";
  return job;
}

// ---- Step 9: post-settlement bookkeeping ----
// Rewritten for the microservices split: reputation and invoice data
// now live in auth-service, so these are HTTP calls instead of local DB writes.
export async function updateReputation(job, authHeader) {
  await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/reputation/${job.acceptedBy}/increment`, {
    method: "PATCH",
    headers: { Authorization: authHeader },
  });

  if (job.commission.type === "flat" && !job.commission.paid) {
    await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/invoice-status/${job.postedBy}/set`, {
      method: "PATCH",
      headers: { Authorization: authHeader },
    });
  }
}