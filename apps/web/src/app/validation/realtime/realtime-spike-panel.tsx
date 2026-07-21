"use client";

import { useEffect, useRef, useState } from "react";

import type {
  RealtimeSpikeEvent,
  RealtimeSpikeKind
} from "../../../lib/realtime-spike-hub";
import {
  initialRealtimeSpikeMetrics,
  recordRealtimeSpikeEvent
} from "../../../lib/realtime-spike-metrics";

const kinds: RealtimeSpikeKind[] = [
  "message",
  "reaction",
  "read",
  "proof_invalidation"
];

export function RealtimeSpikePanel({ podId }: { podId: string }) {
  const [connection, setConnection] = useState("Connecting");
  const [metrics, setMetrics] = useState(initialRealtimeSpikeMetrics);
  const [reconnects, setReconnects] = useState(0);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const opened = useRef(false);

  useEffect(() => {
    const source = new EventSource(
      `/api/validation/realtime/stream?podId=${encodeURIComponent(podId)}`
    );
    source.onopen = () => {
      if (opened.current) setReconnects((value) => value + 1);
      opened.current = true;
      setConnection("Live");
    };
    source.onerror = () => setConnection("Reconnecting");
    source.addEventListener("validation", (message) => {
      const event = JSON.parse((message as MessageEvent<string>).data) as RealtimeSpikeEvent;
      setMetrics((current) => recordRealtimeSpikeEvent(current, event));
    });
    return () => source.close();
  }, [podId]);

  async function emitSequence() {
    setSending(true);
    setSendError("");
    const runId = crypto.randomUUID();
    try {
      for (let offset = 0; offset < 100; offset += 10) {
        const batch = Array.from({ length: 10 }, (_, localIndex) => {
          const index = offset + localIndex;
          return fetch("/api/validation/realtime/emit", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              podId,
              clientEventId: `${runId}-${index}`,
              kind: kinds[index % kinds.length]
            })
          }).then((response) => {
            if (!response.ok) throw new Error("The event sequence was interrupted");
          });
        });
        await Promise.all(batch);
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "The event sequence failed");
    } finally {
      setSending(false);
    }
  }

  const clean = metrics.gaps === 0 && metrics.duplicates === 0;

  return (
    <>
      <section className="realtime-spike-status entrance entrance-status" aria-live="polite">
        <div>
          <span className={`realtime-signal ${connection === "Live" ? "is-live" : ""}`} />
          <small>Transport</small>
          <strong>{connection}</strong>
        </div>
        <div><small>Received</small><strong>{metrics.received}</strong></div>
        <div><small>Gaps</small><strong>{metrics.gaps}</strong></div>
        <div><small>Duplicates</small><strong>{metrics.duplicates}</strong></div>
      </section>

      <section className="realtime-spike-control entrance entrance-templates">
        <div>
          <p className="eyebrow">Railway transport gate</p>
          <h2>{clean ? "Signal is clean." : "Transport needs investigation."}</h2>
          <p>
            Emit 100 sequenced validation events. Keep this screen open on both wallets,
            background one WebView for 90 seconds, interrupt its network, then return.
          </p>
        </div>
        <button className="primary-action" disabled={sending} onClick={emitSequence} type="button">
          {sending ? "Sending sequence" : "Emit 100 events"}
        </button>
        {sendError ? <p className="field-error" role="alert">{sendError}</p> : null}
        <dl className="realtime-spike-facts">
          <div><dt>Reconnects</dt><dd>{reconnects}</dd></div>
          <div><dt>Last event</dt><dd>{metrics.lastEventId || "None"}</dd></div>
          <div><dt>Pod channel</dt><dd>{podId.slice(0, 8)}</dd></div>
        </dl>
      </section>

      <section className="realtime-spike-log" aria-label="Recent validation events">
        <div className="section-heading"><span>Recent signal</span><small>Newest first</small></div>
        {metrics.recent.length > 0 ? metrics.recent.map((event) => (
          <div className="realtime-spike-event" key={`${event.id}-${event.clientEventId}`}>
            <span>{String(event.id).padStart(3, "0")}</span>
            <strong>{event.kind.replaceAll("_", " ")}</strong>
            <time>{new Date(event.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
          </div>
        )) : <div className="realtime-spike-idle">Waiting for the first authenticated event.</div>}
      </section>
    </>
  );
}
