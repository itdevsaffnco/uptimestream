import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { query, ensureTables } from "./db.server";

const SESSION_COOKIE = "ss_session";
const SESSION_TTL_HOURS = 24 * 7; // 7 days

type UserRow = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
};

type SessionRow = {
  id: string;
  user_id: number;
  username: string;
  email: string;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
};

// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3_600_000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  await query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    token,
    userId,
    expiresAt,
  ]);

  return token;
}

async function resolveSession(token: string): Promise<AuthUser | null> {
  const rows = await query<SessionRow>(
    `SELECT s.id, s.user_id, u.username, u.email
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > NOW()`,
    [token],
  );

  if (!rows.length) return null;

  return { id: rows[0].user_id, username: rows[0].username, email: rows[0].email };
}

// ──────────────────────────────────────────────
// Server functions
// ──────────────────────────────────────────────

export const getSessionUser = createServerFn({ method: "GET" }).handler(async (): Promise<AuthUser | null> => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  return resolveSession(token);
});

export const login = createServerFn({ method: "POST" })
  .validator((data: { username: string; password: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    await ensureTables();

    const users = await query<UserRow>(
      "SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1",
      [data.username, data.username],
    );

    if (!users.length) {
      return { ok: false, error: "Invalid username or password" };
    }

    const user = users[0];
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) return { ok: false, error: "Invalid username or password" };

    const token = await createSession(user.id);

    setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_HOURS * 3600,
    });

    return { ok: true };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    await query("DELETE FROM sessions WHERE id = ?", [token]).catch(() => {});
  }
  deleteCookie(SESSION_COOKIE);
  return { ok: true };
});

export const registerUser = createServerFn({ method: "POST" })
  .validator((data: { username: string; email: string; password: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    await ensureTables();

    const existing = await query<{ id: number }>(
      "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
      [data.username, data.email],
    );

    if (existing.length) return { ok: false, error: "Username or email already exists" };

    const hash = await bcrypt.hash(data.password, 12);
    await query("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", [
      data.username,
      data.email,
      hash,
    ]);

    return { ok: true };
  });
