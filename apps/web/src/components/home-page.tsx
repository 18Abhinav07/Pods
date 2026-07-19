import Link from "next/link";

import { TemplateShowcase } from "./template-showcase";

export function HomePage() {
  return (
    <main className="foundation-shell">
      <header className="topbar entrance entrance-topbar">
        <div className="wordmark" aria-label="Pods">
          <span className="pod-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          PODS
        </div>
        <span className="phase-pill">Phase 1 build</span>
      </header>

      <section className="hero entrance entrance-hero">
        <p className="eyebrow">Earned momentum</p>
        <h1>Momentum starts with a clear commitment.</h1>
        <p className="hero-copy">
          Join a focused group, put NIM behind the days you commit to showing up,
          prove the work, and finish together.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href="/connect?returnTo=%2Ftoday">
            Connect wallet
          </Link>
          <Link className="text-action" href="/pods/create/template">
            Create a Pod
          </Link>
        </div>
      </section>

      <section
        className="status-panel entrance entrance-status"
        aria-label="Foundation status"
      >
        <div className="status-head">
          <span className="status-dot" aria-hidden="true" />
          <span>Phase 1 in progress</span>
        </div>
        <p>
          Signed wallet sessions and immutable Pod creation are now active.
          Participant funding remains locked until its own approval gate.
        </p>
        <dl>
          <div>
            <dt>Network</dt>
            <dd>Nimiq Testnet</dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>NIM</dd>
          </div>
          <div>
            <dt>Review</dt>
            <dd>Pods team</dd>
          </div>
        </dl>
      </section>

      <section className="template-section entrance entrance-templates">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Five polished modes</p>
            <h2>One activity engine.</h2>
          </div>
          <span>Cycle I</span>
        </div>
        <TemplateShowcase />
      </section>
    </main>
  );
}
