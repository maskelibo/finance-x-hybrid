/**
 * P7C Wave 1 — Session replay CLI.
 *
 * Usage:
 *   npx tsx scripts/replay.ts <session_id>
 *   npx tsx scripts/replay.ts <session_id> --html out.html
 *
 * Read-only. No DB writes, no LLM, no network. Exit codes:
 *   0 = ok / report generated (even when session not found)
 *   2 = bad arguments
 */

import fs from 'node:fs';
import path from 'node:path';
import { formatReplayHtml, formatReplayText, replaySession } from '../src/dev-tools/replay.js';

interface CliArgs {
  sessionId: string | null;
  htmlPath: string | null;
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  const args: CliArgs = { sessionId: null, htmlPath: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--html') {
      const next = argv[i + 1];
      if (typeof next !== 'string' || next.startsWith('--')) {
        throw new Error('--html requires a file path argument');
      }
      args.htmlPath = next;
      i++;
    } else if (!arg.startsWith('--')) {
      if (args.sessionId === null) args.sessionId = arg;
    }
  }
  return args;
}

function main(): void {
  let parsed: CliArgs;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
  }
  if (!parsed.sessionId) {
    console.error('usage: npx tsx scripts/replay.ts <session_id> [--html out.html]');
    process.exit(2);
  }

  const report = replaySession(parsed.sessionId);
  console.log(formatReplayText(report));

  if (parsed.htmlPath) {
    const out = path.resolve(parsed.htmlPath);
    fs.writeFileSync(out, formatReplayHtml(report), 'utf8');
    console.error(`# wrote HTML: ${out}`);
  }
}

main();
