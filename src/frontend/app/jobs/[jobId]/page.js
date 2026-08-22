"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getJob, acceptJob, getSeekerProfile, acceptCandidate, startWork,
  reviewCandidate, scheduleMeeting, confirmAttendance,
  confirmJob, submitProof, payInvoice
} from "@/lib/api/jobs";
import { uploadFile } from "@/lib/api/upload";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;

function msLeft(target) {
  if (!target) return 0;
  return new Date(target).getTime() - Date.now();
}
function formatMs(ms) {
  if (ms <= 0) return "ready";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Estimates what the seeker actually receives after commission, using the
// exact same formula settlementService.js applies at completion. This is a
// preview only - the real commission isn't set on the job until it's
// finalized, so this can't be read from the job object before completion.
function estimatedNetPay(job) {
  if (job.salary?.amount == null) return null;
  if (job.workflowType === "daily_wage") return Math.round(job.salary.amount * 0.9);
  if (job.workflowType === "mid_level") return Math.max(0, job.salary.amount - 1500);
  if (job.workflowType === "leadership") return Math.max(0, job.salary.amount - 5000);
  return job.salary.amount;
}

export default function JobDetailPage() {
  const { jobId } = useParams();
  const { user, token } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [seekerProfile, setSeekerProfile] = useState(null);
  const [tick, setTick] = useState(0);

  const [proofFile, setProofFile] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [posterEmail, setPosterEmail] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  function reload() {
    return getJob(jobId, token).then(setJob);
  }

  useEffect(() => {
    getJob(jobId, token)
      .then(setJob)
      .catch((err) => setLoadError(err.message || "Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId, token]);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getJob(jobId, token).then(setJob).catch(() => { });
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId, token]);

  const isPoster = user && job && job.postedBy === user.id;

  useEffect(() => {
    if (isPoster && job?.acceptedBy && !seekerProfile) {
      getSeekerProfile(jobId, token).then(setSeekerProfile).catch(() => { });
    }
  }, [isPoster, job?.acceptedBy, jobId, token, seekerProfile]);

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
    if (!proofFile) {
      setActionError("Select a file to upload as proof.");
      return;
    }
    setActing(true);
    setActionError("");
    try {
      setUploadingProof(true);
      const uploaded = await uploadFile(proofFile, token);
      setUploadingProof(false);
      await submitProof(
        jobId,
        { fileId: uploaded.fileId, filename: uploaded.filename, note: proofNote },
        token
      );
      await reload();
    } catch (err) {
      setActionError(err.message || "Failed to submit proof");
    } finally {
      setUploadingProof(false);
      setActing(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]"><p className="text-[var(--slate)]">Loading...</p></main>;
  }
  if (loadError || !job) {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]"><p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">{loadError || "Job not found"}</p></main>;
  }

  const minMeetingDateTime = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    // datetime-local needs "YYYY-MM-DDTHH:mm" in local time, not UTC ISO string
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00`;
  })();

  const isAcceptedSeeker = user && job.acceptedBy && job.acceptedBy === user.id;
  const isParticipant = isPoster || isAcceptedSeeker;
  const isDailyWage = job.workflowType === "daily_wage";

  const canAccept = user && user.role === "seeker" && job.status === "open" && !job.acceptedBy;
  const canAcceptCandidate = isPoster && job.status === "accepted";

  const timerMs = msLeft(job.instructions?.readyAt);
  const canStartWork = isDailyWage && isAcceptedSeeker && job.status === "confirmed" && timerMs <= 0;

  const canReviewCandidate = !isDailyWage && isPoster && job.status === "confirmed";
  const canScheduleMeeting = !isDailyWage && isPoster && job.status === "verifying";
  // Seeker's only step before confirming completion is attendance - the old
  // readiness-timer step (confirmReady / finalConfirmedAt) no longer exists.
  const canConfirmAttendance = !isDailyWage && isAcceptedSeeker && job.status === "connecting" && !job.interview?.seekerAttendConfirmedAt;

  const myConfirmed = isDailyWage
    ? (isPoster ? job.posterConfirmed : isAcceptedSeeker ? job.seekerConfirmed : false)
    : (isPoster ? job.connection?.posterConfirmedCall : isAcceptedSeeker ? job.connection?.seekerConfirmedCall : false);
  const bothConfirmed = isDailyWage
    ? job.seekerConfirmed && job.posterConfirmed
    : job.connection?.seekerConfirmedCall && job.connection?.posterConfirmedCall;

  // Matches the backend's confirmJob gating exactly: for daily_wage, proof
  // is checked via proof.fileId (not proof.url - that field no longer
  // exists). For mid/leadership, only attendance confirmation is required now.
  const canConfirm = isParticipant && !myConfirmed && (
    isDailyWage
      ? isAcceptedSeeker
        ? job.status === "awaiting_proof" && !!job.proof?.fileId
        : job.status === "awaiting_proof" && job.seekerConfirmed
      : job.status === "connecting" && !!job.interview?.seekerAttendConfirmedAt
  );

  const canPayInvoice = isPoster && job.commission?.amount && !job.commission.paid;


  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        <Link href="/dashboard" className="inline-block mb-6 text-sm text-[var(--slate)] hover:text-[var(--ink)] transition-colors">&larr; Back to Dashboard</Link>

        <div className="bg-white border border-[var(--slate)]/15 rounded-sm p-8 shadow-sm">
          {isDailyWage && isAcceptedSeeker && job.status === "confirmed" && job.instructions?.readyAt && (
            <div className="text-center py-4 mb-4 border border-[var(--brass)]/40 rounded-sm bg-[var(--brass)]/5">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--slate)]">Timer - work unlocks in</p>
              <p className="text-3xl font-mono text-[var(--ink)] mt-1">{formatMs(timerMs)}</p>
            </div>
          )}

          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">{job.jobTitle}</h1>
              <p className="text-sm text-[var(--slate)] mt-1">{job.category} - {job.jobType} - {job.location?.address}</p>
            </div>
            {isPoster && job.status === "open" && (
              <Link href={`/jobs/${jobId}/edit`}
                className="px-3 py-1.5 border border-[var(--slate)]/30 rounded-sm text-xs font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors whitespace-nowrap">
                Edit Job
              </Link>
            )}
          </div>

          <p className="text-sm text-[var(--ink)] whitespace-pre-wrap mb-4">{job.description}</p>

          <div className="text-sm text-[var(--slate)] mb-6 space-y-1">
            <p>Salary: {isPoster ? job.salary?.amount : estimatedNetPay(job)} ({job.salary?.type})</p>
            <p>Workflow tier: {job.workflowType}</p>
            {isPoster && job.commission?.amount != null && <p>Commission: {job.commission.amount} - {job.commission.paid ? "paid" : "unpaid"}</p>}
          </div>

          {actionError && (
            <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2 mb-4">
              {actionError}
            </p>
          )}

          <div className="space-y-4">
            {canAccept && (
              <button onClick={() => run(() => acceptJob(jobId, token))} disabled={acting}
                className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Accept Job"}
              </button>
            )}

            {isPoster && job.acceptedBy && ["accepted", "confirmed", "verifying", "connecting", "awaiting_proof", "completed"].includes(job.status) && (
              <div className="border border-[var(--slate)]/15 rounded-sm p-4 bg-[var(--paper)]/40">
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">Candidate Profile</p>
                {!seekerProfile && <p className="text-sm text-[var(--slate)]">Loading profile...</p>}
                {seekerProfile?.candidate && (
                  <div className="text-sm text-[var(--ink)] space-y-1">
                    <p>Name: {seekerProfile.candidate.name}</p>
                    <p>Phone: {seekerProfile.candidate.phone}</p>
                    <p>Reputation: {seekerProfile.candidate.reputationScore} - Completed jobs: {seekerProfile.candidate.completedJobs}</p>
                    {seekerProfile.candidate.professionalInfo?.workCategory && (
                      <p>Tier: {seekerProfile.candidate.professionalInfo.workCategory}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {canAcceptCandidate && (
              <button onClick={() => run(() => acceptCandidate(jobId, token))} disabled={acting}
                className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Accept Candidate"}
              </button>
            )}

            {isDailyWage && ["confirmed", "awaiting_proof", "completed"].includes(job.status) && job.instructions?.text && (
              <div className="border border-[var(--slate)]/15 rounded-sm p-4 bg-[var(--paper)]/40">
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">Instructions</p>
                <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{job.instructions.text}</p>
              </div>
            )}

            {canStartWork && (
              <button onClick={() => run(() => startWork(jobId, token))} disabled={acting}
                className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Start the Work"}
              </button>
            )}

            {isDailyWage && job.status === "awaiting_proof" && isAcceptedSeeker && !job.proof?.fileId && (
              <form onSubmit={handleSubmitProof} className="space-y-3 border-t border-[var(--slate)]/15 pt-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">Proof File</label>
                  <input
                    required
                    type="file"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">Note (optional)</label>
                  <input value={proofNote} onChange={(e) => setProofNote(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40" />
                </div>
                <button type="submit" disabled={acting}
                  className="w-full py-3 border border-[var(--slate)]/30 rounded-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors disabled:opacity-50">
                  {uploadingProof ? "Uploading..." : acting ? "Working..." : "Submit Proof"}
                </button>
              </form>
            )}

            {isDailyWage && job.proof?.fileId && (
              <div className="border border-[var(--slate)]/15 rounded-sm p-4 bg-[var(--paper)]/40 text-sm text-[var(--ink)]">
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1">Proof Submitted</p>
                <a href={`${AUTH_URL}/../uploads/${job.proof.fileId}`} target="_blank" rel="noopener noreferrer" className="underline">
                  {job.proof.filename}
                </a>
                {job.proof.note && <p className="text-[var(--slate)] mt-1">{job.proof.note}</p>}
              </div>
            )}

            {canReviewCandidate && (
              <form onSubmit={(e) => { e.preventDefault(); run(() => reviewCandidate(jobId, { posterEmail }, token)); }}
                className="space-y-3 border-t border-[var(--slate)]/15 pt-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">Your Contact Email</label>
                  <input required type="email" value={posterEmail} onChange={(e) => setPosterEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40" />
                </div>
                <button type="submit" disabled={acting}
                  className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
                  {acting ? "Working..." : "Mark Candidate Reviewed"}
                </button>
              </form>
            )}

            {canScheduleMeeting && (
              <form onSubmit={(e) => { e.preventDefault(); run(() => scheduleMeeting(jobId, { meetingDate, meetingLink }, token)); }}
                className="space-y-3 border-t border-[var(--slate)]/15 pt-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">Meeting Date & Time</label>
                  <input required type="datetime-local" min={minMeetingDateTime} value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40" />
                  <p className="text-xs text-[var(--slate)] mt-1">Must be tomorrow or later.</p>
                </div>
                <a href="https://meet.new" target="_blank" rel="noopener noreferrer"
                  className="inline-block text-sm text-[var(--ink)] underline underline-offset-2">
                  Create a Google Meet link &rarr;
                </a>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">Meeting Link</label>
                  <input required type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40" />
                </div>
                <button type="submit" disabled={acting}
                  className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
                  {acting ? "Working..." : "Schedule Meeting"}
                </button>
              </form>
            )}

            {!isDailyWage && ["connecting", "completed"].includes(job.status) && job.interview?.meetingLink && (
              <div className="border border-[var(--slate)]/15 rounded-sm p-4 bg-[var(--paper)]/40 text-sm text-[var(--ink)] space-y-1">
                <p>Meeting: {new Date(job.interview.meetingDate).toLocaleString()}</p>
                <p><a href={job.interview.meetingLink} target="_blank" rel="noopener noreferrer" className="underline">{job.interview.meetingLink}</a></p>
              </div>
            )}

            {canConfirmAttendance && (
              <button onClick={() => run(() => confirmAttendance(jobId, token))} disabled={acting}
                className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Confirm I'll Attend"}
              </button>
            )}

            {isParticipant && ((isDailyWage && job.status === "awaiting_proof") || (!isDailyWage && job.status === "connecting")) && (
              <p className="text-sm text-[var(--slate)]">
                Confirmation: seeker {isDailyWage ? (job.seekerConfirmed ? "?" : "pending") : (job.connection?.seekerConfirmedCall ? "?" : "pending")}
                {" - "}
                poster {isDailyWage ? (job.posterConfirmed ? "?" : "pending") : (job.connection?.posterConfirmedCall ? "?" : "pending")}
              </p>
            )}

            {canConfirm && (
              <button onClick={() => run(() => confirmJob(jobId, token))} disabled={acting}
                className="w-full py-3 border border-[var(--slate)]/30 rounded-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors disabled:opacity-50">
                {acting ? "Working..." : "Confirm Completion"}
              </button>
            )}

            {job.status === "completed" && (
              <p className="text-sm text-[var(--slate)] border-t border-[var(--slate)]/15 pt-4">
                This job is completed. It finalized automatically once both parties confirmed - no separate finalize step exists.
              </p>
            )}

            {canPayInvoice && (
              <button onClick={() => run(() => payInvoice(jobId, token))} disabled={acting}
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