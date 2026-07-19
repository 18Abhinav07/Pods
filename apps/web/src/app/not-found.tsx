import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="app-shell not-found-shell">
      <header className="app-topbar"><Link className="wordmark" href="/"><span className="pod-mark" aria-hidden="true"><i /><i /><i /></span>PODS</Link><span className="phase-pill">Unavailable</span></header>
      <section className="empty-state"><span className="empty-index">404</span><h1>This path is unavailable.</h1><p>The Pod or invitation may be private, expired, used, revoked, or unknown.</p><Link className="primary-action full-action" href="/discover">Browse public Pods</Link></section>
    </main>
  );
}
