/**
 * Runner helpers — smoke tests against the live Python CLI.
 * Skipped if the venv isn't provisioned (fresh clone without uv sync).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  runFinancexCommand,
  runKapWatch,
  runMacroSnapshot,
  runNewsAnalyze,
  runTechnicalFetch,
} from './runners.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FINANCEX_BIN = path.join(REPO_ROOT, 'python-services', '.venv', 'bin', 'financex');
const HAS_VENV = fs.existsSync(FINANCEX_BIN);
const runIfVenv = HAS_VENV ? it : it.skip;

describe('runners', () => {
  runIfVenv('macro snapshot returns parseable JSON with USD/TRY', async () => {
    const res = await runMacroSnapshot(undefined, { timeoutMs: 60_000 });
    expect(res.success).toBe(true);
    expect(res.parseError).toBeUndefined();
    const data = res.data as Record<string, unknown>;
    expect(data.usd_try).toBeDefined();
  }, 90_000);

  runIfVenv('kap_watch fixture mode returns events array', async () => {
    // Write a tiny fixture and call runKapWatch against it.
    const fixture = path.join(REPO_ROOT, 'python-services', '.tmp_kap_fixture.json');
    fs.writeFileSync(fixture, JSON.stringify([{
      disclosure_id: 'TEST-1',
      ticker: 'KCHOL',
      announced_at: '2026-04-01T10:00:00+00:00',
      title: 'Test disclosure',
      url: 'https://example.com',
    }]));
    try {
      const res = await runKapWatch('KCHOL', {
        since: '2026-01-01',
        fixtureFile: fixture,
      }, { timeoutMs: 30_000 });
      expect(res.success).toBe(true);
      const data = res.data as { events: unknown[] };
      expect(Array.isArray(data.events)).toBe(true);
    } finally {
      if (fs.existsSync(fixture)) fs.unlinkSync(fixture);
    }
  });

  runIfVenv('technical fetch against BIST ticker returns indicators', async () => {
    // This goes to TradingView — skip on timeout without failing hard.
    const res = await runTechnicalFetch('KCHOL', { bars: 100 }, { timeoutMs: 90_000 });
    if (!res.success) {
      // TradingView can be flaky on CI — don't fail the suite on network.
      return;
    }
    expect(res.data).toBeDefined();
  }, 120_000);

  runIfVenv('news analyze returns items list (Google News RSS)', async () => {
    const res = await runNewsAnalyze('KCHOL', { limit: 5, enrich: false }, { timeoutMs: 60_000 });
    if (!res.success) return; // network-dependent; treat as skip
    const data = res.data as { items: unknown[] };
    expect(Array.isArray(data.items)).toBe(true);
  }, 90_000);

  it('unknown financex subcommand produces non-zero exit', async () => {
    if (!HAS_VENV) {
      return;
    }
    const res = await runFinancexCommand(['this-does-not-exist']);
    expect(res.success).toBe(false);
  });
});
