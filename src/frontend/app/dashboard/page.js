"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listMyJobs, listJobs } from "@/lib/api/jobs";
import { getMe } from "@/lib/api/auth";

function classify(job) {
  if (["instructions_sent", "accepted", "confirmed", "verifying", "connecting"].includes(job.status)) return "upcoming";
  if (job.status === "awaiting_proof") return "today";
  return "finished";
}

// Estimates what the seeker actually receives after commission, using the
// exact same formula settlementService.js applies at completion. This is a
// preview only - the real commission isn't set on the job until it's
// finalized, so this can't be read from the job object for open jobs.
function estimatedNetPay(job) {
  if (job.salary?.amount == null) return null;
  if (job.workflowType === "daily_wage") return Math.round(job.salary.amount * 0.9);
  if (job.workflowType === "mid_level") return Math.max(0, job.salary.amount - 1500);
  if (job.workflowType === "leadership") return Math.max(0, job.salary.amount - 5000);
  return job.salary.amount;
}

function JobRow({ job }) {
  return (
    <Link href={`/jobs/${job._id}`} className="block border border-[var(--slate)]/15 rounded-sm p-4 bg-[var(--paper)]/40 hover:border-[var(--brass)] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-[var(--ink)]">{job.jobTitle}</p>
          <p className="text-xs text-[var(--slate)] mt-0.5">{job.category} - {job.jobType}</p>
        </div>
        <span className="font-mono text-xs uppercase text-[var(--slate)]">{job.status}</span>
      </div>
    </Link>
  );
}

function OpenJobRow({ job }) {
  const netPay = estimatedNetPay(job);
  return (
    <Link href={`/jobs/${job._id}`} className="block border border-[var(--slate)]/15 rounded-sm p-4 bg-[var(--paper)]/40 hover:border-[var(--brass)] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-[var(--ink)]">{job.jobTitle}</p>
          <p className="text-xs text-[var(--slate)] mt-0.5">{job.category} - {job.jobType} - {job.location?.address}</p>
        </div>
        <span className="font-mono text-xs text-[var(--ink)]">
          {netPay != null ? `${netPay} (${job.salary?.type})` : ""}
        </span>
      </div>
    </Link>
  );
}


// Case-insensitive, no strict validation - just plain word overlap, per spec.
function normalizeList(arr) {
  return (arr || []).map((s) => (s || "").toLowerCase().trim()).filter(Boolean);
}

// Skills match: if the job doesn't require skills, or the seeker's tier has
// no skills-equivalent field at all (daily_wage), don't filter on this -
// pass automatically rather than hiding everything.
function skillsMatch(jobSkills, seekerSkills) {
  if (!jobSkills || jobSkills.length === 0) return true;
  if (!seekerSkills || seekerSkills.length === 0) return true;
  const job = normalizeList(jobSkills);
  const seeker = normalizeList(seekerSkills);
  return job.some((js) => seeker.some((ss) => ss.includes(js) || js.includes(ss)));
}

function jobMatchesSeeker(job, profile, workCategory) {
  if (!profile) return true; // profile still loading - don't flash an empty list

  let seekerTitle = "";
  let seekerExp = null;
  let seekerSkills = null; // null = tier has no skills field, skip that check

  if (workCategory === "daily_wage") {
    const info = profile.professionalInfo?.dailyWage;
    if (!info) return true;
    seekerTitle = (info.trade || "").toLowerCase();
    seekerExp = info.yearsInTrade;
    // No skills-equivalent field for daily_wage - seekerSkills stays null,
    // skillsMatch() will pass it through automatically.
  } else if (workCategory === "mid_level") {
    const info = profile.professionalInfo?.midLevel;
    if (!info) return true;
    seekerTitle = (info.currentTitle || "").toLowerCase();
    seekerExp = info.totalExperienceYears;
    seekerSkills = [...(info.primarySkills || []), ...(info.secondarySkills || [])];
  } else if (workCategory === "leadership") {
    const info = profile.professionalInfo?.leadership;
    if (!info) return true;
    seekerTitle = (info.currentTitle || "").toLowerCase();
    seekerExp = info.yearsInLeadership;
    // Leadership has no true "skills" field - industryFocus is the closest
    // stand-in, used here as a deliberate substitute, not a real match.
    seekerSkills = info.industryFocus || [];
  } else {
    return true;
  }

  const jobText = `${job.jobTitle || ""} ${job.category || ""}`.toLowerCase();
  const titleWords = seekerTitle.split(/\s+/).filter((w) => w.length > 2);
  const titleMatch = titleWords.length === 0 ? true : titleWords.some((w) => jobText.includes(w));

  const expOk = seekerExp == null || job.minExperience == null ? true : seekerExp >= job.minExperience;

  const skillsOk = skillsMatch(job.requiredSkills, seekerSkills);

  return titleMatch && expOk && skillsOk;
}

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [openJobs, setOpenJobs] = useState([]);
  const [openJobsLoading, setOpenJobsLoading] = useState(true);
  const [openJobsError, setOpenJobsError] = useState("");
  const [fullProfile, setFullProfile] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (!user.profileComplete) router.push("/complete-profile");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !user.profileComplete) { setJobsLoading(false); return; }
    let cancelled = false;
    function load() {
      listMyJobs(token)
        .then((data) => { if (!cancelled) setJobs(data); })
        .catch((err) => { if (!cancelled) setJobsError(err.message || "Failed to load jobs"); })
        .finally(() => { if (!cancelled) setJobsLoading(false); });
    }
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, token]);

  useEffect(() => {
    if (!user || !user.profileComplete || user.role !== "seeker") { setOpenJobsLoading(false); return; }
    let cancelled = false;
    function load() {
      listJobs(token)
        .then((data) => { if (!cancelled) setOpenJobs(data); })
        .catch((err) => { if (!cancelled) setOpenJobsError(err.message || "Failed to load open jobs"); })
        .finally(() => { if (!cancelled) setOpenJobsLoading(false); });
    }
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, token]);

  useEffect(() => {
    if (!user || user.role !== "seeker") return;
    getMe(token).then((res) => setFullProfile(res.user)).catch(() => { });
  }, [user, token]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (loading || !user || !user.profileComplete) {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]"><p className="text-[var(--slate)]">Loading...</p></main>;
  }

  const today = jobs.filter((j) => classify(j) === "today");
  const upcoming = jobs.filter((j) => classify(j) === "upcoming");
  const finished = jobs.filter((j) => classify(j) === "finished");
  const myJobIds = new Set(jobs.map((j) => j._id));

  const effectiveWorkCategory =
    fullProfile?.professionalInfo?.workCategory || user.workCategory || null;

  const browsableOpenJobs = openJobs.filter(
    (j) =>
      !myJobIds.has(j._id) &&
      (!effectiveWorkCategory || j.workflowType === effectiveWorkCategory) &&
      jobMatchesSeeker(j, fullProfile, effectiveWorkCategory)
  );

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">Dashboard</span>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink)] mt-2">Welcome, {user.name}</h1>
            <p className="mt-1 text-sm text-[var(--slate)]">{user.email} - {user.role === "poster" ? "Job Poster" : "Job Seeker"}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="px-4 py-2 border border-[var(--slate)]/30 rounded-sm text-sm font-medium text-[var(--slate)] hover:bg-[var(--slate)]/10 transition-colors">My Profile</Link>
            <button onClick={handleLogout} className="px-4 py-2 border border-[var(--slate)]/30 rounded-sm text-sm font-medium text-[var(--slate)] hover:bg-[var(--slate)]/10 transition-colors">Log out</button>
          </div>
        </div>

        {jobsLoading && <p className="text-[var(--slate)]">Loading jobs...</p>}
        {jobsError && <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">{jobsError}</p>}

        {!jobsLoading && !jobsError && user.role === "seeker" && (
          <div className="space-y-6">
            <section>
              <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">
                Active Jobs {effectiveWorkCategory ? `(${effectiveWorkCategory})` : ""}
              </h2>
              {openJobsLoading && <p className="text-sm text-[var(--slate)]">Loading open jobs...</p>}
              {openJobsError && <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">{openJobsError}</p>}
              {!openJobsLoading && !openJobsError && browsableOpenJobs.length === 0 && (
                <p className="text-sm text-[var(--slate)]">No open jobs matching your title, experience, and skills right now.</p>
              )}
              {!openJobsLoading && !openJobsError && browsableOpenJobs.length > 0 && <div className="space-y-2">{browsableOpenJobs.map((j) => <OpenJobRow key={j._id} job={j} />)}</div>}
            </section>
            <section>
              <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">Accepted Jobs</h2>
              {upcoming.length === 0 ? <p className="text-sm text-[var(--slate)]">No accepted jobs.</p> : <div className="space-y-2">{upcoming.map((j) => <JobRow key={j._id} job={j} />)}</div>}
            </section>
            <section>
              <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">Finished</h2>
              {finished.length === 0 ? <p className="text-sm text-[var(--slate)]">No finished jobs yet.</p> : <div className="space-y-2">{finished.map((j) => <JobRow key={j._id} job={j} />)}</div>}
            </section>
            <section>
              <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">Today</h2>
              {today.length === 0 ? <p className="text-sm text-[var(--slate)]">Nothing active today.</p> : <div className="space-y-2">{today.map((j) => <JobRow key={j._id} job={j} />)}</div>}
            </section>
          </div>
        )}

        {!jobsLoading && !jobsError && user.role === "poster" && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-mono text-xs uppercase tracking-wider text-[var(--slate)]">Posted Jobs</h2>
              <Link href="/jobs/new" className="px-3 py-1.5 bg-[var(--ink)] text-[var(--paper)] rounded-sm text-xs font-medium hover:bg-[var(--slate)] transition-colors">+ Post a Job</Link>
            </div>
            {jobs.length === 0 ? <p className="text-sm text-[var(--slate)]">You haven't posted any jobs yet.</p> : <div className="space-y-2">{jobs.map((j) => <JobRow key={j._id} job={j} />)}</div>}
          </section>
        )}
      </div>
    </main>
  );
}