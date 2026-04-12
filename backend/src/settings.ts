import crypto from 'node:crypto';
import { db } from './db.js';

// Encryption for sensitive values (API keys etc.)
// Prefer FINANCE_X_ENCRYPTION_KEY env var; fall back to machine-derived key for local dev
const keySource = process.env.FINANCE_X_ENCRYPTION_KEY
  || (process.env.USER || 'default') + '@' + (process.env.HOSTNAME || 'localhost') + '-finance-x-secret-v1';
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(keySource)
  .digest();

const ALGORITHM = 'aes-256-gcm';

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

function decrypt(ciphertext: string): string {
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return '';
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

const SENSITIVE_KEYS = new Set(['claude_api_key', 'kap_api_token']);

export type Settings = {
  claude_api_key?: string;
  kap_api_token?: string;
  default_runtime_mode?: string;
  notify_analysis_complete?: boolean;
  notify_kap_event?: boolean;
  notify_agent_error?: boolean;
  notify_budget_warning?: boolean;
};

export function getAllSettings(): Settings {
  const rows = db.prepare(`SELECT key, value FROM settings`).all() as Array<{ key: string; value: string }>;
  const result: any = {};
  for (const row of rows) {
    if (SENSITIVE_KEYS.has(row.key)) {
      // Don't return the actual key, just whether it's set (mask it)
      const decrypted = decrypt(row.value);
      result[row.key] = decrypted ? '••••••••••••' + decrypted.slice(-4) : '';
    } else if (row.value === 'true' || row.value === 'false') {
      result[row.key] = row.value === 'true';
    } else {
      result[row.key] = row.value;
    }
  }
  return result;
}

export function updateSettings(updates: Partial<Settings>): void {
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null) continue;
    // Skip masked values (user didn't change the key)
    if (SENSITIVE_KEYS.has(key) && typeof value === 'string' && value.startsWith('••')) continue;

    let storedValue: string;
    if (SENSITIVE_KEYS.has(key)) {
      storedValue = encrypt(String(value));
    } else if (typeof value === 'boolean') {
      storedValue = value ? 'true' : 'false';
    } else {
      storedValue = String(value);
    }
    upsert.run(key, storedValue, now);
  }
}

export function getDecryptedSetting(key: string): string | null {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as { value: string } | undefined;
  if (!row) return null;
  if (SENSITIVE_KEYS.has(key)) {
    return decrypt(row.value) || null;
  }
  return row.value;
}
