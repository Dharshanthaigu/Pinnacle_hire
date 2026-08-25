import fetch from "node-fetch";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

export function finalizeJob(job) {
  const bothConfirmed =
    job.workflowType === "daily_wage"
      ? job.seekerConfirmed && job.posterConfirmed
      : job.connection.seekerConfirmedCall && job.connection.posterConfirmedCall;
  if (!bothConfirmed) throw new Error("Both parties must confirm before finalizing");

  const commissionRate =
    job.workflowType === "daily_wage" ? 0.10 :
    job.workflowType === "leadership" ? 0.35 :
    0.20;

  const commissionAmount = Math.round(job.salary.amount * commissionRate);

  if (job.workflowType !== "daily_wage") {
    job.connection.contactRevealed = true;
  }
  job.commission = { type: "percentage", amount: commissionAmount, invoiced: true, paid: false };
  job.status = "completed";
  return job;
}

export function markPaidAndComplete(job) {
  job.commission.paid = true;
  return job;
}

export async function updateReputation(job) {
  await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/reputation/${job.acceptedBy}/increment`, {
    method: "PATCH",
    headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY },
  });
}

export async function clearInvoiceIfFullyPaid(job, authHeader) {
  const stillOwing = await import("../models/Job.js").then(({ default: Job }) =>
    Job.exists({ postedBy: job.postedBy, "commission.paid": false, "commission.invoiced": true })
  );
  if (!stillOwing) {
    await fetch(`${AUTH_SERVICE_URL}/api/auth/internal/invoice-status/${job.postedBy}/clear`, {
      method: "PATCH",
      headers: { Authorization: authHeader },
    });
  }
}