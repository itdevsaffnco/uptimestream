import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { fetchIncidentHistory } from "@/lib/uptime-robot.server";
import type { PublicIncident } from "@/lib/uptime-robot.server";
import { staggerContainer, staggerItem } from "@/components/PageTransition";
import { Globe, ArrowLeft, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Sun, Moon } from "lucide-react";
import { useDarkMode } from "@/hooks/use-dark-mode";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Incident History — SAFF & Co." },
      { name: "description", content: "Full incident history for SAFF & Co. services." },
    ],
  }),
  loader: async () => {
    const incidents = await fetchIncidentHistory();
    return { incidents };
  },
  pendingComponent: LoadingSkeleton,
  component: IncidentHistoryPage,
});

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

function IncidentHistoryPage() {
  const { incidents } = Route.useLoaderData();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE));
  const paginated = incidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PublicLayout>
      {/* Back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Status
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Incident History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {incidents.length} incident{incidents.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {/* Table */}
      {incidents.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold text-foreground">No incidents recorded</p>
          <p className="text-sm text-muted-foreground mt-1">All systems have been running smoothly.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Table head */}
            <div className="hidden sm:grid sm:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border bg-muted/40">
              {["Service", "Started", "Resolved", "Duration", "Status"].map((h) => (
                <p key={h} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {h}
                </p>
              ))}
            </div>

            <motion.div variants={staggerContainer} initial="initial" animate="animate">
              {paginated.map((inc, idx) => (
                <motion.div
                  key={inc.id}
                  variants={staggerItem}
                  className={`px-5 py-4 sm:grid sm:grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr] sm:gap-4 sm:items-center ${
                    idx < paginated.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  {/* Service */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-0 min-w-0">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{inc.monitorName}</span>
                  </div>

                  {/* Started */}
                  <p className="text-xs text-muted-foreground mb-1 sm:mb-0">
                    <span className="sm:hidden font-medium text-foreground mr-1">Started:</span>
                    {inc.startedAt}
                  </p>

                  {/* Resolved */}
                  <p className="text-xs text-muted-foreground mb-1 sm:mb-0">
                    <span className="sm:hidden font-medium text-foreground mr-1">Resolved:</span>
                    {inc.endedAt ?? "—"}
                  </p>

                  {/* Duration */}
                  <p className="text-xs text-muted-foreground mb-2 sm:mb-0">
                    <span className="sm:hidden font-medium text-foreground mr-1">Duration:</span>
                    {inc.duration}
                  </p>

                  {/* Status badge */}
                  <div>
                    {inc.ongoing ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                        Ongoing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                        Resolved
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} &middot; {incidents.length} total
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[32px] rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
                          page === p
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="mt-12 border-t border-border pt-6 flex items-center justify-between text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} SAFF &amp; Co.</p>
        <Link to="/" className="hover:text-foreground transition-colors">
          ← Back to status
        </Link>
      </div>
    </PublicLayout>
  );
}

// ──────────────────────────────────────────────
// Layout (shared with index.tsx)
// ──────────────────────────────────────────────

function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-4">
        <motion.header
          className="w-full max-w-6xl rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-sm"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="SAFF & Co." className="h-6 w-6 shrink-0 dark:invert sm:h-7 sm:w-7" />
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">SAFF &amp; Co.</p>
                <p className="text-[11px] text-muted-foreground">System Status</p>
              </div>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">monitor.saffnco.app</span>
              <button
                onClick={() => setIsDark(!isDark)}
                className="ml-1 rounded-lg p-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </motion.header>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

// ──────────────────────────────────────────────
// Loading skeleton
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <PublicLayout>
      <div className="h-4 w-24 rounded bg-muted animate-pulse mb-6" />
      <div className="h-7 w-48 rounded bg-muted animate-pulse mb-2" />
      <div className="h-4 w-32 rounded bg-muted animate-pulse mb-6" />
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`px-5 py-4 ${i < 5 ? "border-b border-border" : ""}`}>
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </PublicLayout>
  );
}
