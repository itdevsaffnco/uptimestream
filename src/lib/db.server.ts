import mysql from "mysql2/promise";
import process from "node:process";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST ?? "saffnco.app",
      port: parseInt(process.env.DB_PORT ?? "3306"),
      database: process.env.DB_NAME ?? "uptime_status",
      user: process.env.DB_USER ?? "itopssaffnco",
      password: process.env.DB_PASSWORD ?? "@S4FF1ens_2020!",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "+00:00",
    });
  }
  return pool;
}

export async function query<T = unknown>(sql: string, params?: (string | number | boolean | null | object)[]): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows] = await getPool().execute(sql, params as any);
  return rows as T[];
}

// Run once on startup to ensure tables exist
export async function ensureTables() {
  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS users (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      username    VARCHAR(64)  NOT NULL UNIQUE,
      email       VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         VARCHAR(64)  PRIMARY KEY,
      user_id    INT UNSIGNED NOT NULL,
      expires_at DATETIME     NOT NULL,
      created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}
