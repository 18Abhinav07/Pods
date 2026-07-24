import type { TemplateEditorProps } from "./types";

function minimumLabel(configuration: Record<string, unknown>) {
  if (
    configuration.minimumKind === "minutes" &&
    typeof configuration.minimumMinutes === "number"
  ) {
    return `${configuration.minimumMinutes} focused minutes`;
  }
  if (
    configuration.minimumKind === "output" &&
    typeof configuration.minimumOutput === "string"
  ) {
    return configuration.minimumOutput;
  }
  return String(configuration.minimumExpectation ?? "Complete the frozen study session");
}

export function StudyEditor({
  configuration,
  evidence,
  onChange
}: TemplateEditorProps<Extract<import("@pods/domain").TemplateEvidence, { kind: "study" }>>) {
  return (
    <div className="template-editor-fields is-study">
      <div className="template-requirement">
        <span>Frozen focus target</span>
        <strong>{String(configuration.subject ?? "Study session")}</strong>
        <p>{minimumLabel(configuration)}</p>
      </div>
      <label htmlFor="study-topic">Study topic</label>
      <input
        id="study-topic"
        maxLength={240}
        onChange={(event) => onChange({ ...evidence, topic: event.target.value })}
        placeholder="What did you focus on?"
        required
        value={evidence.topic}
      />
      <label htmlFor="study-duration">Focus duration</label>
      <div className="quantity-with-unit">
        <input
          id="study-duration"
          inputMode="numeric"
          min={1}
          onChange={(event) => onChange({
            ...evidence,
            durationMinutes: event.target.valueAsNumber || 0
          })}
          required
          type="number"
          value={evidence.durationMinutes || ""}
        />
        <span>minutes</span>
      </div>
      <label htmlFor="study-takeaway">Takeaway</label>
      <textarea
        id="study-takeaway"
        maxLength={800}
        minLength={4}
        onChange={(event) => onChange({ ...evidence, takeaway: event.target.value })}
        placeholder="What can you explain or use now?"
        required
        rows={4}
        value={evidence.takeaway}
      />
      <p className="evidence-example">
        Add a focus timer, notes, solved set, or lesson-workspace image.
      </p>
    </div>
  );
}

