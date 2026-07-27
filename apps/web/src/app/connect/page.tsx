import Image from "next/image";
import Link from "next/link";

import { ConnectClient } from "../../components/connect-client";
import { safeReturnTarget } from "../../lib/auth";
import { podsRepository } from "../../lib/server-db";
import { getCurrentSession } from "../../lib/session";
import { redirect } from "next/navigation";
import styles from "../../components/entry-flow.module.css";

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
    <main className={styles.entryShell}>
      <header className={styles.topbar}>
        <div>
          <Link className={styles.wordmark} href="/" aria-label="Pods home">
            <span className="pod-mark" aria-hidden="true" />
            pods
          </Link>
        </div>
        <span className={styles.routeLabel}>Wallet</span>
      </header>
      <section className={styles.connectionStage}>
        <div className={styles.walletVisual} aria-hidden="true">
          <Image alt="" height={64} priority src="/media/nimiq-signet.svg" width={64} />
        </div>
        <ConnectClient returnTo={returnTo} />
      </section>
    </main>
  );
}
