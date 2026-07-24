import Link from "next/link";

import { OpsConnectForm } from "../../../components/ops-connect-form";
import { safeOpsReturnTarget } from "../../../lib/ops-return-target";

export default async function OpsConnectPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const requested = (await searchParams).returnTo;
  const returnTo = safeOpsReturnTarget(requested);
  return (
    <main className="app-shell ops-shell">
      <header className="app-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true" />pods</Link>
        <span className="phase-pill">Internal</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Pods operations</p>
        <h1>Internal controls.</h1>
        <p className="screen-copy">Review public safety reports and recover Testnet payouts without changing frozen Pod outcomes.</p>
      </section>
      <OpsConnectForm returnTo={returnTo} />
    </main>
  );
}
