import type { BuildDeliverableType } from "@pods/domain";

import type { TemplateEditorProps } from "./types";

const labels: Record<BuildDeliverableType, string> = {
  pull_request: "GitHub pull request",
  commit: "GitHub commit",
  issue: "GitHub issue",
  live_artifact: "Live artifact"
};

export function deliverableLabel(value: BuildDeliverableType | null) {
  return value ? labels[value] : "Activity evidence";
}

export function BuildCommitmentEditor({
  allowedDeliverables,
  deliverableType,
  onDeliverableType,
  onTask,
  task
}: {
  allowedDeliverables: readonly BuildDeliverableType[];
  deliverableType: BuildDeliverableType;
  onDeliverableType: (value: BuildDeliverableType) => void;
  onTask: (value: string) => void;
  task: string;
}) {
  return (
    <>
      <div className="activity-card-heading">
        <span>Today&apos;s commitment</span>
        <h2>What will be finished?</h2>
        <p>Write one outcome another person can verify.</p>
      </div>
      <label htmlFor="occurrence-task">Today&apos;s task</label>
      <textarea
        id="occurrence-task"
        maxLength={240}
        minLength={12}
        onChange={(event) => onTask(event.target.value)}
        placeholder="Ship the mobile evidence capture and review states."
        required
        rows={4}
        value={task}
      />
      <fieldset className="deliverable-choice-grid">
        <legend>Visible deliverable</legend>
        {allowedDeliverables.map((value) => (
          <label className={deliverableType === value ? "is-selected" : ""} key={value}>
            <input
              checked={deliverableType === value}
              name="deliverable"
              onChange={() => onDeliverableType(value)}
              type="radio"
              value={value}
            />
            <span>{deliverableLabel(value)}</span>
            <i aria-hidden="true">
              {value === "pull_request"
                ? "PR"
                : value === "live_artifact"
                  ? "LIVE"
                  : value === "commit"
                    ? "COMMIT"
                    : "ISSUE"}
            </i>
          </label>
        ))}
      </fieldset>
    </>
  );
}

export function BuildEditor({
  evidence,
  onChange
}: TemplateEditorProps<Extract<import("@pods/domain").TemplateEvidence, { kind: "build" }>>) {
  return (
    <div className="template-editor-fields is-build">
      <label htmlFor="result-summary">Result summary</label>
      <textarea
        id="result-summary"
        maxLength={1200}
        minLength={20}
        onChange={(event) => onChange({
          ...evidence,
          resultSummary: event.target.value
        })}
        placeholder="Describe what changed and what the Pod creator can verify."
        required
        rows={5}
        value={evidence.resultSummary}
      />
      <p className="evidence-example">
        Next, attach the GitHub or deployed URL that matches the locked task.
      </p>
    </div>
  );
}
