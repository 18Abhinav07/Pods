import type { RealtimeSpikeEvent } from "./realtime-spike-hub";

export type RealtimeSpikeMetrics = {
  received: number;
  duplicates: number;
  gaps: number;
  lastEventId: number;
  recent: RealtimeSpikeEvent[];
};

export function initialRealtimeSpikeMetrics(): RealtimeSpikeMetrics {
  return {
    received: 0,
    duplicates: 0,
    gaps: 0,
    lastEventId: 0,
    recent: []
  };
}

export function recordRealtimeSpikeEvent(
  metrics: RealtimeSpikeMetrics,
  event: RealtimeSpikeEvent
): RealtimeSpikeMetrics {
  if (event.id <= metrics.lastEventId) {
    return { ...metrics, duplicates: metrics.duplicates + 1 };
  }
  return {
    received: metrics.received + 1,
    duplicates: metrics.duplicates,
    gaps: metrics.gaps + Math.max(0, event.id - metrics.lastEventId - 1),
    lastEventId: event.id,
    recent: [event, ...metrics.recent].slice(0, 8)
  };
}
