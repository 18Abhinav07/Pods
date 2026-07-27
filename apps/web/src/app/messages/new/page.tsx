import Link from "next/link";
import { notFound } from "next/navigation";

import { DirectStartForm } from "../../../components/direct-start-form";
import styles from "../../../components/social-flow.module.css";
import { podsRepository } from "../../../lib/server-db";
import { requireSession } from "../../../lib/session";

export default async function NewDirectMessagePage({
  searchParams
}: {
  searchParams: Promise<{ handle?: string }>;
}) {
  const { handle } = await searchParams;
  if (!handle) notFound();
  const session = await requireSession(
    `/messages/new?handle=${encodeURIComponent(handle)}`
  );
  const presence = await podsRepository.getSocialProfilePresence({
    viewerUserId: session.userId,
    handle
  });
  if (presence.kind !== "public" || presence.relationship.self) notFound();

  return (
    <main className={styles.directPage}>
      <header className={styles.directHeader}>
        <Link href={`/u/${handle}`}>pods</Link>
        <span>Private message</span>
      </header>
      <DirectStartForm
        friend={presence.relationship.friend}
        handle={presence.profile.handle}
      />
    </main>
  );
}
