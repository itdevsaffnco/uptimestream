import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { AppShell, StatusDot, statusLabel } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServerDetailSkeleton } from "@/components/Skeleton";
import { PageTransition, staggerContainer, staggerItem, scaleIn } from "@/components/PageTransition";
import { fetchMonitorDetail } from "@/lib/uptime-robot.server";
import type { Server, Incident } from "@/lib/dummy-data";
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

type LoaderData = {
  server: Server;
  responseHistory: { time: string; ms: number }[];
  incidents: Incident[];
};
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/servers/$serverId")({
  head: ({ params }) => ({
    meta: [
      { title: `Monitor — StatusServer` },
      { name: "description", content: `Status and uptime history for monitor ${params.serverId}.` },
    ],
  }),
  loader: async ({ params }) => {
    const result = await fetchMonitorDetail({ data: params.serverId });
    if (!result) throw notFound();
    return result;
  },
  pendingComponent: () => (
    <AppShell>
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <ServerDetailSkeleton />
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Monitor not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Back to dashboard
        </Link>
      </div>
    </AppShell>
  ),
  component: ServerDetail,
});

function ServerDetail() {
  const { server, responseHistory, incidents } = Route.useLoaderData() as LoaderData;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE));
  const paginated = incidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AppShell>
      <PageTransition pageKey={server.id}>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <motion.div
        className="mb-8 flex flex-wrap items-start justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          <StatusDot status={server.status} />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{server.name}</h1>
            <a
              href={server.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
            >
              {server.url} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Badge variant={server.status === "up" ? "secondary" : "destructive"} className="text-sm">
          {statusLabel(server.status)}
        </Badge>
      </motion.div>

      <motion.div
        className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {[
          { label: "Uptime (30d)", value: `${server.uptime}%` },
          { label: "Response Time", value: server.responseTime > 0 ? `${server.responseTime}ms` : "—" },
          { label: "Last Checked", value: server.lastChecked },
          { label: "Alerts", value: server.alertsEnabled ? "On" : "Off" },
        ].map(({ label, value }) => (
          <motion.div key={label} variants={staggerItem}>
            <MetricCard label={label} value={value} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={scaleIn} initial="initial" animate="animate" className="mb-6">
      <Card className="mb-0 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Response Time (24h)</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary">24h</Button>
          </div>
        </div>
        {responseHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No response time data available.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="time"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  interval={Math.floor(responseHistory.length / 8)}
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} unit="ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ms"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      </motion.div>

      <motion.div variants={scaleIn} initial="initial" animate="animate">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Incident History</h2>
          <span className="text-xs text-muted-foreground">{incidents.length} incidents</span>
        </div>

        {incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No incidents recorded. All systems normal.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Reason</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Started</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Ended</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((i, idx) => (
                    <tr
                      key={i.id}
                      className={`border-t border-border transition-colors hover:bg-accent/40 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{i.reason}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                        {i.startedAt}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                        {i.endedAt ?? <span className="text-red-500">Ongoing</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={i.endedAt ? "secondary" : "destructive"}>{i.duration}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} · {incidents.length} total
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </Card>
  );
}
