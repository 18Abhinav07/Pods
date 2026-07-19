import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { requireSession } from "../../lib/session";

export default async function TodayPage() {
  const session = await requireSession("/today");
  const shortWallet = `${session.walletAddress.slice(0, 9)}...${session.walletAddress.slice(-5)}`;

  return (
    <main className="app-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today" aria-label="Pods Today">
          <span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>
          PODS
        </Link>
        <span className="wallet-chip">{shortWallet}</span>
      </header>
      <section className="today-hero entrance entrance-hero">
        <p className="eyebrow">Today</p>
        <h1>Your first commitment starts here.</h1>
        <p className="screen-copy">
          No active Pods yet. Create a focused activity contract or browse the
          public communities arriving in Phase 2.
        </p>
      </section>
      <section className="empty-state entrance entrance-status">
        <span className="empty-index">01</span>
        <h2>Create the activity.</h2>
        <p>Choose a polished template, set the cadence, and publish frozen rules.</p>
        <Link className="primary-action full-action" href="/pods/create/template">
          Create a Pod
        </Link>
      </section>
      <PrimaryNav active="today" />
    </main>
  );
}
