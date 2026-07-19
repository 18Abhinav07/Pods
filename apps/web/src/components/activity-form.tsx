"use client";

import type { ActivityStepInput, TemplateId } from "@pods/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buildActivityPayload } from "../lib/wizard-payloads";
import { savePodDraftStep } from "../lib/wizard-client";

const weekdayOptions = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"],
  [5, "Fri"], [6, "Sat"], [7, "Sun"]
] as const;

function TemplateFields({
  templateId,
  config
}: {
  templateId: TemplateId;
  config: Record<string, unknown>;
}) {
  if (templateId === "fitness") return <>
    <label className="field-block"><span>Activity type</span><input name="activityType" defaultValue={String(config.activityType ?? "")} placeholder="Strength training" required /></label>
    <label className="field-block"><span>Measurable minimum</span><input name="measurableMinimum" defaultValue={String(config.measurableMinimum ?? "")} placeholder="Complete 35 focused minutes" required /></label>
  </>;
  if (templateId === "reading") return <>
    <label className="field-block"><span>Book or theme</span><input name="bookOrTheme" defaultValue={String(config.bookOrTheme ?? "")} placeholder="Product design and behavioral science" required /></label>
    <div className="field-grid"><label className="field-block"><span>Measure</span><select name="targetType" defaultValue={String(config.targetType ?? "pages")}><option value="pages">Pages</option><option value="minutes">Minutes</option></select></label><label className="field-block"><span>Per occurrence</span><input name="targetAmount" type="number" min="1" defaultValue={String(config.targetAmount ?? "20")} required /></label></div>
  </>;
  if (templateId === "study") return <>
    <label className="field-block"><span>Subject</span><input name="subject" defaultValue={String(config.subject ?? "")} placeholder="Distributed systems" required /></label>
    <label className="field-block"><span>Focused-session minimum</span><input name="minimumExpectation" defaultValue={String(config.minimumExpectation ?? "")} placeholder="45 minutes and one written takeaway" required /></label>
  </>;
  if (templateId === "build") {
    const allowed = Array.isArray(config.allowedDeliverables) ? config.allowedDeliverables : [];
    return <>
      <label className="field-block"><span>Project theme</span><input name="projectTheme" defaultValue={String(config.projectTheme ?? "")} placeholder="Pods Cycle I" required /></label>
      <fieldset className="field-block"><legend>Allowed deliverables</legend><div className="choice-grid">
        {[ ["pull_request", "Pull request"], ["commit", "Commit"], ["issue", "Issue"], ["live_artifact", "Live artifact"] ].map(([value, label]) => <label className="check-choice" key={value}><input type="checkbox" name="allowedDeliverables" value={value} defaultChecked={allowed.includes(value)} /><span>{label}</span></label>)}
      </div></fieldset>
      <label className="field-block"><span>Daily commitment cutoff</span><input name="commitmentCutoff" type="time" defaultValue={String(config.commitmentCutoff ?? "09:00")} required /><small>Builders lock the exact task before this local time.</small></label>
    </>;
  }
  return <>
    <label className="field-block"><span>Discipline</span><input name="discipline" defaultValue={String(config.discipline ?? "")} placeholder="Illustration, piano, writing" required /></label>
    <label className="field-block"><span>Practice or output minimum</span><input name="minimumExpectation" defaultValue={String(config.minimumExpectation ?? "")} placeholder="One finished study and a short reflection" required /></label>
    <label className="field-block"><span>Daily commitment cutoff</span><input name="commitmentCutoff" type="time" defaultValue={String(config.commitmentCutoff ?? "09:00")} required /></label>
  </>;
}

export function ActivityForm({ podId, templateId, initial }: { podId: string; templateId: TemplateId; initial: ActivityStepInput }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = buildActivityPayload(templateId, new FormData(event.currentTarget));
      await savePodDraftStep(podId, "activity", payload);
      router.push(`/pods/create/community?draft=${encodeURIComponent(podId)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Activity contract could not be saved");
      setSaving(false);
    }
  }

  return <form className="wizard-form" onSubmit={submit}>
    <label className="field-block"><span>Pod name</span><input name="name" defaultValue={initial.name} placeholder="Build Pods in Public" required /></label>
    <label className="field-block"><span>Purpose</span><textarea name="purpose" defaultValue={initial.purpose} placeholder="What this group will accomplish together" rows={3} required /></label>
    <TemplateFields templateId={templateId} config={initial.config} />
    <div className="field-grid"><label className="field-block"><span>Start date</span><input name="startDate" type="date" defaultValue={initial.startDate} required /></label><label className="field-block"><span>End date</span><input name="endDate" type="date" defaultValue={initial.endDate} required /></label></div>
    <label className="field-block"><span>Pod timezone</span><input name="timeZone" defaultValue={initial.timeZone} required /><small>Published UTC occurrence windows never move later.</small></label>
    <fieldset className="field-block"><legend>Scheduled weekdays</legend><div className="weekday-grid">{weekdayOptions.map(([value, label]) => <label key={value}><input type="checkbox" name="weekdays" value={value} defaultChecked={initial.weekdays.includes(value)} /><span>{label}</span></label>)}</div></fieldset>
    {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
    <button className="primary-action full-action" disabled={saving} type="submit">{saving ? "Saving activity" : "Continue to community"}</button>
  </form>;
}
