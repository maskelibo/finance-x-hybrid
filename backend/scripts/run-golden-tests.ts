#!/usr/bin/env npx tsx
/**
 * Golden Test Runner — Finance X Agent Contract Validation
 *
 * Validates agent contracts (output_schema.json, test_cases.json, agent_spec.json)
 * against the pipeline configuration and each other.
 *
 * Usage: npx tsx backend/scripts/run-golden-tests.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const AGENTS_ROOT = path.resolve(import.meta.dirname || __dirname, '../../agents');
const RESULTS: Array<{ agent: string; test: string; status: 'PASS' | 'FAIL' | 'WARN'; message: string }> = [];

function log(agent: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
  RESULTS.push({ agent, test, status, message });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${agent}] ${test}: ${message}`);
}

function getAgentDirs(): string[] {
  return fs.readdirSync(AGENTS_ROOT)
    .filter(d => {
      const fullPath = path.join(AGENTS_ROOT, d);
      return fs.statSync(fullPath).isDirectory()
        && !d.startsWith('_')
        && !d.startsWith('.');
    })
    .sort();
}

function readJsonSafe(filePath: string): any | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// Test 1: Every agent must have system_prompt.md
function testSystemPromptExists(agentId: string, agentDir: string) {
  const promptPath = path.join(agentDir, 'system_prompt.md');
  if (fs.existsSync(promptPath)) {
    const content = fs.readFileSync(promptPath, 'utf8');
    if (content.length < 100) {
      log(agentId, 'system_prompt_exists', 'WARN', `system_prompt.md exists but very short (${content.length} chars)`);
    } else {
      log(agentId, 'system_prompt_exists', 'PASS', `${content.length} chars`);
    }
  } else {
    log(agentId, 'system_prompt_exists', 'FAIL', 'system_prompt.md missing');
  }
}

// Test 2: output_schema.json structure validation
function testOutputSchema(agentId: string, agentDir: string) {
  const schemaPath = path.join(agentDir, 'output_schema.json');
  if (!fs.existsSync(schemaPath)) {
    log(agentId, 'output_schema', 'WARN', 'No output_schema.json');
    return;
  }

  const schema = readJsonSafe(schemaPath);
  if (!schema) {
    log(agentId, 'output_schema', 'FAIL', 'Invalid JSON in output_schema.json');
    return;
  }

  // Check basic JSON Schema structure
  if (!schema.type && !schema.properties && !schema['$schema']) {
    log(agentId, 'output_schema', 'WARN', 'Schema has no type, properties, or $schema');
    return;
  }

  const requiredFields = schema.required || [];
  const properties = schema.properties || {};
  const propCount = Object.keys(properties).length;

  // Check that all required fields are defined in properties
  const missingProps = requiredFields.filter((f: string) => !properties[f]);
  if (missingProps.length > 0) {
    log(agentId, 'output_schema', 'FAIL', `Required fields missing from properties: ${missingProps.join(', ')}`);
  } else {
    log(agentId, 'output_schema', 'PASS', `${propCount} properties, ${requiredFields.length} required`);
  }
}

// Test 3: test_cases.json structure validation
function testCases(agentId: string, agentDir: string) {
  const casesPath = path.join(agentDir, 'test_cases.json');
  if (!fs.existsSync(casesPath)) {
    log(agentId, 'test_cases', 'WARN', 'No test_cases.json');
    return;
  }

  const cases = readJsonSafe(casesPath);
  if (!cases) {
    log(agentId, 'test_cases', 'FAIL', 'Invalid JSON in test_cases.json');
    return;
  }

  const testArray = Array.isArray(cases) ? cases : cases.test_cases || cases.tests || [];
  if (testArray.length === 0) {
    log(agentId, 'test_cases', 'WARN', 'No test cases defined');
    return;
  }

  let issues = 0;
  for (let i = 0; i < testArray.length; i++) {
    const tc = testArray[i];
    if (!tc.input && !tc.scenario && !tc.name && !tc.description) {
      issues++;
    }
    if (!tc.expected_behavior && !tc.pass_criteria && !tc.expected_output && !tc.expected) {
      issues++;
    }
  }

  if (issues > 0) {
    log(agentId, 'test_cases', 'WARN', `${testArray.length} cases, ${issues} with missing input/expected fields`);
  } else {
    log(agentId, 'test_cases', 'PASS', `${testArray.length} test cases validated`);
  }
}

// Test 4: agent_spec.json structure validation
function testAgentSpec(agentId: string, agentDir: string) {
  const specPath = path.join(agentDir, 'agent_spec.json');
  if (!fs.existsSync(specPath)) {
    log(agentId, 'agent_spec', 'WARN', 'No agent_spec.json');
    return;
  }

  const spec = readJsonSafe(specPath);
  if (!spec) {
    log(agentId, 'agent_spec', 'FAIL', 'Invalid JSON in agent_spec.json');
    return;
  }

  const requiredKeys = ['trigger', 'inputs', 'outputs'];
  const missing = requiredKeys.filter(k => !spec[k]);
  if (missing.length > 0) {
    log(agentId, 'agent_spec', 'WARN', `Missing spec fields: ${missing.join(', ')}`);
  } else {
    log(agentId, 'agent_spec', 'PASS', 'Spec structure valid');
  }
}

// Test 5: Memory architecture completeness
function testMemoryArchitecture(agentId: string, agentDir: string) {
  const files = {
    'memory.md': fs.existsSync(path.join(agentDir, 'memory.md')),
    'knowledge.md': fs.existsSync(path.join(agentDir, 'knowledge.md')),
    'permanent_rules.md': fs.existsSync(path.join(agentDir, 'permanent_rules.md')),
    'case_lessons.md': fs.existsSync(path.join(agentDir, 'case_lessons.md')),
  };

  const present = Object.entries(files).filter(([, exists]) => exists).map(([name]) => name);
  const missing = Object.entries(files).filter(([, exists]) => !exists).map(([name]) => name);

  if (missing.includes('memory.md')) {
    log(agentId, 'memory_arch', 'FAIL', 'memory.md missing');
  } else if (missing.includes('permanent_rules.md')) {
    log(agentId, 'memory_arch', 'WARN', `Missing: ${missing.join(', ')} (have: ${present.join(', ')})`);
  } else {
    log(agentId, 'memory_arch', 'PASS', `${present.length}/4 files present`);
  }

  // Check memory.md size
  const memoryPath = path.join(agentDir, 'memory.md');
  if (fs.existsSync(memoryPath)) {
    const content = fs.readFileSync(memoryPath, 'utf8');
    if (content.length > 6 * 1024) {
      log(agentId, 'memory_size', 'WARN', `memory.md ${Math.round(content.length / 1024)}KB exceeds 6KB Layer 1 limit`);
    } else {
      log(agentId, 'memory_size', 'PASS', `memory.md ${Math.round(content.length / 1024)}KB within limit`);
    }
  }
}

// Test 6: Cross-reference schema with system prompt keywords
function testSchemaPromptAlignment(agentId: string, agentDir: string) {
  const schemaPath = path.join(agentDir, 'output_schema.json');
  const promptPath = path.join(agentDir, 'system_prompt.md');

  if (!fs.existsSync(schemaPath) || !fs.existsSync(promptPath)) return;

  const schema = readJsonSafe(schemaPath);
  if (!schema?.required) return;

  const prompt = fs.readFileSync(promptPath, 'utf8').toLowerCase();
  const requiredFields = schema.required as string[];

  const mentionedInPrompt = requiredFields.filter((f: string) =>
    prompt.includes(f.toLowerCase()) || prompt.includes(f.replace(/_/g, ' ').toLowerCase())
  );

  const ratio = mentionedInPrompt.length / requiredFields.length;
  if (ratio < 0.5 && requiredFields.length > 3) {
    log(agentId, 'schema_prompt_align', 'WARN',
      `Only ${mentionedInPrompt.length}/${requiredFields.length} required schema fields mentioned in system_prompt`);
  } else {
    log(agentId, 'schema_prompt_align', 'PASS',
      `${mentionedInPrompt.length}/${requiredFields.length} schema fields referenced in prompt`);
  }
}

// ============================================================
// MAIN
// ============================================================
console.log('🧪 Finance X — Golden Test Runner');
console.log('='.repeat(60));
console.log(`Agents root: ${AGENTS_ROOT}`);
console.log('');

const agents = getAgentDirs();
console.log(`Found ${agents.length} agent directories\n`);

for (const agentId of agents) {
  const agentDir = path.join(AGENTS_ROOT, agentId);
  console.log(`\n--- ${agentId} ---`);

  testSystemPromptExists(agentId, agentDir);
  testOutputSchema(agentId, agentDir);
  testCases(agentId, agentDir);
  testAgentSpec(agentId, agentDir);
  testMemoryArchitecture(agentId, agentDir);
  testSchemaPromptAlignment(agentId, agentDir);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));

const pass = RESULTS.filter(r => r.status === 'PASS').length;
const fail = RESULTS.filter(r => r.status === 'FAIL').length;
const warn = RESULTS.filter(r => r.status === 'WARN').length;

console.log(`✅ PASS: ${pass}`);
console.log(`❌ FAIL: ${fail}`);
console.log(`⚠️  WARN: ${warn}`);
console.log(`Total: ${RESULTS.length} checks across ${agents.length} agents`);

if (fail > 0) {
  console.log('\n❌ FAILURES:');
  for (const r of RESULTS.filter(r => r.status === 'FAIL')) {
    console.log(`  - [${r.agent}] ${r.test}: ${r.message}`);
  }
}

if (warn > 0) {
  console.log('\n⚠️  WARNINGS:');
  for (const r of RESULTS.filter(r => r.status === 'WARN')) {
    console.log(`  - [${r.agent}] ${r.test}: ${r.message}`);
  }
}

process.exit(fail > 0 ? 1 : 0);
