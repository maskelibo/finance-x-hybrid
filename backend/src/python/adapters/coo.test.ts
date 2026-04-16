import { describe, expect, it } from 'vitest';

import {
  adaptCooForLegacy,
  runDeliveryCheck,
  runPreflight,
} from './coo.js';


describe('runPreflight', () => {
  it('passes a clean industrial preflight (no facts supplied → optimistic default)', () => {
    const out = runPreflight('EREGL', 'industrial');
    expect(out.decision).toBe('go');
    expect(out.items.every(i => i.passed)).toBe(true);
    // Industrial does not trigger BDDK_FORMAT_AWARE or HOLDING_SOTP_NOTED
    expect(out.items.find(i => i.code === 'BDDK_FORMAT_AWARE')).toBeUndefined();
    expect(out.items.find(i => i.code === 'HOLDING_SOTP_NOTED')).toBeUndefined();
  });

  it('adds BDDK_FORMAT_AWARE only for banking', () => {
    const out = runPreflight('AKBNK', 'banking');
    expect(out.items.find(i => i.code === 'BDDK_FORMAT_AWARE')).toBeDefined();
    expect(out.items.find(i => i.code === 'HOLDING_SOTP_NOTED')).toBeUndefined();
  });

  it('adds HOLDING_SOTP_NOTED only for holding', () => {
    const out = runPreflight('KCHOL', 'holding');
    expect(out.items.find(i => i.code === 'HOLDING_SOTP_NOTED')).toBeDefined();
    expect(out.items.find(i => i.code === 'BDDK_FORMAT_AWARE')).toBeUndefined();
  });

  it('decision → no_go when a probed fact is explicitly false', () => {
    const out = runPreflight('EREGL', 'industrial', { KAP_ACCESS: false });
    expect(out.decision).toBe('no_go');
    const kap = out.items.find(i => i.code === 'KAP_ACCESS');
    expect(kap?.passed).toBe(false);
  });

  it('uppercases ticker', () => {
    const out = runPreflight('eregl', 'industrial');
    expect(out.ticker).toBe('EREGL');
  });
});


describe('runDeliveryCheck', () => {
  const minimalHtml = (filler: string) => `
    <html>
      <body>
        <h1>Rapor</h1>
        ${filler}
        <p>yatırım tavsiyesi değildir</p>
      </body>
    </html>
  `;

  it('approves a well-formed 5KB+ HTML with balanced tables and disclaimer', () => {
    const html = minimalHtml('x'.repeat(5_000));
    const out = runDeliveryCheck('EREGL', html);
    expect(out.decision).toBe('approved');
    expect(out.items.every(i => i.passed)).toBe(true);
  });

  it('blocks on missing SPK disclaimer', () => {
    const html = `<html><body>${'x'.repeat(5_000)}</body></html>`;
    const out = runDeliveryCheck('EREGL', html);
    expect(out.decision).toBe('blocked');
    expect(out.items.find(i => i.code === 'SPK_DISCLAIMER')?.passed).toBe(false);
  });

  it('blocks on missing HTML envelope', () => {
    const html = `<body>yatırım tavsiyesi değildir ${'x'.repeat(5_000)}</body>`;
    const out = runDeliveryCheck('EREGL', html);
    expect(out.decision).toBe('blocked');
    expect(out.items.find(i => i.code === 'HTML_ENVELOPE')?.passed).toBe(false);
  });

  it('revision_needed on unbalanced tables when envelope+disclaimer are fine', () => {
    const html = minimalHtml('<table><tr><td>x</td></tr>' + 'y'.repeat(5_000));
    const out = runDeliveryCheck('EREGL', html);
    expect(out.decision).toBe('revision_needed');
    expect(out.items.find(i => i.code === 'TABLE_BALANCE')?.passed).toBe(false);
  });

  it('revision_needed on stub payload (<5KB) with otherwise clean HTML', () => {
    const html = minimalHtml('');
    const out = runDeliveryCheck('EREGL', html);
    expect(out.decision).toBe('revision_needed');
    expect(out.items.find(i => i.code === 'MIN_PAYLOAD_SIZE')?.passed).toBe(false);
  });
});


describe('adaptCooForLegacy', () => {
  it('wraps preflight report with phase=preflight and adds banking directive', () => {
    const report = runPreflight('AKBNK', 'banking');
    const legacy = adaptCooForLegacy(report, 'preflight', 'coo-1');
    expect(legacy.phase).toBe('preflight');
    expect(legacy.directives.some(d => d.includes('BDDK'))).toBe(true);
    expect(legacy.source).toBe('python');
  });

  it('wraps preflight with holding directive for holding sector', () => {
    const report = runPreflight('KCHOL', 'holding');
    const legacy = adaptCooForLegacy(report, 'preflight', 'coo-1');
    expect(legacy.directives.some(d => d.toLowerCase().includes('sotp'))).toBe(true);
  });

  it('wraps delivery report with phase=delivery and no directives', () => {
    const html = `<html><body>${'x'.repeat(5_000)}<p>yatırım tavsiyesi değildir</p></body></html>`;
    const report = runDeliveryCheck('EREGL', html);
    const legacy = adaptCooForLegacy(report, 'delivery', 'coo-2');
    expect(legacy.phase).toBe('delivery');
    expect(legacy.directives.length).toBe(0);
  });

  it('surfaces failed checks as warnings', () => {
    const report = runPreflight('EREGL', 'industrial', { KAP_ACCESS: false, TCMB_FX: false });
    const legacy = adaptCooForLegacy(report, 'preflight', 'coo-3');
    expect(legacy.warnings.some(w => w.includes('KAP_ACCESS'))).toBe(true);
    expect(legacy.warnings.some(w => w.includes('TCMB_FX'))).toBe(true);
  });
});
