export function FlowProgress({
  ariaLabel,
  labels,
  step
}: {
  ariaLabel: string;
  labels: readonly string[];
  step: number;
}) {
  return (
    <nav aria-label={ariaLabel} className="flow-progress">
      <span>
        Step {step + 1} of {labels.length}
        <strong>{labels[step]}</strong>
      </span>
      <div aria-hidden="true">
        {labels.map((label, index) => (
          <i
            className={`flow-progress-dot${index < step ? " is-complete" : ""}${index === step ? " is-current" : ""}`}
            key={label}
          />
        ))}
      </div>
    </nav>
  );
}
