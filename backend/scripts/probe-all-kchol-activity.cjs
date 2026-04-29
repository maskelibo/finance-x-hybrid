#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const PDFParseMod = await import('pdf-parse');
  const { PDFParse } = PDFParseMod;
  const repoRoot = path.resolve(__dirname, '..', '..');
  const pdfDir = path.join(repoRoot, 'output', 'pdfs');
  const files = fs.readdirSync(pdfDir).filter(f => /^KCHOL_activity_report.*\.pdf$/.test(f));
  for (const f of files) {
    const full = path.join(pdfDir, f);
    const stat = fs.statSync(full);
    const buffer = fs.readFileSync(full);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const text = result.text || '';
    await parser.destroy();
    const pages = result.pages?.length ?? 0;
    const first200 = text.slice(0, 200).replace(/\s+/g, ' ').trim();
    console.log(`${f}  pages=${pages}  bytes=${stat.size}`);
    console.log(`  → ${first200}`);
    console.log('');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
