"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";


export default function RegisterPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "poster" ? "poster" : "seeker";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: initialRole,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]";
  const labelClass = "block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5";


  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        name: form.name, email: form.email, password: form.password, phone: form.phone, role: form.role,
      });
      login(res.user, res.token);
      router.push("/complete-profile");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
            Step 01 - Account
          </span>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] mt-2">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[var(--slate)]">
            Already registered?{" "}
            <Link href="/login" className="text-[var(--ink)] font-medium underline underline-offset-2">
              Log in
            </Link>
          </p>
        </div>

        <div className="bg-white border border-[var(--slate)]/15 rounded-sm p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>
                Full name
              </label>
              <input
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                value={form.confirmPassword || ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "seeker" })}
                  className={`px-4 py-2.5 rounded-sm border text-sm font-medium transition-colors ${form.role === "seeker"
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                    : "border-[var(--slate)]/30 text-[var(--slate)]"
                    }`}
                >
                  Job Seeker
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "poster" })}
                  className={`px-4 py-2.5 rounded-sm border text-sm font-medium transition-colors ${form.role === "poster"
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                    : "border-[var(--slate)]/30 text-[var(--slate)]"
                    }`}
                >
                  Job Poster
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--flag)] bg-[var(--flag)]/8 border border-[var(--flag)]/25 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
