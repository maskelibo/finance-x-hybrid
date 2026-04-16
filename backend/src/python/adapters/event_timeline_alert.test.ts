import { describe, expect, it } from 'vitest';

import {
  adaptLegacyImpactsForPython,
  adaptPythonTimelineForLegacy,
  type PythonTimelineOutput,
} from './event_timeline_alert.js';


describe('adaptLegacyImpactsForPython', () => {
  it('parses timing string into days', () => {
    const events = adaptLegacyImpactsForPython({
      event_impacts: [
        { event_id: 'A', title: 'x', timing: 'immediate' },
        { event_id: 'B', title: 'y', timing: 'near' },
        { event_id: 'C', title: 'z', timing: 'medium' },
        { event_id: 'D', title: 'w', timing: 'long' },
      ],
    });
    expect(events[0].timing_days).toBeLessThan(30);
    expect(events[1].timing_days).toBeGreaterThanOrEqual(30);
    expect(events[2].timing_days).toBeGreaterThanOrEqual(90);
    expect(events[3].timing_days).toBeGreaterThanOrEqual(180);
  });

  it('accepts JSON string or parsed object', () => {
    const as_string = JSON.stringify({ event_impacts: [{ event_id: 'A', timing: 'immediate' }] });
    const fromString = adaptLegacyImpactsForPython(as_string);
    const fromObject = adaptLegacyImpactsForPython({ event_impacts: [{ event_id: 'A', timing: 'immediate' }] });
    expect(fromString).toEqual(fromObject);
  });

  it('returns empty array on garbage input', () => {
    expect(adaptLegacyImpactsForPython('not json')).toEqual([]);
    expect(adaptLegacyImpactsForPython(null)).toEqual([]);
    expect(adaptLegacyImpactsForPython({ unrelated: 'field' })).toEqual([]);
  });

  it('accepts either event_impacts or events field name', () => {
    const a = adaptLegacyImpactsForPython({ event_impacts: [{ event_id: 'A' }] });
    const b = adaptLegacyImpactsForPython({ events: [{ event_id: 'A' }] });
    expect(a.length).toBe(1);
    expect(b.length).toBe(1);
  });

  it('fills default timing when none supplied', () => {
    const events = adaptLegacyImpactsForPython({ event_impacts: [{ event_id: 'A' }] });
    expect(events[0].timing_days).toBeGreaterThan(0);
  });
});

describe('adaptPythonTimelineForLegacy', () => {
  const sample: PythonTimelineOutput = {
    reference_date: '2026-04-16',
    buckets: [
      {
        phase: 'immediate',
        day_range: [0, 30],
        events: [{ event_id: 'E1', title: 'Evt 1', timing_days: 5, confidence: 'high' }],
      },
      {
        phase: 'near_term',
        day_range: [30, 90],
        events: [{ event_id: 'E2', title: 'Evt 2', timing_days: 45, confidence: 'medium' }],
      },
    ],
    priority_alerts: [
      { event_id: 'E1', title: 'Evt 1', phase: 'immediate', urgency: 'high', reason: 'immediate + material' },
    ],
  };

  it('collapses bucket events into a single impact_timeline list', () => {
    const legacy = adaptPythonTimelineForLegacy(sample, 'eta-test');
    expect(legacy.impact_timeline.length).toBe(2);
    expect(legacy.impact_timeline.map(e => e.event_id)).toEqual(['E1', 'E2']);
  });

  it('marks alerted events as high urgency', () => {
    const legacy = adaptPythonTimelineForLegacy(sample, 'eta-test');
    const e1 = legacy.impact_timeline.find(e => e.event_id === 'E1')!;
    const e2 = legacy.impact_timeline.find(e => e.event_id === 'E2')!;
    expect(e1.urgency_level).toBe('high');
    expect(e2.urgency_level).toBe('low');
  });

  it('emits alerts in priority_alerts with original reason text', () => {
    const legacy = adaptPythonTimelineForLegacy(sample, 'eta-test');
    expect(legacy.priority_alerts.length).toBe(1);
    expect(legacy.priority_alerts[0].alert_text).toContain('material');
  });

  it('elevates confidence_overall to high when any alert is high', () => {
    const legacy = adaptPythonTimelineForLegacy(sample, 'eta-test');
    expect(legacy.confidence_overall).toBe('high');
  });

  it('carries the canonical agent_id and pending review status', () => {
    const legacy = adaptPythonTimelineForLegacy(sample, 'eta-test');
    expect(legacy.agent_id).toBe('event_timeline_alert');
    expect(legacy.output_id).toBe('eta-test');
    expect(legacy.review_status).toBe('pending_ceo_review');
  });

  it('handles empty python output without throwing', () => {
    const legacy = adaptPythonTimelineForLegacy({}, 'eta-empty');
    expect(legacy.impact_timeline).toEqual([]);
    expect(legacy.priority_alerts).toEqual([]);
    expect(legacy.confidence_overall).toBe('medium');
  });
});
