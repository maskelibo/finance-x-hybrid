import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { PROJECT_ROOT } from './config.js';

let _cache: Record<string, string> | null = null;

function loadRegistry(): Record<string, string> {
  if (_cache) return _cache;
  const yamlPath = path.join(PROJECT_ROOT, 'config', 'sector_registry.yml');
  try {
    const content = fs.readFileSync(yamlPath, 'utf8');
    const parsed = yaml.parse(content);
    _cache = parsed?.sector_overrides || {};
  } catch (err) {
    console.warn(`[sector-registry] Could not load: ${err instanceof Error ? err.message : err}`);
    _cache = {};
  }
  return _cache!;
}

export function getSector(ticker: string): string | null {
  const registry = loadRegistry();
  return registry[ticker.toUpperCase()] || null;
}

export function getAllTickers(): string[] {
  return Object.keys(loadRegistry());
}
