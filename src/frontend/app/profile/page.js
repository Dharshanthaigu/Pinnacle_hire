"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getMe, updateProfile, uploadResume } from "@/lib/api/auth";

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
function fromArray(arr) {
  return (arr || []).join(", ");
}
function Req() {
  return <span className="text-[var(--flag)]">*</span>;
}
function Opt() {
  return <span className="text-xs text-[var(--slate)]"> (optional)</span>;
}

export default function ProfilePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [fullUser, setFullUser] = useState(null);
  const [tier, setTier] = useState("");
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");

  const inputClass =
    "w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]";
  const labelClass = "block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5";
  const minAvailableFrom = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    getMe(token)
      .then((res) => {
        const u = res.user;
        setFullUser(u);
        if (u.role === "poster") {
          setForm({
            name: u.name || "",
            phone: u.phone || "",
            companyName: u.companyProfile?.companyName || "",
            industry: u.companyProfile?.industry || "",
            companySize: u.companyProfile?.companySize || "",
            companyAddress: u.companyProfile?.companyAddress || "",
            website: u.companyProfile?.website || "",
          });
        } else {
          const wc = u.professionalInfo?.workCategory || "";
          setTier(wc);
          if (wc === "daily_wage") {
            const d = u.professionalInfo?.dailyWage || {};
            setForm({
              name: u.name || "", phone: u.phone || "",
              trade: d.trade || "", yearsInTrade: d.yearsInTrade ?? "",
              toolsOwned: fromArray(d.toolsOwned), languagesSpoken: fromArray(d.languagesSpoken),
              availableDays: fromArray(d.availableDays),
              availableHoursStart: d.availableHours?.start || "", availableHoursEnd: d.availableHours?.end || "",
              serviceRadiusKm: d.serviceRadiusKm ?? "", pastJobPhotos: fromArray(d.pastJobPhotos),
              emergencyContactName: d.emergencyContact?.name || "", emergencyContactPhone: d.emergencyContact?.phone || "",
            });
          } else if (wc === "mid_level") {
            const d = u.professionalInfo?.midLevel || {};
            setForm({
              name: u.name || "", phone: u.phone || "",
              currentTitle: d.currentTitle || "", totalExperienceYears: d.totalExperienceYears ?? "",
              industry: d.industry || "",
              primarySkills: fromArray(d.primarySkills), secondarySkills: fromArray(d.secondarySkills),
              educationLevel: d.educationLevel || "",
              expectedSalaryAmount: d.expectedSalary?.amount ?? "",
              expectedSalaryNegotiable: !!d.expectedSalary?.negotiable,
              availabilityToJoin: d.availabilityToJoin || "",
              resume: d.resume || null,
              headline: d.headline || "",
              achievement: d.achievement || "",
              location: d.location || "",
              willingToRelocate: !!d.willingToRelocate,
              certifications: fromArray(d.certifications),
              employmentType: fromArray(d.employmentType),
            });
          } else if (wc === "leadership") {
            const d = u.professionalInfo?.leadership || {};
            const ref = d.referenceContacts?.[0] || {};
            setForm({
              name: u.name || "", phone: u.phone || "",
              currentTitle: d.currentTitle || "", yearsInLeadership: d.yearsInLeadership ?? "",
              teamSizeManaged: d.teamSizeManaged ?? "", industryFocus: fromArray(d.industryFocus),
              keyAchievements: fromArray(d.keyAchievements),
              refName: ref.name || "", refRelationship: ref.relationship || "", refContact: ref.contact || "", refLetterUrl: ref.letterUrl || "",
              compBase: d.compensationExpectation?.base ?? "", compBonus: d.compensationExpectation?.bonus ?? "",
              compEquity: !!d.compensationExpectation?.equity, compNegotiable: !!d.compensationExpectation?.negotiable,
              availableFrom: d.availableFrom || "",
            });
          } else {
            setForm({ name: u.name || "", phone: u.phone || "" });
          }
        }
      })
      .catch((err) => setError(err.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [authLoading, user, token, router]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function selectTier(value) {
    setTier(value);
    setForm((prev) => ({ name: prev.name, phone: prev.phone }));
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

  function buildSeekerData() {
    if (tier === "daily_wage") {
      return {
        trade: form.trade || "", yearsInTrade: Number(form.yearsInTrade) || 0,
        toolsOwned: toArray(form.toolsOwned), languagesSpoken: toArray(form.languagesSpoken),
        availableDays: toArray(form.availableDays),
        availableHours: { start: form.availableHoursStart || "", end: form.availableHoursEnd || "" },
        serviceRadiusKm: Number(form.serviceRadiusKm) || 0, pastJobPhotos: toArray(form.pastJobPhotos),
        emergencyContact: { name: form.emergencyContactName || "", phone: form.emergencyContactPhone || "" },
      };
    }
    if (tier === "mid_level") {
      return {
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
        employmentType: toArray(form.employmentType),
      };
    }
    if (tier === "leadership") {
      return {
        currentTitle: form.currentTitle || "", yearsInLeadership: Number(form.yearsInLeadership) || 0,
        teamSizeManaged: Number(form.teamSizeManaged) || 0, industryFocus: toArray(form.industryFocus),
        keyAchievements: toArray(form.keyAchievements),
        referenceContacts: [{ name: form.refName || "", relationship: form.refRelationship || "", contact: form.refContact || "", letterUrl: form.refLetterUrl || "" }],
        compensationExpectation: { base: Number(form.compBase) || 0, bonus: Number(form.compBonus) || 0, equity: !!form.compEquity, negotiable: !!form.compNegotiable },
        availableFrom: form.availableFrom || "",
      };
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (tier === "mid_level" && !form.resume?.fileId) {
      setError("Please upload your resume before saving.");
      return;
    }
    setSaving(true);
    try {
      let payload;
      if (fullUser.role === "poster") {
        payload = {
          name: form.name, phone: form.phone,
          companyName: form.companyName, industry: form.industry,
          companySize: form.companySize, companyAddress: form.companyAddress,
          ...(form.website ? { website: form.website } : {}),
        };
      } else {
        const data = buildSeekerData();
        payload = { name: form.name, phone: form.phone };
        if (data) {
          payload.workCategory = tier;
          payload.data = data;
        }
      }
      const res = await updateProfile(payload, token);
      setFullUser(res.user);
      setSuccess("Profile updated.");
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading || !fullUser) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <p className="text-[var(--slate)]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="inline-block mb-4 text-sm text-[var(--slate)] hover:text-[var(--ink)] transition-colors">
          &larr; Back to Dashboard
        </Link>

        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">Account</span>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] mt-2">My Profile</h1>
          <p className="mt-1 text-sm text-[var(--slate)]">{fullUser.email}</p>
          <p className="mt-2 text-xs text-[var(--slate)]"><Req /> = required field</p>
        </div>

        <div className="bg-white border border-[var(--slate)]/15 rounded-sm p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className={labelClass}>Name <Req /></label><input name="name" required value={form.name || ""} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Phone <Req /></label><input name="phone" required value={form.phone || ""} onChange={handleChange} className={inputClass} /></div>

            {fullUser.role === "poster" ? (
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
                  <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">Tier <Req /></label>
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
                    <div><label className={labelClass}>Years in Trade <Req /></label><input name="yearsInTrade" type="number" min="0" required value={form.yearsInTrade || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Tools Owned (comma separated)<Opt /></label><input name="toolsOwned" value={form.toolsOwned || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Languages Spoken (comma separated) <Req /></label><input name="languagesSpoken" required value={form.languagesSpoken || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Available Days (comma separated) <Req /></label><input name="availableDays" required value={form.availableDays || ""} onChange={handleChange} className={inputClass} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={labelClass}>Hours Start <Req /></label><input name="availableHoursStart" type="time" required value={form.availableHoursStart || ""} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Hours End <Req /></label><input name="availableHoursEnd" type="time" required value={form.availableHoursEnd || ""} onChange={handleChange} className={inputClass} /></div>
                    </div>
                    <div><label className={labelClass}>Service Radius (km) <Req /></label><input name="serviceRadiusKm" type="number" min="0" required value={form.serviceRadiusKm || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Past Job Photo URLs (comma separated)<Opt /></label><input name="pastJobPhotos" value={form.pastJobPhotos || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Emergency Contact Name <Req /></label><input name="emergencyContactName" required value={form.emergencyContactName || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Emergency Contact Phone <Req /></label><input name="emergencyContactPhone" required value={form.emergencyContactPhone || ""} onChange={handleChange} className={inputClass} /></div>
                  </>
                )}

                {tier === "mid_level" && (
                  <>
                    <div><label className={labelClass}>Professional Headline <Req /></label><input name="headline" required maxLength={120} value={form.headline || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Current Title <Req /></label><input name="currentTitle" required value={form.currentTitle || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Total Experience (years) <Req /></label><input name="totalExperienceYears" type="number" min="0" required value={form.totalExperienceYears || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Industry <Req /></label><input name="industry" required value={form.industry || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Primary Skills (comma separated) <Req /></label><input name="primarySkills" required value={form.primarySkills || ""} onChange={handleChange} className={inputClass} /></div>
                    <div>
                      <label className={labelClass}>Education Level <Req /></label>
                      <select name="educationLevel" required value={form.educationLevel || ""} onChange={handleChange} className={inputClass}>
                        <option value="">Select...</option>
                        {EDUCATION_LEVELS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                      </select>
                    </div>
                    <div><label className={labelClass}>Expected Salary <Req /></label><input name="expectedSalaryAmount" type="number" min="0" required value={form.expectedSalaryAmount || ""} onChange={handleChange} className={inputClass} /></div>
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
                    <div><label className={labelClass}>Notable Achievement<Opt /></label><textarea name="achievement" rows={2} value={form.achievement || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Current Location<Opt /></label><input name="location" value={form.location || ""} onChange={handleChange} className={inputClass} /></div>
                    <label className="flex items-center gap-2 text-sm text-[var(--slate)]"><input type="checkbox" name="willingToRelocate" checked={!!form.willingToRelocate} onChange={handleChange} /> Willing to relocate<Opt /></label>
                    <div><label className={labelClass}>Certifications (comma separated)<Opt /></label><input name="certifications" value={form.certifications || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Secondary Skills (comma separated)<Opt /></label><input name="secondarySkills" value={form.secondarySkills || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Employment Type (comma separated) <Req /></label><input name="employmentType" required value={form.employmentType || ""} onChange={handleChange} className={inputClass} /></div>
                  </>
                )}

                {tier === "leadership" && (
                  <>
                    <div><label className={labelClass}>Current Title <Req /></label><input name="currentTitle" required value={form.currentTitle || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Years in Leadership <Req /></label><input name="yearsInLeadership" type="number" min="0" required value={form.yearsInLeadership || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Team Size Managed <Req /></label><input name="teamSizeManaged" type="number" min="0" required value={form.teamSizeManaged || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Industry Focus (comma separated) <Req /></label><input name="industryFocus" required value={form.industryFocus || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Key Achievements (comma separated) <Req /></label><input name="keyAchievements" required value={form.keyAchievements || ""} onChange={handleChange} className={inputClass} /></div>
                    <div className="pt-2 border-t border-[var(--slate)]/15">
                      <p className="text-xs text-[var(--slate)] mb-2">Reference contact (at least one required) <Req /></p>
                      <div><label className={labelClass}>Reference Name <Req /></label><input name="refName" required value={form.refName || ""} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Relationship <Req /></label><input name="refRelationship" required value={form.refRelationship || ""} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Contact <Req /></label><input name="refContact" required value={form.refContact || ""} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Reference Letter URL <Req /></label><input name="refLetterUrl" type="url" required value={form.refLetterUrl || ""} onChange={handleChange} className={inputClass} /></div>
                    </div>
                    <div><label className={labelClass}>Compensation - Base <Req /></label><input name="compBase" type="number" min="0" required value={form.compBase || ""} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Compensation - Bonus <Req /></label><input name="compBonus" type="number" min="0" required value={form.compBonus || ""} onChange={handleChange} className={inputClass} /></div>
                    <label className="flex items-center gap-2 text-sm text-[var(--slate)]"><input type="checkbox" name="compEquity" checked={!!form.compEquity} onChange={handleChange} /> Equity offered<Opt /></label>
                    <label className="flex items-center gap-2 text-sm text-[var(--slate)]"><input type="checkbox" name="compNegotiable" checked={!!form.compNegotiable} onChange={handleChange} /> Compensation negotiable<Opt /></label>
                    <div>
                      <label className={labelClass}>Available From <Req /></label>
                      <input name="availableFrom" type="date" required min={minAvailableFrom} value={form.availableFrom || ""} onChange={handleChange} className={inputClass} />
                    </div>
                  </>
                )}
              </>
            )}

            {error && <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-3 py-2">{success}</p>}

            <button type="submit" disabled={saving} className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}