import styles from "../activity-ritual/activity-ritual.module.css";

export function FlowProgress({
  ariaLabel,
  labels,
  step
}: {
  ariaLabel: string;
  labels: readonly string[];
  step: number;
}) {
  const current = String(step + 1).padStart(2, "0");
  const total = String(labels.length).padStart(2, "0");

  return (
    <nav aria-label={ariaLabel} className={styles.flowProgress}>
      <span className={styles.visuallyHidden}>
        Step {step + 1} of {labels.length}, {labels[step]}
      </span>
      <div className={styles.progressMeta}>
        <span
          aria-hidden="true"
          className={styles.progressCount}
        >
          {current} / {total}
        </span>
        <strong aria-hidden="true" className={styles.progressLabel}>
          {labels[step]}
        </strong>
      </div>
      <div aria-hidden="true" className={styles.progressRail}>
        {labels.map((label, index) => (
          <span
            className={styles.progressSegment}
            data-progress-segment
            data-state={index < step ? "complete" : index === step ? "current" : "upcoming"}
            key={`${index}-${label}`}
          />
        ))}
      </div>
    </nav>
  );
}
