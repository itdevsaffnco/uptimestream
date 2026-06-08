import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const pool = mysql.createPool({
  host: "saffnco.app",
  port: 3306,
  database: "uptime_status",
  user: "itopssaffnco",
  password: "@S4FF1ens_2020!",
  waitForConnections: true,
  connectionLimit: 2,
});

async function run() {
  // Ensure tables exist
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      username      VARCHAR(64)  NOT NULL UNIQUE,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id         VARCHAR(64)  PRIMARY KEY,
      user_id    INT UNSIGNED NOT NULL,
      expires_at DATETIME     NOT NULL,
      created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const username = "dwiki";
  const email    = "dwiki@saffnco.com";
  const password = "saffnco";

  // Check if already exists
  const [rows] = await pool.execute(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
    [username, email]
  );

  if (rows.length > 0) {
    console.log("User already exists, skipping.");
    await pool.end();
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await pool.execute(
    "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
    [username, email, hash]
  );

  console.log("✓ Admin user created:");
  console.log("  Name    : Dwiki Arlian Maulana");
  console.log("  Email   : " + email);
  console.log("  Username: " + username);
  console.log("  Password: " + password);

  await pool.end();
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
