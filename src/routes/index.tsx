import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { fetchPublicMonitors } from "@/lib/uptime-robot.server";
import type { PublicMonitor, DayStatus } from "@/lib/uptime-robot.server";
import { staggerContainer, staggerItem } from "@/components/PageTransition";
import { CheckCircle2, AlertTriangle, XCircle, Globe, Activity, Sun, Moon } from "lucide-react";
import { useDarkMode } from "@/hooks/use-dark-mode";

const REFETCH_INTERVAL = 60_000;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "System Status — SAFF & Co." },
      { name: "description", content: "Real-time status of SAFF & Co. services." },
      { property: "og:title", content: "System Status — SAFF & Co." },
    ],
  }),
  loader: async () => {
    const monitors = await fetchPublicMonitors();
    return { monitors };
  },
  pendingComponent: LoadingSkeleton,
  component: PublicStatusPage,
});

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

function PublicStatusPage() {
  const { monitors: initialMonitors } = Route.useLoaderData();

  const { data: monitors = initialMonitors, dataUpdatedAt } = useQuery({
    queryKey: ["public-monitors"],
    queryFn: () => fetchPublicMonitors(),
    initialData: initialMonitors,
    initialDataUpdatedAt: Date.now(),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL - 5_000,
  });

  const allUp = monitors.every((m) => m.status === "up");
  const anyDown = monitors.some((m) => m.status === "down");
  const overallStatus = allUp ? "operational" : anyDown ? "outage" : "degraded";

  return (
    <PublicLayout>
      {/* Refresh indicator */}
      <RefreshIndicator dataUpdatedAt={dataUpdatedAt} intervalMs={REFETCH_INTERVAL} />

      {/* Status banner */}
      <StatusBanner status={overallStatus} />

      {/* Service Availability section */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <h2 className="text-sm font-semibold text-foreground">Service Availability</h2>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {monitors.map((m, idx) => (
              <motion.div
                key={m.id}
                variants={staggerItem}
                className={idx < monitors.length - 1 ? "border-b border-border" : ""}
              >
                <ServiceRow monitor={m} />
              </motion.div>
            ))}
            {monitors.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                No services to display.
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </PublicLayout>
  );
}

// ──────────────────────────────────────────────
// Service row
// ──────────────────────────────────────────────

function ServiceRow({ monitor }: { monitor: PublicMonitor }) {
  const uptimeDisplay = parseFloat(monitor.uptimeRatio).toFixed(3) + "%";

  return (
    <div className="px-5 py-4 sm:px-6">
      {/* Top row: name + badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusPulse status={monitor.status} />
          <p className="font-semibold text-foreground leading-tight truncate">{monitor.name}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-semibold tabular-nums ${uptimeColor(monitor.status)}`}>
            {uptimeDisplay}
          </span>
          <StatusBadge status={monitor.status} />
        </div>
      </div>

      {/* Bar chart */}
      <div className="mt-3">
        <UptimeBars bars={monitor.dailyBars} />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>90 days ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 90-day bar chart
// ──────────────────────────────────────────────

function UptimeBars({ bars }: { bars: DayStatus[] }) {
  const now = Date.now();
  return (
    <div className="flex gap-[2px] h-7">
      {bars.map((status, i) => {
        const daysAgo = 89 - i;
        const date = new Date(now - daysAgo * 86400_000).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const label =
          status === "no-data"
            ? `${date} — No data`
            : `${date} — ${status.charAt(0).toUpperCase() + status.slice(1)}`;

        const colorClass =
          status === "up"
            ? "bg-emerald-500"
            : status === "degraded"
            ? "bg-amber-500"
            : status === "down"
            ? "bg-red-500"
            : "bg-zinc-700 dark:bg-zinc-700 opacity-50";

        return (
          <div
            key={i}
            title={label}
            className={`flex-1 rounded-[2px] cursor-default transition-opacity hover:opacity-80 ${colorClass}`}
          />
        );
      })}
    </div>
  );
}

function uptimeColor(status: "up" | "down" | "degraded") {
  if (status === "up") return "text-emerald-500";
  if (status === "degraded") return "text-amber-500";
  return "text-red-500";
}

// ──────────────────────────────────────────────
// Status banner
// ──────────────────────────────────────────────

function StatusBanner({ status }: { status: "operational" | "degraded" | "outage" }) {
  const map = {
    operational: {
      icon: CheckCircle2,
      text: "All Systems Operational",
      cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    },
    degraded: {
      icon: AlertTriangle,
      text: "Some Systems Degraded",
      cls: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    },
    outage: {
      icon: XCircle,
      text: "Service Disruption Detected",
      cls: "bg-red-500/10 border-red-500/30 text-red-400",
    },
  };
  const { icon: Icon, text, cls } = map[status];

  return (
    <motion.div
      className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${cls}`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="font-semibold">{text}</p>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────

const footerLinks = {
  Status: [
    { label: "Incident History", href: "/incidents" },
    { label: "UptimeRobot", href: "https://uptimerobot.com" },
  ],
  Company: [
    { label: "SAFF & Co.", href: "https://saffnco.com" },
    { label: "Contact", href: "mailto:itsupport@saffnco.com" }, 
  ],
};

function Footer() {
  return (
    <motion.footer
      className="mt-16 border-t border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {/* Main footer */}
      <div className="py-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {/* Brand */}
        <div className="sm:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            <img src="/logo.png" alt="SAFF & Co." className="h-6 w-6 dark:invert" />
            <span className="text-sm font-semibold text-foreground">SAFF &amp; Co.</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            Real-time system status for SAFF &amp; Co. services and infrastructure.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Updates every 60 seconds
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([section, links]) => (
          <div key={section}>
            <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-widest">
              {section}
            </p>
            <ul className="space-y-2">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} SAFF &amp; Co. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a href="https://saffnco.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            SAFF & Co. Website
          </a>
          <a href="mailto:itsupport@saffnco.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            itsupport@saffnco.com
          </a>
        </div>
      </div>
    </motion.footer>
  );
}

// ──────────────────────────────────────────────
// Reusable bits
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
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="SAFF & Co." className="h-6 w-6 shrink-0 dark:invert sm:h-7 sm:w-7" />
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">SAFF &amp; Co.</p>
                <p className="text-[11px] text-muted-foreground">System Status</p>
              </div>
            </div>
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

function StatusPulse({ status }: { status: "up" | "down" | "degraded" }) {
  const c =
    status === "up" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : "bg-red-500";
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${c} opacity-60`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${c}`} />
    </span>
  );
}

function StatusBadge({ status }: { status: "up" | "down" | "degraded" }) {
  const map = {
    up: { label: "Operational", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    degraded: { label: "Degraded", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    down: { label: "Down", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
      {label}
    </span>
  );
}

// ──────────────────────────────────────────────
// Refresh indicator
// ──────────────────────────────────────────────

function RefreshIndicator({ dataUpdatedAt, intervalMs }: { dataUpdatedAt: number; intervalMs: number }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lastUpdatedStr, setLastUpdatedStr] = useState("");

  useEffect(() => {
    const update = () => {
      const nextAt = dataUpdatedAt + intervalMs;
      setSecondsLeft(Math.max(0, Math.round((nextAt - Date.now()) / 1000)));
      setLastUpdatedStr(
        new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt, intervalMs]);

  return (
    <div className="flex justify-end mb-4 -mt-2">
      <p className="text-xs text-muted-foreground">
        Last updated {lastUpdatedStr} &middot; Next update in {secondsLeft}s
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Loading skeleton
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <PublicLayout>
      <div className="h-14 rounded-xl bg-muted animate-pulse mb-8" />
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`px-5 py-4 sm:px-6 ${i < 3 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-muted animate-pulse" />
                <div>
                  <div className="h-4 w-40 rounded bg-muted animate-pulse mb-1" />
                  <div className="h-3 w-28 rounded bg-muted animate-pulse" />
                </div>
              </div>
              <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
            </div>
            <div className="h-7 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </PublicLayout>
  );
}
