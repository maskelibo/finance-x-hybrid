#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const PDFParseMod = await import('pdf-parse');
  const { PDFParse } = PDFParseMod;
  const pdfPath = process.argv[2];
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  console.log(result.text);
}
main().catch(e => { console.error(e); process.exit(1); });
