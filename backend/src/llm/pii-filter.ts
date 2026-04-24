/**
 * PII/Sensitive data scrubber — run before a prompt leaves our process for an LLM provider.
 *
 * IMPORTANT (bug fix 2026-04-23):
 * Earlier version used naive regex for credit_card (13-16 digit sequence) and
 * tc_kimlik (11-digit starting with 1-9). In a financial-analysis context those
 * patterns matched large TL figures — e.g. THYAO total_assets ≈ 1,350,000,000,000
 * (13 digits) was redacted as CREDIT_CARD, wiping Altman Z. Canlı THYAO log:
 * "tc_kimlik:51, credit_card:9" was 100% false-positive on numeric fields.
 *
 * Fix: validate with the actual checksums.
 *   - Credit card → Luhn algorithm (mod-10 check).
 *   - TC Kimlik   → Turkish ID 10-digit base + 2-digit checksum (MERNIS formula).
 *   - Both require the match to look like a PII token (spaces/dashes formatting
 *     for CC, exact 11 digit boundary for TC) AND pass its checksum.
 *
 * Net effect: genuine PII is still masked; financial numeric fields pass through.
 */

function isLuhnValid(digits: string): boolean {
  // digits is a string of 0-9 characters only, length 13..19 (real CC lengths).
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Turkish TC Kimlik (MERNIS) 11-digit validation.
// Rules:
//  - 11 digits exactly, first digit 1-9, last digit non-zero allowed.
//  - Let d1..d11 be the digits.
//  - d10 = ((sum(odd positions 1,3,5,7,9) * 7) - sum(even positions 2,4,6,8)) mod 10
//  - d11 = (sum(d1..d10)) mod 10
function isTcKimlikValid(s: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(s)) return false;
  const d = s.split('').map(c => c.charCodeAt(0) - 48);
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const d10 = ((oddSum * 7) - evenSum + 1000) % 10;
  if (d10 !== d[9]) return false;
  const total10 = d.slice(0, 10).reduce((s, n) => s + n, 0);
  return total10 % 10 === d[10];
}

type RawMatch = {
  name: string;
  // Locate candidate matches — full match + the canonical string we validate.
  pattern: RegExp;
  // Additional predicate applied to the raw match text. If it returns false
  // the match is NOT redacted.
  validate?: (raw: string) => boolean;
};

const PII_RULES: RawMatch[] = [
  {
    name: 'tc_kimlik',
    pattern: /\b[1-9][0-9]{10}\b/g,
    validate: (raw) => isTcKimlikValid(raw),
  },
  { name: 'iban_tr', pattern: /\bTR[0-9]{24}\b/g },
  // Turkish mobile: requires country code OR explicit 0-prefix OR dash/space
  // formatted groups. Plain 10-digit sequences starting with 5 are NOT phones
  // — they're commonly Turkish financial figures (5,370,000,000 TRY).
  // Pre-fix: /\b(\+?90)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\b/ matched pure
  //         10-digit numbers; ARCLK FY2020 financial_expense=5.37B got masked.
  // Post-fix: require one of
  //   (a) explicit +90 country code
  //   (b) leading 0 (domestic)
  //   (c) dash/space/paren delimiters between groups (real phone format)
  {
    name: 'phone_tr',
    pattern:
      /(?:\+90[\s\-]?|\b0)5(?:\d{2}[\s\-]\d{3}[\s\-]\d{2}[\s\-]\d{2}|\d{2}\s\d{3}\s\d{4}|\d{9})\b|\(\s*0?5\d{2}\s*\)[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
  },
  { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  {
    name: 'credit_card',
    // Only accept formatted CC (spaces or dashes every 4 digits) OR a pure
    // 13-19 digit sequence that ALSO passes Luhn. This filters out raw
    // financial figures like "1350000000000000" (not Luhn-valid) and keeps
    // standard card formats.
    pattern: /\b(?:\d{4}[ -]){3}\d{3,4}\b|\b\d{13,19}\b/g,
    validate: (raw) => {
      const digits = raw.replace(/[ -]/g, '');
      if (!/^[0-9]+$/.test(digits)) return false;
      // Formatted CC (contained space/dash) is always considered — Luhn as
      // final gate. Unformatted long runs MUST Luhn-match, else they're
      // business numbers.
      return isLuhnValid(digits);
    },
  },
];

export type ScrubResult = {
  cleaned: string;
  matches: Record<string, number>;
  hasMatches: boolean;
};

export function scrubPii(text: string): ScrubResult {
  let cleaned = text;
  const matches: Record<string, number> = {};

  for (const { name, pattern, validate } of PII_RULES) {
    // Reset lastIndex in case the regex was global and reused.
    pattern.lastIndex = 0;
    const redacted = cleaned.replace(pattern, (raw) => {
      if (validate && !validate(raw)) return raw; // keep original — not PII
      matches[name] = (matches[name] || 0) + 1;
      return `[REDACTED:${name.toUpperCase()}]`;
    });
    cleaned = redacted;
  }

  return { cleaned, matches, hasMatches: Object.keys(matches).length > 0 };
}
