export type ServerStatus = "up" | "down" | "degraded";

export type Server = {
  id: string;
  name: string;
  url: string;
  status: ServerStatus;
  uptime: number; // percentage
  responseTime: number; // ms
  lastChecked: string;
  alertsEnabled: boolean;
};

export type Incident = {
  id: string;
  serverId: string;
  startedAt: string;
  endedAt: string | null;
  duration: string;
  reason: string;
};

export type AlertChannel = {
  id: string;
  type: "email" | "webhook";
  target: string;
  enabled: boolean;
};

export type AlertLog = {
  id: string;
  serverName: string;
  type: "down" | "up";
  message: string;
  sentAt: string;
  channel: string;
};

export const servers: Server[] = [
  {
    id: "google",
    name: "Google",
    url: "https://google.com",
    status: "up",
    uptime: 99.99,
    responseTime: 124,
    lastChecked: "30s ago",
    alertsEnabled: true,
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com",
    status: "up",
    uptime: 99.95,
    responseTime: 210,
    lastChecked: "45s ago",
    alertsEnabled: true,
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    url: "https://cloudflare.com",
    status: "degraded",
    uptime: 98.72,
    responseTime: 480,
    lastChecked: "1m ago",
    alertsEnabled: true,
  },
  {
    id: "my-blog",
    name: "My Blog",
    url: "https://blog.example.com",
    status: "down",
    uptime: 92.41,
    responseTime: 0,
    lastChecked: "20s ago",
    alertsEnabled: true,
  },
  {
    id: "api-service",
    name: "API Service",
    url: "https://api.example.com",
    status: "up",
    uptime: 99.81,
    responseTime: 175,
    lastChecked: "10s ago",
    alertsEnabled: false,
  },
];

// Deterministic pseudo-random for stable charts
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function getResponseHistory(serverId: string, points = 48) {
  const server = servers.find((s) => s.id === serverId);
  const base = server?.responseTime || 200;
  const rand = seededRand(serverId.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const now = Date.now();
  return Array.from({ length: points }).map((_, i) => {
    const t = new Date(now - (points - i) * 30 * 60 * 1000);
    const noise = (rand() - 0.5) * base * 0.6;
    const down = server?.status === "down" && i > points - 4;
    return {
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ms: down ? 0 : Math.max(30, Math.round(base + noise)),
    };
  });
}

export const incidents: Incident[] = [
  {
    id: "i1",
    serverId: "my-blog",
    startedAt: "2026-06-08 09:12",
    endedAt: null,
    duration: "ongoing",
    reason: "Connection timeout",
  },
  {
    id: "i2",
    serverId: "cloudflare",
    startedAt: "2026-06-07 22:04",
    endedAt: "2026-06-07 22:18",
    duration: "14m",
    reason: "Elevated response times",
  },
  {
    id: "i3",
    serverId: "my-blog",
    startedAt: "2026-06-06 14:30",
    endedAt: "2026-06-06 15:02",
    duration: "32m",
    reason: "HTTP 502 Bad Gateway",
  },
  {
    id: "i4",
    serverId: "api-service",
    startedAt: "2026-06-05 03:11",
    endedAt: "2026-06-05 03:14",
    duration: "3m",
    reason: "SSL handshake failed",
  },
];

export const alertChannels: AlertChannel[] = [
  { id: "a1", type: "email", target: "admin@example.com", enabled: true },
  { id: "a2", type: "email", target: "ops@example.com", enabled: true },
  { id: "a3", type: "webhook", target: "https://hooks.slack.com/services/T00/B00/XXX", enabled: false },
];

export const alertLogs: AlertLog[] = [
  {
    id: "l1",
    serverName: "My Blog",
    type: "down",
    message: "Server is down - Connection timeout",
    sentAt: "2026-06-08 09:12",
    channel: "admin@example.com",
  },
  {
    id: "l2",
    serverName: "Cloudflare",
    type: "up",
    message: "Server recovered",
    sentAt: "2026-06-07 22:18",
    channel: "ops@example.com",
  },
  {
    id: "l3",
    serverName: "Cloudflare",
    type: "down",
    message: "Elevated response times detected",
    sentAt: "2026-06-07 22:04",
    channel: "admin@example.com",
  },
  {
    id: "l4",
    serverName: "My Blog",
    type: "up",
    message: "Server recovered",
    sentAt: "2026-06-06 15:02",
    channel: "admin@example.com",
  },
];