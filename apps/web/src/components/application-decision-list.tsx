"use client";

import type {
  ApplicationAnswer,
  ApplicationDecision,
  ProfileAvatar as ProfileAvatarType
} from "@pods/domain";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { decidePodApplication } from "../lib/creator-enrollment-client";
import { ProfileAvatar } from "./profile-avatar";

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
  applications
}: {
  podId: string;
  applications: CreatorApplicationItem[];
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [pending, setPending] = useState(applications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(applicationId: string, decision: ApplicationDecision) {
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
    return <section className="neutral-empty"><span>Queue clear</span><p>No applications need a decision. Share the public Pod to recruit the right group.</p></section>;
  }

  return (
    <div className="decision-list">
      <AnimatePresence initial={false}>
        {pending.map((application) => (
          <motion.article
            className="decision-card"
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -8 }}
            key={application.id}
            layout
          >
            <div className="decision-applicant">
              <ProfileAvatar
                avatar={application.applicant.avatar}
                displayName={application.applicant.displayName}
              />
              <span>
                <small>Applicant</small>
                <strong>{application.applicant.displayName}</strong>
                <i>@{application.applicant.handle}</i>
              </span>
            </div>
            <p className="decision-applicant-bio">
              {application.applicant.bio || "No introduction added yet."}
            </p>
            <dl>
              {application.answers.map(({ question, answer }) => (
                <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>
              ))}
            </dl>
            <div className="decision-actions">
              <button disabled={busyId === application.id} onClick={() => decide(application.id, "reject")} type="button">Not this cycle</button>
              <button className="primary-action" disabled={busyId === application.id} onClick={() => decide(application.id, "accept")} type="button">{busyId === application.id ? "Saving" : "Accept"}</button>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
      {error ? <div className="inline-error" role="alert"><span>{error}</span></div> : null}
    </div>
  );
}
