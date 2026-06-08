import { Link, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Settings as SettingsIcon, LayoutDashboard, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { logout } from "@/lib/auth.server";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/alerts", label: "Alerts", icon: Bell },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    await router.invalidate();
    router.navigate({ to: "/login", search: { redirect: "/admin" } });
  }

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
            <Link to="/admin" className="flex items-center gap-2 min-w-0">
              <img src="/logo.png" alt="SAFF & Co." className="h-6 w-6 shrink-0 dark:invert sm:h-7 sm:w-7" />
              <span className="text-base font-semibold text-foreground sm:text-lg">StatusServer</span>
              <span className="hidden text-xs font-normal text-muted-foreground sm:inline">Admin</span>
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
                    activeOptions={{ exact: to === "/admin" }}
                    activeProps={{ className: "bg-accent text-accent-foreground" }}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:px-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.23 }}
              >
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-red-500 sm:px-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </motion.div>
            </nav>
          </div>
        </motion.header>
      </div>
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

export { StatusDot, statusLabel } from "./AppShell";
