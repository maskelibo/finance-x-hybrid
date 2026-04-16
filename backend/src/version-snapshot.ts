/**
 * Session Version Snapshot — her session başlangıcında artifact hash'lerini kaydet.
 * "Bu rapor neden böyle çıktı?" sorusuna cevap vermek için.
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { AGENTS_ROOT, DIGEST_MODE, TARGETED_KNOWLEDGE_INJECTION, FINANCIAL_ENGINE_ENABLED,
  SCHEMA_VALIDATION_MODE, REPORT_PAYLOAD_MODE } from './config.js';

type ArtifactHash = { path: string; hash: string; size: number } | null;

function hashFile(filePath: string): ArtifactHash {
  try {
    const content = fs.readFileSync(filePath);
    return {
      path: filePath,
      hash: crypto.createHash('sha256').update(content).digest('hex').slice(0, 16),
      size: content.length,
    };
  } catch {
    return null;
  }
}

export function captureSessionSnapshot(agentIds: string[]): Record<string, unknown> {
  const agents: Record<string, unknown> = {};

  for (const agentId of agentIds) {
    const dir = path.join(AGENTS_ROOT, agentId);
    agents[agentId] = {
      prompt: hashFile(path.join(dir, 'system_prompt.md')),
      memory: hashFile(path.join(dir, 'memory.md')),
      knowledge: hashFile(path.join(dir, 'knowledge.md')),
      case_lessons: hashFile(path.join(dir, 'case_lessons.md')),
    };
  }

  return {
    version: '1.0',
    captured_at: new Date().toISOString(),
    platform: 'finance-x',
    flags: {
      digest_mode: DIGEST_MODE,
      targeted_knowledge: TARGETED_KNOWLEDGE_INJECTION,
      financial_engine: FINANCIAL_ENGINE_ENABLED,
      schema_validation: SCHEMA_VALIDATION_MODE,
      report_payload: REPORT_PAYLOAD_MODE,
    },
    shared_directives: hashFile(path.resolve(AGENTS_ROOT, '../prompts/shared_directives.md')),
    template: hashFile(path.resolve(AGENTS_ROOT, '../templates/report_base.html')),
    agents,
  };
}
