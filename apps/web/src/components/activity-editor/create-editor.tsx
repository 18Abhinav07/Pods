import type { TemplateEditorProps } from "./types";

export function CreateCommitmentEditor({
  goal,
  onGoal
}: {
  goal: string;
  onGoal: (value: string) => void;
}) {
  return (
    <>
      <div className="activity-card-heading">
        <span>Today&apos;s practice</span>
        <h2>What will you make?</h2>
        <p>Lock one concrete output before the practice window continues.</p>
      </div>
      <label htmlFor="create-goal">Output goal</label>
      <textarea
        id="create-goal"
        maxLength={240}
        minLength={12}
        onChange={(event) => onGoal(event.target.value)}
        placeholder="Complete one finished character color study."
        required
        rows={4}
        value={goal}
      />
    </>
  );
}

export function CreateEditor({
  configuration,
  evidence,
  onChange
}: TemplateEditorProps<Extract<import("@pods/domain").TemplateEvidence, { kind: "create" }>>) {
  return (
    <div className="template-editor-fields is-create">
      <div className="template-requirement">
        <span>{String(configuration.discipline ?? "Practice")}</span>
        <strong>{String(configuration.minimumExpectation ?? "Complete the locked goal")}</strong>
      </div>
      <label htmlFor="create-reflection">Reflection</label>
      <textarea
        id="create-reflection"
        maxLength={1200}
        minLength={12}
        onChange={(event) => onChange({
          ...evidence,
          reflection: event.target.value
        })}
        placeholder="What did you practice, change, or learn?"
        required
        rows={5}
        value={evidence.reflection}
      />
      <label htmlFor="create-artifact-url">
        Published artifact link <span>Optional with an image</span>
      </label>
      <input
        id="create-artifact-url"
        onChange={(event) => onChange({
          ...evidence,
          artifactUrl: event.target.value || null
        })}
        placeholder="https://example.com/my-artifact"
        type="url"
        value={evidence.artifactUrl ?? ""}
      />
      <p className="evidence-example">
        Add an artifact image or a safe published link that demonstrates the locked goal.
      </p>
    </div>
  );
}

