import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)]">
      <nav className="w-full px-6 py-5 flex items-center justify-between border-b border-[var(--slate)]/10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
          Pinnacle Hire
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 rounded-sm transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-[var(--ink)] text-[var(--paper)] rounded-sm text-sm font-medium hover:bg-[var(--slate)] transition-colors"
          >
            Register
          </Link>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4" style={{ minHeight: "calc(100vh - 73px)" }}>
        <div className="w-full max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--slate)]">
            Pinnacle Hire
          </span>
          <h1 className="font-display text-5xl font-semibold text-[var(--ink)] mt-4">
            Work, matched right.
          </h1>
          <p className="mt-4 text-[var(--slate)] max-w-lg mx-auto">
            Daily wage gigs, mid-level roles, and leadership positions - one platform, tiered verification for each.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/jobs"
              className="px-6 py-3 bg-[var(--ink)] text-[var(--paper)] rounded-sm font-medium hover:bg-[var(--slate)] transition-colors"
            >
              Browse Jobs
            </Link>
            <Link
              href="/register?role=poster"
              className="px-6 py-3 border border-[var(--slate)]/30 rounded-sm font-medium text-[var(--ink)] hover:bg-[var(--slate)]/10 transition-colors"
            >
              Post a Job
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
