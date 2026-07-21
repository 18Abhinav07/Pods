import { describe, expect, it, vi } from "vitest";

import { RealtimeSpikeHub } from "../src/lib/realtime-spike-hub";

describe("realtime validation hub", () => {
  it("delivers only events from the subscribed Pod", () => {
    const hub = new RealtimeSpikeHub({ historyLimit: 100 });
    const received = vi.fn();
    hub.subscribe("pod-a", 0, received);

    hub.publish({
      podId: "pod-a",
      actorId: "user-a",
      clientEventId: "event-1",
      kind: "message"
    });
    hub.publish({
      podId: "pod-b",
      actorId: "user-b",
      clientEventId: "event-2",
      kind: "reaction"
    });

    expect(received).toHaveBeenCalledTimes(1);
    expect(received.mock.calls[0]?.[0]).toMatchObject({
      id: 1,
      clientEventId: "event-1",
      kind: "message"
    });
  });

  it("replays missed events after the supplied cursor", () => {
    const hub = new RealtimeSpikeHub({ historyLimit: 100 });
    hub.publish({
      podId: "pod-a",
      actorId: "user-a",
      clientEventId: "event-1",
      kind: "message"
    });
    hub.publish({
      podId: "pod-a",
      actorId: "user-a",
      clientEventId: "event-2",
      kind: "read"
    });
    const received = vi.fn();

    hub.subscribe("pod-a", 1, received);

    expect(received).toHaveBeenCalledOnce();
    expect(received.mock.calls[0]?.[0]).toMatchObject({
      id: 2,
      clientEventId: "event-2"
    });
  });

  it("makes mobile send retries idempotent per actor and client event ID", () => {
    const hub = new RealtimeSpikeHub({ historyLimit: 100 });
    const received = vi.fn();
    hub.subscribe("pod-a", 0, received);
    const input = {
      podId: "pod-a",
      actorId: "user-a",
      clientEventId: "retry-safe-id",
      kind: "proof_invalidation" as const
    };

    const first = hub.publish(input);
    const retried = hub.publish(input);

    expect(retried).toEqual(first);
    expect(received).toHaveBeenCalledOnce();
  });

  it("keeps a bounded replay history", () => {
    const hub = new RealtimeSpikeHub({ historyLimit: 2 });
    for (let index = 1; index <= 3; index += 1) {
      hub.publish({
        podId: "pod-a",
        actorId: "user-a",
        clientEventId: `event-${index}`,
        kind: "message"
      });
    }
    const received = vi.fn();

    hub.subscribe("pod-a", 0, received);

    expect(received.mock.calls.map(([event]) => event.id)).toEqual([2, 3]);
  });
});
