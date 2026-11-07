import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { runtimeEnv } from "./env";
import { BUNDLED_MIGRATIONS } from "./schema-sql";

let pool: pg.Pool | undefined;
let local: Promise<LocalQuery> | undefined;
let postgresReady: Promise<void> | undefined;

type LocalQuery = {
  query: <T>(text: string, params?: unknown[]) => Promise<{ rows: T[] }>;
};

function databaseUrl(): string {
  return runtimeEnv("DATABASE_URL");
}

function publishedHost(): boolean {
  return Boolean(runtimeEnv("CURSOR_APP_ID") || runtimeEnv("VERCEL"));
}

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const url = databaseUrl();
  if (url !== "") {
    pool ??= new pg.Pool({ connectionString: url, max: 5 });
    postgresReady ??= applyPostgresMigrations(pool).catch((error: unknown) => {
      postgresReady = undefined;
      throw error;
    });
    await postgresReady;
    return (await pool.query(text, params)).rows as T[];
  }
  if (publishedHost()) {
    throw new Error("database-unavailable");
  }
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    throw error;
  });
  return (await (await local).query<T>(text, params)).rows;
}

async function applyPostgresMigrations(client: pg.Pool): Promise<void> {
  const files = await loadMigrations();
  if (files.length === 0) return;
  await client.query("select pg_advisory_lock(7272741)");
  try {
    await client.query(
      "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const done = new Set(
      (await client.query("select name from schema_migrations")).rows.map((row: { name: string }) => row.name),
    );
    for (const file of files.filter((entry) => !done.has(entry.name))) {
      await client.query("begin");
      try {
        await client.query(file.sql);
        await client.query("insert into schema_migrations (name) values ($1)", [file.name]);
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    await client.query("select pg_advisory_unlock(7272741)").catch(() => undefined);
  }
}

async function loadMigrations(): Promise<{ name: string; sql: string }[]> {
  const dir = path.join(process.cwd(), "migrations");
  if (!existsSync(dir)) return BUNDLED_MIGRATIONS;
  const names = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
  if (names.length === 0) return BUNDLED_MIGRATIONS;
  return Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readFile(path.join(dir, name), "utf8"),
    })),
  );
}

async function startLocal(): Promise<LocalQuery> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite("/tmp/shabetzti-pglite");
  for (const file of await loadMigrations()) {
    await db.exec(file.sql);
  }
  return db as unknown as LocalQuery;
}
