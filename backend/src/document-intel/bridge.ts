/**
 * Document Intelligence bridge — spawns Python cited_rag CLI.
 * U3 Block U.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { PROJECT_ROOT } from '../config.js';

export type EvidenceChunk = {
  doc_id: string;
  doc_type: string;
  fiscal_period: string;
  page: number;
  section: string | null;
  snippet: string;
  relevance: number;
};

export type EvidencePack = {
  ticker: string;
  query: string;
  total_retrieved: number;
  evidence: EvidenceChunk[];
};

const PY_BIN = process.platform === 'win32'
  ? path.join(PROJECT_ROOT, 'python-services', '.venv', 'Scripts', 'python.exe')
  : path.join(PROJECT_ROOT, 'python-services', '.venv', 'bin', 'python');

const PY_CWD = path.join(PROJECT_ROOT, 'python-services');

export async function queryCompanyKnowledge(
  ticker: string,
  question: string,
  timeoutMs = 60_000,
): Promise<EvidencePack> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      PY_BIN,
      ['-m', 'financex.document_intel.cited_rag', ticker, question],
      {
        cwd: PY_CWD,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUTF8: '1',
          PYTHONPATH: path.join(PY_CWD, 'src'),
        },
      },
    );

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', c => { stdout += c.toString('utf-8'); });
    proc.stderr.on('data', c => { stderr += c.toString('utf-8'); });

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`document-intel query timeout (${timeoutMs}ms) stderr=${stderr.slice(0, 200)}`));
    }, timeoutMs);

    proc.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(`document-intel query failed (exit ${code}): ${stderr.slice(0, 400)}`));
      }
      try {
        resolve(JSON.parse(stdout) as EvidencePack);
      } catch (err: unknown) {
        reject(new Error(`document-intel JSON parse failed: ${err instanceof Error ? err.message : err}; stdout head=${stdout.slice(0, 200)}`));
      }
    });
  });
}

export function formatEvidenceForAgent(pack: EvidencePack, maxChars = 6000): string {
  const header = `## Evidence for "${pack.query}" (${pack.total_retrieved} chunks)`;
  const body = pack.evidence.map((e, i) =>
    `### [${i + 1}] ${e.doc_id} p.${e.page}${e.section ? ` (${e.section})` : ''} — relevance ${e.relevance}\n` +
    `> ${e.snippet}\n` +
    `*Source: ${e.doc_type} ${e.fiscal_period}*`,
  ).join('\n\n');
  const full = `${header}\n\n${body}`;
  return full.length > maxChars ? full.slice(0, maxChars) + '\n\n[...kırpıldı]' : full;
}
