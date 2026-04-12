import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_ROOT = path.resolve(__dirname, '../../agents');

function memoryPath(agentId: string): string {
  // Sanitize agentId to prevent path traversal (e.g., "../../etc/passwd")
  const sanitized = path.basename(agentId);
  const resolved = path.join(AGENTS_ROOT, sanitized, 'memory.md');
  if (!resolved.startsWith(AGENTS_ROOT)) {
    throw new Error(`Invalid agent ID: ${agentId}`);
  }
  return resolved;
}

export function readAgentMemory(agentId: string): string {
  try {
    return fs.readFileSync(memoryPath(agentId), 'utf8');
  } catch {
    return `# ${agentId} Memory\n(empty)`;
  }
}

export function getAgentMemoryMtime(agentId: string): number {
  try {
    return fs.statSync(memoryPath(agentId)).mtimeMs;
  } catch {
    return 0;
  }
}

export class MemoryConflictError extends Error {
  constructor(public currentMtime: number, public expectedMtime: number) {
    super('Memory was modified externally since you loaded it');
    this.name = 'MemoryConflictError';
  }
}

export function writeAgentMemory(agentId: string, content: string, expectedMtime?: number): void {
  // Optimistic locking: if caller provided an expected mtime, verify it matches
  if (expectedMtime !== undefined && expectedMtime > 0) {
    const current = getAgentMemoryMtime(agentId);
    // Allow 100ms tolerance for filesystem timestamp granularity
    if (current > 0 && Math.abs(current - expectedMtime) > 100) {
      throw new MemoryConflictError(current, expectedMtime);
    }
  }
  fs.writeFileSync(memoryPath(agentId), content, 'utf8');
}

export function appendAgentMemory(agentId: string, section: string, content: string): void {
  const current = readAgentMemory(agentId);
  const timestamp = new Date().toISOString().split('T')[0];
  const entry = `\n\n### ${timestamp} — ${section}\n${content}\n`;
  fs.writeFileSync(memoryPath(agentId), current + entry, 'utf8');
}

// Backward compatibility for CEO-specific callers
export function readCEOMemory(): string {
  return readAgentMemory('ceo');
}

export function writeCEOMemory(content: string): void {
  writeAgentMemory('ceo', content);
}

export function appendCEOMemory(section: string, content: string): void {
  appendAgentMemory('ceo', section, content);
}
