import { describe, expect, it } from "vitest";

import {
  initialRealtimeSpikeMetrics,
  recordRealtimeSpikeEvent
} from "../src/lib/realtime-spike-metrics";

describe("realtime spike metrics", () => {
  it("counts ordered events without gaps or duplicates", () => {
    const first = recordRealtimeSpikeEvent(initialRealtimeSpikeMetrics(), {
      id: 1,
      clientEventId: "one",
      kind: "message",
      occurredAt: "2026-07-21T12:00:00.000Z"
    });
    const second = recordRealtimeSpikeEvent(first, {
      id: 2,
      clientEventId: "two",
      kind: "reaction",
      occurredAt: "2026-07-21T12:00:01.000Z"
    });

    expect(second).toMatchObject({ received: 2, duplicates: 0, gaps: 0, lastEventId: 2 });
  });

  it("records duplicate and missing sequence evidence", () => {
    const afterFirst = recordRealtimeSpikeEvent(initialRealtimeSpikeMetrics(), {
      id: 1,
      clientEventId: "one",
      kind: "message",
      occurredAt: "2026-07-21T12:00:00.000Z"
    });
    const afterGap = recordRealtimeSpikeEvent(afterFirst, {
      id: 3,
      clientEventId: "three",
      kind: "read",
      occurredAt: "2026-07-21T12:00:02.000Z"
    });
    const afterDuplicate = recordRealtimeSpikeEvent(afterGap, {
      id: 3,
      clientEventId: "three",
      kind: "read",
      occurredAt: "2026-07-21T12:00:02.000Z"
    });

    expect(afterDuplicate).toMatchObject({
      received: 2,
      duplicates: 1,
      gaps: 1,
      lastEventId: 3
    });
  });
});
