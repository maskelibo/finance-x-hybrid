/**
 * Runtime validator for TickerPackage JSON produced by the Python data
 * layer. Loads JSON Schemas from backend/generated/schemas/ (exported
 * by `financex schemas export`) and validates via Ajv.
 *
 * Integrates with SCHEMA_VALIDATION_MODE in config.ts:
 *   off         → skip entirely
 *   warn        → validate, log warnings, return valid=true anyway
 *   soft_block  → validate, mark degraded on failure
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { SCHEMA_VALIDATION_MODE, PROJECT_ROOT } from '../config.js';
import type { TickerPackage } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------
// Schema directory resolution
// ---------------------------------------------------------------------
const DEFAULT_SCHEMA_DIR = path.join(PROJECT_ROOT, 'backend', 'generated', 'schemas');

export interface ValidatorOptions {
  schemaDir?: string;
}

// ---------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------
export interface PackageValidationResult {
  valid: boolean;
  mode: 'off' | 'warn' | 'soft_block';
  schemaVersion: string | null;
  errors: string[];
  warnings: string[];
  /** Present only when valid=true; the parsed TickerPackage. */
  data?: TickerPackage;
}

// ---------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------
export class TickerPackageValidator {
  private readonly ajv: Ajv2020;
  private readonly validator: ValidateFunction;
  private readonly schemaVersion: string;

  constructor(opts: ValidatorOptions = {}) {
    const dir = opts.schemaDir ?? DEFAULT_SCHEMA_DIR;
    const tickerSchemaPath = path.join(dir, 'ticker_package.schema.json');

    if (!fs.existsSync(tickerSchemaPath)) {
      throw new Error(
        `Ticker package schema not found at ${tickerSchemaPath}. ` +
          `Run \`cd python-services && uv run financex schemas export --out ../backend/generated/schemas\`.`,
      );
    }

    const schemaRaw = fs.readFileSync(tickerSchemaPath, 'utf-8');
    const schema = JSON.parse(schemaRaw) as Record<string, unknown>;
    this.schemaVersion = (schema['x-financex-version'] as string | undefined) ?? 'unknown';

    this.ajv = new Ajv2020({
      strict: false,
      allErrors: true,
      allowUnionTypes: true,
    });
    addFormats(this.ajv);

    this.validator = this.ajv.compile(schema);
  }

  validate(candidate: unknown): PackageValidationResult {
    const mode = SCHEMA_VALIDATION_MODE;

    if (mode === 'off') {
      return {
        valid: true,
        mode: 'off',
        schemaVersion: this.schemaVersion,
        errors: [],
        warnings: [],
        data: candidate as TickerPackage,
      };
    }

    const ok = this.validator(candidate);
    const errs = this.validator.errors ?? [];

    if (ok) {
      return {
        valid: true,
        mode,
        schemaVersion: this.schemaVersion,
        errors: [],
        warnings: [],
        data: candidate as TickerPackage,
      };
    }

    const messages = formatErrors(errs);

    if (mode === 'warn') {
      return {
        valid: true, // warn mode never blocks
        mode: 'warn',
        schemaVersion: this.schemaVersion,
        errors: [],
        warnings: messages,
        data: candidate as TickerPackage,
      };
    }

    // soft_block: not valid, caller should mark degraded.
    return {
      valid: false,
      mode: 'soft_block',
      schemaVersion: this.schemaVersion,
      errors: messages,
      warnings: [],
    };
  }
}

// ---------------------------------------------------------------------
// Lazy singleton — most callers use this.
// ---------------------------------------------------------------------
let sharedValidator: TickerPackageValidator | null = null;

export function getTickerPackageValidator(): TickerPackageValidator {
  if (!sharedValidator) sharedValidator = new TickerPackageValidator();
  return sharedValidator;
}

export function validateTickerPackage(candidate: unknown): PackageValidationResult {
  return getTickerPackageValidator().validate(candidate);
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function formatErrors(errors: ErrorObject[]): string[] {
  return errors.map((e) => {
    const where = e.instancePath || '(root)';
    const detail = e.params ? JSON.stringify(e.params) : '';
    return `${where} ${e.message ?? 'validation error'}${detail ? ` — ${detail}` : ''}`;
  });
}
