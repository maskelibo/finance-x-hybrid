/**
 * Pre-Core-4 Phase B — peer fixture loader unit tests.
 */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import { loadPeerFixtures, peerFixturesToContextValue } from './peer-fixture-loader.js';
import { PROJECT_ROOT } from '../config.js';

describe('peer-fixture-loader', () => {
  it('loads committed holding peer fixtures (SAHOL/DOHOL/AGHOL/ALARK)', () => {
    const set = loadPeerFixtures('holding');
    const tickers = set.fixtures.map((f) => f.ticker).sort();
    // The four committed KCHOL holding peers must be present.
    expect(tickers).toEqual(['AGHOL', 'ALARK', 'DOHOL', 'SAHOL']);
    expect(set.loaded_count).toBe(4);
  });

  it('all committed holding peers carry source_attribution + verification_status', () => {
    const set = loadPeerFixtures('holding');
    for (const f of set.fixtures) {
      expect(f.source_attribution.source_url).toMatch(/^https?:\/\//);
      expect(f.source_attribution.as_of_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.source_attribution.source_filing).toBeTruthy();
      expect([
        'operator_verified',
        'auto_curated_pending_operator_review',
      ]).toContain(f.verification_status);
    }
  });

  it('committed holding peers all use FY-* periods (no interim)', () => {
    const set = loadPeerFixtures('holding');
    for (const f of set.fixtures) {
      expect(f.period_label).toMatch(/^FY-\d{4}$/);
    }
  });

  it('returns empty + warning when sector dir missing', () => {
    const set = loadPeerFixtures('definitely_not_a_sector_xyz');
    expect(set.fixtures).toEqual([]);
    expect(set.loaded_count).toBe(0);
    expect(set.warnings.some((w) => w.startsWith('peer_fixture_sector_dir_missing'))).toBe(true);
  });

  it('rejects fixture with bad period (interim)', () => {
    const tmp = path.join(os.tmpdir(), `peer-fixture-test-${crypto.randomUUID()}`);
    const sector = 'tmp_sector';
    const sectorDir = path.join(PROJECT_ROOT, 'config', 'peer_fixtures', sector);
    fs.mkdirSync(sectorDir, { recursive: true });
    const file = path.join(sectorDir, 'BAD.json');
    try {
      fs.writeFileSync(file, JSON.stringify({
        ticker: 'BAD',
        sector,
        period_label: 'Q3-2024',
        canonical_numbers: { revenue: '1' },
        verification_status: 'operator_verified',
        source_attribution: { source_url: 'http://x', as_of_date: '2024-01-01', source_filing: 'x' },
      }));
      const set = loadPeerFixtures(sector);
      expect(set.fixtures).toHaveLength(0);
      expect(set.warnings.some((w) => w.includes('peer_fixture_bad_period'))).toBe(true);
    } finally {
      fs.rmSync(sectorDir, { recursive: true, force: true });
    }
  });

  it('peerFixturesToContextValue produces the shape sector_competition expects', () => {
    const set = loadPeerFixtures('holding');
    const ctxValue = peerFixturesToContextValue(set);
    const parsed = JSON.parse(ctxValue);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(4);
    for (const p of parsed) {
      expect(p.ticker).toBeTruthy();
      expect(p.canonical_numbers).toBeTruthy();
      expect(p.__peer_verification_status).toBeTruthy();
    }
  });
});
