import { db } from './db.js';
import { runAgent } from './agent-runner.js';
import { nanoid } from 'nanoid';

/**
 * Re-run event_impact_mapper for SISE session
 * Session ID: fwSLyU9JEeiMGoH8ja840
 */

const SESSION_ID = 'fwSLyU9JEeiMGoH8ja840';
const AGENT_ID = 'event_impact_mapper';

async function main() {
  console.log(`🔄 Re-running ${AGENT_ID} for session ${SESSION_ID}...`);

  // Get session info
  const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(SESSION_ID) as any;
  if (!session) {
    throw new Error('Session not found');
  }

  const ticker = session.ticker;
  console.log(`📊 Company: ${ticker}`);

  // Build context from completed agents
  const completedRuns = db.prepare(`
    SELECT agent_id, output_text FROM agent_runs
    WHERE session_id = ? AND status = 'completed' AND agent_id != ?
  `).all(SESSION_ID, AGENT_ID) as any[];

  const accumulatedContext: Record<string, unknown> = { ticker, runtimeMode: session.runtime_mode };
  for (const r of completedRuns) {
    if (r.output_text) {
      // Increased to 6000 chars as per orchestrator
      accumulatedContext[`${r.agent_id}_output`] = String(r.output_text).slice(0, 6000);
    }
  }

  console.log(`📦 Context built from ${completedRuns.length} completed agents`);

  // Build task prompt for event_impact_mapper
  const taskPrompt = `Map each classified KAP event for ${ticker} to specific financial statement impacts.

For each material event from event_classification agent:
1. Identify which financial statements are affected (IS/BS/CF/SE)
2. Map to specific line items
3. Assess magnitude and direction of impact
4. Note timing (when impact will manifest)
5. Assign confidence level

**Output Format:**
### Event: [Event Title]
- **Type:** [event type]
- **Date:** [date]
- **Affected Statements:** [IS/BS/CF/SE]
- **Line Items Impacted:**
  - [Statement].[Line Item]: [Direction] [Magnitude] [Confidence]
- **Impact Assessment:** [1-2 sentence explanation]
- **Timing:** [Immediate / Next Quarter / Next Year]

**SPEED OPTIMIZATION (Chairman Directive):**
- Time Budget: <3 minutes total
- Per-Event: 20-30 seconds
- If >10 events: process only HIGH materiality
- Batch all events at once (not sequential)
- Minimal quantification (only if explicit in disclosure)

Use the quick reference table in your system prompt for standard event types.`;

  // Get current agent run record
  let runRow = db.prepare(`
    SELECT id, status FROM agent_runs WHERE session_id = ? AND agent_id = ?
  `).get(SESSION_ID, AGENT_ID) as any;

  let runId: string;
  if (!runRow) {
    // Create new run record
    runId = nanoid();
    db.prepare(`
      INSERT INTO agent_runs (id, session_id, agent_id, agent_display_name, status)
      VALUES (?, ?, ?, 'Etki Haritalama', 'pending')
    `).run(runId, SESSION_ID, AGENT_ID);
    console.log(`✨ Created new agent run record: ${runId}`);
  } else {
    runId = runRow.id;
    console.log(`♻️  Reusing existing agent run record: ${runId}`);
  }

  // Mark as running
  const startedAt = new Date().toISOString();
  db.prepare(`
    UPDATE agent_runs SET status = 'running', started_at = ?, error_message = NULL WHERE id = ?
  `).run(startedAt, runId);

  // Run the agent (8 min timeout for meta agents)
  console.log(`🚀 Starting ${AGENT_ID} agent...`);
  const result = await runAgent({
    agentId: AGENT_ID,
    taskPrompt,
    context: accumulatedContext,
    timeoutMs: 8 * 60 * 1000, // 8 minutes
    onStdout: (chunk: string) => process.stdout.write('.'),
  });

  console.log('');

  const completedAt = new Date().toISOString();

  if (result.success) {
    console.log(`✅ ${AGENT_ID} completed successfully`);
    console.log(`⏱️  Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    console.log(`💰 Cost: $${result.costUsd.toFixed(4)}`);
    console.log(`🔢 Tokens: ${result.tokensUsed}`);

    // Update database
    db.prepare(`
      UPDATE agent_runs
      SET status = 'completed', completed_at = ?, duration_ms = ?,
          output_text = ?, tokens_used = ?, cost_usd = ?, input_prompt = ?
      WHERE id = ?
    `).run(
      completedAt, result.durationMs, result.output,
      result.tokensUsed, result.costUsd, taskPrompt, runId
    );

    // Update session totals
    const sessionRow = db.prepare(`SELECT total_cost_usd, total_tokens FROM analysis_sessions WHERE id = ?`).get(SESSION_ID) as any;
    const newCost = (sessionRow?.total_cost_usd || 0) + result.costUsd;
    const newTokens = (sessionRow?.total_tokens || 0) + result.tokensUsed;

    db.prepare(`
      UPDATE analysis_sessions SET total_cost_usd = ?, total_tokens = ? WHERE id = ?
    `).run(newCost, newTokens, SESSION_ID);

    console.log('\n📝 Output preview:');
    console.log(result.output.slice(0, 500) + '...\n');

  } else {
    console.error(`❌ ${AGENT_ID} failed: ${result.error}`);
    console.error(`⏱️  Duration: ${(result.durationMs / 1000).toFixed(1)}s`);

    db.prepare(`
      UPDATE agent_runs
      SET status = 'failed', completed_at = ?, duration_ms = ?,
          error_message = ?, input_prompt = ?
      WHERE id = ?
    `).run(completedAt, result.durationMs, result.error || 'Unknown error', taskPrompt, runId);
  }

  console.log(`\n🎯 Run ID: ${runId}`);
  console.log(`📊 Session ID: ${SESSION_ID}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
