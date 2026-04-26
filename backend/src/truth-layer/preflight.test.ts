import { describe, it, expect } from 'vitest';
import {
  populateTruthAssertions,
  populateFaFilingHint,
  readTruthAssertions,
  kapDisclosuresToFilings,
  TRUTH_CONTEXT_KEYS,
} from './preflight.js';

describe('truth-layer preflight', () => {
  it('populateTruthAssertions writes truth_assertions + json into context', () => {
    const ctx: Record<string, unknown> = { ticker: 'KCHOL' };
    const a = populateTruthAssertions('KCHOL', ctx);
    expect(a.classification.is_holding).toBe(true);
    expect(ctx[TRUTH_CONTEXT_KEYS.ASSERTIONS]).toBeDefined();
    expect(typeof ctx[TRUTH_CONTEXT_KEYS.ASSERTIONS_JSON]).toBe('string');
  });

  it('populateTruthAssertions is idempotent for the same ticker', () => {
    const ctx: Record<string, unknown> = {};
    const first = populateTruthAssertions('KCHOL', ctx);
    const second = populateTruthAssertions('KCHOL', ctx);
    expect(first).toBe(second); // identical reference (cache hit)
  });

  it('readTruthAssertions returns null when absent', () => {
    expect(readTruthAssertions({})).toBeNull();
  });

  it('readTruthAssertions returns the populated object', () => {
    const ctx: Record<string, unknown> = {};
    populateTruthAssertions('AKBNK', ctx);
    const a = readTruthAssertions(ctx);
    expect(a).not.toBeNull();
    expect(a!.classification.is_banking).toBe(true);
  });

  it('populateFaFilingHint is no-op when no kap_watch_output', () => {
    const ctx: Record<string, unknown> = {};
    const sel = populateFaFilingHint('KCHOL', ctx);
    expect(sel).toBeNull();
    expect(ctx[TRUTH_CONTEXT_KEYS.FA_FILING_HINT]).toBeUndefined();
  });

  it('populateFaFilingHint picks consolidated annual report from KAP inventory', () => {
    const kapOutput = {
      disclosure_inventory: [
        {
          disclosure_id: '1572100',
          title: 'Özel Durum Açıklaması (Genel)',
          summary: 'Yönetim kurulu kararı',
          published_at: '2026-04-15T10:00:00Z',
        },
        {
          disclosure_id: '1555903',
          title: 'Konsolide Finansal Tablolar — Bağımsız Denetim Raporu Yıllık FY-2025',
          summary: 'KCHOL FY2025 Konsolide Finansallar',
          published_at: '2026-02-11T18:00:00Z',
        },
        {
          disclosure_id: '1561073',
          title: 'Faaliyet Raporu',
          summary: 'KCHOL FY2025 Faaliyet Raporu',
          published_at: '2026-02-24T09:00:00Z',
        },
      ],
    };
    const ctx: Record<string, unknown> = { kap_watch_output: kapOutput };
    const sel = populateFaFilingHint('KCHOL', ctx);
    expect(sel?.selected?.filing_id).toBe('1555903');
    expect(ctx[TRUTH_CONTEXT_KEYS.FA_FILING_HINT]).toBe('1555903');
    expect(typeof ctx[TRUTH_CONTEXT_KEYS.FA_FILING_HINT_REASONING]).toBe('string');
  });

  it('populateFaFilingHint accepts kap_watch_output as JSON string', () => {
    const kapOutput = {
      disclosure_inventory: [
        {
          disclosure_id: 'A',
          title: 'Konsolide Finansal Tablolar',
          published_at: '2026-02-11T00:00:00Z',
        },
      ],
    };
    const ctx: Record<string, unknown> = { kap_watch_output: JSON.stringify(kapOutput) };
    const sel = populateFaFilingHint('KCHOL', ctx);
    expect(sel?.selected?.filing_id).toBe('A');
  });

  it('kapDisclosuresToFilings infers document_type from title', () => {
    const filings = kapDisclosuresToFilings([
      { disclosure_id: '1', title: 'Özel Durum Açıklaması (Genel)', published_at: '2026-04-15' },
      { disclosure_id: '2', title: 'Konsolide Finansal Tablolar Yıllık FY2025', published_at: '2026-02-11' },
      { disclosure_id: '3', title: 'Faaliyet Raporu 2025', published_at: '2026-02-24' },
      { disclosure_id: '4', title: 'Bağımsız Denetim Raporu Yıllık', published_at: '2026-02-12' },
      { disclosure_id: '5', title: '3. Çeyrek Finansal Tablolar', published_at: '2025-11-10' },
    ]);
    expect(filings).toHaveLength(5);
    expect(filings[0].document_type).toBe('ozel_durum_aciklamasi');
    expect(filings[1].document_type).toBe('konsolide_finansal_rapor');
    expect(filings[2].document_type).toBe('faaliyet_raporu');
    expect(filings[3].document_type).toBe('audited_annual_financials');
    expect(filings[4].document_type).toBe('q3_finansal');
  });

  it('kapDisclosuresToFilings uses KAP cat/subcat for shorthand titles', () => {
    // Real KCHOL inventory shape: title="Finansal Rapor", cat=FR/FR
    const filings = kapDisclosuresToFilings([
      { disclosure_id: '1555903', title: 'Finansal Rapor', category: 'FR', subcategory: 'FR', published_at: '2026-02-11' },
      { disclosure_id: '1561073', title: 'Faaliyet Raporu (Konsolide)', category: 'ODA', subcategory: 'FR', published_at: '2026-02-24' },
      { disclosure_id: '1592323', title: 'Finansal Takvim', category: 'ODA', subcategory: 'DG', published_at: '2026-04-13' },
      { disclosure_id: '1572139', title: 'Finansal Duran Varlık Edinimi', category: 'ODA', subcategory: 'ODA', published_at: '2026-03-13' },
    ]);
    expect(filings[0].document_type).toBe('konsolide_finansal_rapor');
    expect(filings[0].has_auditor_opinion).toBe(true);
    expect(filings[1].document_type).toBe('faaliyet_raporu');
    expect(filings[2].document_type).toBe('other');                  // schedule/DG
    expect(filings[3].document_type).toBe('ozel_durum_aciklamasi');
  });

  it('kapDisclosuresToFilings detects auditor opinion presence', () => {
    const f = kapDisclosuresToFilings([
      { disclosure_id: '1', title: 'Bağımsız Denetim Raporu Yıllık FY2025' },
      { disclosure_id: '2', title: 'Yönetim Kurulu Kararı' },
    ]);
    expect(f[0].has_auditor_opinion).toBe(true);
    expect(f[1].has_auditor_opinion).toBe(false);
  });

  it('populateFaFilingHint gracefully handles malformed kap_watch_output', () => {
    const ctx: Record<string, unknown> = { kap_watch_output: 'not_json' };
    const sel = populateFaFilingHint('KCHOL', ctx);
    expect(sel).toBeNull();
    expect(ctx[TRUTH_CONTEXT_KEYS.FA_FILING_HINT]).toBeUndefined();
  });
});
