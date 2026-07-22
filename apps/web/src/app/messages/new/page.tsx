import Link from "next/link";
import { notFound } from "next/navigation";

import { DirectStartForm } from "../../../components/direct-start-form";
import { podsRepository } from "../../../lib/server-db";
import { requireSession } from "../../../lib/session";

export default async function NewDirectMessagePage({ searchParams }: { searchParams: Promise<{ handle?: string }> }) {
  const { handle } = await searchParams;
  if (!handle) notFound();
  const session = await requireSession(`/messages/new?handle=${encodeURIComponent(handle)}`);
  const presence = await podsRepository.getSocialProfilePresence({ viewerUserId: session.userId, handle });
  if (presence.kind !== "public" || presence.relationship.self) notFound();
  return <main className="app-shell direct-start-shell"><header className="app-topbar"><Link className="wordmark" href={`/u/${handle}`}><span className="pod-mark" aria-hidden="true" />pods</Link><span className="phase-pill">Private message</span></header><DirectStartForm friend={presence.relationship.friend} handle={presence.profile.handle} /></main>;
}
