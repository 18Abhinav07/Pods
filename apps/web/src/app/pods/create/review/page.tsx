import { buildPublishedContract, templateContracts } from "@pods/domain";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "../../../../components/creator-flow.module.css";
import { CreatorShell } from "../../../../components/creator-shell";
import { PublishClient } from "../../../../components/publish-client";
import { alphaFundingPolicy } from "../../../../lib/alpha-access";
import { requireDraftOwner } from "../../../../lib/creator-guard";
import { mediaForTemplate } from "../../../../lib/template-presentation";

function nim(luna: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(luna / 100_000);
}

function activityTerms(
  templateId: string,
  config: Record<string, unknown>
) {
  const text = (key: string) => String(config[key] ?? "").trim();
  if (templateId === "fitness") {
    return [
      ["Activity", text("activityType")],
      ["Minimum", text("measurableMinimum")]
    ] as const;
  }
  if (templateId === "reading") {
    return [
      ["Book or theme", text("bookOrTheme")],
      ["Target", `${text("targetAmount")} ${text("targetType")}`.trim()]
    ] as const;
  }
  if (templateId === "study") {
    return [
      ["Subject", text("subject")],
      ["Minimum", text("minimumExpectation")]
    ] as const;
  }
  if (templateId === "build") {
    const deliverables = Array.isArray(config.allowedDeliverables)
      ? config.allowedDeliverables
          .map((value) => String(value).replaceAll("_", " "))
          .join(", ")
      : "";
    return [
      ["Project theme", text("projectTheme")],
      ["Deliverables", deliverables],
      ["Commitment cutoff", text("commitmentCutoff")]
    ] as const;
  }
  return [
    ["Discipline", text("discipline")],
    ["Minimum", text("minimumExpectation")],
    ["Commitment cutoff", text("commitmentCutoff")]
  ] as const;
}

export default async function ReviewStepPage({ searchParams }: { searchParams: Promise<{ draft?: string }> }) {
  const { draft } = await searchParams;
  const { pod } = await requireDraftOwner(draft, "/pods/create/review");
  const { activity, community, commitment } = pod.draftData;
  if (!activity) redirect(`/pods/create/activity?draft=${pod.id}`);
  if (!community) redirect(`/pods/create/community?draft=${pod.id}`);
  if (!commitment) redirect(`/pods/create/commitment?draft=${pod.id}`);
  let fundingPolicy: ReturnType<typeof alphaFundingPolicy>;
  try {
    fundingPolicy = alphaFundingPolicy(process.env);
  } catch {
    return (
      <CreatorShell
        activeStep={4}
        eyebrow="Review paused"
        title="Publishing is paused."
        copy="Your draft is saved. No contract has been published or changed."
      >
        <Link className={styles.secondaryAction} href="/my-pods">
          Return to My Pods
        </Link>
      </CreatorShell>
    );
  }
  const result = buildPublishedContract(
    { templateId: pod.templateId, activity, community, commitment },
    fundingPolicy
  );
  if (!result.success) {
    return <CreatorShell activeStep={4} eyebrow="Review paused" title="One section still needs attention." copy="The server could not freeze this contract yet."><div className={styles.reviewStack}>{result.errors.map((error) => <p className={styles.error} key={error}>{error}</p>)}<Link className={styles.secondaryAction} href={`/pods/create/activity?draft=${pod.id}`}>Return to activity</Link></div></CreatorShell>;
  }
  const contract = result.contract;
  const template = templateContracts.find((item) => item.id === contract.templateId);
  const media = mediaForTemplate(contract.templateId, pod.id);
  const terms = activityTerms(contract.templateId, contract.activity.config);
  const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cadence = contract.activity.weekdays
    .map((day) => weekdayNames[day - 1] ?? String(day))
    .join(", ");
  const accessTerms = contract.community.visibility === "public"
    ? contract.community.applicationQuestions.map((question, index) => [
        `Application question ${index + 1}`,
        question
      ] as const)
    : [["Invitation expiry", `${contract.community.inviteExpiryHours} hours`] as const];
  return <CreatorShell activeStep={4} eyebrow="Step 5 of 5" title="Ready to make it real." copy="Read the frozen receipt once. Publishing removes every edit path.">
    <div className={styles.reviewStack}>
      <section className={styles.publishVisual}>
        <Image alt="" fill priority sizes="390px" src={media.hero} />
        <span>Ready to publish</span>
      </section>
      <section className={styles.reviewTitle}>
        <h2>{contract.activity.name}</h2>
        <p>{contract.activity.purpose}</p>
      </section>
      <section className={styles.contractReceipt} aria-label="Frozen Pod receipt">
        <div className={styles.receiptRow}><span>Template</span><strong>{template?.name}</strong></div>
        <div className={styles.receiptRow}><span>Schedule</span><strong>{contract.commitment.occurrenceCount} occurrences · {cadence} · {contract.activity.startDate} to {contract.activity.endDate} · {contract.activity.timeZone}</strong></div>
        <div className={styles.receiptRow}><span>Community</span><strong>{contract.community.visibility === "public" ? "Public, application-based" : "Private, invitation-only"} · {contract.community.minParticipants} to {contract.community.maxParticipants}</strong></div>
        {contract.version === 2 ? <div className={styles.receiptRow}><span>Visitor room</span><strong>{contract.community.roomAudience === "public_read_only" ? "Read only visitors allowed" : "Members only"}</strong></div> : null}
        <div className={styles.receiptRow}><span>Commitment</span><strong>{nim(contract.commitment.lunaPerOccurrence)} NIM each · {nim(contract.commitment.totalLuna)} Testnet NIM maximum</strong></div>
        <div className={styles.receiptRow}><span>Verification</span><strong>Creator review</strong></div>
      </section>
      <details className={styles.details}>
        <summary>Review frozen terms</summary>
        <div className={styles.detailsBody}>
          <p>{contract.evidenceMode === "repeating_criterion" ? "One measurable criterion repeats for every occurrence." : "Each participant locks a new task before every occurrence cutoff."}</p>
          <dl className={styles.termsList}>
            {terms.filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            {accessTerms.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          <p>The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds.</p>
          <p>{contract.settlementMode === "proportional" ? "Approved work protects its slice and can earn from rejected or missed slices for the same occurrence. This Testnet MVP has no appeal or peer vote." : "The complete Testnet commitment returns after roster lock. No proportional redistribution applies to this immutable contract."}</p>
        </div>
      </details>
      <PublishClient podId={pod.id} />
    </div>
  </CreatorShell>;
}
