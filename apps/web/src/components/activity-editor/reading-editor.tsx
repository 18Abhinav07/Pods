import type { TemplateEditorProps } from "./types";

export function ReadingEditor({
  configuration,
  evidence,
  onChange
}: TemplateEditorProps<Extract<import("@pods/domain").TemplateEvidence, { kind: "reading" }>>) {
  const unit = configuration.targetType === "minutes" ? "minutes" : "pages";
  return (
    <div className="template-editor-fields is-reading">
      <div className="template-requirement">
        <span>Frozen reading target</span>
        <strong>{String(configuration.bookOrTheme ?? "Reading session")}</strong>
        <p>{String(configuration.targetAmount ?? "")} {unit} per occurrence</p>
      </div>
      <label htmlFor="reading-title">Reading title</label>
      <input
        id="reading-title"
        maxLength={240}
        onChange={(event) => onChange({ ...evidence, title: event.target.value })}
        placeholder="Book, essay, or chapter title"
        required
        value={evidence.title}
      />
      <label htmlFor="reading-amount">Amount completed</label>
      <div className="quantity-with-unit">
        <input
          id="reading-amount"
          inputMode="numeric"
          min={1}
          onChange={(event) => onChange({
            ...evidence,
            amountCompleted: event.target.valueAsNumber || 0,
            unit
          })}
          required
          type="number"
          value={evidence.amountCompleted || ""}
        />
        <span>{unit}</span>
      </div>
      <label htmlFor="reading-note">Reading note <span>Optional</span></label>
      <textarea
        id="reading-note"
        maxLength={500}
        onChange={(event) => onChange({ ...evidence, note: event.target.value })}
        placeholder="What stood out?"
        rows={3}
        value={evidence.note}
      />
      <p className="evidence-example">
        Add a book page, e-reader progress, library session, or reading-notes image.
      </p>
    </div>
  );
}

