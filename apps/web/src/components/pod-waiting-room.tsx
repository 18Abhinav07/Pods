"use client";

import { ArrowRight, CalendarBlank, CaretDown, ShieldCheck, UsersThree } from "@phosphor-icons/react";
import type { MembershipState, SettlementMode } from "@pods/domain";
import Link from "next/link";

import { formatZonedMoment } from "../lib/format-moment";
import styles from "./financial-flow.module.css";
import type { ParticipantRefund } from "./refund-status-rail";
import { RefundStatusRail } from "./refund-status-rail";
import { WaitingCountdown } from "./waiting-countdown";

export type PodWaitingRoomProps = {
  podId: string;
  name: string;
  purpose: string;
  viewerRole: "creator" | "participant";
  membershipState: MembershipState | null;
  confirmedParticipants: number;
  minParticipants: number;
  maxParticipants: number;
  cutoffAt: string;
  firstOccurrenceAt: string;
  firstOccurrenceDate: string;
  occurrenceCount: number;
  weekdays: number[];
  timeZone: string;
  nimPerOccurrence: number;
  totalNim: number;
  settlementMode: SettlementMode;
  refund: ParticipantRefund | null;
};

const participantStateCopy: Partial<Record<MembershipState, readonly [string, string]>> = {
  funded_provisional: [
    "Commitment credited",
    "Your NIM is recorded. Roster lock happens at the published cutoff."
  ],
  roster_locked: [
    "Place secured",
    "The minimum roster was met and your place is locked for the activity."
  ],
  active: [
    "Activity live",
    "Your roster is locked and the occurrence lifecycle is now active."
  ],
  excluded_at_cutoff: [
    "Refund required",
    "Capacity filled before your finalized chain position. Your full commitment is protected."
  ],
  refund_pending: [
    "Refund in progress",
    "The Pod did not include your place. Your full commitment is being returned."
  ],
  refunded: [
    "Refund completed",
    "Your full commitment has been returned and the receipt remains available here."
  ]
};

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatMoment(value: string, timeZone: string) {
  return formatZonedMoment(value, { timeZone, includeYear: true });
}

function nim(value: number) {
  return new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(value);
}

export function PodWaitingRoom(props: PodWaitingRoomProps) {
  const remaining = Math.max(0, props.maxParticipants - props.confirmedParticipants);
  const isAlphaRefund = props.settlementMode === "full_refund_alpha";
  const hasRefundPath = Boolean(props.refund) || [
    "excluded_at_cutoff",
    "refund_pending",
    "refunded"
  ].includes(props.membershipState ?? "");
  const stateCopy = props.viewerRole === "creator"
    ? ["Creator overview", "Track funded places without exposing participant payment data."] as const
    : participantStateCopy[props.membershipState ?? "applied"] ?? [
        "Waiting room",
        "Your Pod status is available here."
      ];
  const refundReason = props.membershipState === "excluded_at_cutoff"
    ? "Pod capacity was filled before your finalized deposit position."
    : "Your place did not enter the locked roster.";
  const primaryAction = props.viewerRole === "creator"
    ? { href: `/pods/${props.podId}/admin/funding`, label: "Open creator funding view" }
    : hasRefundPath
      ? { href: "/my-pods", label: "View My Pods" }
      : { href: `/pods/${props.podId}/rules`, label: "Review frozen rules" };

  return (
    <div className={styles.waitingFlow}>
      <section className={styles.waitingHero}>
        <div className={styles.waitingState}>
          <i aria-hidden="true" />
          <span>{stateCopy[0]}</span>
        </div>
        <h1>{props.name}</h1>
        <p>{props.purpose}</p>
        <div className={styles.waitingStatus}>{stateCopy[1]}</div>
        {!hasRefundPath ? <WaitingCountdown cutoffAt={props.cutoffAt} /> : null}
      </section>

      <section className={styles.rosterCard} aria-label="Pod capacity">
        <div>
          <UsersThree aria-hidden="true" weight="regular" />
          <span><small>Roster</small><strong>{props.confirmedParticipants} confirmed</strong><em>{props.minParticipants} minimum</em></span>
        </div>
        <div>
          <CalendarBlank aria-hidden="true" weight="regular" />
          <span><small>Capacity</small><strong>{remaining} {remaining === 1 ? "place" : "places"} remaining</strong><em>{props.maxParticipants} maximum</em></span>
        </div>
      </section>

      {props.refund ? <RefundStatusRail refund={{ ...props.refund, reason: props.refund.reason ?? refundReason }} /> : null}

      <details className={styles.waitingContract}>
        <summary>
          <span><small>Frozen contract</small><strong>Schedule and protections</strong></span>
          <CaretDown aria-hidden="true" />
        </summary>
        <div className={styles.waitingContractBody}>
          <dl>
            <div><dt>Enrollment cutoff</dt><dd>{formatMoment(props.cutoffAt, props.timeZone)}</dd></div>
            <div><dt>First occurrence</dt><dd>{formatMoment(props.firstOccurrenceAt, props.timeZone)}</dd></div>
            <div><dt>Cadence</dt><dd>{props.weekdays.map((day) => weekdayNames[day]).join(" · ")}</dd></div>
            <div><dt>Schedule</dt><dd>{props.occurrenceCount} frozen occurrences</dd></div>
            <div><dt>{isAlphaRefund ? "Activity slice" : "At risk each time"}</dt><dd>{nim(props.nimPerOccurrence)} NIM</dd></div>
            <div><dt>Total commitment</dt><dd>{nim(props.totalNim)} NIM</dd></div>
          </dl>
          {isAlphaRefund ? (
            <aside>
              <ShieldCheck aria-hidden="true" weight="regular" />
              <span>
                <strong>Your full Testnet commitment returns after roster lock.</strong>
                <p>Activity review changes streaks and progress only. It cannot reduce your return or create a winner pool.</p>
              </span>
            </aside>
          ) : null}
          <aside>
            <ShieldCheck aria-hidden="true" weight="regular" />
            <span>
              <strong>Proof decisions stay separate from creator funds.</strong>
              <p>The Pod creator reviews member proofs. The creator does not fund this Pod or receive any member funds.</p>
            </span>
          </aside>
        </div>
      </details>

      <div className={styles.waitingAction}>
        <Link className={styles.primaryAction} href={primaryAction.href}>
          <span>{primaryAction.label}</span><i aria-hidden="true"><ArrowRight weight="bold" /></i>
        </Link>
      </div>
    </div>
  );
}
