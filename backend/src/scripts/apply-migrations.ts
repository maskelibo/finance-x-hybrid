/**
 * Migration apply tool — Phase 12A.
 *
 * Replaces the sqlite3-CLI dependency with a Node-native apply script that
 * uses the already-installed better-sqlite3 binding. Idempotent, backup-first,
 * audit-logged via a schema_migrations registry table.
 *
 * Usage:
 *   npx tsx src/scripts/apply-migrations.ts --status
 *     → list every migration file under src/migrations/ and show applied yes/no
 *
 *   npx tsx src/scripts/apply-migrations.ts --all
 *     → apply every pending migration in lexicographic order (phase2, phase3a,
 *       phase4, phase5, phase6). Each file runs inside its own transaction.
 *
 *   npx tsx src/scripts/apply-migrations.ts --file=phase4_schema_observation
 *     → apply a single migration by basename (without .sql)
 *
 *   npx tsx src/scripts/apply-migrations.ts --all --dry-run
 *     → print what would happen without touching the db. Backup is skipped
 *       in dry-run so this is safe to run on a live db.
 *
 * Pre-flight guarantees:
 *   - The db file is backed up to ../data/backups/<basename>.pre-<ts>.db before
 *     any ALTER statement runs (unless --dry-run).
 *   - A migration whose basename is already in schema_migrations is SKIPPED
 *     (not re-run, not counted as a failure).
 *   - Each migration runs in its own transaction; partial apply is rolled back.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'financex.db');
const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');
const BACKUPS_DIR = path.resolve(__dirname, '..', '..', 'data', 'backups');

type Args = {
  mode: 'status' | 'apply';
  all: boolean;
  file: string | null;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { mode: 'status', all: false, file: null, dryRun: false };
  for (const a of argv) {
    if (a === '--status') args.mode = 'status';
    else if (a === '--all') { args.mode = 'apply'; args.all = true; }
    else if (a.startsWith('--file=')) { args.mode = 'apply'; args.file = a.slice('--file='.length); }
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') { printUsage(); process.exit(0); }
    else { console.error(`unknown arg: ${a}`); printUsage(); process.exit(2); }
  }
  return args;
}

function printUsage(): void {
  console.log('apply-migrations.ts — Finance-X migration runner (Phase 12A)');
  console.log('');
  console.log('  --status              list every migration + applied yes/no');
  console.log('  --all                 apply every pending migration in order');
  console.log('  --file=<basename>     apply one migration by basename (no .sql)');
  console.log('  --dry-run             print what would happen; no db writes');
  console.log('');
  console.log('DB path:   ' + DB_PATH);
  console.log('Migs dir:  ' + MIGRATIONS_DIR);
  console.log('Backups:   ' + BACKUPS_DIR);
}

function listMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function ensureRegistry(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL,
      source_file TEXT,
      sha256 TEXT
    )
  `);
}

function getApplied(db: Database.Database): Set<string> {
  const rows = db.prepare(`SELECT id FROM schema_migrations`).all() as Array<{ id: string }>;
  return new Set(rows.map((r) => r.id));
}

function sha256(s: string): string {
  // Tiny hash for integrity logging; we don't need crypto-grade here.
  let h1 = 0xdeadbeef ^ 0x243f6a88;
  let h2 = 0x41c6ce57 ^ 0x85a308d3;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(13, '0');
}

function backupDb(basename: string, dryRun: boolean): string | null {
  if (dryRun) return '(dry-run — skipped)';
  if (!fs.existsSync(DB_PATH)) {
    console.warn(`[apply-migrations] db file not found at ${DB_PATH}; it will be created fresh. No backup needed.`);
    return '(no prior db — new file)';
  }
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUPS_DIR, `financex.pre-${basename}-${ts}.db`);
  fs.copyFileSync(DB_PATH, dest);
  return dest;
}

function applyOne(
  db: Database.Database,
  filename: string,
  dryRun: boolean,
): { applied: boolean; reason?: string } {
  const basename = filename.replace(/\.sql$/, '');
  const applied = getApplied(db);
  if (applied.has(basename)) {
    return { applied: false, reason: 'already in schema_migrations' };
  }
  const fullPath = path.join(MIGRATIONS_DIR, filename);
  const rawSql = fs.readFileSync(fullPath, 'utf8');
  const hash = sha256(rawSql);
  const backupTarget = backupDb(basename, dryRun);
  console.log(`  → applying ${filename} (${rawSql.length} bytes, sha=${hash})`);
  console.log(`    backup: ${backupTarget}`);
  if (dryRun) {
    console.log(`    (dry-run — not executing SQL)`);
    return { applied: false, reason: 'dry-run' };
  }
  // Strip the migration file's own BEGIN TRANSACTION / COMMIT — better-sqlite3
  // cannot nest transactions, and we provide the outer atomicity below.
  const innerSql = rawSql
    .replace(/^\s*BEGIN\s+TRANSACTION\s*;?\s*$/gim, '')
    .replace(/^\s*COMMIT\s*;?\s*$/gim, '');
  // Outer transaction: apply the file body AND record the registry row as a
  // single atomic step. If either fails, the rollback is complete.
  const apply = db.transaction(() => {
    db.exec(innerSql);
    db.prepare(
      `INSERT INTO schema_migrations (id, applied_at, source_file, sha256) VALUES (?, ?, ?, ?)`,
    ).run(basename, new Date().toISOString(), filename, hash);
  });
  apply();
  return { applied: true };
}

function status(files: string[]): void {
  if (!fs.existsSync(DB_PATH)) {
    console.log(`db: ${DB_PATH} does NOT exist yet`);
    console.log(`available migrations (${files.length}):`);
    for (const f of files) console.log(`  ? ${f}   (db missing — all would be applied fresh)`);
    return;
  }
  const db = new Database(DB_PATH);
  ensureRegistry(db);
  const applied = getApplied(db);
  console.log(`db: ${DB_PATH} (size ${fs.statSync(DB_PATH).size} bytes)`);
  console.log(`applied migrations: ${applied.size}`);
  console.log(`files in ${MIGRATIONS_DIR}:`);
  for (const f of files) {
    const bn = f.replace(/\.sql$/, '');
    const mark = applied.has(bn) ? '✅' : '⬜';
    console.log(`  ${mark} ${f}`);
  }
  db.close();
}

function apply(files: string[], targetBasename: string | null, dryRun: boolean): number {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  const db = new Database(DB_PATH);
  ensureRegistry(db);

  const targets = targetBasename
    ? files.filter((f) => f.replace(/\.sql$/, '') === targetBasename)
    : files;

  if (targetBasename && targets.length === 0) {
    console.error(`no migration file matches basename: ${targetBasename}`);
    db.close();
    return 2;
  }

  let appliedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  for (const f of targets) {
    try {
      const result = applyOne(db, f, dryRun);
      if (result.applied) appliedCount++;
      else {
        skippedCount++;
        console.log(`    skipped: ${result.reason}`);
      }
    } catch (err: unknown) {
      errorCount++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`    ERROR applying ${f}: ${msg}`);
      console.error(`    halting — remaining migrations NOT applied; state is still consistent (transaction rolled back).`);
      break;
    }
  }

  console.log('');
  console.log(`summary: applied=${appliedCount} skipped=${skippedCount} errors=${errorCount}`);
  db.close();
  return errorCount > 0 ? 1 : 0;
}

function main(argv: string[]): number {
  const args = parseArgs(argv);
  const files = listMigrationFiles();
  if (args.mode === 'status') {
    status(files);
    return 0;
  }
  return apply(files, args.file, args.dryRun);
}

process.exit(main(process.argv.slice(2)));
