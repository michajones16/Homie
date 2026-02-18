import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

// Load .env BEFORE creating the pool so DATABASE_URL is available.
// This must happen here (not in server.ts) because ES module imports
// are evaluated before the importing module's body runs.
try {
  const envPath = resolve(import.meta.dirname, "..", ".env");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch {
  // .env not found — rely on environment variables
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export default pool;
