type ScheduleRow = {
  occurrence: {
    id: string;
    ordinal: number;
    opensAt: Date;
    closesAt: Date;
  };
  commitment: { id: string } | null;
  submission: { state: string } | null;
};

export type RoomActivityPresentation = {
  mode: "lock" | "add" | "continue" | "view" | "upcoming" | "complete";
  href: string;
  label: string;
  stateLabel: string;
  progressLabel: string;
  targetAt: string | null;
  targetLabel: "remaining" | "until next occurrence" | null;
};

function submittedStateLabel(state: string) {
  if (state === "reviewing" || state === "submitted") return "Creator review";
  if (state === "approved") return "Proof submitted";
  if (state === "rejected") return "Not verified";
  if (state === "grace") return "Grace applied";
  if (state === "timeout_protected") return "Protected after timeout";
  return "Submission recorded";
}

export function presentRoomActivitySchedule({
  podId,
  now,
  rows
}: {
  podId: string;
  now: Date;
  rows: ScheduleRow[];
}): RoomActivityPresentation {
  const ordered = [...rows].sort((first, second) => first.occurrence.ordinal - second.occurrence.ordinal);
  const total = ordered.length;
  const open = ordered.find(({ occurrence }) =>
    occurrence.opensAt.getTime() <= now.getTime() && occurrence.closesAt.getTime() > now.getTime()
  );
  const future = ordered.find(({ occurrence }) => occurrence.opensAt.getTime() > now.getTime());

  if (open) {
    const href = `/pods/${podId}/activity/${open.occurrence.id}`;
    const standard = {
      href,
      progressLabel: `Occurrence ${open.occurrence.ordinal} of ${total}`,
      targetAt: open.occurrence.closesAt.toISOString(),
      targetLabel: "remaining" as const
    };
    if (!open.commitment) {
      return { ...standard, mode: "lock", label: "Lock commitment", stateLabel: "Commitment open" };
    }
    if (!open.submission) {
      return { ...standard, mode: "add", label: "Add proof", stateLabel: "Proof due" };
    }
    if (open.submission.state === "draft") {
      return { ...standard, mode: "continue", label: "Continue proof", stateLabel: "Draft saved" };
    }
    return {
      ...standard,
      mode: "view",
      label: "View submission",
      stateLabel: submittedStateLabel(open.submission.state),
      progressLabel: `Occurrence ${open.occurrence.ordinal} of ${total}${future ? " complete" : ""}`,
      targetAt: future?.occurrence.opensAt.toISOString() ?? standard.targetAt,
      targetLabel: future ? "until next occurrence" : standard.targetLabel
    };
  }

  if (future) {
    const completed = ordered.filter(({ occurrence }) => occurrence.closesAt.getTime() <= now.getTime()).length;
    return {
      mode: "upcoming",
      href: `/pods/${podId}/activity`,
      label: "Next occurrence",
      stateLabel: "Next occurrence",
      progressLabel: `${completed} of ${total} occurrences finished`,
      targetAt: future.occurrence.opensAt.toISOString(),
      targetLabel: "until next occurrence"
    };
  }

  return {
    mode: "complete",
    href: `/pods/${podId}/activity`,
    label: "Schedule complete",
    stateLabel: "Schedule complete",
    progressLabel: `${total} of ${total} occurrences finished`,
    targetAt: null,
    targetLabel: null
  };
}
