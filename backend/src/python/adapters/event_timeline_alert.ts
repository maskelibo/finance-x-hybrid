/**
 * Event timeline alert adapter — bridges the legacy LLM output shape
 * with the Python TimelineOutput schema, both directions.
 *
 * Upstream (event_impact_mapper) still runs on the LLM until that
 * agent flips. Its JSON is best-effort — we pull whatever timing /
 * materiality signal we can parse out, and default the rest.
 */

export interface LegacyEventImpact {
  event_id?: string;
  id?: string;
  type?: string;
  event_type?: string;
  summary?: string;
  title?: string;
  timing?: string;                // 'immediate' | 'near' | 'medium' | 'long'
  timing_days?: number;
  materiality_pct?: number | string;
  confidence?: string;
  source_url?: string;
  must_happen?: boolean;
}

export interface LegacyEventImpactOutput {
  agent_id?: string;
  event_impacts?: LegacyEventImpact[];
  events?: LegacyEventImpact[];   // some LLM outputs use this name
  [key: string]: unknown;
}

export interface EventForTimeline {
  event_id: string;
  title: string;
  timing_days: number;
  summary: string | null;
  event_type: string | null;
  materiality_pct: string | null;     // Decimal as string
  confidence: string;
  source_url: string | null;
  must_happen: boolean;
}

const PHASE_TO_DAYS: Record<string, number> = {
  immediate: 15,
  near: 60,
  near_term: 60,
  medium: 135,
  medium_term: 135,
  long: 270,
  long_term: 270,
};


/**
 * Turn the upstream LLM event_impact_mapper JSON into the payload the
 * Python timeline bucketer expects (array of EventForTimeline).
 */
export function adaptLegacyImpactsForPython(legacy: unknown): EventForTimeline[] {
  let parsed: LegacyEventImpactOutput | null = null;

  if (typeof legacy === 'string') {
    try {
      parsed = JSON.parse(legacy) as LegacyEventImpactOutput;
    } catch {
      return [];
    }
  } else if (legacy && typeof legacy === 'object') {
    parsed = legacy as LegacyEventImpactOutput;
  }
  if (!parsed) return [];

  const items = parsed.event_impacts ?? parsed.events ?? [];
  if (!Array.isArray(items)) return [];

  return items.map((raw, i): EventForTimeline => {
    const id = String(raw.event_id ?? raw.id ?? `legacy-${i}`);
    const title = String(raw.summary ?? raw.title ?? id);
    const rawTiming = String(raw.timing ?? '').toLowerCase();
    const timingDays = raw.timing_days ?? PHASE_TO_DAYS[rawTiming] ?? PHASE_TO_DAYS.medium;
    const materiality = raw.materiality_pct === undefined || raw.materiality_pct === null
      ? null
      : String(raw.materiality_pct);
    return {
      event_id: id,
      title,
      timing_days: Number(timingDays),
      summary: raw.summary ?? null,
      event_type: raw.type ?? raw.event_type ?? null,
      materiality_pct: materiality,
      confidence: String(raw.confidence ?? 'unknown').toLowerCase(),
      source_url: raw.source_url ?? null,
      must_happen: Boolean(raw.must_happen),
    };
  });
}


/**
 * Convert the Python TimelineOutput JSON back into the legacy shape
 * downstream agents (final_summary, etc.) expect.
 */
export interface PythonTimelineOutput {
  reference_date?: string;
  buckets?: Array<{
    phase?: string;
    day_range?: [number, number];
    events?: Array<{
      event_id?: string;
      title?: string;
      timing_days?: number;
      materiality_pct?: string | null;
      confidence?: string;
    }>;
  }>;
  priority_alerts?: Array<{
    event_id?: string;
    title?: string;
    phase?: string;
    urgency?: string;
    reason?: string;
  }>;
}

export interface LegacyTimelineOutput {
  agent_id: string;
  output_id: string;
  impact_timeline: Array<{
    event_id: string;
    title: string;
    phase: string;
    day_range: [number, number];
    timing_days: number;
    materiality_pct: string | null;
    confidence: string;
    urgency_level: string;
  }>;
  priority_alerts: Array<{
    event_id: string;
    title: string;
    phase: string;
    urgency_level: string;
    alert_text: string;
  }>;
  upcoming_calendar: unknown[];
  confidence_overall: string;
  warnings: string[];
  review_status: string;
}

export function adaptPythonTimelineForLegacy(
  python: PythonTimelineOutput,
  outputId: string,
): LegacyTimelineOutput {
  const priorityIds = new Set((python.priority_alerts ?? []).map(a => a.event_id ?? ''));

  const impact_timeline: LegacyTimelineOutput['impact_timeline'] = [];
  for (const bucket of python.buckets ?? []) {
    const phase = bucket.phase ?? 'unknown';
    const day_range = bucket.day_range ?? [0, 0];
    for (const evt of bucket.events ?? []) {
      const event_id = evt.event_id ?? 'unknown';
      impact_timeline.push({
        event_id,
        title: evt.title ?? event_id,
        phase,
        day_range,
        timing_days: evt.timing_days ?? 0,
        materiality_pct: evt.materiality_pct ?? null,
        confidence: evt.confidence ?? 'unknown',
        urgency_level: priorityIds.has(event_id) ? 'high' : 'low',
      });
    }
  }

  const priority_alerts: LegacyTimelineOutput['priority_alerts'] = (python.priority_alerts ?? [])
    .map(a => ({
      event_id: a.event_id ?? 'unknown',
      title: a.title ?? '',
      phase: a.phase ?? '',
      urgency_level: a.urgency ?? 'low',
      alert_text: a.reason ?? '',
    }));

  return {
    agent_id: 'event_timeline_alert',
    output_id: outputId,
    impact_timeline,
    priority_alerts,
    upcoming_calendar: [],
    confidence_overall: priority_alerts.some(a => a.urgency_level === 'high') ? 'high' : 'medium',
    warnings: [],
    review_status: 'pending_ceo_review',
  };
}
