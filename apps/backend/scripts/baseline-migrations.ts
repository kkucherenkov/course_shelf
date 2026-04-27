/**
 * WHY this file exists:
 * Baseline an existing database for Prisma's migration history. Use after a
 * database that was bootstrapped with `prisma db push` (i.e. has tables but no
 * `_prisma_migrations` row) needs to switch to a `prisma migrate deploy`
 * workflow. The script reads `prisma/migrations/`, queries which migrations
 * are already recorded, and runs `prisma migrate resolve --applied` for the
 * missing ones — in lexical (== chronological) order. Idempotent: re-running
 * is a no-op once everything is recorded.
 *
 * Usage:
 *   pnpm --filter @app/backend prisma:baseline
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { Client } from 'pg';

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '../prisma/migrations');

function listMigrationDirs(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((entry) => statSync(path.join(MIGRATIONS_DIR, entry)).isDirectory())
    .sort();
}

async function listRecordedMigrations(): Promise<Set<string>> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const exists = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
       ) AS exists`,
    );
    if (!exists.rows[0]?.exists) return new Set();
    const rows = await client.query<{ migration_name: string }>(
      `SELECT migration_name FROM _prisma_migrations`,
    );
    return new Set(rows.rows.map((r) => r.migration_name));
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const dirs = listMigrationDirs();
  const recorded = await listRecordedMigrations();

  const pending = dirs.filter((name) => !recorded.has(name));
  if (pending.length === 0) {
    console.log(`All ${dirs.length} migrations already recorded — nothing to baseline.`);
    return;
  }

  console.log(`Baselining ${pending.length} of ${dirs.length} migrations:`);
  for (const name of pending) {
    console.log(`  • ${name}`);
    execFileSync('prisma', ['migrate', 'resolve', '--applied', name], { stdio: 'inherit' });
  }
  console.log('Done. Run `prisma migrate status` to verify.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
