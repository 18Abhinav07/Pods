import type {
  NativeMomentumPreviewData,
  NativeMomentumPreviewPerson,
  NativeMomentumPreviewPod,
  NativeMomentumRoomEntry
} from "../components/design-preview/native-momentum-prototype";
import { podsRepository } from "./server-db";

const fallbackPeople: NativeMomentumPreviewPerson[] = [
  {
    displayName: "Ari Vale",
    handle: "arivale",
    avatarSeed: "Ari Vale",
    bio: "Shipping small products with careful craft and visible progress.",
    source: "fixture"
  },
  {
    displayName: "Noah Mercer",
    handle: "noahmercer",
    avatarSeed: "Noah Mercer",
    bio: "Designing community tools that make good habits easier to keep.",
    source: "fixture"
  },
  {
    displayName: "Mina Sol",
    handle: "minasol",
    avatarSeed: "Mina Sol",
    bio: "Running, reading, and making ambitious work feel social.",
    source: "fixture"
  }
];

const fallbackPods: NativeMomentumPreviewPod[] = [
  {
    id: "preview-pods-in-pods",
    name: "Pods in Pods",
    purpose: "Build the accountability product in public with a visible daily shipping rhythm.",
    templateId: "build",
    state: "active",
    stage: "live",
    totalNim: 0.3,
    occurrenceCount: 3,
    minParticipants: 2,
    maxParticipants: 5,
    visibility: "public",
    visitorsAllowed: true,
    source: "fixture"
  },
  {
    id: "preview-night-run",
    name: "Night Run Club",
    purpose: "Finish three evening runs with a small group that notices when you show up.",
    templateId: "fitness",
    state: "enrollment_open",
    stage: "open",
    totalNim: 0.6,
    occurrenceCount: 3,
    minParticipants: 3,
    maxParticipants: 8,
    visibility: "public",
    visitorsAllowed: false,
    source: "fixture"
  },
  {
    id: "preview-reading-reset",
    name: "Reading Reset",
    purpose: "Read, reflect, and share one useful idea on every scheduled occurrence.",
    templateId: "reading",
    state: "completed",
    stage: "recent",
    totalNim: 0.4,
    occurrenceCount: 4,
    minParticipants: 2,
    maxParticipants: 6,
    visibility: "public",
    visitorsAllowed: true,
    source: "fixture"
  }
];

const fallbackRoomEntries: NativeMomentumRoomEntry[] = [
  {
    id: "preview-message-1",
    kind: "message",
    author: "Ari Vale",
    handle: "arivale",
    body: "The funding and roster flow is finally calm on mobile. I am checking the proof path next.",
    time: "10:32 PM",
    source: "fixture"
  },
  {
    id: "preview-activity-1",
    kind: "activity",
    author: "Abhinav",
    handle: "ryuk",
    body: "Ship the compact Pod room and proof entry flow.",
    result: "The responsive room, visibility controls, and submission path are ready for review.",
    status: "approved",
    time: "10:47 PM",
    artifactLabel: "Pull request 184",
    source: "fixture"
  },
  {
    id: "preview-message-2",
    kind: "message",
    author: "Noah Mercer",
    handle: "noahmercer",
    body: "The proof card reads much faster now. I can understand the task before opening the detail.",
    time: "10:51 PM",
    source: "fixture"
  },
  {
    id: "preview-system-1",
    kind: "system",
    author: "Pods",
    handle: "pods",
    body: "Occurrence 2 proof was approved.",
    time: "10:52 PM",
    source: "fixture"
  }
];

function uniqueBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const identity = key(value);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function normalizeSemanticIdentity(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
}

export function mergePreviewPodsBySemanticIdentity(
  livePods: NativeMomentumPreviewPod[],
  fixturePods: NativeMomentumPreviewPod[]
) {
  return uniqueBy(
    [...livePods, ...fixturePods],
    (pod) => `${normalizeSemanticIdentity(pod.name)}:${pod.templateId}`
  );
}

function timeLabel(value: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}

function connectedData(
  publicPods: Awaited<ReturnType<typeof podsRepository.listPublicPodDirectory>>,
  publicProfiles: Awaited<ReturnType<typeof podsRepository.listPublicProfiles>>,
  room: Awaited<ReturnType<typeof podsRepository.getPublicVisitorRoom>>
): NativeMomentumPreviewData {
  const livePods: NativeMomentumPreviewPod[] = publicPods.flatMap((pod) => {
    const contract = pod.contractData;
    if (!contract || contract.community.visibility !== "public") return [];
    return [{
      id: pod.id,
      name: contract.activity.name,
      purpose: contract.activity.purpose,
      templateId: pod.templateId,
      state: pod.state,
      stage: pod.stage === "cancelled" ? "recent" : pod.stage,
      totalNim: contract.commitment.totalLuna / 100_000,
      occurrenceCount: contract.commitment.occurrenceCount,
      minParticipants: contract.community.minParticipants,
      maxParticipants: contract.community.maxParticipants,
      visibility: "public" as const,
      visitorsAllowed: pod.visitorRoomAvailable,
      source: "live" as const
    }];
  });
  const people = publicProfiles.map((profile) => ({
    displayName: profile.displayName,
    handle: profile.handle,
    avatarSeed: profile.displayName,
    bio: profile.bio || "Showing up for meaningful work with a public rhythm.",
    source: "live" as const
  }));
  const liveRoomEntries: NativeMomentumRoomEntry[] = (room?.messages ?? []).flatMap(
    (message): NativeMomentumRoomEntry[] => {
    if (message.hidden) return [];
    const author = message.sender?.displayName ?? (message.kind === "system" ? "Pods" : "Builder");
    const handle = message.sender?.handle ?? (message.kind === "system" ? "pods" : "builder");
    if (message.activity) {
      const status: NonNullable<NativeMomentumRoomEntry["status"]> =
        message.activity.state === "timeout_protected"
          ? "protected"
          : message.activity.state === "under_review"
            ? "reviewing"
            : message.activity.state === "committed"
              ? "locked"
              : message.activity.state;
      return [{
        id: message.id,
        kind: "activity" as const,
        author,
        handle,
        body: message.activity.task,
        status,
        time: timeLabel(message.createdAt),
        ...(message.activity.resultSummary
          ? { result: message.activity.resultSummary }
          : {}),
        ...(message.activity.artifactUrl
          ? { artifactLabel: "Public artifact" }
          : {}),
        source: "live" as const
      }];
    }
    return [{
      id: message.id,
      kind: message.kind === "system"
        ? "system" as const
        : message.kind === "announcement"
          ? "announcement" as const
          : "message" as const,
      author,
      handle,
      body: message.body ?? "Message unavailable",
      time: timeLabel(message.createdAt),
      source: "live" as const
    }];
  });
  const mergedPods = mergePreviewPodsBySemanticIdentity(
    livePods,
    fallbackPods
  ).slice(0, 6);
  const mergedPeople = uniqueBy([...people, ...fallbackPeople], (person) => person.handle).slice(0, 6);
  const mergedRoom = uniqueBy(
    [...liveRoomEntries, ...fallbackRoomEntries],
    (entry) => entry.id
  ).slice(0, 12);
  const commitmentNim = mergedPods[0]?.totalNim ?? 0.3;
  const returnedNim = Math.max(commitmentNim * 0.66, 0.1);
  const bonusNim = Math.max(commitmentNim * 0.12, 0.02);

  return {
    databaseStatus: "connected",
    generatedAt: new Date().toISOString(),
    viewer: {
      displayName: mergedPeople[0]?.displayName ?? "Abhinav",
      handle: mergedPeople[0]?.handle ?? "ryuk",
      avatarSeed: mergedPeople[0]?.avatarSeed ?? "Abhinav"
    },
    pods: mergedPods,
    people: mergedPeople,
    roomEntries: mergedRoom,
    finance: {
      commitmentNim,
      returnedNim,
      payoutNim: commitmentNim + bonusNim,
      bonusNim,
      transactionHash: "57f39ddaa4d2e5fa3dc302091e7ed4d8a021c31f91a.preview"
    }
  };
}

function fallbackData(): NativeMomentumPreviewData {
  return {
    databaseStatus: "fallback",
    generatedAt: new Date().toISOString(),
    viewer: {
      displayName: "Abhinav",
      handle: "ryuk",
      avatarSeed: "Abhinav"
    },
    pods: fallbackPods,
    people: fallbackPeople,
    roomEntries: fallbackRoomEntries,
    finance: {
      commitmentNim: 0.3,
      returnedNim: 0.2,
      payoutNim: 0.4,
      bonusNim: 0.1,
      transactionHash: "57f39ddaa4d2e5fa3dc302091e7ed4d8a021c31f91a.preview"
    }
  };
}

export async function loadNativeMomentumPreviewData(): Promise<NativeMomentumPreviewData> {
  try {
    const [publicPods, publicProfiles] = await Promise.all([
      podsRepository.listPublicPodDirectory({ now: new Date(), recentDays: 30 }),
      podsRepository.listPublicProfiles({ limit: 12 })
    ]);
    const visitorPod = publicPods.find((pod) => pod.visitorRoomAvailable);
    const room = visitorPod
      ? await podsRepository.getPublicVisitorRoom({
          podId: visitorPod.id,
          afterSequence: 0,
          limit: 30
        })
      : null;
    return connectedData(publicPods, publicProfiles, room);
  } catch {
    return fallbackData();
  }
}
