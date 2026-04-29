#!/usr/bin/env node
/**
 * Operator review CLI for config YAMLs (ownership / sotp / peer fixtures).
 *
 * Workflow:
 *   1. Operator opens config/ownership/<TICKER>.yaml (or sotp/, etc.)
 *      and cross-checks against the cited KAP / IR source.
 *   2. Operator runs:
 *        node backend/scripts/verify-config-yaml.cjs ownership KCHOL
 *      which:
 *        a. Computes sha256 of the canonical fields (ticker + source +
 *           shareholders/listed_subsidiaries/computed-source-data).
 *        b. Prints the hash and expected next steps.
 *        c. With --confirm, flips verification_status to operator_verified
 *           and writes the hash into a sibling .verified file under
 *           config/<kind>/.verified/<TICKER>.json carrying:
 *             { ticker, sha256, verified_by, verified_at }
 *
 * The runtime loaders DO NOT yet check the .verified file — this is a
 * deterministic audit trail. The verification_status flip in the YAML
 * itself is what the QA gate reads.
 *
 * Usage:
 *   node backend/scripts/verify-config-yaml.cjs ownership KCHOL
 *   node backend/scripts/verify-config-yaml.cjs ownership KCHOL --confirm --by="IP"
 *   node backend/scripts/verify-config-yaml.cjs sotp KCHOL --confirm --by="IP"
 *
 * Exit codes:
 *   0 — success (hash printed, or YAML flipped if --confirm)
 *   1 — file not found / parse error
 *   2 — already operator_verified (no-op unless --reverify)
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function usage() {
  console.error('Usage: node backend/scripts/verify-config-yaml.cjs <kind> <TICKER> [--confirm] [--by="initials"] [--reverify]');
  console.error('  kind: ownership | sotp');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) usage();
const kind = args[0];
const ticker = args[1].toUpperCase();
const confirm = args.includes('--confirm');
const reverify = args.includes('--reverify');
const byArg = args.find(a => a.startsWith('--by='));
const verifiedBy = byArg ? byArg.slice(5).replace(/^["']|["']$/g, '') : process.env.OPERATOR_INITIALS || '';

if (!['ownership', 'sotp'].includes(kind)) {
  console.error(`unknown kind: ${kind}`);
  usage();
}

const repoRoot = path.resolve(__dirname, '..', '..');
const yamlPath = path.join(repoRoot, 'config', kind, `${ticker}.yaml`);
if (!fs.existsSync(yamlPath)) {
  console.error(`file not found: ${yamlPath}`);
  process.exit(1);
}

let raw;
try {
  raw = fs.readFileSync(yamlPath, 'utf8');
} catch (e) {
  console.error(`read failed: ${e.message}`);
  process.exit(1);
}

// Compute canonical hash by stripping verification_status line and any whitespace
// noise so the hash is invariant to flips.
const canonical = raw
  .split('\n')
  .filter(line => !/^\s*verification_status:/.test(line))
  .join('\n')
  .trim();
const sha = crypto.createHash('sha256').update(canonical).digest('hex');

const currentStatusMatch = raw.match(/^verification_status:\s*([a-z_]+)/m);
const currentStatus = currentStatusMatch ? currentStatusMatch[1] : 'unknown';

console.log(`config:           ${path.relative(repoRoot, yamlPath)}`);
console.log(`current status:   ${currentStatus}`);
console.log(`canonical sha256: ${sha}`);

if (currentStatus === 'operator_verified' && !reverify) {
  console.log('already operator_verified — pass --reverify to re-sign.');
  process.exit(2);
}

if (!confirm) {
  console.log('');
  console.log('Dry-run only. To flip verification_status to operator_verified:');
  console.log(`  node backend/scripts/verify-config-yaml.cjs ${kind} ${ticker} --confirm --by="<initials>"`);
  console.log('');
  console.log('Operator MUST have cross-checked the YAML against the cited');
  console.log('KAP/IR source filing before running with --confirm.');
  process.exit(0);
}

if (!verifiedBy) {
  console.error('--confirm requires --by="<initials>" or OPERATOR_INITIALS env var');
  process.exit(1);
}

// Flip verification_status in the YAML
const updated = raw.replace(
  /^verification_status:\s*[a-z_]+/m,
  'verification_status: operator_verified',
);
fs.writeFileSync(yamlPath, updated, 'utf8');

// Write the audit trail
const verifiedDir = path.join(repoRoot, 'config', kind, '.verified');
if (!fs.existsSync(verifiedDir)) fs.mkdirSync(verifiedDir, { recursive: true });
const auditPath = path.join(verifiedDir, `${ticker}.json`);
const audit = {
  ticker,
  kind,
  sha256: sha,
  verified_by: verifiedBy,
  verified_at: new Date().toISOString(),
  yaml_path: path.relative(repoRoot, yamlPath),
};
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n', 'utf8');

console.log('');
console.log(`✓ flipped to operator_verified`);
console.log(`✓ audit trail written: ${path.relative(repoRoot, auditPath)}`);
console.log(`  verified_by: ${verifiedBy}`);
console.log(`  verified_at: ${audit.verified_at}`);
process.exit(0);
