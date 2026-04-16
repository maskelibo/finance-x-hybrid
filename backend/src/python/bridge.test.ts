/**
 * End-to-end bridge tests — actually invoke the `financex` CLI from the
 * Python side, parse JSON, validate the TickerPackage schema roundtrip.
 *
 * Skipped if the venv binary is not present (fresh clone without uv sync).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  runFinancexCommand,
  runFinancexJson,
  runFinancexTickerPackage,
} from './bridge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../..');
const FINANCEX_BIN = path.join(REPO_ROOT, 'python-services', '.venv', 'bin', 'financex');

const HAS_VENV = fs.existsSync(FINANCEX_BIN);
const runIfVenv = HAS_VENV ? it : it.skip;

describe('bridge', () => {
  runIfVenv('runs `financex version` and captures stdout', async () => {
    const res = await runFinancexCommand(['version']);
    expect(res.success).toBe(true);
    expect(res.stdout).toMatch(/financex \d/);
    expect(res.exitCode).toBe(0);
  });

  runIfVenv('runs `financex ping` — health check', async () => {
    const res = await runFinancexCommand(['ping']);
    expect(res.success).toBe(true);
    expect(res.stdout.trim()).toBe('pong');
  });

  runIfVenv(
    'runs `financex sample ticker-package` and parses JSON',
    async () => {
      const res = await runFinancexJson(['sample', 'ticker-package']);
      expect(res.success).toBe(true);
      expect(res.parseError).toBeUndefined();
      expect(res.data).toBeDefined();
      const data = res.data as Record<string, unknown>;
      expect(data.meta).toBeDefined();
      expect((data.meta as Record<string, unknown>).ticker).toBe('KCHOL');
    },
  );

  runIfVenv(
    'runs sample + validates TickerPackage round-trip',
    async () => {
      const res = await runFinancexTickerPackage(['sample', 'ticker-package']);
      expect(res.success).toBe(true);
      expect(res.validation).toBeDefined();
      expect(res.validation?.valid).toBe(true);
      expect(res.package).toBeDefined();
      expect(res.package?.meta.ticker).toBe('KCHOL');
      expect(res.package?.company.is_holding).toBe(true);
      expect(res.package?.financials.periods.length).toBe(1);
    },
  );

  runIfVenv('exit code != 0 on unknown command', async () => {
    const res = await runFinancexCommand(['this-does-not-exist']);
    expect(res.success).toBe(false);
    expect(res.exitCode).not.toBe(0);
    // Either stderr or a surfaced error must be non-empty.
    expect((res.stderr + (res.error ?? '')).length).toBeGreaterThan(0);
  });

  it('missing binary path surfaces clear error', async () => {
    const res = await runFinancexCommand(['version'], {
      binaryPath: '/nonexistent/path/to/financex',
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/spawn error/);
  });
});
