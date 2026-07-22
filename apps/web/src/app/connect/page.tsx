import Link from "next/link";

import { ConnectClient } from "../../components/connect-client";
import { safeReturnTarget } from "../../lib/auth";
import { podsRepository } from "../../lib/server-db";
import { getCurrentSession } from "../../lib/session";
import { redirect } from "next/navigation";

export default async function ConnectPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTarget(params.returnTo);
  const session = await getCurrentSession();
  if (session) {
    const profile = await podsRepository.getProfileForUser(session.userId);
    redirect(
      profile
        ? returnTo
        : `/onboarding/profile?returnTo=${encodeURIComponent(returnTo)}`
    );
  }

  return (
    <main className="app-shell connection-shell">
      <header className="app-topbar connection-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/" aria-label="Pods home">
          <span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>
          PODS
        </Link>
      </header>
      <section className="connection-stage entrance entrance-hero">
        <div className="connection-art" aria-hidden="true"><i /><i /><i /></div>
        <ConnectClient returnTo={returnTo} />
      </section>
    </main>
  );
}
