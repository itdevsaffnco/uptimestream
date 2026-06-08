import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AdminShell as AppShell, StatusDot, statusLabel } from "@/components/AdminShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/Skeleton";
import { PageTransition, staggerContainer, staggerItem, scaleIn } from "@/components/PageTransition";
import { fetchMonitors } from "@/lib/uptime-robot.server";
import { ChevronRight, Globe } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — StatusServer" },
      { name: "description", content: "Monitor your servers and websites uptime in real time." },
      { property: "og:title", content: "Dashboard — StatusServer" },
      { property: "og:description", content: "Monitor your servers and websites uptime in real time." },
    ],
  }),
  loader: async () => {
    const servers = await fetchMonitors();
    return { servers };
  },
  pendingComponent: () => (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Server Status</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time monitoring of all your services.</p>
      </div>
      <DashboardSkeleton />
    </AppShell>
  ),
  component: Index,
});

function Index() {
  const { servers } = Route.useLoaderData();

  const total = servers.length;
  const up = servers.filter((s) => s.status === "up").length;
  const down = servers.filter((s) => s.status === "down").length;
  const degraded = servers.filter((s) => s.status === "degraded").length;
  const avgUptime =
    total > 0
      ? (servers.reduce((sum, s) => sum + s.uptime, 0) / total).toFixed(2)
      : "0.00";

  return (
    <AppShell>
      <PageTransition pageKey="dashboard">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Server Status</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time monitoring of all your services.</p>
        </motion.div>

        <motion.div
          className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {[
            { label: "Total Monitors", value: total },
            { label: "Operational", value: up, accent: "text-emerald-500" },
            { label: "Degraded", value: degraded, accent: "text-amber-500" },
            { label: "Down", value: down, accent: "text-red-500" },
          ].map(({ label, value, accent }) => (
            <motion.div key={label} variants={staggerItem}>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${accent ?? "text-foreground"}`}>{value}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={scaleIn} initial="initial" animate="animate" className="mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Uptime (30d)</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{avgUptime}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </Card>
        </motion.div>

        {servers.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No monitors found in UptimeRobot.</p>
          </Card>
        ) : (
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {servers.map((s) => (
              <motion.div key={s.id} variants={staggerItem}>
                <Link to="/admin/servers/$serverId" params={{ serverId: s.id }} className="block">
                  <Card className="p-4 transition-colors hover:bg-accent/50">
                    <div className="flex items-center gap-3">
                      <StatusDot status={s.status} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.url}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-muted-foreground">Uptime</p>
                          <p className="text-sm font-medium text-foreground">{s.uptime}%</p>
                        </div>
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-muted-foreground">Response</p>
                          <p className="text-sm font-medium text-foreground">
                            {s.responseTime > 0 ? `${s.responseTime}ms` : "—"}
                          </p>
                        </div>
                        <Badge variant={s.status === "up" ? "secondary" : "destructive"} className="text-xs">
                          {statusLabel(s.status)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </PageTransition>
    </AppShell>
  );
}
