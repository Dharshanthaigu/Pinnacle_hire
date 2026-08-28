"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";

function RegisterForm() {
  const router = useRouter();
  const { login, user } = useAuth();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "poster" ? "poster" : "seeker";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: initialRole,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const data = await register(payload);
      login(data.user, data.token);
      router.push("/complete-profile");
    } catch (err) {
      setError(err.message);
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
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">
                Full name
              </label>
              <input
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--slate)] mb-1.5">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]"
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
                  className={`px-4 py-2.5 rounded-sm border text-sm font-medium transition-colors ${
                    form.role === "seeker"
                      ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                      : "border-[var(--slate)]/30 text-[var(--slate)]"
                  }`}
                >
                  Job Seeker
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "poster" })}
                  className={`px-4 py-2.5 rounded-sm border text-sm font-medium transition-colors ${
                    form.role === "poster"
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <p className="text-[var(--slate)]">Loading...</p>
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}