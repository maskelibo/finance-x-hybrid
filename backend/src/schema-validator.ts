/**
 * Finance X — Runtime Output Schema Validator
 *
 * Agent çıktılarını output_schema.json'a karşı doğrular.
 * WARN mode: log + devam. Pipeline'ı kırmaz.
 *
 * Agent'lar genellikle markdown çıktı üretiyor, JSON değil.
 * Bu yüzden text-first yaklaşım:
 * 1. JSON blok varsa (```json...```) → parse + schema validate
 * 2. JSON blok yoksa → text validation (min length + keyword check)
 * 3. Her iki durumda da extractedFields döner (mümkünse)
 */

import fs from 'node:fs';
import path from 'node:path';
import { AGENTS_ROOT } from './config.js';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
export type ValidationResult = {
  valid: boolean;
  mode: 'json_schema' | 'text_fallback' | 'skipped';
  errors: string[];
  warnings: string[];
  extractedFields: Record<string, unknown>;
};

// -------------------------------------------------------------------
// Text-based validation — keyword/length checks per agent
// -------------------------------------------------------------------
const TEXT_VALIDATION_RULES: Record<string, {
  minLength: number;
  requiredKeywords: string[];
  warningKeywords?: string[];
}> = {
  financial_analysis: {
    minLength: 5000,
    requiredKeywords: ['ROE', 'EBITDA'],
    warningKeywords: ['FCF', 'DSO', 'CCC', 'CAPEX'],
  },
  valuation_agent: {
    minLength: 3000,
    requiredKeywords: ['DCF', 'WACC'],
    warningKeywords: ['Bull', 'Bear', 'Sensitivity'],
  },
  strategic_synthesis: {
    minLength: 5000,
    requiredKeywords: ['Skor', 'Risk'],
    warningKeywords: ['SWOT', 'Boyut'],
  },
  final_summary: {
    minLength: 5000,
    requiredKeywords: ['Skor'],
    warningKeywords: ['Bull', 'Bear'],
  },
  qa_review: {
    minLength: 500,
    requiredKeywords: ['quality', 'review'],
  },
  reconciliation: {
    minLength: 3000,
    requiredKeywords: ['quality'],
    warningKeywords: ['score', 'skor', 'puan'],
  },
  report_formatter: {
    minLength: 1000,
    requiredKeywords: ['html', 'HTML'],
  },
  data_collection: {
    minLength: 2000,
    requiredKeywords: [],
  },
  context_extraction: {
    minLength: 2000,
    requiredKeywords: [],
  },
  macro_analysis: {
    minLength: 2000,
    requiredKeywords: [],
  },
};

// -------------------------------------------------------------------
// JSON extraction helpers
// -------------------------------------------------------------------

/**
 * Try to extract a JSON object from agent output.
 * Looks for ```json blocks first, then naked { } object.
 */
function tryExtractJson(output: string): Record<string, unknown> | null {
  // Strategy 1: ```json code block
  const codeBlockMatch = output.match(/```json\s*\n([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch { /* continue */ }
  }

  // Strategy 2: Naked JSON object at the start or end of output
  // Only try if output starts with { or ends with }
  const trimmed = output.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch { /* continue */ }
  }

  return null;
}

/**
 * Validate a parsed JSON object against schema's required fields.
 * Lightweight check — no full JSON Schema validation library needed.
 */
function validateJsonAgainstSchema(
  parsed: Record<string, unknown>,
  schema: Record<string, unknown>,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const required = (schema.required || []) as string[];
  const properties = (schema.properties || {}) as Record<string, unknown>;

  // Check required fields
  for (const field of required) {
    if (!(field in parsed)) {
      // Some fields are metadata (agent_id, session_id, timestamp) — warn instead of error
      const metadataFields = ['agent_id', 'output_id', 'session_id', 'task_id', 'timestamp', 'reviewed_output_id', 'producing_agent_id'];
      if (metadataFields.includes(field)) {
        warnings.push(`metadata field eksik: ${field}`);
      } else {
        errors.push(`required field eksik: ${field}`);
      }
    }
  }

  // Type check for present fields
  for (const [key, value] of Object.entries(parsed)) {
    const propDef = properties[key] as Record<string, unknown> | undefined;
    if (!propDef) continue; // Extra fields are OK

    const expectedType = propDef.type as string;
    if (!expectedType) continue;

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (expectedType === 'number' && actualType !== 'number') {
      warnings.push(`${key}: beklenen tip number, gelen ${actualType}`);
    }
    if (expectedType === 'string' && actualType !== 'string') {
      warnings.push(`${key}: beklenen tip string, gelen ${actualType}`);
    }
    if (expectedType === 'object' && actualType !== 'object') {
      warnings.push(`${key}: beklenen tip object, gelen ${actualType}`);
    }
  }

  return { errors, warnings };
}

// -------------------------------------------------------------------
// Text validation fallback
// -------------------------------------------------------------------
function validateText(
  agentId: string,
  output: string,
): { errors: string[]; warnings: string[] } {
  const rules = TEXT_VALIDATION_RULES[agentId];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rules) return { errors, warnings }; // No rules defined — pass

  // Length check
  if (output.length < rules.minLength) {
    errors.push(`çıktı çok kısa: ${output.length} karakter (min ${rules.minLength})`);
  }

  // Required keywords
  const outputLower = output.toLowerCase();
  for (const kw of rules.requiredKeywords) {
    if (!outputLower.includes(kw.toLowerCase())) {
      errors.push(`zorunlu keyword eksik: ${kw}`);
    }
  }

  // Warning keywords (not required, but notable if missing)
  for (const kw of rules.warningKeywords || []) {
    if (!outputLower.includes(kw.toLowerCase())) {
      warnings.push(`beklenen keyword eksik: ${kw}`);
    }
  }

  // Empty output check
  if (output.trim().length === 0) {
    errors.push('çıktı boş');
  }

  // DEGRADED marker check
  if (output.startsWith('[DEGRADED]')) {
    errors.push('çıktı DEGRADED işaretli');
  }

  return { errors, warnings };
}

// -------------------------------------------------------------------
// Extract numeric fields from text (best-effort)
// -------------------------------------------------------------------
function extractFieldsFromText(agentId: string, output: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const outputLower = output.toLowerCase();

  // Extract overall score if present
  const scoreMatch = output.match(/(?:overall[_\s-]*score|genel[_\s-]*puan|toplam[_\s-]*skor|qa[_\s-]*skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i);
  if (scoreMatch) {
    fields['overall_score'] = parseFloat(scoreMatch[1].replace(',', '.'));
  }

  // Extract data_quality_score if present (reconciliation)
  const dqMatch = output.match(/data_quality_score["\s:]*([0-9.]+)/i);
  if (dqMatch) {
    fields['data_quality_score'] = parseFloat(dqMatch[1]);
  }

  // Extract confidence level
  const confMatch = output.match(/confidence[_\s-]*(?:overall|level)?["\s:]*([a-z]+)/i);
  if (confMatch && ['high', 'medium', 'low', 'speculative'].includes(confMatch[1].toLowerCase())) {
    fields['confidence_overall'] = confMatch[1].toLowerCase();
  }

  // Extract qa_decision
  if (agentId === 'qa_review') {
    if (outputLower.includes('pass') && !outputLower.includes('conditional_pass') && !outputLower.includes('fail')) {
      fields['qa_decision'] = 'pass';
    } else if (outputLower.includes('conditional_pass') || outputLower.includes('koşullu')) {
      fields['qa_decision'] = 'conditional_pass';
    } else if (outputLower.includes('fail') || outputLower.includes('reject') || outputLower.includes('blocked')) {
      fields['qa_decision'] = 'fail';
    }
  }

  return fields;
}

// -------------------------------------------------------------------
// Main validation entry point
// -------------------------------------------------------------------
export function validateAgentOutput(agentId: string, output: string): ValidationResult {
  const schemaPath = path.join(AGENTS_ROOT, agentId, 'output_schema.json');
  const hasSchema = fs.existsSync(schemaPath);

  // Try JSON extraction first
  const jsonParsed = tryExtractJson(output);

  if (jsonParsed && hasSchema) {
    // JSON found + schema exists → validate against schema
    let schema: Record<string, unknown>;
    try {
      schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    } catch {
      return {
        valid: true,
        mode: 'skipped',
        errors: [],
        warnings: ['schema dosyası okunamadı'],
        extractedFields: jsonParsed,
      };
    }

    const { errors, warnings } = validateJsonAgainstSchema(jsonParsed, schema);
    return {
      valid: errors.length === 0,
      mode: 'json_schema',
      errors,
      warnings,
      extractedFields: jsonParsed,
    };
  }

  // No JSON or no schema → text fallback validation
  const { errors, warnings } = validateText(agentId, output);
  const extractedFields = extractFieldsFromText(agentId, output);

  // Merge any JSON fields if partially extracted
  if (jsonParsed) {
    Object.assign(extractedFields, jsonParsed);
  }

  return {
    valid: errors.length === 0,
    mode: 'text_fallback',
    errors,
    warnings,
    extractedFields,
  };
}
