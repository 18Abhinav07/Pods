import type { ProofReviewView } from "../lib/proof-review-view";
import styles from "./activity-ritual/activity-ritual.module.css";

const versionLabels = {
  initial: "Original proof",
  clarification: "Clarification evidence",
  appeal: "Appeal evidence"
} as const;

export function ProofVersionHistory({
  endpoint,
  versions
}: {
  endpoint: string;
  versions: ProofReviewView["versions"];
}) {
  if (versions.length === 0) return null;
  return (
    <details className={styles.proofVersions} open={versions.length > 1}>
      <summary>
        <span>Immutable evidence history</span>
        <strong>{versions.length} {versions.length === 1 ? "version" : "versions"}</strong>
      </summary>
      <div>
        {versions.map((version) => (
          <article key={version.ordinal}>
            <header>
              <strong>{versionLabels[version.kind]}</strong>
              <span>Version {version.ordinal}</span>
            </header>
            <p>{version.resultSummary}</p>
            <nav aria-label={`${versionLabels[version.kind]} evidence`}>
              {version.artifactUrl ? (
                <a href={version.artifactUrl} rel="noreferrer" target="_blank">
                  Open artifact
                </a>
              ) : null}
              {version.hasEvidenceImage ? (
                <a
                  href={`${endpoint}/versions/${version.ordinal}/evidence`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open private image
                </a>
              ) : null}
            </nav>
          </article>
        ))}
      </div>
    </details>
  );
}
