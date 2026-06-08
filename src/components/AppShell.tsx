import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Settings as SettingsIcon, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
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
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img src="/logo.png" alt="SAFF & Co." className="h-6 w-6 shrink-0 dark:invert sm:h-7 sm:w-7" />
              <span className="text-base font-semibold text-foreground sm:text-lg">StatusServer</span>
            </Link>
            <nav className="flex items-center gap-0.5 sm:gap-1">
              {nav.map(({ to, label, icon: Icon }, i) => (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 + i * 0.06 }}
                >
                  <Link
                    to={to}
                    activeOptions={{ exact: to === "/" }}
                    activeProps={{ className: "bg-accent text-accent-foreground" }}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>
        </motion.header>
      </div>
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

export function StatusDot({ status }: { status: "up" | "down" | "degraded" }) {
  const color =
    status === "up"
      ? "bg-emerald-500"
      : status === "degraded"
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}

export function statusLabel(status: "up" | "down" | "degraded") {
  return status === "up" ? "Operational" : status === "degraded" ? "Degraded" : "Down";
}