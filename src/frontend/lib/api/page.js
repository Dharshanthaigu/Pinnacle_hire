"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getJob, acceptJob, verifyJob, approveJob, confirmJob, finalizeJob, submitProof, payInvoice } from "@/lib/api/jobs";

export default function JobDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofNote, setProofNote] = useState("");

  function reload() {
    return getJob(id, token).then(setJob);
  }

  useEffect(() => {
    getJob(id, token)
      .then(setJob)
      .catch((err) => setLoadError(err.message || "Failed to load job"))
      .finally(() => setLoading(false));
  }, [id, token]);

  async function run(action) {
    setActing(true);
    setActionError("");
    try {
      await action();
      await reload();
    } catch (err) {
      setActionError(err.message || "Action failed");
    } finally {
      setActing(false);
    }
  }

  async function handleSubmitProof(e) {
    e.preventDefault();
    await run(() => submitProof(id, { url: proofUrl, note: proofNote }, token));
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <p className="text-[var(--slate)]">Loading...</p>
      </main>
    );
  }

  if (loadError || !job) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">
          {loadError || "Job not found"}
        </p>
      </main>
    );
  }

  const isPoster = user && job.postedBy === user.id;
  const isAcceptedSeeker = user && job.acceptedBy && job.acceptedBy === user.id;
  const isParticipant = isPoster || isAcceptedSeeker;
  const isDailyWage = job.workflowType === "daily_wage";

  const canAccept = user && user.role === "seeker" && job.status === "open" && !job.acceptedBy;
  const canVerify = isPoster && job.status === "accepted";
  const canApprove = isPoster && ["verifying", "accepted", "confirmed"].includes(job.status);
  const canSubmitProof = isDailyWage && isAcceptedSeeker && job.status === "awaiting_proof";

  const myConfirmed = isDailyWage
    ? (isPoster ? job.posterConfirmed : isAcceptedSeeker ? job.seekerConfirmed : false)
    : (isPoster ? job.connection?.posterConfirmedCall : isAcceptedSeeker ? job.connection?.seekerConfirmedCall : false);

  const bothConfirmed = isDailyWage
    ? job.seekerConfirmed && job.posterConfirmed
    : job.connection?.seekerConfirmedCall && job.connection?.posterConfirmedCall;

  const canConfirm =
    isParticipant &&
    !myConfirmed &&
    (isDailyWage ? job.status === "awaiting_proof" : job.status === "connecting");

  const canFinalize = isParticipant && job.status !== "completed" && bothConfirmed;

  const canPayInvoice = isPoster && job.commission && !job.commission.paid;

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        <Link href="/jobs" className="inline-block mb-6 text-sm text-[var(--slate)] hover:text-[var(--ink)] transition-colors">
          &larr; Back to Jobs
        </Link>

        <div className="bg-white border border-[var(--slate)]/15 rounded-sm p-8 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">{job.jobTitle}</h1>
              <p className="text-sm text-[var(--slate)] mt-1">
                {job.category} - {job.jobType} - {job.location?.address}
              </p>
            </div>
            <span className="font-mono text-xs uppercase text-[var(--slate)] border border-[var(--slate)]/25 rounded-sm px-2 py-1">
              {job.status}
            </span>
          </div>

          <p className="text-sm text-[var(--ink)] whitespace-pre-wrap mb-4">{job.description}</p>

          <div className="text-sm text-[var(--slate)] mb-6 space-y-1">
            <p>Salary: {isPoster ? job.salary?.amount : estimatedNetPay(job)} ({job.salary?.type})</p>
            <p>Workflow tier: {job.workflowType}</p>
            {job.commission && (
              <p>Commission: {job.commission.amount} - {job.commission.paid ? "paid" : "unpaid"}</p>
            )}
            {isParticipant && (job.status === "awaiting_proof" || job.status === "connecting") && (
              <p>
                Confirmation: seeker {isDailyWage ? (job.seekerConfirmed ? "✓" : "pending") : (job.connection?.seekerConfirmedCall ? "✓" : "pending")}
                {" - "}
                poster {isDailyWage ? (job.posterConfirmed ? "✓" : "pending") : (job.connection?.posterConfirmedCall ? "✓" : "pending")}
              </p>
            )}
          </div>

          {actionError && (
            <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2 mb-4">
              {actionError}
            </p>
          )}

          <div className="space-y-3">
            {canAccept && (
              <button onClick={() => run(() => acceptJob(id, token))} disabled={acting}
                className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Accept Job"}
              </button>
            )}

            {canVerify && (
              <button onClick={() => run(() => verifyJob(id, token))} disabled={acting}
                className="w-full py-3 border border-[var(--slate)]/30 rounded-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors disabled:opacity-50">
                {acting ? "Working..." : isDailyWage ? "Run Verification Check" : "Start Verification Window"}
              </button>
            )}

            {canApprove && (
              <button onClick={() => run(() => approveJob(id, token))} disabled={acting}
                className="w-full py-3 border border-[var(--slate)]/30 rounded-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Approve"}
              </button>
            )}

            {canSubmitProof && (
              <form onSubmit={handleSubmitProof} className="space-y-3 border-t border-[var(--slate)]/15 pt-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">Proof URL</label>
                  <input required type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40" />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">Note (optional)</label>
                  <input value={proofNote} onChange={(e) => setProofNote(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40" />
                </div>
                <button type="submit" disabled={acting}
                  className="w-full py-3 border border-[var(--slate)]/30 rounded-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors disabled:opacity-50">
                  {acting ? "Working..." : "Submit Proof"}
                </button>
              </form>
            )}

            {canConfirm && (
              <button onClick={() => run(() => confirmJob(id, token))} disabled={acting}
                className="w-full py-3 border border-[var(--slate)]/30 rounded-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Confirm Completion"}
              </button>
            )}

            {canFinalize && (
              <button onClick={() => run(() => finalizeJob(id, token))} disabled={acting}
                className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Finalize Job"}
              </button>
            )}

            {canPayInvoice && (
              <button onClick={() => run(() => payInvoice(id, token))} disabled={acting}
                className="w-full py-3 border border-[var(--slate)]/30 rounded-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors disabled:opacity-50">
                {acting ? "Working..." : `Pay Invoice (${job.commission?.amount})`}
              </button>
            )}

            {!user && (
              <p className="text-sm text-[var(--slate)]">
                <Link href="/login" className="underline">Log in</Link> to interact with this job.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
