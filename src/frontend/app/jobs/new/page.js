"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createJob } from "@/lib/api/jobs";

const JOB_TYPES = ["full-time", "part-time", "gig", "contract", "one-time"];
const WORKFLOW_TYPES = [
  { value: "daily_wage", label: "Daily Wage" },
  { value: "mid_level", label: "Mid-Level" },
  { value: "leadership", label: "Leadership" },
];
const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on-site", label: "On-site" },
];

function Req() {
  return <span className="text-[var(--flag)]">*</span>;
}
function MatchNote({ children }) {
  return <span className="italic text-[var(--slate)]/70 text-xs normal-case tracking-normal font-normal"> *{children}</span>;
}

export default function NewJobPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    jobTitle: "", description: "", category: "",
    jobType: "full-time", workflowType: "daily_wage",
    address: "", lat: "", lng: "",
    salaryAmount: "",
    minExperience: "",
    numberOfOpenings: "1", applicationDeadline: "", workMode: "on-site", jobContactPhone: "",
    postingAttested: false,
    durationChoice: "0.5", customDuration: "",
    foodProvided: false, transportationProvided: false,
    workStartDate: "", workEndDate: "",
    workingHoursStart: "", workingHoursEnd: "",
    instructionsText: "",
    requiredSkills: "",
    minClientProjectExperience: "", minTeamSizeExperience: "",
    minDirectReportsToBoard: "", requiredDomainExpertise: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const inputClass = "w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]";
  const labelClass = "block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5";
  const minWorkStartDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  function useMyLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation isn't supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
      },
      (err) => {
        setLocationError(err.code === err.PERMISSION_DENIED ? "Location permission denied. Enter manually." : "Couldn't get your location. Enter manually.");
        setLocating(false);
      }
    );
  }

    async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.postingAttested) {
      setError("You must confirm this posting is real and active before submitting.");
      return;
    }
    if (form.applicationDeadline < minWorkStartDate) {
      setError("Application deadline must start from tomorrow, not today.");
      return;
    }
    if (form.workflowType === "daily_wage" && form.workStartDate < minWorkStartDate) {
      setError("Work start date must be a future date - it cannot be today.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        jobTitle: form.jobTitle,
        description: form.description,
        category: form.category,
        jobType: form.jobType,
        workflowType: form.workflowType,
        location: { address: form.address, lat: Number(form.lat), lng: Number(form.lng) },
        salary: { amount: Number(form.salaryAmount), type: "fixed" },
        minExperience: Number(form.minExperience),
        numberOfOpenings: Number(form.numberOfOpenings),
        applicationDeadline: form.applicationDeadline,
        workMode: form.workMode,
        jobContactPhone: form.jobContactPhone,
        postingAttested: form.postingAttested,
      };
      if (form.workflowType === "daily_wage") {
        const durationMinutes = form.durationChoice === "custom" ? Number(form.customDuration) : Number(form.durationChoice);
        payload.foodProvided = form.foodProvided;
        payload.transportationProvided = form.transportationProvided;
        payload.workStartDate = form.workStartDate;
        payload.workEndDate = form.workEndDate;
        payload.workingHoursStart = form.workingHoursStart;
        payload.workingHoursEnd = form.workingHoursEnd;
        payload.instructionsText = form.instructionsText;
        payload.instructionsDurationMinutes = durationMinutes;
      } else {
        payload.requiredSkills = form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean);
        if (form.workflowType === "mid_level") {
          payload.minClientProjectExperience = Number(form.minClientProjectExperience);
          payload.minTeamSizeExperience = Number(form.minTeamSizeExperience);
        }
        if (form.workflowType === "leadership") {
          payload.minDirectReportsToBoard = Number(form.minDirectReportsToBoard);
          if (form.requiredDomainExpertise) {
            payload.requiredDomainExpertise = form.requiredDomainExpertise.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }
      }
      await createJob(payload, token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]"><p className="text-[var(--slate)]">You need to log in first.</p></main>;
  }
  if (user.role !== "poster") {
    return <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]"><p className="text-[var(--slate)]">Only job posters can create a job.</p></main>;
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">New Job</span>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] mt-2">Post a job</h1>
        </div>

        <div className="bg-white border border-[var(--slate)]/15 rounded-sm p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className={labelClass}>Job Title <Req /></label><input name="jobTitle" required value={form.jobTitle} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Job Description <Req /></label><textarea name="description" required rows={4} value={form.description} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Category <Req /><MatchNote>matches seeker profile</MatchNote></label><input name="category" required value={form.category} onChange={handleChange} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Job Type <Req /></label>
              <select name="jobType" value={form.jobType} onChange={handleChange} className={inputClass}>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Workflow Tier <Req /></label>
              <select name="workflowType" value={form.workflowType} onChange={handleChange} className={inputClass}>
                {WORKFLOW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Experience (years) <Req /><MatchNote>matches seeker profile</MatchNote></label>
              <input name="minExperience" type="number" min="0" required value={form.minExperience} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Number of Openings <Req /></label>
              <input name="numberOfOpenings" type="number" min="1" required value={form.numberOfOpenings} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Application Deadline <Req /></label>
              <input
                name="applicationDeadline"
                type="date"
                required
                min={minWorkStartDate}
                value={form.applicationDeadline}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Work Mode <Req /></label>
              <select name="workMode" value={form.workMode} onChange={handleChange} className={inputClass}>
                {WORK_MODES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Job Contact Phone <Req /></label>
              <input name="jobContactPhone" required value={form.jobContactPhone} onChange={handleChange} className={inputClass} />
            </div>

            {form.workflowType === "daily_wage" && (
              <div className="border-t border-[var(--slate)]/15 pt-4 space-y-4">
                <label className="flex items-center gap-2 text-sm text-[var(--slate)]">
                  <input type="checkbox" name="foodProvided" checked={form.foodProvided} onChange={handleChange} /> Food provided <span className="text-xs text-[var(--slate)]">(optional)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--slate)]">
                  <input type="checkbox" name="transportationProvided" checked={form.transportationProvided} onChange={handleChange} /> Transportation provided <span className="text-xs text-[var(--slate)]">(optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Work Start Date <Req /></label>
                    <input name="workStartDate" type="date" required min={minWorkStartDate} value={form.workStartDate} onChange={handleChange} className={inputClass} />
                    <p className="text-xs text-[var(--slate)] mt-1">Must be a future date - today is not allowed.</p>
                  </div>
                  <div><label className={labelClass}>Work End Date <Req /></label><input name="workEndDate" type="date" required min={form.workStartDate || minWorkStartDate} value={form.workEndDate} onChange={handleChange} className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Working Time Start <Req /></label><input name="workingHoursStart" type="time" required value={form.workingHoursStart} onChange={handleChange} className={inputClass} /></div>
                  <div><label className={labelClass}>Working Time End <Req /></label><input name="workingHoursEnd" type="time" required value={form.workingHoursEnd} onChange={handleChange} className={inputClass} /></div>
                </div>
                <div>
                  <label className={labelClass}>Instructions / Protocol <Req /></label>
                  <textarea name="instructionsText" required rows={3} value={form.instructionsText} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            )}

            {(form.workflowType === "mid_level" || form.workflowType === "leadership") && (
              <div className="border-t border-[var(--slate)]/15 pt-4 space-y-4">
                <div>
                  <label className={labelClass}>Skills (comma separated) <Req /><MatchNote>matches seeker profile</MatchNote></label>
                  <input name="requiredSkills" required value={form.requiredSkills} onChange={handleChange} className={inputClass} />
                </div>

                {form.workflowType === "mid_level" && (
                  <>
                    <div>
                      <label className={labelClass}>Minimum Client-Facing Project Experience (years) <Req /></label>
                      <input name="minClientProjectExperience" type="number" min="0" required value={form.minClientProjectExperience} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Minimum Team Size Experience <Req /></label>
                      <input name="minTeamSizeExperience" type="number" min="0" required value={form.minTeamSizeExperience} onChange={handleChange} className={inputClass} />
                    </div>
                  </>
                )}

                {form.workflowType === "leadership" && (
                  <>
                    <div>
                      <label className={labelClass}>Minimum Direct Reports to Board <Req /></label>
                      <input name="minDirectReportsToBoard" type="number" min="0" required value={form.minDirectReportsToBoard} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Required Domain/Tools Expertise (comma separated) <span className="text-xs text-[var(--slate)]">(optional)</span></label>
                      <input name="requiredDomainExpertise" value={form.requiredDomainExpertise} onChange={handleChange} className={inputClass} />
                    </div>
                  </>
                )}
              </div>
            )}

            {form.workflowType === "daily_wage" && (
              <>
                <div className="border-t border-[var(--slate)]/15 pt-4">
                  <label className={labelClass}>Timer Duration <Req /></label>
                  <select name="durationChoice" value={form.durationChoice} onChange={handleChange} className={inputClass}>
                    <option value="0.5">30 seconds (testing)</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                {form.durationChoice === "custom" && (
                  <div>
                    <label className={labelClass}>Custom Duration (minutes) <Req /></label>
                    <input name="customDuration" type="number" min="1" required value={form.customDuration} onChange={handleChange} className={inputClass} />
                  </div>
                )}
              </>
            )}

            <div className="border-t border-[var(--slate)]/15 pt-4">
              <label className={labelClass}>Address <Req /></label>
              <input name="address" required value={form.address} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <button type="button" onClick={useMyLocation} disabled={locating}
                className="w-full py-2.5 border border-[var(--slate)]/30 rounded-sm text-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors disabled:opacity-50">
                {locating ? "Getting location..." : "Use my current location"}
              </button>
              {locationError && <p className="text-xs text-[var(--flag)] mt-1.5">{locationError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Latitude <Req /></label><input name="lat" type="number" step="any" required value={form.lat} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Longitude <Req /></label><input name="lng" type="number" step="any" required value={form.lng} onChange={handleChange} className={inputClass} /></div>
            </div>
            <div><label className={labelClass}>Salary Amount <Req /></label><input name="salaryAmount" type="number" required value={form.salaryAmount} onChange={handleChange} className={inputClass} /></div>

            <div className="border-t border-[var(--slate)]/15 pt-4">
              <label className="flex items-start gap-2 text-sm text-[var(--slate)]">
                <input type="checkbox" name="postingAttested" checked={form.postingAttested} onChange={handleChange} className="mt-1" />
                I confirm this is a real, currently active opening. <Req />
              </label>
            </div>

            {error && <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
              {loading ? "Posting..." : "Post Job"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}