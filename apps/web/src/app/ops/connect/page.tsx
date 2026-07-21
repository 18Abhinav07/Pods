import Link from "next/link";

import { OpsConnectForm } from "../../../components/ops-connect-form";

export default async function OpsConnectPage({
  searchParams
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const requested = (await searchParams).returnTo;
  const returnTo = requested?.startsWith("/ops/") ? requested : "/ops/reviews";
  return (
    <main className="app-shell ops-shell">
      <header className="app-topbar">
        <Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link>
        <span className="phase-pill">Internal</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Pods team</p>
        <h1>Evidence review.</h1>
        <p className="screen-copy">This workspace is separate from participant and creator authority.</p>
      </section>
      <OpsConnectForm returnTo={returnTo} />
    </main>
  );
}
