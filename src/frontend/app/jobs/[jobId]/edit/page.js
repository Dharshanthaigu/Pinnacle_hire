"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getJob, updateJob } from "@/lib/api/jobs";

export default function EditJobPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [job, setJob] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]";
  const labelClass = "block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5";

  useEffect(() => {
    getJob(jobId, token)
      .then((j) => {
        setJob(j);
        setForm({
          jobTitle: j.jobTitle || "",
          description: j.description || "",
          category: j.category || "",
          salaryAmount: j.salary?.amount ?? "",
          numberOfOpenings: j.numberOfOpenings ?? "",
          applicationDeadline: j.applicationDeadline ? j.applicationDeadline.slice(0, 10) : "",
          jobContactPhone: j.jobContactPhone || "",
          workStartDate: j.workStartDate ? j.workStartDate.slice(0, 10) : "",
          workEndDate: j.workEndDate ? j.workEndDate.slice(0, 10) : "",
          workingHoursStart: j.workingHoursStart || "",
          workingHoursEnd: j.workingHoursEnd || "",
        });
      })
      .catch((err) => setError(err.message || "Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId, token]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        jobTitle: form.jobTitle,
        description: form.description,
        category: form.category,
        salary: { ...job.salary, amount: Number(form.salaryAmount) },
        numberOfOpenings: Number(form.numberOfOpenings),
        applicationDeadline: form.applicationDeadline,
        jobContactPhone: form.jobContactPhone,
      };
      if (job.workflowType === "daily_wage") {
        payload.workStartDate = form.workStartDate;
        payload.workEndDate = form.workEndDate;
        payload.workingHoursStart = form.workingHoursStart;
        payload.workingHoursEnd = form.workingHoursEnd;
      }
      await updateJob(jobId, payload, token);
      router.push(`/jobs/${jobId}`);
    } catch (err) {
      setError(err.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]"><p className="text-[var(--slate)]">Loading...</p></main>;
  }
  if (error && !form) {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]"><p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">{error}</p></main>;
  }
  if (!user || !job || String(job.postedBy) !== user.id) {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]"><p className="text-[var(--slate)]">You don't have permission to edit this job.</p></main>;
  }
  if (job.status !== "open") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <p className="text-[var(--slate)]">This job can no longer be edited - a candidate has already accepted it.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href={`/jobs/${jobId}`} className="inline-block mb-6 text-sm text-[var(--slate)] hover:text-[var(--ink)] transition-colors">&larr; Back to Job</Link>

        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">Edit Job</span>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] mt-2">{job.jobTitle}</h1>
        </div>

        <div className="bg-white border border-[var(--slate)]/15 rounded-sm p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className={labelClass}>Job Title</label><input name="jobTitle" required value={form.jobTitle} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Job Description</label><textarea name="description" required rows={4} value={form.description} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Category</label><input name="category" required value={form.category} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Salary Amount</label><input name="salaryAmount" type="number" required value={form.salaryAmount} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Number of Openings</label><input name="numberOfOpenings" type="number" min="1" required value={form.numberOfOpenings} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Application Deadline</label><input name="applicationDeadline" type="date" required value={form.applicationDeadline} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Job Contact Phone</label><input name="jobContactPhone" required value={form.jobContactPhone} onChange={handleChange} className={inputClass} /></div>

            {job.workflowType === "daily_wage" && (
              <div className="border-t border-[var(--slate)]/15 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Work Start Date</label><input name="workStartDate" type="date" required value={form.workStartDate} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Work End Date</label><input name="workEndDate" type="date" required value={form.workEndDate} onChange={handleChange} className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Working Time Start</label><input name="workingHoursStart" type="time" required value={form.workingHoursStart} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Working Time End</label><input name="workingHoursEnd" type="time" required value={form.workingHoursEnd} onChange={handleChange} className={inputClass} /></div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">{error}</p>}

            <button type="submit" disabled={saving}
              className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}