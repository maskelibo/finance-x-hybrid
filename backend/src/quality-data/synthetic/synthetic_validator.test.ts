/**
 * P5C Wave 1 — Synthetic Company Generator validation tests.
 *
 * Pure Node-side validation of:
 *   - JSON schema parses + has the expected structural shape.
 *   - All 8 committed fixtures validate against the schema.
 *   - Per-case invariants: synthetic_fixture flag, induced_issues non-empty,
 *     should_flag non-empty, generator.seed integer, case_id matches filename.
 *   - Schema enums cover all observed fixture values (no fixture cites a
 *     value the schema cannot accept).
 *   - The Python generator script exists and declares __main__ (no Python
 *     invocation in tests — the script ships pre-generated fixtures and is
 *     executable on demand).
 *   - metadata.yml default seed matches what the committed fixtures cite.
 *
 * No Python runtime invocation. No DB writes. No LLM calls.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// __dirname = repo_root/backend/src/quality-data/synthetic — go up 4 to repo_root
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const SCHEMA_PATH = path.join(REPO_ROOT, 'evals/synthetic/schema/synthetic_company.schema.json');
const FIXTURE_DIR = path.join(REPO_ROOT, 'evals/synthetic');
const METADATA_PATH = path.join(REPO_ROOT, 'evals/synthetic/metadata.yml');
const SCRIPT_PATH = path.join(REPO_ROOT, 'scripts/synth_generator.py');

const CASE_IDS = [
  'holding_with_segment_conflict',
  'airline_missing_da',
  'steel_ias29_anomaly',
  'bank_nim_jump',
  'exporter_fx_shock',
  'conflicting_disclosures',
  'missing_critical_metric',
  'high_leverage_liquidity_stress',
] as const;

interface SyntheticFixture {
  _warning: string;
  synthetic_fixture: boolean;
  synthetic_id: string;
  case_id: string;
  sector: string;
  induced_issues: string[];
  financial_statements: Record<string, unknown>;
  disclosures: Array<{ disclosure_id: string; topic: string; text: string }>;
  expected_agent_behavior: {
    should_flag: string[];
    should_not_silently_pass?: string[];
    expected_contradiction_severity: 'soft' | 'material' | 'critical';
  };
  generator: { script_version: string; seed: number; generated_at: string };
}

function loadSchema(): object {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
}

function makeValidator(): (data: unknown) => boolean {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(loadSchema());
}

function loadFixture(caseId: string): SyntheticFixture {
  const p = path.join(FIXTURE_DIR, `${caseId}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as SyntheticFixture;
}

// =============================================================================
// Schema parses + structural smoke
// =============================================================================

describe('synthetic_company.schema.json', () => {
  it('schema file exists and parses as JSON', () => {
    expect(fs.existsSync(SCHEMA_PATH)).toBe(true);
    const schema = loadSchema() as { $schema?: string; type?: string };
    expect(schema.type).toBe('object');
    expect(schema.$schema).toContain('json-schema.org');
  });

  it('schema enforces synthetic_fixture: true (rejects false)', () => {
    const validate = makeValidator();
    const baseFixture = loadFixture('holding_with_segment_conflict');
    const tampered = { ...baseFixture, synthetic_fixture: false };
    expect(validate(tampered)).toBe(false);
  });

  it('schema rejects missing required envelope fields', () => {
    const validate = makeValidator();
    const baseFixture = loadFixture('holding_with_segment_conflict');
    const noWarning = { ...baseFixture };
    delete (noWarning as { _warning?: string })._warning;
    expect(validate(noWarning)).toBe(false);
  });

  it('schema enum for case_id covers all 8 cases (no extras, no missing)', () => {
    const schema = loadSchema() as { properties?: { case_id?: { enum?: string[] } } };
    const enumValues = schema.properties?.case_id?.enum;
    expect(enumValues).toBeDefined();
    expect((enumValues ?? []).slice().sort()).toEqual([...CASE_IDS].slice().sort());
  });

  it('schema enum for expected_contradiction_severity matches {soft, material, critical}', () => {
    const schema = loadSchema() as {
      properties?: {
        expected_agent_behavior?: { properties?: { expected_contradiction_severity?: { enum?: string[] } } };
      };
    };
    const enumValues = schema.properties?.expected_agent_behavior?.properties
      ?.expected_contradiction_severity?.enum;
    expect((enumValues ?? []).sort()).toEqual(['critical', 'material', 'soft']);
  });

  it('schema enum for sector includes all observed sectors', () => {
    const schema = loadSchema() as { properties?: { sector?: { enum?: string[] } } };
    const enumValues = new Set(schema.properties?.sector?.enum ?? []);
    for (const c of CASE_IDS) {
      const f = loadFixture(c);
      expect(enumValues.has(f.sector)).toBe(true);
    }
  });
});

// =============================================================================
// Per-case fixture validation
// =============================================================================

describe('synthetic fixtures — per-case validation', () => {
  for (const caseId of CASE_IDS) {
    it(`fixture ${caseId} validates + asserts induced-issue invariants`, () => {
      const validate = makeValidator();
      const fx = loadFixture(caseId);
      const ok = validate(fx);
      if (!ok) {
        // eslint-disable-next-line no-console
        console.error('Validation errors for', caseId, (validate as unknown as { errors: unknown }).errors);
      }
      expect(ok).toBe(true);

      // synthetic_fixture flag MUST be true
      expect(fx.synthetic_fixture).toBe(true);

      // case_id MUST match the filename stem
      expect(fx.case_id).toBe(caseId);

      // synthetic_id MUST be SYNTH_<UPPER>
      expect(fx.synthetic_id).toBe(`SYNTH_${caseId.toUpperCase()}`);

      // induced_issues MUST be non-empty
      expect(fx.induced_issues.length).toBeGreaterThan(0);

      // expected_agent_behavior.should_flag MUST be non-empty
      expect(fx.expected_agent_behavior.should_flag.length).toBeGreaterThan(0);

      // generator.seed MUST be an integer
      expect(Number.isInteger(fx.generator.seed)).toBe(true);

      // generator.script_version MUST be a non-empty string
      expect(typeof fx.generator.script_version).toBe('string');
      expect(fx.generator.script_version.length).toBeGreaterThan(0);

      // _warning MUST be a non-empty string clearly flagging synthetic data
      expect(fx.synthetic_fixture).toBe(true);
      expect(fx._warning.length).toBeGreaterThan(0);
      expect(fx._warning.toLowerCase()).toMatch(/synthetic|test fixture|not real/i);
    });
  }
});

// =============================================================================
// Cross-fixture invariants
// =============================================================================

describe('synthetic fixtures — cross-fixture invariants', () => {
  it('all 8 committed fixtures present on disk', () => {
    for (const c of CASE_IDS) {
      expect(fs.existsSync(path.join(FIXTURE_DIR, `${c}.json`))).toBe(true);
    }
  });

  it('every fixture has synthetic_fixture: true', () => {
    for (const c of CASE_IDS) {
      expect(loadFixture(c).synthetic_fixture).toBe(true);
    }
  });

  it('every fixture cites the same generator.seed (default 42 from metadata)', () => {
    const seeds = new Set(CASE_IDS.map((c) => loadFixture(c).generator.seed));
    expect(seeds.size).toBe(1);
    expect(seeds.has(42)).toBe(true);
  });

  it('every fixture cites the same script_version', () => {
    const versions = new Set(CASE_IDS.map((c) => loadFixture(c).generator.script_version));
    expect(versions.size).toBe(1);
  });

  it('every fixture has at least one disclosure', () => {
    for (const c of CASE_IDS) {
      expect(loadFixture(c).disclosures.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// Generator script smoke (no Python invocation)
// =============================================================================

describe('synth_generator.py script smoke', () => {
  it('script exists at scripts/synth_generator.py', () => {
    expect(fs.existsSync(SCRIPT_PATH)).toBe(true);
    const stat = fs.statSync(SCRIPT_PATH);
    expect(stat.size).toBeGreaterThan(0);
  });

  it('script declares __main__ block (basic CLI smoke)', () => {
    const src = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    expect(src).toContain("if __name__ == \"__main__\":");
    // Stdlib-only invariant: no python-services / external deps imports.
    expect(src).not.toMatch(/from\s+python_services\b/);
    expect(src).not.toMatch(/^\s*import\s+(requests|httpx|numpy|pandas)\b/m);
  });

  it('script exposes generate_company(case_id, seed) for the registry', () => {
    const src = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    expect(src).toContain('def generate_company(case_id: str, seed: int)');
    for (const c of CASE_IDS) {
      // Each case_id must be referenced in the GENERATORS table.
      expect(src).toContain(`"${c}"`);
    }
  });
});

// =============================================================================
// metadata.yml — default seed matches fixture seed
// =============================================================================

describe('metadata.yml', () => {
  it('exists and parses as YAML', () => {
    expect(fs.existsSync(METADATA_PATH)).toBe(true);
    const meta = yaml.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    expect(meta).toBeDefined();
    expect(meta.framework_version).toBeDefined();
  });

  it('default_seed matches what fixtures cite', () => {
    const meta = yaml.parse(fs.readFileSync(METADATA_PATH, 'utf-8')) as {
      generator?: { default_seed?: number };
    };
    const defaultSeed = meta.generator?.default_seed;
    expect(typeof defaultSeed).toBe('number');
    const fixtureSeed = loadFixture('holding_with_segment_conflict').generator.seed;
    expect(defaultSeed).toBe(fixtureSeed);
  });

  it('case_index lists all 8 cases', () => {
    const meta = yaml.parse(fs.readFileSync(METADATA_PATH, 'utf-8')) as {
      case_index?: Array<{ case_id?: string }>;
    };
    const indexed = (meta.case_index ?? []).map((c) => c.case_id).filter(Boolean) as string[];
    expect(indexed.slice().sort()).toEqual([...CASE_IDS].slice().sort());
  });

  it('declares torture runner as deferred / not shipped', () => {
    const raw = fs.readFileSync(METADATA_PATH, 'utf-8');
    expect(raw).toMatch(/not shipped/i);
    expect(raw).toMatch(/torture/i);
  });
});
