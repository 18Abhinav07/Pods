import Link from "next/link";

import { OpsConnectForm } from "../../../components/ops-connect-form";
import styles from "../../../components/ops-flow.module.css";
import { safeOpsReturnTarget } from "../../../lib/ops-return-target";

export default async function OpsConnectPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const requested = (await searchParams).returnTo;
  const returnTo = safeOpsReturnTarget(requested);
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <Link className={`wordmark ${styles.wordmark}`} href="/today">
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <span className={styles.contextPill}>Internal</span>
      </header>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Pods operations</p>
        <h1>Internal controls.</h1>
        <p className={styles.heroCopy}>
          Review public safety reports and recover Testnet payouts without
          changing frozen Pod outcomes.
        </p>
      </section>
      <section className={styles.connectLayout}>
        <aside className={styles.boundaryCard}>
          <strong>Authority stays narrow</strong>
          <p>
            Operations can change public visibility or recover a transfer.
            They cannot rewrite membership, evidence decisions, or financial
            entitlements.
          </p>
        </aside>
        <OpsConnectForm returnTo={returnTo} />
      </section>
    </main>
  );
}
