"use client";

import type { ActivityStepInput, TemplateId } from "@pods/domain";
import {
  ArrowSquareOut,
  GitCommit,
  GitPullRequest,
  Ticket
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buildActivityPayload } from "../lib/wizard-payloads";
import { savePodDraftStep } from "../lib/wizard-client";
import styles from "./creator-flow.module.css";

const weekdayOptions = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"],
  [5, "Fri"], [6, "Sat"], [7, "Sun"]
] as const;

const buildDeliverables = [
  { value: "pull_request", label: "Pull request", Icon: GitPullRequest },
  { value: "commit", label: "Commit", Icon: GitCommit },
  { value: "issue", label: "Issue", Icon: Ticket },
  { value: "live_artifact", label: "Live artifact", Icon: ArrowSquareOut }
] as const;

function TemplateFields({
  templateId,
  config
}: {
  templateId: TemplateId;
  config: Record<string, unknown>;
}) {
  if (templateId === "fitness") return <>
    <label className={styles.field}><span>Activity type</span><input name="activityType" defaultValue={String(config.activityType ?? "")} placeholder="Strength training" required /></label>
    <label className={styles.field}><span>Measurable minimum</span><input name="measurableMinimum" defaultValue={String(config.measurableMinimum ?? "")} placeholder="Complete 35 focused minutes" required /></label>
  </>;
  if (templateId === "reading") return <>
    <label className={styles.field}><span>Book or theme</span><input name="bookOrTheme" defaultValue={String(config.bookOrTheme ?? "")} placeholder="Product design and behavioral science" required /></label>
    <div className={styles.twoColumn}><label className={styles.field}><span>Measure</span><select name="targetType" defaultValue={String(config.targetType ?? "pages")}><option value="pages">Pages</option><option value="minutes">Minutes</option></select></label><label className={styles.field}><span>Per occurrence</span><input name="targetAmount" type="number" min="1" defaultValue={String(config.targetAmount ?? "20")} required /></label></div>
  </>;
  if (templateId === "study") return <>
    <label className={styles.field}><span>Subject</span><input name="subject" defaultValue={String(config.subject ?? "")} placeholder="Distributed systems" required /></label>
    <label className={styles.field}><span>Focused-session minimum</span><input name="minimumExpectation" defaultValue={String(config.minimumExpectation ?? "")} placeholder="45 minutes and one written takeaway" required /></label>
  </>;
  if (templateId === "build") {
    const allowed = Array.isArray(config.allowedDeliverables) ? config.allowedDeliverables : [];
    return <>
      <label className={styles.field}><span>Project theme</span><input name="projectTheme" defaultValue={String(config.projectTheme ?? "")} placeholder="Pods Cycle I" required /></label>
      <fieldset className={styles.field}>
        <legend>Allowed deliverables</legend>
        <div className={styles.compactChoices}>
          {buildDeliverables.map(({ value, label, Icon }) => (
            <label className={styles.compactChoice} key={value}>
              <input
                className={styles.choiceInput}
                type="checkbox"
                name="allowedDeliverables"
                value={value}
                defaultChecked={allowed.includes(value)}
              />
              <span className={styles.deliverableIcon} aria-hidden="true">
                <Icon size={18} weight="bold" />
              </span>
              <span>{label}</span>
              <i className={styles.deliverableIndicator} aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>
      <label className={styles.field}><span>Commitment cutoff</span><input name="commitmentCutoff" type="time" defaultValue={String(config.commitmentCutoff ?? "09:00")} required /><small>Builders lock the exact task before this local time.</small></label>
    </>;
  }
  return <>
    <label className={styles.field}><span>Discipline</span><input name="discipline" defaultValue={String(config.discipline ?? "")} placeholder="Illustration, piano, writing" required /></label>
    <label className={styles.field}><span>Practice or output minimum</span><input name="minimumExpectation" defaultValue={String(config.minimumExpectation ?? "")} placeholder="One finished study and a short reflection" required /></label>
    <label className={styles.field}><span>Commitment cutoff</span><input name="commitmentCutoff" type="time" defaultValue={String(config.commitmentCutoff ?? "09:00")} required /></label>
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

  return <form className={styles.form} onSubmit={submit}>
    <section className={styles.sectionCard}>
      <span className={styles.sectionLabel}>The shared goal</span>
      <label className={styles.field}><span>Pod name</span><input name="name" defaultValue={initial.name} placeholder="Build Pods in Public" required /></label>
      <label className={styles.field}><span>Purpose</span><textarea name="purpose" defaultValue={initial.purpose} placeholder="What this group will accomplish together" rows={3} required /></label>
    </section>
    <section className={styles.sectionCard}>
      <span className={styles.sectionLabel}>What counts</span>
      <TemplateFields templateId={templateId} config={initial.config} />
    </section>
    <section className={styles.sectionCard}>
      <span className={styles.sectionLabel}>When the group moves</span>
      <div className={styles.twoColumn}><label className={styles.field}><span>Start date</span><input name="startDate" type="date" defaultValue={initial.startDate} required /></label><label className={styles.field}><span>End date</span><input name="endDate" type="date" defaultValue={initial.endDate} required /></label></div>
      <label className={styles.field}><span>Pod timezone</span><input name="timeZone" defaultValue={initial.timeZone} required /><small>Published occurrence windows remain fixed.</small></label>
      <fieldset className={styles.field}><legend>Scheduled weekdays</legend><div className={styles.weekdayGrid}>{weekdayOptions.map(([value, label]) => <label className={styles.weekday} key={value}><input aria-label={label} className={styles.choiceInput} type="checkbox" name="weekdays" value={value} defaultChecked={initial.weekdays.includes(value)} /><span>{label.slice(0, 1)}</span></label>)}</div></fieldset>
    </section>
    {error ? <div className={styles.error} role="alert">{error}</div> : null}
    <div className={`${styles.actionDock} ${styles.formActionDock}`}><button className={styles.primaryAction} disabled={saving} type="submit">{saving ? "Saving activity" : "Continue to community"}</button></div>
  </form>;
}
