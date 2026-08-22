"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login as loginApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push(user.profileComplete ? "/dashboard" : "/complete-profile");
    }
  }, [user, router]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginApi(form);
      login(data.user, data.token);
      router.push(data.user.profileComplete ? "/dashboard" : "/complete-profile");
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
            Welcome back
          </span>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink)] mt-2">
            Log in
          </h1>
          <p className="mt-2 text-sm text-[var(--slate)]">
            New here?{" "}
            <Link href="/register" className="text-[var(--ink)] font-medium underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </div>
        <div className="bg-white border border-[var(--slate)]/15 rounded-sm p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-[var(--slate)]/25 rounded-sm bg-[var(--paper)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--brass)] focus:border-[var(--brass)]"
              />
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
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
