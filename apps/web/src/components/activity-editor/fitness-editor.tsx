import type { TemplateEditorProps } from "./types";

export function FitnessEditor({
  configuration,
  evidence,
  onChange
}: TemplateEditorProps<Extract<import("@pods/domain").TemplateEvidence, { kind: "fitness" }>>) {
  return (
    <div className="template-editor-fields is-fitness">
      <div className="template-requirement">
        <span>Today&apos;s movement</span>
        <strong>{String(configuration.activityType ?? evidence.activityType)}</strong>
        <p>{String(configuration.measurableMinimum ?? "")}</p>
      </div>
      <label htmlFor="fitness-completion-note">Completion note</label>
      <textarea
        id="fitness-completion-note"
        maxLength={500}
        minLength={4}
        onChange={(event) => onChange({
          ...evidence,
          completionNote: event.target.value
        })}
        placeholder="What did you complete in this session?"
        required
        rows={4}
        value={evidence.completionNote}
      />
      <p className="evidence-example">
        Add a photo from the gym floor, run finish, class, or completed movement session.
      </p>
    </div>
  );
}

