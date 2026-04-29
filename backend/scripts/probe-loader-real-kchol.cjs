#!/usr/bin/env node
/**
 * Drive the actual loader against the real KCHOL activity_report PDFs.
 * Uses the compiled .ts via tsx/ts-node-style import is too involved
 * for a probe; instead we re-run the same classifier+extractor logic
 * inline. Numbers must match the loader's output exactly.
 */

const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const PDFParseMod = await import('pdf-parse');
  const { PDFParse } = PDFParseMod;
  const repoRoot = path.resolve(__dirname, '..', '..');
  const pdfDir = path.join(repoRoot, 'output', 'pdfs');
  const target = process.argv[2]
    || path.join(pdfDir, 'KCHOL_activity_report_20260224_1561073.pdf');

  const buffer = fs.readFileSync(target);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  const text = result.text || '';
  const pages = result.pages?.length ?? 0;
  await parser.destroy();

  // Replicate classifyDocumentType
  const lower = text.toLocaleLowerCase('tr-TR');
  const hasAuditorMarker = /bağımsız denetçi raporu|bağımsız denetim kuruluşu/i.test(lower);
  const hasFarSection = /(?:^|\n)\s*(?:yönetim kurulu başkan|genel müdür|risk yönetimi|faaliyet (?:konuları|alanları))/i
    .test(lower);
  let docType;
  if (hasFarSection && pages >= 30) docType = 'full_far';
  else if (hasAuditorMarker && pages <= 12) docType = 'auditor_opinion_cover';
  else if (pages <= 4 && !hasFarSection) docType = 'kap_cover_only';
  else if (hasFarSection) docType = 'full_far';
  else docType = 'unknown';

  // Replicate extractAuditorOpinion
  const firmMatch = text.match(/Bağımsız Denetim Kuruluşu\s+([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü .&]+)(?:\s+Denetim|\n)/);
  const firm = firmMatch ? firmMatch[1].trim() : null;
  const periodMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4})/);
  const period = periodMatch ? periodMatch[1].replace(/\s+/g, '') : null;
  const resultMatch = text.match(/Denetim Sonucu\s+(Olumlu|Olumsuz|Şartlı(?:\s+olumlu)?|Görüş bildirmekten kaçınma)/i);
  const auditResult = resultMatch ? resultMatch[1] : null;
  const opinionMatch = text.match(/Görüşümüze göre[\s\S]{0,600}?(?=\d\)|$)/);
  const opinion = opinionMatch ? opinionMatch[0].replace(/\s+/g, ' ').trim() : null;

  console.log(`File:          ${path.basename(target)}`);
  console.log(`Pages:         ${pages}`);
  console.log(`Bytes:         ${buffer.length}`);
  console.log(`document_type: ${docType}`);
  console.log(`audit_firm:    ${firm}`);
  console.log(`audit_period:  ${period}`);
  console.log(`audit_result:  ${auditResult}`);
  console.log(`opinion (first 200): ${opinion ? opinion.slice(0, 200) + '…' : 'null'}`);
}
main().catch(e => { console.error(e); process.exit(1); });
