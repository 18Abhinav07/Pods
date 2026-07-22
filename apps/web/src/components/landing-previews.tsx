const loopStages = [
  [
    "01",
    "Define the activity",
    "Choose the ritual, cadence, evidence, and community shape."
  ],
  [
    "02",
    "Commit NIM",
    "Fund once so the full activity has a visible commitment."
  ],
  [
    "03",
    "Submit proof",
    "Share the result and choose who can see the supporting image."
  ],
  [
    "04",
    "Build momentum",
    "Keep the occurrence trail, room, and streak moving together."
  ]
] as const;

export function AccountabilityLoop() {
  return (
    <ol className="accountability-list">
      {loopStages.map(([index, title, copy]) => (
        <li key={index}>
          <span>{index}</span>
          <div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PodRoomPreview() {
  return (
    <div className="room-preview">
      <header>
        <span>Build Lab</span>
        <small>12 members · proof window open</small>
      </header>
      <div className="room-preview-thread">
        <article className="room-preview-announcement">
          <small>Creator announcement</small>
          <p>Keep today&apos;s proof focused on what someone can open and verify.</p>
        </article>
        <article className="room-preview-message">
          <strong>Arin</strong>
          <p>Checkout flow is now stable on mobile.</p>
        </article>
        <article className="room-preview-proof">
          <small>Occurrence 04 · submitted</small>
          <h3>Ship wallet-safe evidence capture</h3>
          <p>Added the final mobile states and linked the pull request.</p>
          <div>
            <span>Pod-shared image</span>
            <span>Support 6</span>
            <span>2 replies</span>
          </div>
        </article>
        <article className="room-preview-reply">
          <small>Replying to Arin</small>
          <p>The loading state feels much clearer now.</p>
        </article>
      </div>
      <footer>
        <span>Pods reviewer only</span>
        <span>Share with Pod</span>
      </footer>
    </div>
  );
}

const fundingStates = [
  "Wallet confirmation",
  "Transaction submitted",
  "Chain finalized",
  "Ledger credited",
  "Place secured"
] as const;

export function FundingRailPreview() {
  return (
    <ol className="funding-preview">
      {fundingStates.map((state, index) => (
        <li className={index < 4 ? "is-complete" : "is-current"} key={state}>
          <i aria-hidden="true" />
          <span>{state}</span>
          <small>{index < 4 ? "Confirmed" : "Roster lock"}</small>
        </li>
      ))}
    </ol>
  );
}
