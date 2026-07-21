import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSession } from "../../../lib/session";
import {
  authorizeRealtimeSpikePod,
  realtimeSpikeEnabled
} from "../../../lib/realtime-spike-server";
import { RealtimeSpikePanel } from "./realtime-spike-panel";

export const dynamic = "force-dynamic";

export default async function RealtimeValidationPage({
  searchParams
}: {
  searchParams: Promise<{ podId?: string }>;
}) {
  if (!realtimeSpikeEnabled()) notFound();
  const podId = (await searchParams).podId ?? "";
  const returnTo = `/validation/realtime?podId=${encodeURIComponent(podId)}`;
  await requireSession(returnTo);
  const authorization = await authorizeRealtimeSpikePod(podId);
  if (authorization.status !== "authorized") notFound();

  return (
    <main className="app-shell realtime-spike-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href={`/pods/${podId}/today`}>
          <span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>
          PODS
        </Link>
        <span className="phase-pill">Realtime lab</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Authenticated SSE validation</p>
        <h1>Stress the signal.</h1>
        <p className="screen-copy">
          This hidden harness validates reconnect, replay, and Pod isolation before rooms
          become a product feature. It stores no message content.
        </p>
      </section>
      <RealtimeSpikePanel podId={podId} />
    </main>
  );
}
