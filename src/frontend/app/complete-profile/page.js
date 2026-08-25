"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { completeProfile, uploadResume } from "@/lib/api/auth";

const TIERS = [
  { value: "daily_wage", label: "Daily Wage" },
  { value: "mid_level", label: "Mid-Level" },
  { value: "leadership", label: "Leadership" },
];

const EDUCATION_LEVELS = [
  { value: "high_school", label: "High School" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Other" },
];
const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];
const AVAILABILITY_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "2_weeks", label: "2 Weeks" },
  { value: "1_month", label: "1 Month" },
  { value: "1_plus_month", label: "1+ Month" },
];

function toArray(str) {
  return (str || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function Req() {
  return <span className="text-[var(--flag)]">*</span>;
}
function Opt() {
  return <span className="text-xs text-[var(--slate)]"> (optional)</span>;
}

export default function CompleteProfilePage() {
  const { user, token, login } = useAuth();
  const router = useRouter();
  const [tier, setTier] = useState("");
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [refNA, setRefNA] = useState(false);

  const inputClass = "w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]";
  const labelClass = "block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5";

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function toggleEmploymentType(value) {
    setForm((prev) => {
      const current = prev.employmentTypes || [];
      return {
        ...prev,
        employmentTypes: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  }

  function selectTier(value) {
    setTier(value);
    setForm({});
    setRefNA(false);
  }

  // Reference letter URL must pass z.string().url() on the backend - literal
  // "NA" text would fail that check, so this uses a valid placeholder URL
  // instead while the other 3 fields use plain "NA" text.
  function handleRefNAToggle(e) {
    const checked = e.target.checked;
    setRefNA(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        refName: "NA",
        refRelationship: "NA",
        refContact: "NA",
        refLetterUrl: "https://example.com/na",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        refName: "",
        refRelationship: "",
        refContact: "",
        refLetterUrl: "",
      }));
    }
  }

  async function handleResumeChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeError("");
    setResumeUploading(true);
    try {
      const res = await uploadResume(file, token);
      setForm((prev) => ({ ...prev, resume: { fileId: res.fileId, filename: res.filename } }));
    } catch (err) {
      setResumeError(err.message || "Upload failed");
    } finally {
      setResumeUploading(false);
    }
  }

  function buildSeekerPayload() {
    if (tier === "daily_wage") {
      return {
        workCategory: "daily_wage",
        data: {
          trade: form.trade || "",
          yearsInTrade: Number(form.yearsInTrade) || 0,
          toolsOwned: toArray(form.toolsOwned),
          languagesSpoken: toArray(form.languagesSpoken),
          availableDays: toArray(form.availableDays),
          availableHours: { start: form.availableHoursStart || "", end: form.availableHoursEnd || "" },
          serviceRadiusKm: Number(form.serviceRadiusKm) || 0,
          emergencyContact: { name: form.emergencyContactName || "", phone: form.emergencyContactPhone || "" },
        },
      };
    }
    if (tier === "mid_level") {
      return {
        workCategory: "mid_level",
        data: {
          currentTitle: form.currentTitle || "",
          totalExperienceYears: Number(form.totalExperienceYears) || 0,
          industry: form.industry || "",
          primarySkills: toArray(form.primarySkills),
          educationLevel: form.educationLevel || "",
          expectedSalary: { amount: Number(form.expectedSalaryAmount) || 0, negotiable: !!form.expectedSalaryNegotiable },
          availabilityToJoin: form.availabilityToJoin || "",
          resume: form.resume || null,
          headline: form.headline || "",
          achievement: form.achievement || undefined,
          location: form.location || undefined,
          willingToRelocate: !!form.willingToRelocate,
          certifications: toArray(form.certifications),
          secondarySkills: toArray(form.secondarySkills),
          employmentType: form.employmentTypes || [],
        },
      };
    }
    if (tier === "leadership") {
      return {
        workCategory: "leadership",
        data: {
          currentTitle: form.currentTitle || "",
          yearsInLeadership: Number(form.yearsInLeadership) || 0,
          teamSizeManaged: Number(form.teamSizeManaged) || 0,
          industryFocus: toArray(form.industryFocus),
          keyAchievements: toArray(form.keyAchievements),
          referenceContacts: [
            { name: form.refName || "", relationship: form.refRelationship || "", contact: form.refContact || "", letterUrl: form.refLetterUrl || "" },
          ],
          compensationExpectation: {
            base: Number(form.compBase) || 0,
            bonus: Number(form.compBonus) || 0,
            equity: !!form.compEquity,
            negotiable: !!form.compNegotiable,
          },
          availableFrom: form.availableFrom || "",
        },
      };
    }
    return null;
  }

  function buildPosterPayload() {
    return {
      companyName: form.companyName || "",
      industry: form.industry || "",
      companySize: form.companySize || "",
      companyAddress: form.companyAddress || "",
      ...(form.website ? { website: form.website } : {}),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = user.role === "poster" ? buildPosterPayload() : buildSeekerPayload();
    if (!payload) return;
    if (tier === "mid_level" && !form.resume?.fileId) {
      setError("Please upload your resume before submitting.");
      return;
    }
    setLoading(true);
    try {
      const res = await completeProfile(payload, token);
      login(res.user, token);
      router.push(user.role === "poster" ? "/jobs/new" : "/dashboard");
    } catch (err) {
      setError(err.message || "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <p className="text-[var(--slate)]">You need to log in first.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">Step 02 - Profile</span>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] mt-2">Complete your profile</h1>
        </div>

        <div className="bg-white border border-[var(--slate)]/15 rounded-sm p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {user.role === "poster" ? (
              <>
                <div><label className={labelClass}>Company Name <Req /></label><input name="companyName" required value={form.companyName || ""} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Industry <Req /></label><input name="industry" required value={form.industry || ""} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Company Size <Req /></label><input name="companySize" required value={form.companySize || ""} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Company Address <Req /></label><input name="companyAddress" required value={form.companyAddress || ""} onChange={handleChange} className={inputClass} /></div>
                <div><label className={labelClass}>Website<Opt /></label><input name="website" type="url" value={form.website || ""} onChange={handleChange} className={inputClass} /></div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">Select your tier <Req /></label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIERS.map((t) => (
                      <button key={t.value} type="button" onClick={() => selectTier(t.value)}
                        className={`px-2 py-2.5 rounded-sm border text-xs font-medium transition-colors ${tier === t.value ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--slate)]/30 text-[var(--slate)]"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {tier === "daily_wage" && (
                  <>
                    <div><label className={labelClass}>Trade <Req /></label><input name="trade" required value={form.trade || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Years in Trade <Req /></label><input name="yearsInTrade" type="number" required value={form.yearsInTrade || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Tools Owned (comma separated)<Opt /></label><input name="toolsOwned" value={form.toolsOwned || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Languages Spoken (comma separated) <Req /></label><input name="languagesSpoken" required value={form.languagesSpoken || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Available Days (comma separated) <Req /></label><input name="availableDays" required value={form.availableDays || ""} onChange={handleChange} className={inputClass} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelClass}>Hours Start <Req /></label><input name="availableHoursStart" type="time" required value={form.availableHoursStart || ""} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Hours End <Req /></label><input name="availableHoursEnd" type="time" required value={form.availableHoursEnd || ""} onChange={handleChange} className={inputClass} /></div>
                    </div>
                    <div><label className={labelClass}>Service Radius (km) <Req /></label><input name="serviceRadiusKm" type="number" required value={form.serviceRadiusKm || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Emergency Contact Name <Req /></label><input name="emergencyContactName" required value={form.emergencyContactName || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Emergency Contact Phone <Req /></label><input name="emergencyContactPhone" required value={form.emergencyContactPhone || ""} onChange={handleChange} className={inputClass} /></div>
                  </>
                )}

                {tier === "mid_level" && (
                  <>
                    <div><label className={labelClass}>Professional Headline <Req /></label><input name="headline" required maxLength={120} value={form.headline || ""} onChange={handleChange} className={inputClass} placeholder="e.g. Finance analyst with cross-functional ops experience" /></div>
                    <div><label className={labelClass}>Current / Most Recent Title <Req /></label><input name="currentTitle" required value={form.currentTitle || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Total Experience (years) <Req /></label><input name="totalExperienceYears" type="number" required value={form.totalExperienceYears || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Industry <Req /></label><input name="industry" required value={form.industry || ""} onChange={handleChange} className={inputClass} placeholder="e.g. Finance, HR, Marketing, Ops" /></div>
                    <div><label className={labelClass}>Key Skills (comma separated) <Req /></label><input name="primarySkills" required value={form.primarySkills || ""} onChange={handleChange} className={inputClass} /></div>
                    <div>
                      <label className={labelClass}>Highest Education <Req /></label>
                      <select name="educationLevel" required value={form.educationLevel || ""} onChange={handleChange} className={inputClass}>
                        <option value="">Select...</option>
                        {EDUCATION_LEVELS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Expected Salary (per annum) <Req /></label><input name="expectedSalaryAmount" type="number" required value={form.expectedSalaryAmount || ""} onChange={handleChange} className={inputClass} /></div>
                    <label className="flex items-center gap-2 text-sm text-[var(--slate)]"><input type="checkbox" name="expectedSalaryNegotiable" checked={!!form.expectedSalaryNegotiable} onChange={handleChange} /> Salary negotiable<Opt /></label>
                    <div>
                      <label className={labelClass}>Availability to Join <Req /></label>
                      <select name="availabilityToJoin" required value={form.availabilityToJoin || ""} onChange={handleChange} className={inputClass}>
                        <option value="">Select...</option>
                        {AVAILABILITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Resume <Req /></label>
                      <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleResumeChange} className={inputClass} />
                      {resumeUploading && <p className="text-xs text-[var(--slate)] mt-1.5">Uploading...</p>}
                      {form.resume?.filename && <p className="text-xs text-green-700 mt-1.5">Uploaded: {form.resume.filename}</p>}
                      {resumeError && <p className="text-xs text-[var(--flag)] mt-1.5">{resumeError}</p>}
                    </div>

                    <div className="border-t border-[var(--slate)]/15 pt-4">
                      <label className={labelClass}>Notable Achievement<Opt /></label>
                      <textarea name="achievement" rows={2} value={form.achievement || ""} onChange={handleChange} className={inputClass} placeholder="e.g. Led migration cutting infra cost 30%" />
                    </div>
                    <div><label className={labelClass}>Current Location<Opt /></label><input name="location" value={form.location || ""} onChange={handleChange} className={inputClass} /></div>
                    <label className="flex items-center gap-2 text-sm text-[var(--slate)]"><input type="checkbox" name="willingToRelocate" checked={!!form.willingToRelocate} onChange={handleChange} /> Willing to relocate<Opt /></label>
                    <div><label className={labelClass}>Certifications (comma separated)<Opt /></label><input name="certifications" value={form.certifications || ""} onChange={handleChange} className={inputClass} /></div>

                    <div className="border-t border-[var(--slate)]/15 pt-4">
                      <label className={labelClass}>Secondary Skills (comma separated)<Opt /></label>
                      <input name="secondarySkills" value={form.secondarySkills || ""} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Employment Type <Req /></label>
                      <div className="grid grid-cols-2 gap-2">
                        {EMPLOYMENT_TYPES.map((t) => (
                          <label key={t.value} className="flex items-center gap-2 text-sm text-[var(--slate)]">
                            <input type="checkbox" checked={(form.employmentTypes || []).includes(t.value)} onChange={() => toggleEmploymentType(t.value)} />
                            {t.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {tier === "leadership" && (
                  <>
                    <div><label className={labelClass}>Current Title <Req /></label><input name="currentTitle" required value={form.currentTitle || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Years in Leadership <Req /></label><input name="yearsInLeadership" type="number" required value={form.yearsInLeadership || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Team Size Managed <Req /></label><input name="teamSizeManaged" type="number" required value={form.teamSizeManaged || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Industry Focus (comma separated) <Req /></label><input name="industryFocus" required value={form.industryFocus || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Key Achievements (comma separated) <Req /></label><input name="keyAchievements" required value={form.keyAchievements || ""} onChange={handleChange} className={inputClass} /></div>

                    <div className="pt-2 border-t border-[var(--slate)]/15">
                      <p className="text-xs text-[var(--slate)] mb-2">Reference contact (at least one required) <Req /></p>

                      <label className="flex items-center gap-2 text-sm text-[var(--slate)] mb-3">
                        <input type="checkbox" checked={refNA} onChange={handleRefNAToggle} />
                        I don't have a reference to provide (mark as N/A)
                      </label>

                      <div><label className={labelClass}>Reference Name <Req /></label><input name="refName" required disabled={refNA} value={form.refName || ""} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Relationship <Req /></label><input name="refRelationship" required disabled={refNA} value={form.refRelationship || ""} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Contact <Req /></label><input name="refContact" required disabled={refNA} value={form.refContact || ""} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Reference Letter URL <Req /></label><input name="refLetterUrl" type={refNA ? "text" : "url"} required disabled={refNA} value={form.refLetterUrl || ""} onChange={handleChange} className={inputClass} /></div>
                    </div>

                    <div><label className={labelClass}>Compensation - Base <Req /></label><input name="compBase" type="number" required value={form.compBase || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Compensation - Bonus <Req /></label><input name="compBonus" type="number" required value={form.compBonus || ""} onChange={handleChange} className={inputClass} /></div>
                    <label className="flex items-center gap-2 text-sm text-[var(--slate)]"><input type="checkbox" name="compEquity" checked={!!form.compEquity} onChange={handleChange} /> Equity offered<Opt /></label>
                    <label className="flex items-center gap-2 text-sm text-[var(--slate)]"><input type="checkbox" name="compNegotiable" checked={!!form.compNegotiable} onChange={handleChange} /> Compensation negotiable<Opt /></label>
                    <div>
                      <label className={labelClass}>Available From <Req /></label>
                      <input
                        name="availableFrom"
                        type="date"
                        required
                        min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                        value={form.availableFrom || ""}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {error && <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading || (user.role !== "poster" && !tier)}
              className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
              {loading ? "Saving..." : "Complete Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
