import { createServerFn } from "@tanstack/react-start";
import process from "node:process";

import type { Server, Incident, AlertChannel, AlertLog } from "./dummy-data";

const BASE_URL = "https://api.uptimerobot.com/v2";
const CACHE_TTL = 60_000; // 60 seconds

const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getApiKey() {
  return process.env.UPTIMEROBOT_API_KEY ?? "u3423949-cbfa8a16351e80ef9c5afbce";
}

async function urPost<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const body = new URLSearchParams({
    api_key: getApiKey(),
    format: "json",
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const res = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`UptimeRobot HTTP error: ${res.status}`);

  const json = (await res.json()) as { stat: string; error?: unknown } & T;
  if (json.stat !== "ok") throw new Error(`UptimeRobot error: ${JSON.stringify(json.error)}`);

  cache.set(cacheKey, { data: json, expiresAt: Date.now() + CACHE_TTL });
  return json;
}

// UptimeRobot API types

type URMonitor = {
  id: number;
  friendly_name: string;
  url: string;
  status: 0 | 1 | 2 | 8 | 9;
  all_time_uptime_ratio: string;
  custom_uptime_ratio: string;
  average_response_time: string;
  create_datetime?: number; // unix timestamp when monitor was created
  response_times?: Array<{ datetime: number; value: number }>;
  logs?: Array<{
    id: number;
    type: 1 | 2 | 98 | 99;
    datetime: number;
    duration: number;
    reason?: { code: number; detail: string };
  }>;
};

type URMonitorsResponse = {
  stat: string;
  pagination: { offset: number; limit: number; total: number };
  monitors: URMonitor[];
};

type URAlertContact = {
  id: string;
  type: number; // 1=SMS, 2=Email, 3=Twitter, 5=Email Group, 11=Slack, 14=Webhook
  status: number;
  friendly_name: string;
  value: string;
};

type URAlertContactsResponse = {
  stat: string;
  alert_contacts: URAlertContact[];
};

// Helpers

function mapStatus(status: 0 | 1 | 2 | 8 | 9): "up" | "down" | "degraded" {
  if (status === 2) return "up";
  if (status === 9) return "down";
  return "degraded"; // 0=paused, 1=not checked, 8=seems down
}

function mapContactType(typeCode: number): "email" | "webhook" {
  if (typeCode === 14 || typeCode === 11) return "webhook";
  return "email";
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "ongoing";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function formatDatetime(unix: number): string {
  return new Date(unix * 1000).toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ──────────────────────────────────────────────
// Public page types
// ──────────────────────────────────────────────

export type PublicIncident = {
  id: string;
  monitorName: string;
  startedAt: string;
  startedTs: number; // raw unix for sorting
  endedAt: string | null;
  duration: string;
  ongoing: boolean;
  reason: string;
};

export type DayStatus = "up" | "degraded" | "down" | "no-data";

export type PublicMonitor = {
  id: string;
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  uptimeRatio: string; // 90-day ratio, e.g. "99.997"
  dailyBars: DayStatus[]; // 90 entries: [0]=90 days ago, [89]=today
};

function buildDailyBars(logs: NonNullable<URMonitor["logs"]>, createDatetime?: number): DayStatus[] {
  const now = Math.floor(Date.now() / 1000);
  const bars: DayStatus[] = [];

  // Determine when monitoring started.
  // Priority: create_datetime from API → type-99 start log → oldest log → assume 90-day history.
  let monitoringStart: number;
  if (createDatetime && createDatetime > 0) {
    monitoringStart = createDatetime;
  } else {
    const startLogs = logs.filter((e) => e.type === 99);
    if (startLogs.length > 0) {
      monitoringStart = Math.min(...startLogs.map((e) => e.datetime));
    } else if (logs.length > 0) {
      monitoringStart = Math.min(...logs.map((e) => e.datetime));
    } else {
      // No logs at all — monitor has been running cleanly for full 90 days
      monitoringStart = now - 90 * 86400;
    }
  }

  for (let i = 89; i >= 0; i--) {
    const dayEnd = now - i * 86400;
    const dayStart = dayEnd - 86400;

    // Before monitoring started
    if (dayEnd <= monitoringStart) {
      bars.push("no-data");
      continue;
    }

    // Sum downtime that overlaps this day
    let downtimeSeconds = 0;
    for (const log of logs) {
      if (log.type !== 1) continue; // only "down" events
      const logStart = log.datetime;
      const logEnd = log.duration > 0 ? log.datetime + log.duration : now;
      const overlapStart = Math.max(logStart, dayStart);
      const overlapEnd = Math.min(logEnd, dayEnd);
      if (overlapEnd > overlapStart) downtimeSeconds += overlapEnd - overlapStart;
    }

    const pct = downtimeSeconds / 86400;
    if (pct === 0) bars.push("up");
    else if (pct < 0.2) bars.push("degraded");
    else bars.push("down");
  }

  return bars;
}

// ──────────────────────────────────────────────
// Server functions

export const fetchMonitors = createServerFn({ method: "GET" }).handler(async () => {
  const data = await urPost<URMonitorsResponse>("getMonitors", {
    all_time_uptime_ratio: 1,
    custom_uptime_ratios: 30,
    response_times: 0,
    logs: 0,
  });

  return data.monitors.map((m): Server => ({
    id: String(m.id),
    name: m.friendly_name,
    url: m.url,
    status: mapStatus(m.status),
    uptime: parseFloat(m.custom_uptime_ratio || m.all_time_uptime_ratio || "0"),
    responseTime: parseInt(m.average_response_time || "0"),
    lastChecked: "just now",
    alertsEnabled: true,
  }));
});

export const fetchMonitorDetail = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: monitorId }) => {
    const data = await urPost<URMonitorsResponse>("getMonitors", {
      monitors: monitorId,
      all_time_uptime_ratio: 1,
      custom_uptime_ratios: 30,
      response_times: 1,
      response_times_limit: 48,
      logs: 1,
      logs_limit: 50,
    });

    const m = data.monitors[0];
    if (!m) return null;

    const server: Server = {
      id: String(m.id),
      name: m.friendly_name,
      url: m.url,
      status: mapStatus(m.status),
      uptime: parseFloat(m.custom_uptime_ratio || m.all_time_uptime_ratio || "0"),
      responseTime: parseInt(m.average_response_time || "0"),
      lastChecked: "just now",
      alertsEnabled: true,
    };

    const responseHistory = (m.response_times ?? []).map((rt) => ({
      time: new Date(rt.datetime * 1000).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ms: rt.value,
    }));

    const incidents: Incident[] = (m.logs ?? [])
      .filter((log) => log.type === 1)
      .map((log) => ({
        id: String(log.id),
        serverId: String(m.id),
        startedAt: formatDatetime(log.datetime),
        endedAt: log.duration > 0 ? formatDatetime(log.datetime + log.duration) : null,
        duration: formatDuration(log.duration),
        reason: log.reason?.detail ?? "No details",
      }));

    return { server, responseHistory, incidents };
  });

export const fetchAlertContacts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await urPost<URAlertContactsResponse>("getAlertContacts");
    return (data.alert_contacts ?? []).map((c): AlertChannel => ({
      id: c.id,
      type: mapContactType(c.type),
      target: c.value || c.friendly_name,
      enabled: c.status === 2,
    }));
  } catch {
    return [] as AlertChannel[];
  }
});

export const fetchPublicMonitors = createServerFn({ method: "GET" }).handler(async () => {
  const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 86400;

  const data = await urPost<URMonitorsResponse>("getMonitors", {
    all_time_uptime_ratio: 0,
    custom_uptime_ratios: 90,
    response_times: 0,
    logs: 1,
    logs_limit: 500,
    logs_start_time: ninetyDaysAgo,
  });

  return data.monitors.map((m): PublicMonitor => ({
    id: String(m.id),
    name: m.friendly_name,
    url: m.url,
    status: mapStatus(m.status),
    uptimeRatio: m.custom_uptime_ratio || "100",
    dailyBars: buildDailyBars(m.logs ?? [], m.create_datetime),
  }));
});

export const fetchIncidentHistory = createServerFn({ method: "GET" }).handler(async () => {
  const data = await urPost<URMonitorsResponse>("getMonitors", {
    response_times: 0,
    logs: 1,
    logs_limit: 200,
    log_types: 1, // down events only
  });

  const now = Math.floor(Date.now() / 1000);
  const incidents: PublicIncident[] = [];

  for (const m of data.monitors ?? []) {
    for (const log of m.logs ?? []) {
      if (log.type !== 1) continue;
      incidents.push({
        id: `${m.id}-${log.datetime}`,
        monitorName: m.friendly_name,
        startedAt: formatDatetime(log.datetime),
        startedTs: log.datetime,
        endedAt: log.duration > 0 ? formatDatetime(log.datetime + log.duration) : null,
        duration: formatDuration(log.duration),
        ongoing: log.duration === 0 || log.datetime + log.duration > now,
        reason: log.reason?.detail ?? "No details available",
      });
    }
  }

  return incidents.sort((a, b) => b.startedTs - a.startedTs);
});

export const fetchRecentAlerts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await urPost<URMonitorsResponse>("getMonitors", {
      all_time_uptime_ratio: 0,
      logs: 1,
      logs_limit: 20,
    });

    type RawLog = { monitorName: string; monitorId: number; datetime: number; type: 1 | 2; reason?: string };
    const raw: RawLog[] = [];

    for (const m of data.monitors ?? []) {
      for (const log of m.logs ?? []) {
        if (log.type !== 1 && log.type !== 2) continue;
        raw.push({
          monitorName: m.friendly_name,
          monitorId: m.id,
          datetime: log.datetime,
          type: log.type,
          reason: log.reason?.detail,
        });
      }
    }

    // Sort by unix timestamp descending, then format
    return raw
      .sort((a, b) => b.datetime - a.datetime)
      .map((r, i): AlertLog => ({
        id: `${r.monitorId}-${r.datetime}-${i}`,
        serverName: r.monitorName,
        type: r.type === 1 ? "down" : "up",
        message: r.type === 1
          ? `Server is down${r.reason ? ` - ${r.reason}` : ""}`
          : "Server recovered",
        sentAt: formatDatetime(r.datetime),
        channel: "—",
      }));
  } catch {
    return [] as AlertLog[];
  }
});
