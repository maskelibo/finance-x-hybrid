/**
 * PII/Sensitive data scrubber — run before a prompt leaves our process for an LLM provider.
 */

const PII_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'tc_kimlik', pattern: /\b[1-9][0-9]{10}\b/g },
  { name: 'iban_tr', pattern: /\bTR[0-9]{24}\b/g },
  { name: 'phone_tr', pattern: /\b(\+?90)?\s?5[0-9]{2}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}\b/g },
  { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  { name: 'credit_card', pattern: /\b(?:\d[ -]*?){13,16}\b/g },
];

export type ScrubResult = {
  cleaned: string;
  matches: Record<string, number>;
  hasMatches: boolean;
};

export function scrubPii(text: string): ScrubResult {
  let cleaned = text;
  const matches: Record<string, number> = {};

  for (const { name, pattern } of PII_PATTERNS) {
    const found = cleaned.match(pattern);
    if (found) {
      matches[name] = found.length;
      cleaned = cleaned.replace(pattern, `[REDACTED:${name.toUpperCase()}]`);
    }
  }

  return { cleaned, matches, hasMatches: Object.keys(matches).length > 0 };
}
