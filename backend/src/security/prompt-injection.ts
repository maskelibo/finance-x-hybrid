/**
 * P6E Wave 1 — Prompt-injection detection + user-input validator.
 *
 * Standalone module; no consumer wiring in Wave 1. The master-plan Step 2
 * (wire into /api/sessions and emit a P6B audit event on validation
 * failure) is deferred to a future P6E Wave 2 alongside P6B Wave 2 audit
 * consumer wiring — both are runtime audit-log consumers and gated
 * together.
 *
 * Defence-in-depth scope:
 *   - First layer only. Regex-based pattern detection against a curated
 *     set of well-known prompt-injection signatures. Not exhaustive — a
 *     real-world attacker can word-shuffle. The aim is to catch obvious
 *     attempts and surface them to log/audit; deeper LLM-side defences
 *     and a separate isolated_context discipline live in agent prompts.
 *   - Pure functions, no I/O, no LLM, no DB, no network. Module import
 *     is side-effect-free.
 *   - Sanitization replaces detected patterns with a fixed token. The
 *     surrounding text is preserved.
 */

import { VALID_ANALYSIS_LAYERS, VALID_RUNTIME_MODES, type AnalysisLayer, type RuntimeMode } from '../analysis-config.js';

// ---------------------------------------------------------------------------
// Pattern registry — frozen; new entries require explicit code review.
// ---------------------------------------------------------------------------

interface NamedPattern {
  name: string;
  regex: RegExp;
}

const INJECTION_PATTERNS: ReadonlyArray<NamedPattern> = Object.freeze([
  { name: 'ignore_previous_instructions', regex: /ignore\s+(previous|all|above|prior|earlier)(\s+\w+){0,3}\s+(instructions|prompts|rules)/i },
  { name: 'disregard_instructions', regex: /disregard[^.\n]{0,40}(instructions|prompts|rules)/i },
  { name: 'role_redefinition', regex: /you\s+are\s+now[^.\n]{0,40}(different|new|unrestricted|jailbroken|dan)/i },
  { name: 'system_prefix', regex: /(^|\n)\s*system\s*:\s/i },
  { name: 'chatml_im_start', regex: /<\|im_start\|>/i },
  { name: 'system_tag', regex: /\[\s*SYSTEM\s*\]/i },
  { name: 'reveal_system_prompt', regex: /print\s+(your|the)\s+(system\s+prompt|instructions)/i },
  { name: 'reveal_rules', regex: /reveal[^.\n]{0,30}(prompt|instructions|rules)/i },
  { name: 'forget_everything', regex: /forget\s+everything/i },
  { name: 'new_instructions_prefix', regex: /(^|[.\n])\s*new\s+instructions\s*:/i },
  { name: 'act_as_admin', regex: /act\s+as[^.\n]{0,40}(admin|root|superuser|administrator)/i },
]);

const REDACTION_TOKEN = '[REDACTED_INJECTION_ATTEMPT]';

// ---------------------------------------------------------------------------
// Public — detectPromptInjection
// ---------------------------------------------------------------------------

export interface InjectionDetectionResult {
  suspicious: boolean;
  patterns_matched: string[];
  sanitized: string;
}

export function detectPromptInjection(userInput: string): InjectionDetectionResult {
  if (typeof userInput !== 'string' || userInput.length === 0) {
    return { suspicious: false, patterns_matched: [], sanitized: userInput ?? '' };
  }

  const matched: string[] = [];
  let sanitized = userInput;
  for (const { name, regex } of INJECTION_PATTERNS) {
    const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
    if (regex.test(userInput)) {
      matched.push(name);
      sanitized = sanitized.replace(globalRegex, REDACTION_TOKEN);
    }
  }
  return {
    suspicious: matched.length > 0,
    patterns_matched: matched,
    sanitized,
  };
}

// ---------------------------------------------------------------------------
// Public — validateUserInput
// ---------------------------------------------------------------------------

export interface UserInput {
  ticker: string;
  mode: string;
  layers?: string[];
  user_note?: string;
}

export interface ValidatedInput {
  valid: boolean;
  errors: string[];
  sanitized: UserInput;
}

const TICKER_REGEX = /^[A-Z]{3,6}$/;

export function validateUserInput(input: UserInput): ValidatedInput {
  const errors: string[] = [];

  if (typeof input?.ticker !== 'string' || !TICKER_REGEX.test(input.ticker)) {
    errors.push('invalid_ticker_format');
  }

  if (typeof input?.mode !== 'string' || !VALID_RUNTIME_MODES.has(input.mode as RuntimeMode)) {
    errors.push('invalid_mode');
  }

  if (input?.layers !== undefined) {
    if (!Array.isArray(input.layers)) {
      errors.push('layers_must_be_array');
    } else {
      for (const layer of input.layers) {
        if (typeof layer !== 'string' || !VALID_ANALYSIS_LAYERS.has(layer as AnalysisLayer)) {
          errors.push(`invalid_layer:${String(layer).slice(0, 40)}`);
        }
      }
    }
  }

  let sanitizedNote = input?.user_note ?? '';
  if (typeof input?.user_note === 'string' && input.user_note.length > 0) {
    const result = detectPromptInjection(input.user_note);
    if (result.suspicious) {
      errors.push(`user_note_injection:${result.patterns_matched.join(',')}`);
      sanitizedNote = result.sanitized;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      ...(input ?? ({} as UserInput)),
      user_note: sanitizedNote,
    },
  };
}

// ---------------------------------------------------------------------------
// Test-only helpers
// ---------------------------------------------------------------------------

export const _PATTERN_NAMES_FOR_TESTS: ReadonlyArray<string> = INJECTION_PATTERNS.map((p) => p.name);
export const _REDACTION_TOKEN_FOR_TESTS = REDACTION_TOKEN;
