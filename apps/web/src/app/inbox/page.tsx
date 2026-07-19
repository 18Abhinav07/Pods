import Link from "next/link";

import { PrimaryNav } from "../../components/primary-nav";
import { requireSession } from "../../lib/session";

export default async function InboxPage() {
  await requireSession("/inbox");
  return <main className="app-shell"><header className="app-topbar"><Link className="wordmark" href="/today"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span className="phase-pill">History</span></header><section className="today-hero"><p className="eyebrow">Inbox</p><h1>Nothing needs attention.</h1><p className="screen-copy">Application, funding, review, and settlement events will appear here as Phase 2 onward activates them.</p></section><section className="neutral-empty"><span>All clear</span><p>Today remains the single place for your highest-priority action.</p></section><PrimaryNav active="inbox" /></main>;
}
