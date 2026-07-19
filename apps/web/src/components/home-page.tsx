const templates = [
  { name: "Move", detail: "Fitness and movement" },
  { name: "Read", detail: "Reading progress" },
  { name: "Focus", detail: "Study and deep work" },
  { name: "Build", detail: "Ship visible work" },
  { name: "Create", detail: "Practice and create" }
] as const;

export function HomePage() {
  return (
    <main className="foundation-shell">
      <header className="topbar">
        <div className="wordmark" aria-label="Pods">
          <span className="pod-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          PODS
        </div>
        <span className="phase-pill">Phase 0 foundation</span>
      </header>

      <section className="hero">
        <p className="eyebrow">Earned momentum</p>
        <h1>Momentum starts with a clear commitment.</h1>
        <p className="hero-copy">
          Join a focused group, put NIM behind the days you commit to showing up,
          prove the work, and finish together.
        </p>
      </section>

      <section className="status-panel" aria-label="Foundation status">
        <div className="status-head">
          <span className="status-dot" aria-hidden="true" />
          <span>Foundation in progress</span>
        </div>
        <p>
          This build contains the locked visual system and runtime foundation only.
          Wallet and Pod actions arrive after the Phase 0 approval gate.
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

      <section className="template-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Five polished modes</p>
            <h2>One activity engine.</h2>
          </div>
          <span>Cycle I</span>
        </div>
        <div className="template-list">
          {templates.map((template, index) => (
            <article className="template-row" key={template.name}>
              <span className={`template-icon template-${index + 1}`} aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3>{template.name}</h3>
                <p>{template.detail}</p>
              </div>
              <span className="template-state">Specified</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
