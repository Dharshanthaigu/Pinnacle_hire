// ---- Step 4: host approval (shared across all three) ----
export function approveByHost(job) {
  if (!["verifying", "accepted", "confirmed"].includes(job.status)) {
    throw new Error("Job is not awaiting host approval");
  }
  job.status = job.workflowType === "daily_wage" ? "awaiting_proof" : "connecting";
  return job;
}

// ---- Step 7: two-party confirmation (shared pattern, different meaning per branch) ----
export function confirmByParty(job, actorRole) {
  if (job.workflowType === "daily_wage") {
    if (actorRole === "seeker") job.seekerConfirmed = true;
    if (actorRole === "poster") job.posterConfirmed = true;
  } else {
    if (actorRole === "seeker") job.connection.seekerConfirmedCall = true;
    if (actorRole === "poster") job.connection.posterConfirmedCall = true;
  }
  return job;
}