import Link from "next/link";

import { ConnectClient } from "../../components/connect-client";
import { safeReturnTarget } from "../../lib/auth";
import { getCurrentSession } from "../../lib/session";
import { redirect } from "next/navigation";

export default async function ConnectPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTarget(params.returnTo);
  if (await getCurrentSession()) redirect(returnTo);

  return (
    <main className="app-shell connection-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/" aria-label="Pods home">
          <span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>
          PODS
        </Link>
        <span className="phase-pill">Secure session</span>
      </header>
      <section className="screen-card entrance entrance-hero">
        <ConnectClient returnTo={returnTo} />
      </section>
    </main>
  );
}
