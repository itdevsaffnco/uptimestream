import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { AlertsSkeleton } from "@/components/Skeleton";
import { PageTransition, scaleIn } from "@/components/PageTransition";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { fetchAlertContacts, fetchRecentAlerts } from "@/lib/uptime-robot.server";
import { Mail, Webhook, ArrowDownCircle, ArrowUpCircle, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — StatusServer" },
      { name: "description", content: "Configure email and webhook alerts for your monitors." },
    ],
  }),
  loader: async () => {
    const [channels, recentAlerts] = await Promise.all([
      fetchAlertContacts(),
      fetchRecentAlerts(),
    ]);
    return { channels, recentAlerts };
  },
  pendingComponent: () => (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get notified when your servers go down or recover.</p>
      </div>
      <AlertsSkeleton />
    </AppShell>
  ),
  component: AlertsPage,
});

function AlertsPage() {
  const { channels, recentAlerts } = Route.useLoaderData();
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(recentAlerts.length / PAGE_SIZE));
  const paginated = recentAlerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell>
      <PageTransition pageKey="alerts">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Get notified when your servers go down or recover.
          </p>
        </motion.div>

        {/* Notification Channels */}
        <motion.div variants={scaleIn} initial="initial" animate="animate" className="mb-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Notification Channels</h2>
              <a
                href="https://dashboard.uptimerobot.com/monitors"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Manage in UptimeRobot →
              </a>
            </div>

            {channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No alert contacts found. Add them in your UptimeRobot dashboard.
              </p>
            ) : (
              <div className="space-y-3">
                {channels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ch.type === "email" ? (
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <Webhook className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground capitalize">{ch.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{ch.target}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={ch.enabled} disabled />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Recent Alerts Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Alerts</h2>
              <span className="text-xs text-muted-foreground">{recentAlerts.length} events</span>
            </div>

            {recentAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent alerts.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-left">
                        <th className="px-4 py-3 text-xs font-medium text-muted-foreground w-8"></th>
                        <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Monitor</th>
                        <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Message</th>
                        <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Time</th>
                        <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((log, idx) => (
                        <tr
                          key={log.id}
                          className={`border-t border-border transition-colors hover:bg-accent/40 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
                        >
                          <td className="px-4 py-3">
                            {log.type === "down" ? (
                              <ArrowDownCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {log.serverName}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{log.message}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                            {log.sentAt}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={log.type === "down" ? "destructive" : "secondary"}>
                              {log.type === "down" ? "Down" : "Recovered"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages} · {recentAlerts.length} total
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (arr[idx - 1] as number) < p - 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "…" ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-xs">…</span>
                        ) : (
                          <Button
                            key={item}
                            size="sm"
                            variant={page === item ? "default" : "outline"}
                            onClick={() => setPage(item as number)}
                          >
                            {item}
                          </Button>
                        )
                      )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </motion.div>
      </PageTransition>
    </AppShell>
  );
}
