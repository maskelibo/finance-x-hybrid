/**
 * Phase 13 (compliance fix) — request input guard.
 *
 * Helper extracted from server.ts to keep the P4.5 sensitive-runtime
 * touch budget (≤15 additive lines) honored. server.ts now calls
 * `guardUserNote(req, res)` and returns early when the guard rejects.
 *
 * Behaviour identical to the original P13 inline block:
 *   - if req.body.user_note is a non-empty string,
 *     detectPromptInjection runs.
 *   - on suspicious match: 400 with stable error code +
 *     patterns_matched list + Turkish message.
 *   - returns true to continue, false when a 400 was emitted.
 *
 * Pure function module: no module-level side effects, no DB writes,
 * no LLM calls, no orchestrator dependencies.
 */

import type { Request, Response } from 'express';

import { detectPromptInjection } from './prompt-injection.js';

export function guardUserNote(req: Request, res: Response): boolean {
  const note = (req.body as { user_note?: unknown } | undefined)?.user_note;
  if (typeof note !== 'string' || note.length === 0) return true;
  const inj = detectPromptInjection(note);
  if (!inj.suspicious) return true;
  console.warn(
    `[input-validation] prompt_injection_detected patterns=[${inj.patterns_matched.join(',')}]`,
  );
  res.status(400).json({
    error: 'user_note_injection_detected',
    patterns_matched: inj.patterns_matched,
    message:
      'user_note alanında potansiyel injection paterni tespit edildi. Lütfen düzgün cümle olarak yeniden gönderin.',
  });
  return false;
}
