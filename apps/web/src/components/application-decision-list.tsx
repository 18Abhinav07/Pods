"use client";

import type {
  ApplicationAnswer,
  ApplicationDecision,
  ProfileAvatar as ProfileAvatarType
} from "@pods/domain";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { decidePodApplication } from "../lib/creator-enrollment-client";
import { ProfileAvatar } from "./profile-avatar";
import styles from "./pod-admin-flow.module.css";

export type CreatorApplicationItem = {
  id: string;
  applicant: {
    handle: string;
    displayName: string;
    bio: string;
    avatar: ProfileAvatarType;
  };
  answers: ApplicationAnswer[];
};

export function ApplicationDecisionList({
  podId,
  applications,
  selectedApplicationId
}: {
  podId: string;
  applications: CreatorApplicationItem[];
  selectedApplicationId?: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState(applications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(applicationId: string, decision: ApplicationDecision) {
    if (busyId !== null) return;
    setBusyId(applicationId);
    setError("");
    try {
      await decidePodApplication(podId, applicationId, decision);
      setPending((current) => current.filter((item) => item.id !== applicationId));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Application decision could not be saved");
    } finally {
      setBusyId(null);
    }
  }

  if (pending.length === 0) {
    return <section className={styles.empty}><strong>Queue clear</strong><p>No applications need a decision. Share the public Pod to recruit the right group.</p></section>;
  }

  const selected = selectedApplicationId
    ? pending.find(({ id }) => id === selectedApplicationId)
    : null;

  if (selected) {
    const working = busyId === selected.id;
    return (
      <section className={styles.detail} aria-label={`${selected.applicant.displayName} application`}>
        <Link className={styles.applicationHeaderLink} href={`/pods/${podId}/admin/applications`}>
          All applications
        </Link>
        <article className={styles.applicantCard}>
          <ProfileAvatar
            avatar={selected.applicant.avatar}
            displayName={selected.applicant.displayName}
          />
          <span>
            <strong>{selected.applicant.displayName}</strong>
            <small>@{selected.applicant.handle}</small>
          </span>
          <p>{selected.applicant.bio || "No introduction added yet."}</p>
        </article>
        <section className={styles.answerStack} aria-labelledby="application-answers-title">
          <h3 id="application-answers-title">Application answers</h3>
          {selected.answers.map(({ question, answer }) => (
            <article className={styles.answerCard} key={question}>
              <span>{question}</span>
              <p>{answer}</p>
            </article>
          ))}
        </section>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.decisionDock}>
          <button
            aria-label="Decline applicant"
            disabled={working}
            onClick={() => void decide(selected.id, "reject")}
            type="button"
          >
            Decline
          </button>
          <button
            aria-label={working ? "Saving decision" : "Accept applicant"}
            disabled={working}
            onClick={() => void decide(selected.id, "accept")}
            type="button"
          >
            {working ? "Saving decision" : "Accept applicant"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.list}>
      <AnimatePresence initial={false}>
        {pending.map((application) => (
          <motion.div
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
            key={application.id}
            layout
          >
            <Link
              aria-label={`Review ${application.applicant.displayName} application`}
              className={styles.queueCard}
              href={`/pods/${podId}/admin/applications?application=${encodeURIComponent(application.id)}`}
            >
              <ProfileAvatar
                avatar={application.applicant.avatar}
                displayName={application.applicant.displayName}
              />
              <span>
                <strong>{application.applicant.displayName}</strong>
                <span className={styles.queueMeta}>
                  <small>@{application.applicant.handle}</small>
                  <small>{application.answers.length} {application.answers.length === 1 ? "response" : "responses"}</small>
                </span>
                <p>{application.applicant.bio || "No introduction added yet."}</p>
              </span>
              <i aria-hidden="true">›</i>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  );
}
