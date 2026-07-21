export const realtimeSpikeKinds = [
  "message",
  "reaction",
  "read",
  "proof_invalidation"
] as const;

export type RealtimeSpikeKind = (typeof realtimeSpikeKinds)[number];

export type RealtimeSpikeEvent = {
  id: number;
  clientEventId: string;
  kind: RealtimeSpikeKind;
  occurredAt: string;
};

type PublishInput = {
  podId: string;
  actorId: string;
  clientEventId: string;
  kind: RealtimeSpikeKind;
};

type StoredEvent = RealtimeSpikeEvent & {
  dedupeKey: string;
  podId: string;
};

type RealtimeSpikeHubOptions = {
  historyLimit: number;
  now?: () => Date;
};

export class RealtimeSpikeHub {
  readonly #historyLimit: number;
  readonly #now: () => Date;
  readonly #history: StoredEvent[] = [];
  readonly #eventsByDedupeKey = new Map<string, StoredEvent>();
  readonly #listeners = new Map<
    string,
    Set<(event: RealtimeSpikeEvent) => void>
  >();
  readonly #nextIdByPod = new Map<string, number>();

  constructor({ historyLimit, now = () => new Date() }: RealtimeSpikeHubOptions) {
    if (!Number.isSafeInteger(historyLimit) || historyLimit < 1) {
      throw new Error("Realtime history limit must be a positive integer");
    }
    this.#historyLimit = historyLimit;
    this.#now = now;
  }

  publish(input: PublishInput): RealtimeSpikeEvent {
    const dedupeKey = [input.podId, input.actorId, input.clientEventId].join(":");
    const existing = this.#eventsByDedupeKey.get(dedupeKey);
    if (existing) return this.#publicEvent(existing);

    const stored: StoredEvent = {
      id: this.#nextIdByPod.get(input.podId) ?? 1,
      podId: input.podId,
      clientEventId: input.clientEventId,
      kind: input.kind,
      occurredAt: this.#now().toISOString(),
      dedupeKey
    };
    this.#nextIdByPod.set(input.podId, stored.id + 1);
    this.#history.push(stored);
    this.#eventsByDedupeKey.set(dedupeKey, stored);
    while (this.#history.length > this.#historyLimit) {
      const removed = this.#history.shift();
      if (removed) this.#eventsByDedupeKey.delete(removed.dedupeKey);
    }

    const event = this.#publicEvent(stored);
    for (const listener of this.#listeners.get(input.podId) ?? []) {
      listener(event);
    }
    return event;
  }

  subscribe(
    podId: string,
    afterId: number,
    listener: (event: RealtimeSpikeEvent) => void
  ) {
    for (const event of this.#history) {
      if (event.podId === podId && event.id > afterId) {
        listener(this.#publicEvent(event));
      }
    }
    const listeners = this.#listeners.get(podId) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(podId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.#listeners.delete(podId);
    };
  }

  #publicEvent(event: StoredEvent): RealtimeSpikeEvent {
    return {
      id: event.id,
      clientEventId: event.clientEventId,
      kind: event.kind,
      occurredAt: event.occurredAt
    };
  }
}

const globalRealtime = globalThis as typeof globalThis & {
  podsRealtimeSpikeHub?: RealtimeSpikeHub;
};

export const realtimeSpikeHub =
  globalRealtime.podsRealtimeSpikeHub ??
  new RealtimeSpikeHub({ historyLimit: 1_000 });

globalRealtime.podsRealtimeSpikeHub = realtimeSpikeHub;
