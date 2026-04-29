#!/usr/bin/env node
/**
 * Phase G empirical probe — runs the annual-report text loader against
 * the cached KCHOL activity_report PDFs and prints which sections
 * populate. Used during Pre-Core-4 verification only; safe to delete
 * after the loader/anchors are validated.
 */

const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const PDFParseMod = await import('pdf-parse');
  const { PDFParse } = PDFParseMod;
  const repoRoot = path.resolve(__dirname, '..', '..');
  const pdfDir = path.join(repoRoot, 'output', 'pdfs');
  const targetPdf = process.argv[2]
    || path.join(pdfDir, 'KCHOL_activity_report_20260224_1561073.pdf');

  if (!fs.existsSync(targetPdf)) {
    console.error(`Not found: ${targetPdf}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(targetPdf);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  const text = result.text || '';
  await parser.destroy();

  console.log(`File:        ${targetPdf}`);
  console.log(`Bytes:       ${buffer.length}`);
  console.log(`Pages:       ${result.pages?.length ?? '?'}`);
  console.log(`Text length: ${text.length}`);
  console.log('');

  // Replicate ANCHORS exactly as in annual-report-text-loader.ts
  const ANCHORS = {
    executive_summary: [
      /(?:^|\n)\s*yönetici özeti/i,
      /(?:^|\n)\s*yönetim özeti/i,
      /(?:^|\n)\s*faaliyet raporu özeti/i,
      /(?:^|\n)\s*executive summary/i,
    ],
    chairman_letter: [
      /(?:^|\n)\s*yönetim kurulu başkan(?:'?ın(?:ın)?|ı)? mesajı/i,
      /(?:^|\n)\s*başkan(?:'?ın)? mesajı/i,
      /(?:^|\n)\s*chairman'?s? message/i,
    ],
    ceo_message: [
      /(?:^|\n)\s*genel müdür(?:'?ün)? mesajı/i,
      /(?:^|\n)\s*ceo(?:'?nun)? mesajı/i,
      /(?:^|\n)\s*üst yönetim mesajı/i,
    ],
    segments_overview: [
      /(?:^|\n)\s*faaliyet konuları/i,
      /(?:^|\n)\s*faaliyet alanları/i,
      /(?:^|\n)\s*iş segmentleri/i,
      /(?:^|\n)\s*bölümlere ait bilgiler/i,
      /(?:^|\n)\s*segmentler(?:e? göre)?/i,
    ],
    risks_section: [
      /(?:^|\n)\s*risk yönetimi/i,
      /(?:^|\n)\s*önemli riskler/i,
      /(?:^|\n)\s*finansal riskler/i,
      /(?:^|\n)\s*risk faktörleri/i,
    ],
    outlook_section: [
      /(?:^|\n)\s*\d{0,4}\s*beklenti(?:ler(?:i)?|si)/i,
      /(?:^|\n)\s*görünüm/i,
      /(?:^|\n)\s*20\d{2} hedefler/i,
      /(?:^|\n)\s*gelecek dönem/i,
      /(?:^|\n)\s*outlook/i,
    ],
    sustainability_section: [
      /(?:^|\n)\s*sürdürülebilirlik/i,
      /(?:^|\n)\s*esg/i,
      /(?:^|\n)\s*çevresel,?\s*sosyal/i,
      /(?:^|\n)\s*iklim/i,
    ],
    human_resources_section: [
      /(?:^|\n)\s*insan kaynakları/i,
      /(?:^|\n)\s*çalışan profili/i,
      /(?:^|\n)\s*personel sayısı/i,
    ],
  };

  const lower = text.toLocaleLowerCase('tr-TR');

  console.log('=== Anchor scan ===');
  for (const [section, regexes] of Object.entries(ANCHORS)) {
    let firstHit = null;
    let firstHitRegex = null;
    for (const re of regexes) {
      const m = re.exec(lower);
      if (m && (firstHit == null || m.index < firstHit)) {
        firstHit = m.index;
        firstHitRegex = re.source;
      }
    }
    if (firstHit == null) {
      console.log(`  ${section.padEnd(28)} : MISS`);
    } else {
      const snippet = text.slice(firstHit, Math.min(firstHit + 120, text.length))
        .replace(/\s+/g, ' ').trim();
      console.log(`  ${section.padEnd(28)} : HIT @ ${firstHit} (${firstHitRegex})`);
      console.log(`     → ${snippet.slice(0, 100)}...`);
    }
  }

  // Print headings present in the actual PDF for diagnostic
  console.log('');
  console.log('=== First 40 candidate heading lines (uppercase + Turkish letters, length 5-80) ===');
  const lines = text.split('\n');
  let count = 0;
  for (const line of lines) {
    const s = line.trim();
    if (s.length < 5 || s.length > 80) continue;
    const isHeadinglike = /^[A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü ,/\-:0-9]{4,79}$/.test(s)
      && /[A-ZÇĞİÖŞÜ]{2,}/.test(s);
    if (!isHeadinglike) continue;
    console.log(`  ${s}`);
    count++;
    if (count >= 40) break;
  }
}

main().catch(e => { console.error(e); process.exit(1); });
