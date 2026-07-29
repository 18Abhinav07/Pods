import { ArtifactLinkCard } from "./artifact-link-card";
import styles from "./activity-ritual/activity-ritual.module.css";

export function ProofRecordSection({
  artifact,
  evidenceImageEndpoint,
  evidenceRows,
  frozenCriterion,
  headingId,
  templateName
}: {
  artifact: { label: string; href: string } | null;
  evidenceImageEndpoint: string | null;
  evidenceRows: Array<{ label: string; value: string }>;
  frozenCriterion: Array<{ label: string; value: string }>;
  headingId?: string;
  templateName: string;
}) {
  return (
    <>
      <header className={styles.proofRecordHeader}>
        <span>{templateName}</span>
        <h2 id={headingId}>Proof record</h2>
      </header>
      <section className={styles.recordGroup}>
        <header>
          <span>Locked commitment</span>
          <strong>What you promised</strong>
        </header>
        {frozenCriterion.map((row) => (
          <div key={`criterion-${row.label}`}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </section>
      <section className={styles.recordGroup}>
        <header>
          <span>Completed work</span>
          <strong>What you submitted</strong>
        </header>
        {evidenceRows.map((row) => (
          <div key={`evidence-${row.label}`}>
            <span>{row.label}</span>
            <p>{row.value}</p>
          </div>
        ))}
      </section>
      {artifact ? (
        <ArtifactLinkCard
          artifactAction
          context="Public artifact"
          href={artifact.href}
          label={artifact.label}
        />
      ) : null}
      {evidenceImageEndpoint ? (
        <figure className={styles.evidenceFigure}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Your optional evidence" src={evidenceImageEndpoint} />
          <figcaption>Evidence shared with your reviewer</figcaption>
        </figure>
      ) : null}
    </>
  );
}
