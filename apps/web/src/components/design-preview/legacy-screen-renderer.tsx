"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  Clock,
  Compass,
  DotsThree,
  Eye,
  FileText,
  Flag,
  FunnelSimple,
  GearSix,
  House,
  ImageSquare,
  LinkSimple,
  LockKey,
  MagnifyingGlass,
  PaperPlaneTilt,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkle,
  TrendUp,
  Users,
  Wallet,
  X
} from "@phosphor-icons/react";
import Image from "next/image";

import {
  PREVIEW_FIXTURE_PROFILE,
  type ScenarioId,
  type SelectedEntities
} from "./model";
import styles from "./native-momentum-prototype.module.css";

export type NativeMomentumPreviewPod = {
  id: string;
  name: string;
  purpose: string;
  templateId: "build" | "create" | "fitness" | "reading" | "study";
  state: string;
  stage: "open" | "live" | "recent";
  totalNim: number;
  occurrenceCount: number;
  minParticipants: number;
  maxParticipants: number;
  visibility: "public" | "private";
  visitorsAllowed: boolean;
};

export type NativeMomentumPreviewPerson = {
  displayName: string;
  handle: string;
  avatarSeed: string;
  bio: string;
};

export type NativeMomentumRoomEntry = {
  id: string;
  kind: "message" | "activity" | "announcement" | "system";
  author: string;
  handle: string;
  body: string;
  result?: string;
  status?: "locked" | "reviewing" | "approved" | "rejected" | "protected";
  time: string;
  artifactLabel?: string;
};

export type NativeMomentumPreviewData = {
  databaseStatus: "connected" | "fallback";
  generatedAt: string;
  viewer: {
    displayName: string;
    handle: string;
    avatarSeed: string;
  };
  pods: NativeMomentumPreviewPod[];
  people: NativeMomentumPreviewPerson[];
  roomEntries: NativeMomentumRoomEntry[];
  finance: {
    commitmentNim: number;
    returnedNim: number;
    payoutNim: number;
    bonusNim: number;
    transactionHash: string;
  };
};

type PreviewApplicationRecord = {
  id: string;
  person: NativeMomentumPreviewPerson;
  motivation: string;
  responseCount: number;
  appliedAt: string;
};

type PreviewSubmissionRecord = {
  id: string;
  person: NativeMomentumPreviewPerson;
  occurrence: number;
  commitment: string;
  result: string;
  artifactLabel: string;
  age: string;
};

type PreviewTransferRecord = {
  id: string;
  pod: string;
  state: "Unknown" | "Retry required" | "Late";
  tone: "warning" | "danger";
  amount: number;
  age: string;
  description: string;
  leg: string;
  lastChecked: string;
};

type PreviewRecords = {
  applications: PreviewApplicationRecord[];
  submissions: PreviewSubmissionRecord[];
  transfers: PreviewTransferRecord[];
};

const JOURNEY_FIXTURE_PEOPLE: readonly NativeMomentumPreviewPerson[] = [
  {
    displayName: "Ari Vale",
    handle: "arivale",
    avatarSeed: "Ari Vale",
    bio: "A fictional creator-review fixture."
  },
  {
    displayName: "Noah Mercer",
    handle: "noahmercer",
    avatarSeed: "Noah Mercer",
    bio: "A fictional participant-review fixture."
  },
  {
    displayName: "Mina Sol",
    handle: "minasol",
    avatarSeed: "Mina Sol",
    bio: "A fictional participant-review fixture."
  }
];

const JOURNEY_FIXTURE_ROOM_ENTRIES: readonly NativeMomentumRoomEntry[] = [
  {
    id: "fixture-room-message-1",
    kind: "message",
    author: "Ari Vale",
    handle: "arivale",
    body: "The funding and roster flow is calm on mobile. I am checking the proof path next.",
    time: "10:32 PM"
  },
  {
    id: "fixture-room-activity-1",
    kind: "activity",
    author: "Kai Rowan",
    handle: "kairowan",
    body: "Ship the compact Pod room and proof entry flow.",
    result: "The responsive room and submission path are ready for review.",
    status: "approved",
    time: "10:47 PM",
    artifactLabel: "Pull request 184"
  },
  {
    id: "fixture-room-message-2",
    kind: "message",
    author: "Noah Mercer",
    handle: "noahmercer",
    body: "The proof card reads faster now. I can understand the task before opening the detail.",
    time: "10:51 PM"
  }
];

function buildPreviewRecords(): PreviewRecords {
  const applicationMotivations = [
    "I want a shared rhythm for shipping the proof experience.",
    "I want to make public activity rooms easier to follow."
  ];
  const submissionResults = [
    "The responsive room and submission path are ready.",
    "Funding-state audit is published with clear state transitions."
  ];
  const submissionArtifacts = ["Pull request 184", "Pull request 219"];
  const commitments = [
    "Ship the compact Pod room and proof entry flow.",
    "Publish the funding-state audit."
  ];

  return {
    applications: JOURNEY_FIXTURE_PEOPLE.map((person, index) => ({
      id: `application-${person.handle}`,
      person,
      motivation:
        applicationMotivations[index] ??
        `I want to build visible momentum with ${person.displayName}.`,
      responseCount: index === 0 ? 2 : 1,
      appliedAt: index === 0 ? "Today at 9:18 PM" : "Today at 9:42 PM"
    })),
    submissions: JOURNEY_FIXTURE_PEOPLE.map((person, index) => ({
      id: `submission-${person.handle}`,
      person,
      occurrence: index + 1,
      commitment:
        commitments[index] ?? `Complete occurrence ${index + 1} work.`,
      result:
        submissionResults[index] ??
        `${person.displayName} submitted the committed work.`,
      artifactLabel:
        submissionArtifacts[index] ?? `Artifact ${index + 1}`,
      age: index === 0 ? "46m" : "3h"
    })),
    transfers: [
      {
        id: "transfer-unknown",
        pod: "Pods in Pods",
        state: "Unknown",
        tone: "warning",
        amount: 0.4,
        age: "4m",
        description:
          "Broadcast exists, but chain confirmation is not yet conclusive. Reconcile before any retry.",
        leg: "7e320c14...a881",
        lastChecked: "4 minutes ago"
      },
      {
        id: "transfer-retry",
        pod: "Night Run Club",
        state: "Retry required",
        tone: "danger",
        amount: 0.2,
        age: "18m",
        description:
          "The previous broadcast failed safely. Reconcile the failed attempt before replacing it.",
        leg: "9b420c14...f219",
        lastChecked: "18 minutes ago"
      },
      {
        id: "transfer-late",
        pod: "Reading Reset",
        state: "Late",
        tone: "warning",
        amount: 0.1,
        age: "1h",
        description:
          "Confirmation is later than the target window. Inspect the chain record before taking action.",
        leg: "4a119d72...c004",
        lastChecked: "1 hour ago"
      }
    ]
  };
}

type ScreenId =
  | "discover"
  | "pod-preview"
  | "visitor-room"
  | "public-proof"
  | "apply"
  | "invite"
  | "invalid-invite"
  | "today"
  | "my-pods"
  | "funding"
  | "waiting"
  | "room"
  | "commitment"
  | "proof-type"
  | "proof-evidence"
  | "proof-review"
  | "submission-review"
  | "submission-approved"
  | "refund"
  | "settlement"
  | "updates"
  | "members"
  | "rules"
  | "command-center"
  | "applications"
  | "application-detail"
  | "creator-funding"
  | "review-queue"
  | "review-proof"
  | "creator-settlement"
  | "private-profile"
  | "public-profile"
  | "people-search"
  | "messages"
  | "requests"
  | "direct-message"
  | "transfer-queue"
  | "transfer-detail"
  | "public-safety"
  | "landing"
  | "connect"
  | "signature-waiting"
  | "setup-complete"
  | "proof-approved"
  | "proof-rejected"
  | "profile-identity"
  | "profile-avatar"
  | "profile-privacy"
  | "create-template"
  | "create-activity"
  | "create-community"
  | "create-commitment"
  | "create-review";

export type LegacyScreenId = ScreenId;

export type LegacyProductDestination =
  | LegacyScreenId
  | "application-submitted"
  | "creator-reviewing"
  | "publishing";

type LegacyNavigate = (
  screen: LegacyProductDestination,
  selected?: Partial<SelectedEntities>
) => void;

const templateLabel: Record<NativeMomentumPreviewPod["templateId"], string> = {
  build: "Build & Ship",
  create: "Practice & Create",
  fitness: "Fitness & Movement",
  reading: "Reading",
  study: "Study & Focus"
};

const templateMedia: Record<NativeMomentumPreviewPod["templateId"], string> = {
  build: "/media/build-workspace.jpg",
  create: "/media/build-proof.jpg",
  fitness: "/media/fitness.jpg",
  reading: "/media/reading.jpg",
  study: "/media/reading-proof.jpg"
};

const templateThemeClass: Record<NativeMomentumPreviewPod["templateId"], string> = {
  build: styles.themeBuild!,
  create: styles.themeCreate!,
  fitness: styles.themeFitness!,
  reading: styles.themeReading!,
  study: styles.themeStudy!
};

function formatNim(value: number) {
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 5 }).format(value)} NIM`;
}

function shortenHash(value: string) {
  if (value.length < 18) return value;
  return `${value.slice(0, 9)}...${value.slice(-7)}`;
}

function artifactDisplayLabel(value?: string) {
  return !value || value === "Public artifact" ? "Shared work" : value;
}

function seedNumber(value: string) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
}

function PreviewAvatar({
  name,
  size = "medium"
}: {
  name: string;
  size?: "small" | "medium" | "large" | "hero";
}) {
  const seed = seedNumber(name);
  const palettes = [
    { bg: "#E8EEE5", skin: "#9B5B39", hair: "#171916", shirt: "#4E8667", detail: "#D6EA8B" },
    { bg: "#F2E7E2", skin: "#75452F", hair: "#171412", shirt: "#E38268", detail: "#F4C1A6" },
    { bg: "#E9E9F2", skin: "#E8AA7D", hair: "#2F4059", shirt: "#6678B8", detail: "#A9B8EE" },
    { bg: "#F2EDDF", skin: "#C2764C", hair: "#A64E2D", shirt: "#E4B83D", detail: "#FFF0AD" },
    { bg: "#E8E8E5", skin: "#EFB58B", hair: "#20201F", shirt: "#73777C", detail: "#D4D0C8" },
    { bg: "#E9EFEE", skin: "#6E412F", hair: "#111A18", shirt: "#2F736A", detail: "#A6D8C8" }
  ];
  const palette = palettes[seed % palettes.length] ?? palettes[0]!;
  const hair = seed % 4;
  return (
    <span className={`${styles.avatar} ${styles[`avatar-${size}`]}`} role="img" aria-label={`${name} portrait`}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 96 96">
        <rect fill={palette.bg} height="96" width="96" />
        <path d="M8 98c2-23 16-34 40-34s38 11 40 34H8Z" fill={palette.shirt} />
        <path d="M40 62h16v16c-3 5-13 5-16 0V62Z" fill={palette.skin} />
        <ellipse cx="48" cy="43" fill={palette.skin} rx="23" ry="27" />
        <ellipse cx="25" cy="47" fill={palette.skin} rx="4" ry="7" />
        <ellipse cx="71" cy="47" fill={palette.skin} rx="4" ry="7" />
        {hair === 0 ? <path d="M24 42c-2-23 11-34 26-34 16 0 27 11 25 30-8-3-13-10-14-20-8 11-20 16-37 15v9Z" fill={palette.hair} /> : null}
        {hair === 1 ? <><path d="M23 46C20 21 32 8 49 8c20 0 29 14 25 40l-8-9-3-17c-10 11-23 15-40 14v10Z" fill={palette.hair} /><circle cx="69" cy="11" fill={palette.hair} r="8" /></> : null}
        {hair === 2 ? <path d="M23 41C24 18 35 7 50 7c18 0 29 12 27 32-7-6-10-14-10-22-9 12-24 18-44 16v8Z" fill={palette.hair} /> : null}
        {hair === 3 ? <path d="M22 45C20 19 33 7 49 7c19 0 30 14 27 39l-7-8c-2-5-4-11-4-18-8 9-22 14-43 13v12Z" fill={palette.hair} /> : null}
        <circle cx="39" cy="45" fill="#171916" r="2" />
        <circle cx="57" cy="45" fill="#171916" r="2" />
        <path d="M47 47l-2 7h5" fill="none" stroke="#171916" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M40 59c5 4 11 4 16 0" fill="none" stroke="#171916" strokeLinecap="round" strokeWidth="1.8" />
        {seed % 3 === 0 ? <><circle cx="39" cy="45" fill="none" r="7" stroke={palette.detail} strokeWidth="2.5" /><circle cx="57" cy="45" fill="none" r="7" stroke={palette.detail} strokeWidth="2.5" /><path d="M46 45h4" stroke={palette.detail} strokeWidth="2.5" /></> : null}
      </svg>
    </span>
  );
}

function IconButton({
  label,
  children,
  onClick
}: {
  label: string;
  children: React.ReactNode;
  onClick?: (() => void) | undefined;
}) {
  return (
    <button aria-label={label} className={styles.iconButton} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function ScreenHeader({
  title,
  subtitle,
  avatar,
  back,
  onBack,
  trailing = "actions"
}: {
  title: string;
  subtitle?: string;
  avatar?: string;
  back?: boolean;
  onBack?: () => void;
  trailing?: "actions" | "bell" | "none";
}) {
  return (
    <header className={styles.screenHeader}>
      <div className={styles.headerLead}>
        {back ? (
          <IconButton label="Go back" onClick={onBack}>
            <ArrowLeft size={20} weight="regular" />
          </IconButton>
        ) : null}
        {avatar ? <PreviewAvatar name={avatar} size="small" /> : null}
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {trailing === "actions" ? (
        <IconButton label="Open page actions">
          <DotsThree size={24} weight="bold" />
        </IconButton>
      ) : trailing === "bell" ? (
        <IconButton label="Open updates">
          <Bell size={21} weight="regular" />
        </IconButton>
      ) : null}
    </header>
  );
}

function BottomNav({
  active,
  navigate
}: {
  active: "today" | "discover" | "pods" | "messages";
  navigate: LegacyNavigate;
}) {
  const items = [
    { id: "today", label: "Today", icon: House, screen: "today" as ScreenId },
    { id: "discover", label: "Discover", icon: Compass, screen: "discover" as ScreenId },
    { id: "pods", label: "My Pods", icon: Users, screen: "my-pods" as ScreenId },
    { id: "messages", label: "Messages", icon: ChatCircleDots, screen: "messages" as ScreenId }
  ];
  return (
    <nav aria-label="Prototype primary navigation" className={styles.bottomNav}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            aria-current={active === item.id ? "page" : undefined}
            key={item.id}
            onClick={() => navigate(item.screen)}
            type="button"
          >
            <Icon size={21} weight={active === item.id ? "fill" : "regular"} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function PrimaryButton({
  children,
  onClick,
  icon = true,
  disabled = false,
  ariaLabel
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={styles.primaryButton}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{children}</span>
      {icon ? <i><ArrowRight size={19} weight="bold" /></i> : null}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className={styles.secondaryButton} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function StatusPill({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "live" | "success" | "warning" | "danger";
}) {
  return <span className={`${styles.statusPill} ${styles[`status-${tone}`]}`}>{children}</span>;
}

function SectionHeading({
  eyebrow,
  title,
  action
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHeading}>
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function PodRow({
  pod,
  relationship,
  onClick
}: {
  pod: NativeMomentumPreviewPod;
  relationship: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={`Open ${pod.name}`}
      className={styles.podRow}
      onClick={onClick}
      type="button"
    >
      <span className={styles.podRowMedia}>
        <Image alt="" height={120} src={templateMedia[pod.templateId]} width={120} />
        {pod.stage === "live" ? <i aria-hidden="true" /> : null}
      </span>
      <span className={styles.podRowCopy}>
        <strong>{pod.name}</strong>
        <small>{relationship}</small>
      </span>
      <span className={styles.podRowMeta}>
        <small>{templateLabel[pod.templateId]}</small>
        <CaretRight size={16} weight="bold" />
      </span>
    </button>
  );
}

function PersonRow({
  person,
  action,
  onClick
}: {
  person: NativeMomentumPreviewPerson;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <button className={styles.personRow} onClick={onClick} type="button">
      <PreviewAvatar name={person.avatarSeed} />
      <span>
        <strong>{person.displayName}</strong>
        <small>@{person.handle}</small>
      </span>
      {action ? <b>{action}</b> : <CaretRight size={16} weight="bold" />}
    </button>
  );
}

function DisclosureRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <button className={styles.disclosureRow} type="button">
      <i>{icon}</i>
      <span><strong>{label}</strong>{value ? <small>{value}</small> : null}</span>
      <CaretRight size={16} weight="bold" />
    </button>
  );
}

function ScreenBody({ children, flush = false }: { children: React.ReactNode; flush?: boolean }) {
  return <div className={flush ? styles.screenBodyFlush : styles.screenBody}>{children}</div>;
}

function MobileScreen({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return <section className={`${styles.mobileScreen} ${className}`}>{children}</section>;
}

function DiscoverScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Discover Pods" trailing="bell" />
      <ScreenBody>
        <div className={styles.searchControl}>
          <MagnifyingGlass size={19} weight="regular" />
          <span>Search activities</span>
          <button aria-label="Filter activities" type="button"><FunnelSimple size={18} /></button>
        </div>
        <div className={styles.stageSwitch} role="tablist" aria-label="Pod lifecycle">
          <button aria-selected="true" role="tab" type="button">Open</button>
          <button aria-selected="false" role="tab" type="button">Live</button>
          <button aria-selected="false" role="tab" type="button">Recent</button>
        </div>
        <SectionHeading eyebrow="Public activities" title={`${data.pods.length} Pods from the database`} />
        <div className={styles.rowList}>
          {data.pods.map((pod) => (
            <PodRow
              key={pod.id}
              onClick={() =>
                navigate("pod-preview", { podId: pod.id })
              }
              pod={pod}
              relationship={pod.stage === "live" ? "Live now · Visitor room open" : `Apply · ${pod.maxParticipants} places`}
            />
          ))}
        </div>
      </ScreenBody>
      <BottomNav active="discover" navigate={navigate} />
    </MobileScreen>
  );
}

function PodPreviewScreen({
  pod,
  creator,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  creator: NativeMomentumPreviewPerson;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={templateThemeClass[pod.templateId]}>
      <ScreenHeader back onBack={() => navigate("discover")} title="Pod details" trailing="actions" />
      <ScreenBody flush>
        <div className={styles.podHero}>
          <Image alt={`${pod.name} activity`} height={520} priority src={templateMedia[pod.templateId]} width={720} />
          <div className={styles.podHeroShade} />
          <div className={styles.podHeroCopy}>
            <StatusPill tone={pod.stage === "live" ? "live" : "neutral"}>
              {pod.stage === "live" ? "Live activity" : "Applications open"}
            </StatusPill>
            <h2>{pod.name}</h2>
            <p>{pod.purpose}</p>
          </div>
        </div>
        <div className={styles.insetContent}>
          <div className={styles.creatorRow}>
            <PreviewAvatar name={creator.avatarSeed} />
            <span><small>Created and reviewed by</small><strong>{creator.displayName}</strong></span>
            <CaretRight size={17} weight="bold" />
          </div>
          <div className={styles.compactStats}>
            <div><strong>{pod.occurrenceCount}</strong><span>Occurrences</span></div>
            <div><strong>{formatNim(pod.totalNim)}</strong><span>Upfront</span></div>
            <div><strong>{pod.maxParticipants}</strong><span>Capacity</span></div>
          </div>
          <div className={styles.readableSection}>
            <SectionHeading title="What this group is doing" />
            <p>{pod.purpose}</p>
          </div>
          <div className={styles.disclosureList}>
            {pod.visitorsAllowed ? (
              <DisclosureRow
                icon={<Eye size={19} />}
                label="Watch the public room"
                value="Messages and public proof are visible"
              />
            ) : null}
            <DisclosureRow icon={<FileText size={19} />} label="Complete Pod contract" value="Schedule, evidence, review, and settlement" />
            <DisclosureRow icon={<Users size={19} />} label="People" value={`${pod.minParticipants} minimum, ${pod.maxParticipants} maximum`} />
          </div>
          <div className={styles.stickyActionSpacer} />
        </div>
      </ScreenBody>
      <div className={styles.actionDock}>
        {pod.stage === "live" ? (
          <PrimaryButton onClick={() => navigate("visitor-room")}>Watch this Pod</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => navigate("apply")}>Apply to join</PrimaryButton>
        )}
      </div>
    </MobileScreen>
  );
}

function VisitorRoomScreen({
  data,
  pod,
  navigate
}: {
  data: NativeMomentumPreviewData;
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={`${styles.roomScreen} ${templateThemeClass[pod.templateId]}`}>
      <ScreenHeader avatar={pod.name} title={pod.name} subtitle="Public room · Read only" />
      <div className={styles.occurrenceStrip}>
        <span><i />Occurrence 2 of {pod.occurrenceCount}</span>
        <strong>8h 24m left</strong>
      </div>
      <div className={styles.readOnlyNotice}>
        <Eye size={17} />
        <span>You can watch public messages and proof.</span>
        <button type="button">How it works</button>
      </div>
      <RoomTimeline
        data={data}
        navigate={navigate}
        publicMode
      />
      <div className={styles.visitorRoomDock}>
        <span>Want to take part in the next Pod?</span>
        <button onClick={() => navigate("pod-preview")} type="button">View details</button>
      </div>
    </MobileScreen>
  );
}

function PublicProofScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  const entry = data.roomEntries.find((item) => item.kind === "activity") ?? data.roomEntries[0]!;
  return (
    <MobileScreen className={styles.themeBuild}>
      <ScreenHeader back onBack={() => navigate("visitor-room")} title="Public proof" trailing="actions" />
      <ScreenBody>
        <div className={styles.proofIdentity}>
          <PreviewAvatar name={entry.author} />
          <span><strong>{entry.author}</strong><small>@{entry.handle} · Occurrence 2</small></span>
          <StatusPill tone="success">Approved</StatusPill>
        </div>
        <section className={styles.proofResult}>
          <span>Public result</span>
          <h2>{entry.body}</h2>
          <p>{entry.result ?? "The activity result is available to public viewers."}</p>
        </section>
        <div className={styles.proofMedia}>
          <Image alt="Shared build evidence" height={480} src="/media/build-proof.jpg" width={720} />
          <small>Shared with the Pod and public visitors</small>
        </div>
        <DisclosureRow icon={<LinkSimple size={19} />} label={artifactDisplayLabel(entry.artifactLabel)} value="Opens outside Pods" />
        <p className={styles.privacyFootnote}>
          Private reviewer evidence, wallet identity, and financial outcomes are never included here.
        </p>
      </ScreenBody>
    </MobileScreen>
  );
}

function ApplicationScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={templateThemeClass[pod.templateId]}>
      <ScreenHeader back onBack={() => navigate("pod-preview")} title="Apply to join" trailing="none" />
      <ScreenBody>
        <div className={styles.progressHeader}><span>Application</span><strong>1 of 2</strong></div>
        <section className={styles.editorialPrompt}>
          <h2>Why do you want to show up for this?</h2>
          <p>The creator uses this answer to understand your intent. Funding happens only after acceptance.</p>
        </section>
        <label className={styles.textAreaField}>
          <span>Your answer</span>
          <textarea defaultValue="I am building the public activity and want a visible daily rhythm with the team." />
          <small>118 of 400</small>
        </label>
        <div className={styles.promiseRow}>
          <ShieldCheck size={22} weight="regular" />
          <span><strong>Applying does not reserve a place</strong><small>A place is secured only after acceptance, funding finality, and roster lock.</small></span>
        </div>
        <PrimaryButton onClick={() => navigate("application-submitted")}>
          Submit application
        </PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function InviteScreen({
  pod,
  creator,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  creator: NativeMomentumPreviewPerson;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={templateThemeClass[pod.templateId]}>
      <ScreenHeader title="Private invitation" trailing="none" />
      <ScreenBody>
        <div className={styles.inviteIdentity}>
          <PreviewAvatar name={creator.avatarSeed} size="large" />
          <span><small>Invited by</small><strong>{creator.displayName}</strong><p>@{creator.handle}</p></span>
        </div>
        <section className={styles.inviteTitle}>
          <StatusPill>Expires in 2 days</StatusPill>
          <h2>{pod.name}</h2>
          <p>{pod.purpose}</p>
        </section>
        <div className={styles.compactStats}>
          <div><strong>{pod.occurrenceCount}</strong><span>Occurrences</span></div>
          <div><strong>{formatNim(pod.totalNim)}</strong><span>Upfront</span></div>
          <div><strong>Creator</strong><span>Reviews proof</span></div>
        </div>
        <div className={styles.disclosureList}>
          <DisclosureRow icon={<Clock size={19} />} label="Schedule and deadlines" value="Review the exact cadence" />
          <DisclosureRow icon={<ImageSquare size={19} />} label="Evidence contract" value="What proof must contain" />
          <DisclosureRow icon={<Receipt size={19} />} label="Settlement outcomes" value="Approved, rejected, protected, and missed" />
        </div>
        <div className={styles.buttonStack}>
          <PrimaryButton onClick={() => navigate("funding")}>Accept and continue</PrimaryButton>
          <SecondaryButton>Decline invitation</SecondaryButton>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function InvalidInviteScreen({ navigate }: { navigate: LegacyNavigate }) {
  return (
    <MobileScreen>
      <ScreenHeader title="Invitation unavailable" trailing="none" />
      <ScreenBody>
        <section className={styles.centeredState}>
          <span className={styles.stateIcon}><LockKey size={30} weight="regular" /></span>
          <h2>This invitation cannot be used.</h2>
          <p>It may have expired, been revoked, or already been accepted. No private Pod details are shown.</p>
          <PrimaryButton onClick={() => navigate("discover")}>Browse public Pods</PrimaryButton>
        </section>
      </ScreenBody>
    </MobileScreen>
  );
}

function ActivityEventCard({
  entry,
  navigate,
  publicMode = false
}: {
  entry: NativeMomentumRoomEntry;
  navigate: LegacyNavigate;
  publicMode?: boolean;
}) {
  return (
    <article className={styles.activityEvent}>
      <header>
        <PreviewAvatar name={entry.author} size="small" />
        <span><strong>{entry.author}</strong><small>{entry.time} · Occurrence 2</small></span>
        <StatusPill tone={entry.status === "approved" ? "success" : entry.status === "rejected" ? "danger" : "warning"}>
          {entry.status === "approved" ? "Approved" : entry.status === "reviewing" ? "Creator review" : entry.status ?? "Locked"}
        </StatusPill>
      </header>
      <div className={styles.activityEventBody}>
        <h3>{entry.body}</h3>
        {entry.result ? <p>{entry.result}</p> : null}
      </div>
      <div className={styles.activityEventPreview}>
        <Image alt="" height={120} src="/media/build-proof.jpg" width={120} />
        <span><strong>{artifactDisplayLabel(entry.artifactLabel)}</strong></span>
        <ArrowRight size={18} weight="bold" />
      </div>
      <button onClick={() => navigate(publicMode ? "public-proof" : "submission-review")} type="button">
        {publicMode ? "Open public proof" : "View your submission"}
        <CaretRight size={17} weight="bold" />
      </button>
    </article>
  );
}

function RoomTimeline({
  data,
  navigate,
  publicMode = false
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
  publicMode?: boolean;
}) {
  return (
    <div className={styles.roomTimeline}>
      <div className={styles.dayDivider}><span>Today</span></div>
      {data.roomEntries.map((entry) => {
        if (entry.kind === "activity") {
          return (
            <ActivityEventCard
              entry={entry}
              key={entry.id}
              navigate={navigate}
              publicMode={publicMode}
            />
          );
        }
        if (entry.kind === "system") {
          return <p className={styles.systemEvent} key={entry.id}>{entry.body}</p>;
        }
        return (
          <div className={styles.messageCluster} key={entry.id}>
            <PreviewAvatar name={entry.author} size="small" />
            <div>
              <span><strong>{entry.author}</strong><small>{entry.time}</small></span>
              <p>{entry.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TodayScreen({
  data,
  pod,
  navigate
}: {
  data: NativeMomentumPreviewData;
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={templateThemeClass[pod.templateId]}>
      <ScreenHeader avatar={data.viewer.avatarSeed} title="Today" subtitle={`Good evening, ${data.viewer.displayName}`} trailing="bell" />
      <ScreenBody>
        <section className={styles.todayHero}>
          <div className={styles.todayHeroTop}>
            <span><i />Commitment window open</span>
            <strong>8h 24m</strong>
          </div>
          <div className={styles.todayVisual}>
            <Image alt="" height={360} priority src={templateMedia[pod.templateId]} width={640} />
            <div />
          </div>
          <div className={styles.todayCopy}>
            <small>{pod.name} · Occurrence 2 of {pod.occurrenceCount}</small>
            <h2>What will you move forward today?</h2>
            <p>Lock one concrete task before the commitment window closes.</p>
          </div>
          <PrimaryButton onClick={() => navigate("commitment")}>Start commitment</PrimaryButton>
        </section>
        <div className={styles.todayContext}>
          <div><span>Current streak</span><strong>2 occurrences</strong></div>
          <div><span>Activity slice</span><strong>{formatNim(pod.totalNim / Math.max(pod.occurrenceCount, 1))}</strong></div>
          <button onClick={() => navigate("room")} type="button">Open room <CaretRight size={15} /></button>
        </div>
      </ScreenBody>
      <BottomNav active="today" navigate={navigate} />
    </MobileScreen>
  );
}

function MyPodsScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  const first = data.pods[0]!;
  return (
    <MobileScreen>
      <ScreenHeader title="My Pods" trailing="actions" />
      <ScreenBody>
        <SectionHeading eyebrow="Next action" title="Active" />
        <div className={styles.rowList}>
          <PodRow onClick={() => navigate("today")} pod={first} relationship="Commitment window open · 8h 24m" />
        </div>
        <SectionHeading eyebrow="Money moving" title="Funding and returns" />
        <div className={styles.rowList}>
          <PodRow onClick={() => navigate("funding")} pod={{ ...first, name: "Night Run Club", templateId: "fitness" }} relationship="Funding final · Waiting for roster lock" />
          <PodRow onClick={() => navigate("refund")} pod={{ ...first, name: "Reading Reset", templateId: "reading", stage: "recent" }} relationship={`${formatNim(data.finance.returnedNim)} returned · Receipt ready`} />
        </div>
        <SectionHeading eyebrow="History" title="Completed" />
        <div className={styles.rowList}>
          <PodRow onClick={() => navigate("settlement")} pod={{ ...first, name: "Three-Day Shipping Sprint", stage: "recent" }} relationship={`${formatNim(data.finance.payoutNim)} paid · View settlement`} />
        </div>
      </ScreenBody>
      <BottomNav active="pods" navigate={navigate} />
    </MobileScreen>
  );
}

function FinancialJourney({
  kind,
  data,
  navigate
}: {
  kind: "funding" | "refund" | "settlement";
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  const config = kind === "funding"
    ? {
        eyebrow: "Place secured",
        title: formatNim(data.finance.commitmentNim),
        copy: "Your finalized deposit is credited and included in the locked roster.",
        stages: ["Wallet", "Submitted", "Finalized", "Secured"],
        current: 3,
        tone: "success" as const
      }
    : kind === "refund"
      ? {
          eyebrow: "Return confirmed",
          title: formatNim(data.finance.returnedNim),
          copy: "Your protected principal has returned to the funding wallet.",
          stages: ["Queued", "Prepared", "Submitted", "Confirmed"],
          current: 3,
          tone: "success" as const
        }
      : {
          eyebrow: "Final payout",
          title: formatNim(data.finance.payoutNim),
          copy: `${formatNim(data.finance.commitmentNim)} principal plus ${formatNim(data.finance.bonusNim)} earned bonus.`,
          stages: ["Calculated", "Prepared", "Submitted", "Paid"],
          current: 3,
          tone: "success" as const
        };
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("my-pods")} title={kind === "funding" ? "Funding" : kind === "refund" ? "Refund" : "Settlement"} trailing="actions" />
      <ScreenBody>
        <section className={`${styles.financialHero} ${styles[`financial-${config.tone}`]}`}>
          <CheckCircle size={32} weight="fill" />
          <span>{config.eyebrow}</span>
          <h2>{config.title}</h2>
          <p>{config.copy}</p>
        </section>
        <ol className={styles.compactTimeline}>
          {config.stages.map((stage, index) => (
            <li className={index <= config.current ? styles.timelineComplete : ""} key={stage}>
              <i>{index <= config.current ? <Check size={12} weight="bold" /> : null}</i>
              <span>{stage}</span>
            </li>
          ))}
        </ol>
        {kind === "settlement" ? (
          <section className={styles.moneyBreakdown}>
            <div><span>Principal</span><strong>{formatNim(data.finance.commitmentNim)}</strong></div>
            <div><span>Earned bonus</span><strong>+{formatNim(data.finance.bonusNim)}</strong></div>
            <div><span>Total payout</span><strong>{formatNim(data.finance.payoutNim)}</strong></div>
          </section>
        ) : null}
        <div className={styles.disclosureList}>
          <DisclosureRow icon={<Receipt size={19} />} label="Transaction details" value={shortenHash(data.finance.transactionHash)} />
          <DisclosureRow icon={<FileText size={19} />} label={kind === "settlement" ? "Occurrence outcomes" : "Contract and ledger"} value="Open the full record" />
        </div>
        <PrimaryButton onClick={() => navigate(kind === "funding" ? "waiting" : "my-pods")}>
          {kind === "funding" ? "Continue to waiting room" : "Return to My Pods"}
        </PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function WaitingScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={templateThemeClass[pod.templateId]}>
      <ScreenHeader title={pod.name} subtitle="Waiting for roster lock" trailing="actions" />
      <ScreenBody>
        <section className={styles.waitingHero}>
          <span className={styles.waitingSignal}><Clock size={26} weight="regular" /></span>
          <StatusPill tone="warning">Funding complete</StatusPill>
          <h2>Your place is funded.</h2>
          <p>The roster locks when the cutoff is evaluated. Your deposit remains protected until then.</p>
        </section>
        <div className={styles.compactStats}>
          <div><strong>2 of 5</strong><span>Funded</span></div>
          <div><strong>18m</strong><span>To cutoff</span></div>
          <div><strong>Jul 27</strong><span>Starts</span></div>
        </div>
        <div className={styles.disclosureList}>
          <DisclosureRow icon={<Users size={19} />} label="Funded roster" value="2 participants confirmed" />
          <DisclosureRow icon={<Clock size={19} />} label="Activity schedule" value={`${pod.occurrenceCount} occurrences`} />
          <DisclosureRow icon={<FileText size={19} />} label="Frozen contract" value="Review financial and proof rules" />
        </div>
        <PrimaryButton onClick={() => navigate("room")}>Open Pod room</PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function RoomScreen({
  data,
  pod,
  navigate
}: {
  data: NativeMomentumPreviewData;
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={`${styles.roomScreen} ${templateThemeClass[pod.templateId]}`}>
      <ScreenHeader avatar={pod.name} title={pod.name} subtitle={`${pod.minParticipants} members · Live`} trailing="actions" />
      <div className={styles.occurrenceStrip}>
        <span><i />Proof window open</span>
        <strong>8h 24m left</strong>
      </div>
      <RoomTimeline data={data} navigate={navigate} />
      <div className={styles.composer}>
        <IconButton label="Add proof or attachment"><Plus size={24} weight="regular" /></IconButton>
        <label><span className={styles.srOnly}>Message</span><textarea aria-label="Message" placeholder="Message" rows={1} /></label>
        <button aria-label="Send message" type="button"><PaperPlaneTilt size={20} weight="fill" /></button>
      </div>
    </MobileScreen>
  );
}

function WizardHeader({
  current,
  total,
  label,
  onClose
}: {
  current: number;
  total: number;
  label: string;
  onClose: () => void;
}) {
  return (
    <header className={styles.wizardHeader}>
      <button aria-label="Close flow" onClick={onClose} type="button"><X size={19} /></button>
      <div><span>{label}</span><strong>{current} of {total}</strong></div>
      <div className={styles.wizardDots}>
        {Array.from({ length: total }, (_, index) => (
          <i className={index < current ? styles.wizardDotActive : ""} key={index} />
        ))}
      </div>
    </header>
  );
}

function CommitmentScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={templateThemeClass[pod.templateId]}>
      <WizardHeader current={1} label="Daily commitment" onClose={() => navigate("today")} total={4} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>{pod.name} · Occurrence 2</span>
          <h2>Name today’s ship</h2>
          <p>Choose one result that can be clearly checked before the proof window closes.</p>
        </section>
        <label className={styles.statementField}>
          <span>I will</span>
          <textarea defaultValue="Ship the compact Pod room and proof entry flow." />
          <div><span>Specific and checkable</span><strong>57 / 240</strong></div>
        </label>
        <div className={styles.suggestionRail}>
          <span>Useful structure</span>
          <button type="button">Ship a pull request</button>
          <button type="button">Publish a working URL</button>
          <button type="button">Complete a named feature</button>
        </div>
        <div className={styles.commitmentConsequence}>
          <ShieldCheck size={21} />
          <span><strong>This task locks for occurrence 2</strong><small>It cannot be replaced with an easier task after the deadline.</small></span>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}>
        <PrimaryButton onClick={() => navigate("proof-type")}>Continue to proof type</PrimaryButton>
      </div>
    </MobileScreen>
  );
}

function ProofTypeScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  const choices = [
    { icon: LinkSimple, title: "Public artifact", copy: "Pull request, deployment, or public document", selected: true },
    { icon: ImageSquare, title: "Image evidence", copy: "A clear screenshot or camera capture", selected: false },
    { icon: FileText, title: "Written result", copy: "A concise result the creator can inspect", selected: false }
  ];
  return (
    <MobileScreen>
      <WizardHeader current={2} label="Daily proof" onClose={() => navigate("today")} total={4} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Proof format</span>
          <h2>Choose the clearest proof</h2>
          <p>Pick the format that makes your locked result easiest to verify.</p>
        </section>
        <div className={styles.selectionList}>
          {choices.map(({ icon: Icon, title, copy, selected }) => (
            <button aria-pressed={selected} key={title} type="button">
              <i><Icon size={21} /></i>
              <span><strong>{title}</strong><small>{copy}</small></span>
              <b>{selected ? <Check size={14} weight="bold" /> : null}</b>
            </button>
          ))}
        </div>
      </ScreenBody>
      <div className={styles.actionDock}>
        <PrimaryButton onClick={() => navigate("proof-evidence")}>Continue to evidence</PrimaryButton>
      </div>
    </MobileScreen>
  );
}

function ProofEvidenceScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <WizardHeader current={3} label="Daily proof" onClose={() => navigate("today")} total={4} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Evidence</span>
          <h2>Add what the creator can verify</h2>
          <p>Your public artifact and reviewer evidence have separate visibility.</p>
        </section>
        <label className={styles.urlField}>
          <span>Public artifact URL</span>
          <div><LinkSimple size={18} /><input defaultValue="https://github.com/18Abhinav07/Pods/pull/184" /></div>
          <small>Visible to the Pod and public visitors when public sharing is enabled.</small>
        </label>
        <section className={styles.uploadSurface}>
          <div><ImageSquare size={26} weight="regular" /><span><strong>Screenshot attached</strong><small>build-proof.jpg · 1.8 MB</small></span></div>
          <Image alt="Attached reviewer evidence" height={480} src="/media/build-proof.jpg" width={720} />
          <div className={styles.visibilityChoice}>
            <button aria-pressed="true" type="button"><Check size={13} weight="bold" />Creator only</button>
            <button aria-pressed="false" type="button">Share with Pod</button>
          </div>
        </section>
        <div className={styles.privacyFootnote}>
          The creator can inspect all reviewer evidence. Other members see only attachments you explicitly share.
        </div>
      </ScreenBody>
      <div className={styles.actionDock}>
        <PrimaryButton onClick={() => navigate("proof-review")}>Review submission</PrimaryButton>
      </div>
    </MobileScreen>
  );
}

function ProofReviewScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <WizardHeader current={4} label="Daily proof" onClose={() => navigate("today")} total={4} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Final check</span>
          <h2>Ready for creator review</h2>
          <p>Your locked task and evidence cannot be changed after submission.</p>
        </section>
        <section className={styles.reviewSheet}>
          <div><span>Locked task</span><strong>Ship the compact Pod room and proof entry flow.</strong></div>
          <div><span>Public artifact</span><strong>Pull request 184</strong></div>
          <div><span>Reviewer evidence</span><strong>1 creator-only image</strong></div>
          <div><span>Public sharing</span><strong>Artifact only</strong></div>
        </section>
        <div className={styles.commitmentConsequence}>
          <Clock size={21} />
          <span><strong>Creator review targets 12 hours</strong><small>Principal becomes timeout-protected if no first decision arrives within 24 hours.</small></span>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}>
        <PrimaryButton onClick={() => navigate("submission-review")}>Submit proof</PrimaryButton>
      </div>
    </MobileScreen>
  );
}

function SubmissionStatusScreen({
  approved,
  data,
  navigate
}: {
  approved: boolean;
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("room")} title="Submission" trailing="actions" />
      <ScreenBody>
        <section className={`${styles.outcomeHero} ${approved ? styles.outcomeApproved : ""}`}>
          <span>{approved ? <CheckCircle size={28} weight="fill" /> : <Clock size={28} weight="regular" />}</span>
          <small>Occurrence 2</small>
          <h2>{approved ? "Work approved" : "Creator review in progress"}</h2>
          <p>{approved ? "This occurrence counts toward your completion and bonus eligibility." : "Your creator is checking the proof against your locked task."}</p>
        </section>
        <div className={styles.outcomeFacts}>
          <div><PreviewAvatar name={data.people[0]?.avatarSeed ?? "Creator"} size="small" /><span><small>Reviewer</small><strong>{data.people[0]?.displayName ?? "Pod creator"}</strong></span></div>
          <div><Eye size={19} /><span><small>Proof audience</small><strong>Creator only</strong></span></div>
        </div>
        <section className={styles.proofRecord}>
          <SectionHeading eyebrow="Proof record" title="What you submitted" />
          <div><span>Commitment</span><strong>Ship the compact Pod room and proof entry flow.</strong></div>
          <div><span>Result</span><strong>The responsive room and submission path are ready.</strong></div>
          <DisclosureRow icon={<LinkSimple size={19} />} label="Pull request 184" value="Public artifact" />
          <div className={styles.proofThumb}><Image alt="Reviewer evidence" height={120} src="/media/build-proof.jpg" width={120} /><span>Shared with your creator</span></div>
        </section>
        <DisclosureRow icon={<Clock size={19} />} label="Decision history" value={approved ? "Approved at 10:52 PM" : "Protection applies at 10:47 PM tomorrow"} />
        <PrimaryButton onClick={() => navigate(approved ? "room" : "creator-reviewing")}>
          {approved ? "Return to Pod room" : "Track review status"}
        </PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function ProofRejectedScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Proof Rejected" trailing="actions" />
      <ScreenBody>
        <section className={styles.outcomeHero}>
          <span><X size={28} weight="bold" /></span>
          <small>Occurrence 2</small>
          <h2>Proof does not meet the locked commitment.</h2>
          <p>The participant sees the creator decision and the occurrence is no longer bonus eligible.</p>
        </section>
        <PrimaryButton onClick={() => navigate("review-queue")}>
          Return to review queue
        </PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function UpdatesScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  const groups = [
    {
      label: "Today",
      items: [
        { icon: CheckCircle, title: "Proof approved", detail: `${pod.name} · Occurrence 2`, time: "10:52 PM", screen: "submission-approved" as ScreenId },
        { icon: ChatCircleDots, title: "New reply in the room", detail: `${pod.name} · Ari replied`, time: "10:45 PM", screen: "room" as ScreenId }
      ]
    },
    {
      label: "Financial",
      items: [
        { icon: Receipt, title: "Payout confirmed", detail: `${formatNim(0.4)} returned to your wallet`, time: "Yesterday", screen: "settlement" as ScreenId }
      ]
    }
  ];
  return (
    <MobileScreen>
      <ScreenHeader title="Updates" trailing="actions" />
      <ScreenBody>
        {groups.map((group) => (
          <section className={styles.updateGroup} key={group.label}>
            <h2>{group.label}</h2>
            {group.items.map(({ icon: Icon, title, detail, time, screen }) => (
              <button key={title} onClick={() => navigate(screen)} type="button">
                <i><Icon size={19} weight="regular" /></i>
                <span><strong>{title}</strong><small>{detail}</small></span>
                <time>{time}</time>
              </button>
            ))}
          </section>
        ))}
      </ScreenBody>
    </MobileScreen>
  );
}

function MembersScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("room")} title="Members" trailing="actions" />
      <ScreenBody>
        <SectionHeading eyebrow="Locked roster" title={`${data.people.length + 1} people`} />
        <div className={styles.memberList}>
          <div><PreviewAvatar name={data.viewer.avatarSeed} /><span><strong>{data.viewer.displayName}</strong><small>@{data.viewer.handle} · 2 occurrence streak</small></span><b>2 / 3</b></div>
          {data.people.map((person, index) => (
            <div key={person.handle}><PreviewAvatar name={person.avatarSeed} /><span><strong>{person.displayName}</strong><small>@{person.handle} · {index + 1} occurrence streak</small></span><b>{index + 1} / 3</b></div>
          ))}
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function RulesScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("room")} title="Pod contract" trailing="actions" />
      <ScreenBody>
        <section className={styles.contractIntro}>
          <StatusPill tone="success">Frozen</StatusPill>
          <h2>{pod.name}</h2>
          <p>This contract was frozen before applications and funding. It cannot be changed for this Pod.</p>
        </section>
        <div className={styles.contractSummary}>
          <div><span>Activity</span><strong>{templateLabel[pod.templateId]}</strong></div>
          <div><span>Schedule</span><strong>{pod.occurrenceCount} occurrences · Asia/Kolkata</strong></div>
          <div><span>Commitment</span><strong>{formatNim(pod.totalNim)} upfront</strong></div>
          <div><span>Review</span><strong>Pod creator · No peer vote</strong></div>
        </div>
        <div className={styles.disclosureList}>
          <DisclosureRow icon={<Clock size={19} />} label="Occurrence windows" value="Commitment, evidence, and review deadlines" />
          <DisclosureRow icon={<ImageSquare size={19} />} label="Evidence requirements" value="Template fields and examples" />
          <DisclosureRow icon={<Receipt size={19} />} label="Settlement outcomes" value="Approved, protected, rejected, and missed" />
          <DisclosureRow icon={<ShieldCheck size={19} />} label="Custody and timeout protection" value="Treasury and reviewer inactivity terms" />
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function CreatorCommandScreen({
  data,
  pod,
  navigate
}: {
  data: NativeMomentumPreviewData;
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader avatar={data.viewer.avatarSeed} title={pod.name} subtitle="Creator controls" trailing="actions" />
      <ScreenBody>
        <section className={styles.creatorPriority}>
          <div><span><i />Needs attention</span><strong>2 proofs</strong></div>
          <h2>Review today’s work before the decision window closes.</h2>
          <p>Oldest review reaches its 12-hour target in 46 minutes.</p>
          <PrimaryButton onClick={() => navigate("review-queue")}>Review proofs</PrimaryButton>
        </section>
        <div className={styles.creatorSnapshot}>
          <div><strong>3</strong><span>Participants</span></div>
          <div><strong>2</strong><span>Approved today</span></div>
          <div><strong>{formatNim(data.finance.commitmentNim * 3)}</strong><span>Participant pool</span></div>
        </div>
        <SectionHeading eyebrow="Manage" title="Pod controls" />
        <div className={styles.disclosureList}>
          <DisclosureRow icon={<Users size={19} />} label="Applications" value="2 waiting" />
          <DisclosureRow icon={<Wallet size={19} />} label="Funding and roster" value="3 funded · Roster locked" />
          <DisclosureRow icon={<ChatCircleDots size={19} />} label="Room controls" value="Announcements, pins, and archive" />
          <DisclosureRow icon={<FileText size={19} />} label="Frozen contract" value="Read-only after publication" />
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function ApplicationsScreen({
  applications,
  navigate
}: {
  applications: PreviewApplicationRecord[];
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("command-center")} title="Applications" trailing="actions" />
      <ScreenBody>
        <div className={styles.queueSummary}><span>2 waiting</span><strong>Decide before funding cutoff</strong></div>
        {applications.map((application) => (
          <article className={styles.applicationCard} key={application.id}>
            <div className={styles.applicationIdentity}>
              <PreviewAvatar name={application.person.avatarSeed} />
              <span><strong>{application.person.displayName}</strong><small>@{application.person.handle}</small></span>
              <button aria-label={`More actions for ${application.person.displayName}`} type="button"><DotsThree size={20} weight="bold" /></button>
            </div>
            <p>{application.person.bio}</p>
            <DisclosureRow
              icon={<FileText size={18} />}
              label="Application answers"
              value={`${application.responseCount} ${
                application.responseCount === 1 ? "response" : "thoughtful responses"
              }`}
            />
            <PrimaryButton
              ariaLabel={`Review ${application.person.displayName}'s application`}
              icon={false}
              onClick={() =>
                navigate("application-detail", {
                  applicationId: application.id,
                  personHandle: application.person.handle
                })
              }
            >
              Review application
            </PrimaryButton>
          </article>
        ))}
      </ScreenBody>
    </MobileScreen>
  );
}

function ApplicationDetailScreen({
  application,
  navigate
}: {
  application: PreviewApplicationRecord;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader
        back
        onBack={() => navigate("applications")}
        title={`${application.person.displayName}'s application`}
        trailing="actions"
      />
      <ScreenBody>
        <article className={styles.applicationCard}>
          <div className={styles.applicationIdentity}>
            <PreviewAvatar name={application.person.avatarSeed} />
            <span>
              <strong>{application.person.displayName}</strong>
              <small>@{application.person.handle}</small>
            </span>
          </div>
          <p>{application.person.bio}</p>
          <div className={styles.reviewComparison}>
            <div>
              <span>Why this Pod?</span>
              <strong>{application.motivation}</strong>
            </div>
            <div>
              <span>Applied</span>
              <strong>{application.appliedAt}</strong>
            </div>
          </div>
        </article>
        <SecondaryButton>Decline application</SecondaryButton>
        <PrimaryButton icon={false}>Accept applicant</PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function CreatorFundingScreen({
  data,
  pod,
  navigate
}: {
  data: NativeMomentumPreviewData;
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  const fundedPeople = data.people.filter(
    (person) => person.handle.toLowerCase() !== data.viewer.handle.toLowerCase()
  );
  const members = [
    { name: fundedPeople[0]?.displayName ?? "Noah Mercer", handle: fundedPeople[0]?.handle ?? "noahmercer", status: "Finalized", time: "10:32 PM" },
    { name: fundedPeople[1]?.displayName ?? "Mina Sol", handle: fundedPeople[1]?.handle ?? "minasol", status: "Finalized", time: "10:37 PM" },
    { name: data.viewer.displayName, handle: data.viewer.handle, status: "Creator · No funding", time: "Verifier" }
  ];
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("command-center")} title="Funding and roster" trailing="actions" />
      <ScreenBody>
        <section className={styles.fundingOverview}>
          <div><span>Funded capacity</span><strong>2 of {pod.maxParticipants}</strong></div>
          <div><span>Cutoff</span><strong>18 minutes</strong></div>
          <div className={styles.capacityBar}><i style={{ width: "42%" }} /></div>
          <p>Finalized chain position determines capacity when the Pod is oversubscribed.</p>
        </section>
        <SectionHeading eyebrow="Recognizable roster" title="People" />
        <div className={styles.fundingPeople}>
          {members.map((member) => (
            <div key={member.handle}>
              <PreviewAvatar name={member.name} size="small" />
              <span><strong>{member.name}</strong><small>@{member.handle}</small></span>
              <b>{member.status}<small>{member.time}</small></b>
            </div>
          ))}
        </div>
        <DisclosureRow icon={<Receipt size={19} />} label="Deposit ledger" value="2 finalized transactions" />
      </ScreenBody>
    </MobileScreen>
  );
}

function ReviewQueueScreen({
  submissions,
  navigate
}: {
  submissions: PreviewSubmissionRecord[];
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("command-center")} title="Review queue" trailing="actions" />
      <ScreenBody>
        <section className={styles.reviewQueueLead}>
          <span>2</span>
          <div>
            <small>Simulated journey actors</small>
            <h2>Oldest first</h2>
            <p>One proof reaches its 12-hour target in 46 minutes.</p>
          </div>
        </section>
        <div className={styles.reviewQueue}>
          {submissions.map((submission) => (
            <button
              aria-label={`Review ${submission.person.displayName}'s submission`}
              key={submission.id}
              onClick={() =>
                navigate("review-proof", {
                  personHandle: submission.person.handle,
                  submissionId: submission.id
                })
              }
              type="button"
            >
              <PreviewAvatar name={submission.person.avatarSeed} />
              <span><small>Occurrence {submission.occurrence}</small><strong>{submission.person.displayName}</strong><p>{submission.commitment}</p></span>
              <time>{submission.age}</time>
              <CaretRight size={16} weight="bold" />
            </button>
          ))}
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function ReviewProofScreen({
  submission,
  navigate
}: {
  submission: PreviewSubmissionRecord;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={styles.themeBuild}>
      <ScreenHeader back onBack={() => navigate("review-queue")} title="Review proof" trailing="actions" />
      <ScreenBody>
        <div className={styles.reviewPerson}>
          <PreviewAvatar name={submission.person.avatarSeed} />
          <span><strong>{submission.person.displayName}</strong><small>@{submission.person.handle} · Occurrence {submission.occurrence}</small></span>
          <StatusPill tone="warning">{submission.age} open</StatusPill>
        </div>
        <section className={styles.reviewComparison}>
          <div><span>Locked commitment</span><strong>{submission.commitment}</strong></div>
          <div><span>Submitted result</span><strong>{submission.result}</strong></div>
        </section>
        <div className={styles.reviewEvidence}>
          <Image alt="Creator-only build workspace evidence" height={480} src="/media/build-workspace.jpg" width={720} />
          <span><LockKey size={16} /><strong>Creator only</strong></span>
        </div>
        <DisclosureRow icon={<LinkSimple size={19} />} label={submission.artifactLabel} />
        <button className={styles.optionalNote} type="button">Add a private review note <Plus size={16} /></button>
        <div className={styles.stickyActionSpacer} />
      </ScreenBody>
      <div className={styles.decisionDock}>
        <SecondaryButton onClick={() => navigate("proof-rejected")}>
          Reject proof
        </SecondaryButton>
        <PrimaryButton
          icon={false}
          onClick={() => navigate("proof-approved")}
        >
          Approve proof
        </PrimaryButton>
      </div>
    </MobileScreen>
  );
}

function CreatorSettlementScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  const people = [
    { ...data.people[0]!, amount: data.finance.payoutNim, result: "3 approved" },
    { ...data.people[1]!, amount: data.finance.returnedNim, result: "1 approved · 2 missed" }
  ];
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("command-center")} title="Settlement" trailing="actions" />
      <ScreenBody>
        <section className={styles.conservationHero}>
          <CheckCircle size={28} weight="fill" />
          <span>Treasury conserved</span>
          <h2>{formatNim(data.finance.payoutNim + data.finance.returnedNim)}</h2>
          <p>Deposited and allocated amounts match exactly in integer Luna.</p>
        </section>
        <div className={styles.settlementPeople}>
          {people.map((person) => (
            <div key={person.handle}>
              <PreviewAvatar name={person.avatarSeed} size="small" />
              <span><strong>{person.displayName}</strong><small>{person.result}</small></span>
              <b>{formatNim(person.amount)}<small>Confirmed</small></b>
            </div>
          ))}
        </div>
        <div className={styles.disclosureList}>
          <DisclosureRow icon={<TrendUp size={19} />} label="Conservation record" value="Deposits equal payouts" />
          <DisclosureRow icon={<Receipt size={19} />} label="Transfer ledger" value="2 confirmed payout legs" />
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function PrivateProfileScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Profile" trailing="actions" />
      <ScreenBody>
        <section className={styles.profileIdentity}>
          <PreviewAvatar name={data.viewer.avatarSeed} size="large" />
          <div><span>@{data.viewer.handle}</span><h2>{data.viewer.displayName}</h2><p>Building Pods in public, one honest commitment at a time.</p></div>
        </section>
        <div className={styles.profileCounts}>
          <button type="button"><strong>{data.people.length}</strong><span>Following</span></button>
          <button type="button"><strong>1</strong><span>Friend</span></button>
          <button type="button"><strong>2</strong><span>Public Pods</span></button>
        </div>
        <SectionHeading eyebrow="Momentum" title="Your activity" />
        <div className={styles.milestoneRail}>
          <article><span>Current streak</span><strong>3</strong><small>occurrences</small></article>
          <article><span>Completion</span><strong>78%</strong><small>public Pods</small></article>
        </div>
        <SectionHeading
          eyebrow="Connections"
          title="Recent people"
          action={<button className={styles.inlineAction} onClick={() => navigate("people-search")} type="button">Find people</button>}
        />
        <div className={styles.avatarRail}>
          {data.people.map((person) => (
            <button
              key={person.handle}
              onClick={() =>
                navigate("public-profile", {
                  personHandle: person.handle
                })
              }
              type="button"
            >
              <PreviewAvatar name={person.avatarSeed} />
              <span>{person.displayName.split(" ")[0]}</span>
            </button>
          ))}
          <button onClick={() => navigate("people-search")} type="button"><span className={styles.addPerson}><Plus size={20} /></span><span>Search</span></button>
        </div>
        <div className={styles.disclosureList}>
          <DisclosureRow icon={<GearSix size={19} />} label="Profile and privacy settings" value="Public identity, messages, and wallet" />
          <DisclosureRow icon={<Receipt size={19} />} label="Private financial history" value="Principal, bonus, forfeiture, and transfers" />
        </div>
      </ScreenBody>
      <BottomNav active="messages" navigate={navigate} />
    </MobileScreen>
  );
}

function PublicProfileScreen({
  person,
  navigate
}: {
  person: NativeMomentumPreviewPerson;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("people-search")} title={`@${person.handle}`} trailing="actions" />
      <ScreenBody flush>
        <section className={styles.publicProfileHero}>
          <div className={styles.publicPortrait}><PreviewAvatar name={person.avatarSeed} size="hero" /></div>
          <div className={styles.publicProfileCopy}>
            <span>@{person.handle}</span>
            <h2>{person.displayName}</h2>
            <p>{person.bio}</p>
            <div><button type="button"><strong>12</strong><small>Followers</small></button><button type="button"><strong>7</strong><small>Following</small></button><button className={styles.followButton} type="button">Follow <Plus size={16} /></button></div>
          </div>
        </section>
        <div className={styles.insetContent}>
          <SectionHeading eyebrow="Public momentum" title="Earned milestones" />
          <div className={styles.badgeList}>
            <article><span><Sparkle size={21} weight="fill" /></span><div><strong>7-occurrence streak</strong><small>Earned in Build & Ship</small></div></article>
            <article><span><CheckCircle size={21} weight="fill" /></span><div><strong>First public Pod completed</strong><small>Completed with 86% consistency</small></div></article>
          </div>
          <PrimaryButton onClick={() => navigate("direct-message")}>Message {person.displayName.split(" ")[0]}</PrimaryButton>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function PeopleSearchScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("private-profile")} title="Find people" trailing="none" />
      <ScreenBody>
        <label className={styles.peopleSearch}>
          <MagnifyingGlass size={19} />
          <input defaultValue="a" aria-label="Search handles or names" />
          <button aria-label="Clear search" type="button"><X size={16} /></button>
        </label>
        <SectionHeading eyebrow="Database profiles" title={`${data.people.length} people`} />
        <div className={styles.personList}>
          {data.people.map((person) => (
            <PersonRow
              key={person.handle}
              onClick={() =>
                navigate("public-profile", {
                  personHandle: person.handle
                })
              }
              person={person}
            />
          ))}
        </div>
        <p className={styles.privacyFootnote}>Only opted-in public profiles appear in search.</p>
      </ScreenBody>
    </MobileScreen>
  );
}

function MessagesScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Messages" trailing="actions" />
      <ScreenBody>
        <div className={styles.segmentControl}>
          <button aria-pressed="true" type="button">People</button>
          <button aria-pressed="false" onClick={() => navigate("requests")} type="button">Requests <span>2</span></button>
        </div>
        <div className={styles.conversationList}>
          {data.people.map((person, index) => (
            <button key={person.handle} onClick={() => navigate("direct-message")} type="button">
              <span className={styles.conversationAvatar}><PreviewAvatar name={person.avatarSeed} />{index === 0 ? <i /> : null}</span>
              <span><strong>{person.displayName}</strong><p>{index === 0 ? "The room proof flow feels much clearer now." : "I can review the new activity card tonight."}</p></span>
              <time>{index === 0 ? "10:52" : "9:18"}</time>
            </button>
          ))}
        </div>
      </ScreenBody>
      <BottomNav active="messages" navigate={navigate} />
    </MobileScreen>
  );
}

function RequestsScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("messages")} title="Requests" trailing="actions" />
      <ScreenBody>
        <SectionHeading eyebrow="Message introduction" title="Choose who enters your space" />
        <article className={styles.requestRow}>
          <PreviewAvatar name={data.people[1]?.avatarSeed ?? "Noah"} />
          <span><strong>{data.people[1]?.displayName ?? "Noah Mercer"}</strong><small>@{data.people[1]?.handle ?? "noahmercer"} · 1 shared Pod</small></span>
          <PrimaryButton icon={false}>Accept</PrimaryButton>
          <p>I would like to compare notes on making public activity rooms easier to follow.</p>
          <button aria-label="More request actions" type="button"><DotsThree size={21} weight="bold" /></button>
        </article>
        <SectionHeading eyebrow="Friend request" title="People who want to connect" />
        <article className={styles.requestRow}>
          <PreviewAvatar name={data.people[0]?.avatarSeed ?? "Ari"} />
          <span><strong>{data.people[0]?.displayName ?? "Ari Vale"}</strong><small>@{data.people[0]?.handle ?? "arivale"} · Met in {data.pods[0]?.name ?? "a public Pod"}</small></span>
          <PrimaryButton icon={false}>Accept</PrimaryButton>
          <button aria-label="More friend request actions" type="button"><DotsThree size={21} weight="bold" /></button>
        </article>
      </ScreenBody>
    </MobileScreen>
  );
}

function DirectMessageScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  const peer = data.people[0]!;
  return (
    <MobileScreen className={styles.roomScreen}>
      <ScreenHeader back avatar={peer.avatarSeed} onBack={() => navigate("messages")} title={peer.displayName} subtitle="Active now" trailing="actions" />
      <div className={styles.directTimeline}>
        <div className={styles.dayDivider}><span>Today</span></div>
        <div className={styles.ownBubble}>
          <p>I want the Pod room to feel like a real conversation, not a dashboard feed.</p>
          <span>10:42 PM · Seen</span>
        </div>
        <div className={styles.peerBubble}>
          <PreviewAvatar name={peer.avatarSeed} size="small" />
          <div>
            <span className={styles.replyPreview}><strong>You</strong><small>I want the Pod room to feel like a real conversation...</small></span>
            <p>Agreed. Keep proof as a special message type and let ordinary chat stay light.</p>
            <span>10:47 PM</span>
          </div>
        </div>
      </div>
      <div className={styles.replyComposerContext}><span><strong>Replying to {peer.displayName}</strong><small>Agreed. Keep proof as a special message type...</small></span><button aria-label="Cancel reply" type="button"><X size={16} /></button></div>
      <div className={styles.composer}>
        <IconButton label="Add attachment"><Plus size={24} weight="regular" /></IconButton>
        <label><span className={styles.srOnly}>Message</span><textarea aria-label="Message" defaultValue="That is the balance I want." rows={1} /></label>
        <button aria-label="Send message" className={styles.readySend} type="button"><PaperPlaneTilt size={20} weight="fill" /></button>
      </div>
    </MobileScreen>
  );
}

function TransferQueueScreen({
  transfers,
  navigate
}: {
  transfers: PreviewTransferRecord[];
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Transfer operations" trailing="actions" />
      <ScreenBody>
        <div className={styles.opsFilter}>
          <button aria-pressed="true" type="button">Open <span>3</span></button>
          <button aria-pressed="false" type="button">Manual review</button>
          <button aria-label="Filter transfers" type="button"><FunnelSimple size={18} /></button>
        </div>
        <div className={styles.opsList}>
          {transfers.map((transfer) => (
            <button
              aria-label={`Open ${transfer.state} transfer for ${transfer.pod}`}
              key={transfer.id}
              onClick={() =>
                navigate("transfer-detail", {
                  transferId: transfer.id
                })
              }
              type="button"
            >
              <span><StatusPill tone={transfer.tone}>{transfer.state}</StatusPill><strong>{transfer.pod}</strong><small>{formatNim(transfer.amount)} · Payout leg</small></span>
              <time>{transfer.age}</time>
              <CaretRight size={16} weight="bold" />
            </button>
          ))}
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function TransferDetailScreen({
  data,
  transfer,
  navigate
}: {
  data: NativeMomentumPreviewData;
  transfer: PreviewTransferRecord;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("transfer-queue")} title="Transfer detail" trailing="actions" />
      <ScreenBody>
        <section className={styles.opsDetailHero}>
          <StatusPill tone={transfer.tone}>{transfer.state}</StatusPill>
          <h2>{formatNim(transfer.amount)}</h2>
          <p>{transfer.description}</p>
        </section>
        <div className={styles.opsFacts}>
          <div><span>Pod</span><strong>{transfer.pod}</strong></div>
          <div><span>Network</span><strong>Nimiq Testnet</strong></div>
          <div><span>Transfer leg</span><code>{transfer.leg}</code></div>
          <div><span>Transaction</span><code>{shortenHash(data.finance.transactionHash)}</code></div>
          <div><span>Last checked</span><strong>{transfer.lastChecked}</strong></div>
        </div>
        <div className={styles.operatorNotice}><ShieldCheck size={20} /><span><strong>Retry safety is active</strong><small>The worker must prove absence before creating another broadcast.</small></span></div>
        <PrimaryButton icon={false}>Reconcile on chain</PrimaryButton>
        <SecondaryButton>Move to manual review</SecondaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function PublicSafetyScreen({
  data
}: {
  data: NativeMomentumPreviewData;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Public safety" trailing="actions" />
      <ScreenBody>
        <div className={styles.opsFilter}>
          <button aria-pressed="true" type="button">Pending <span>2</span></button>
          <button aria-pressed="false" type="button">Resolved</button>
        </div>
        <article className={styles.reportCard}>
          <div><Flag size={20} /><span><small>Reported public proof</small><strong>{data.pods[0]?.name ?? "Pods in Pods"}</strong></span><time>12m</time></div>
          <p>The artifact opens an unrelated destination and may be misleading.</p>
          <DisclosureRow icon={<Eye size={18} />} label="Inspect reported content" value="Public submission · Occurrence 2" />
          <PrimaryButton icon={false}>Open moderation review</PrimaryButton>
        </article>
        <article className={styles.reportCard}>
          <div><Flag size={20} /><span><small>Reported message</small><strong>Night Run Club</strong></span><time>48m</time></div>
          <p>A visitor reported a room message for harassment.</p>
          <PrimaryButton icon={false}>Open moderation review</PrimaryButton>
        </article>
      </ScreenBody>
    </MobileScreen>
  );
}

function LandingScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen className={styles.landingScreen}>
      <header className={styles.landingHeader}>
        <span className={styles.previewWordmark}><i />pods</span>
        <button onClick={() => navigate("discover")} type="button">Pods</button>
        <button onClick={() => navigate("connect")} type="button">Wallet</button>
      </header>
      <div className={styles.landingComposition}>
        <div className={styles.landingPortrait}><Image alt="" height={360} priority src="/media/fitness.jpg" width={280} /></div>
        <div className={styles.landingPortrait}><Image alt="" height={360} priority src="/media/reading.jpg" width={280} /></div>
        <div className={styles.landingPortrait}><Image alt="" height={360} priority src="/media/build-workspace.jpg" width={280} /></div>
        <span className={styles.landingOrbit}><i /><i /><i /></span>
      </div>
      <section className={styles.landingCopy}>
        <span>Earned momentum</span>
        <h1>Show up together.</h1>
        <p>Lock a small NIM commitment, share visible work, and turn repeated activity into a group rhythm.</p>
        <PrimaryButton onClick={() => navigate("connect")}>Connect wallet</PrimaryButton>
      </section>
    </MobileScreen>
  );
}

function ConnectScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Wallet" trailing="none" />
      <ScreenBody>
        <section className={styles.walletHero}>
          <span><Wallet size={32} weight="regular" /></span>
          <small>Nimiq Pay</small>
          <h2>Your wallet is your Pods account.</h2>
          <p>Connect and sign one message. Pods never asks for your private key.</p>
        </section>
        <div className={styles.walletFacts}>
          <div><ShieldCheck size={19} /><span><strong>One-time signature</strong><small>Proves wallet ownership without a password.</small></span></div>
          <div><Eye size={19} /><span><strong>Private by default</strong><small>Your wallet address never appears on social profiles.</small></span></div>
        </div>
        <PrimaryButton onClick={() => navigate("signature-waiting")}>
          Connect Nimiq wallet
        </PrimaryButton>
        <p className={styles.testnetNote}>Testnet beta. Test NIM has no real-world value.</p>
      </ScreenBody>
    </MobileScreen>
  );
}

function SignatureWaitingScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Wallet confirmation" trailing="none" />
      <ScreenBody>
        <section className={styles.outcomeHero}>
          <span><Wallet size={28} weight="regular" /></span>
          <small>Wallet handoff</small>
          <h2>Confirm in Nimiq Pay</h2>
          <p>Pods will continue as soon as the signed wallet response returns.</p>
        </section>
        <PrimaryButton onClick={() => navigate("profile-identity")}>
          Preview signed response
        </PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function ProfileIdentityScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <WizardHeader current={1} label="Set up profile" onClose={() => navigate("landing")} total={3} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Your identity</span>
          <h2>Make your work recognizable</h2>
          <p>This is how people see you in rooms, applications, and public activity.</p>
        </section>
        <label className={styles.inputField}><span>Display name</span><input defaultValue={data.viewer.displayName} /></label>
        <label className={styles.inputField}><span>Handle</span><div><b>@</b><input defaultValue={data.viewer.handle} /></div><small>Available</small></label>
        <label className={styles.textAreaField}><span>Short bio</span><textarea defaultValue="Building Pods in public, one honest commitment at a time." /><small>62 of 160</small></label>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("profile-avatar")}>Choose an avatar</PrimaryButton></div>
    </MobileScreen>
  );
}

function ProfileAvatarScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: LegacyNavigate;
}) {
  const bundledNames = [
    "Ari Vale",
    "Noah Mercer",
    "Mina Sol",
    "Theo North",
    "Sora Finch",
    "Kei Rowan",
    "Lina Moss",
    "Ivo Hart",
    "Nera Bloom",
    "Rio Ash",
    "Uma Pine",
    "Zia Reed"
  ];
  const names = [
    data.viewer.displayName,
    ...bundledNames.filter(
      (name) => name.toLowerCase() !== data.viewer.displayName.toLowerCase()
    )
  ].slice(0, 12);
  return (
    <MobileScreen>
      <WizardHeader current={2} label="Set up profile" onClose={() => navigate("landing")} total={3} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Your portrait</span>
          <h2>Choose a signal that feels like you</h2>
          <p>Twelve distinct illustrated portraits are bundled with Pods. A real photo upload remains available.</p>
        </section>
        <div className={styles.avatarGrid}>
          {names.map((name, index) => (
            <button aria-pressed={index === 0} key={name} type="button">
              <PreviewAvatar name={name} size="large" />
              {index === 0 ? <i><Check size={14} weight="bold" /></i> : null}
            </button>
          ))}
        </div>
        <SecondaryButton><ImageSquare size={18} /> Upload your own photo</SecondaryButton>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("profile-privacy")}>Continue to privacy</PrimaryButton></div>
    </MobileScreen>
  );
}

function ProfilePrivacyScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <WizardHeader current={3} label="Set up profile" onClose={() => navigate("landing")} total={3} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Your boundaries</span>
          <h2>Choose what people can discover</h2>
          <p>These controls can be changed later. Wallet identity and private Pod activity always remain private.</p>
        </section>
        <div className={styles.flatChoices}>
          <button aria-pressed="true" type="button"><span><strong>Public profile</strong><small>People can search, follow, and see public milestones.</small></span><b><Check size={14} /></b></button>
          <button aria-pressed="false" type="button"><span><strong>Private profile</strong><small>Your handle exists, but profile content stays hidden.</small></span><b /></button>
        </div>
        <div className={styles.choiceSectionTitle}><h2>Who can contact you</h2></div>
        <div className={styles.flatChoices}>
          <button aria-pressed="true" type="button"><span><strong>Friends and requests</strong><small>Non-friends can send one introduction.</small></span><b><Check size={14} /></b></button>
          <button aria-pressed="false" type="button"><span><strong>Friends only</strong><small>Only accepted friends can start a chat.</small></span><b /></button>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}>
        <PrimaryButton onClick={() => navigate("setup-complete")}>
          Enter Pods
        </PrimaryButton>
      </div>
    </MobileScreen>
  );
}

function SetupCompleteScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <ScreenHeader title="Profile ready" trailing="none" />
      <ScreenBody>
        <section className={`${styles.outcomeHero} ${styles.outcomeApproved}`}>
          <span><CheckCircle size={28} weight="fill" /></span>
          <small>Profile ready</small>
          <h2>Your Pods identity is ready.</h2>
          <p>Start with today’s action or browse a public activity.</p>
        </section>
        <PrimaryButton onClick={() => navigate("today")}>
          Enter Pods
        </PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function CreateTemplateScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  const templates: NativeMomentumPreviewPod["templateId"][] = ["build", "fitness", "reading", "study", "create"];
  return (
    <MobileScreen>
      <WizardHeader current={1} label="Create a Pod" onClose={() => navigate("today")} total={5} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Activity contract</span>
          <h2>What kind of momentum are you building?</h2>
          <p>Each template carries its own evidence fields, cadence, and visual rhythm.</p>
        </section>
        <div className={styles.templateList}>
          {templates.map((template, index) => (
            <button aria-pressed={index === 0} key={template} type="button">
              <Image alt="" height={160} src={templateMedia[template]} width={160} />
              <span><strong>{templateLabel[template]}</strong><small>{template === "build" ? "Daily output and public artifacts" : template === "fitness" ? "Movement, distance, or attendance" : template === "reading" ? "Pages, reflections, and consistency" : template === "study" ? "Focused sessions and learning outputs" : "Practice sessions and finished work"}</small></span>
              <b>{index === 0 ? <Check size={14} weight="bold" /> : null}</b>
            </button>
          ))}
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("create-activity")}>Shape the activity</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateActivityScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <WizardHeader current={2} label="Create a Pod" onClose={() => navigate("today")} total={5} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>{templateLabel[pod.templateId]}</span>
          <h2>Give the group a clear rhythm</h2>
          <p>Name the activity, explain why it exists, and choose when people show up.</p>
        </section>
        <label className={styles.inputField}><span>Pod name</span><input defaultValue={pod.name} /></label>
        <label className={styles.textAreaField}><span>Purpose</span><textarea defaultValue={pod.purpose} /></label>
        <div className={styles.cadencePicker}>
          <span>Active weekdays</span>
          <div>{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <button aria-pressed={[0, 2, 4].includes(index)} key={`${day}-${index}`} type="button">{day}</button>)}</div>
        </div>
        <div className={styles.dualFields}>
          <label className={styles.inputField}><span>Starts</span><input defaultValue="Jul 27" /></label>
          <label className={styles.inputField}><span>Ends</span><input defaultValue="Aug 02" /></label>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("create-community")}>Set community access</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateCommunityScreen({
  navigate
}: {
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <WizardHeader current={3} label="Create a Pod" onClose={() => navigate("today")} total={5} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Community access</span>
          <h2>Who gets to take part?</h2>
          <p>Applications and invitations always require creator acceptance before funding.</p>
        </section>
        <div className={styles.flatChoices}>
          <button aria-pressed="true" type="button"><span><strong>Public Pod</strong><small>Listed in Discover. People apply before funding.</small></span><b><Check size={14} /></b></button>
          <button aria-pressed="false" type="button"><span><strong>Private Pod</strong><small>Accessible only through a revocable invitation.</small></span><b /></button>
        </div>
        <section className={styles.visitorChoice}>
          <Eye size={21} />
          <span><strong>Allow read-only visitors</strong><small>Anyone with the link can watch messages and explicitly public proof after roster lock.</small></span>
          <button aria-pressed="true" type="button"><i /></button>
        </section>
        <div className={styles.dualFields}>
          <label className={styles.inputField}><span>Minimum</span><input defaultValue="2" inputMode="numeric" /></label>
          <label className={styles.inputField}><span>Maximum</span><input defaultValue="5" inputMode="numeric" /></label>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("create-commitment")}>Set NIM commitment</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateCommitmentScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  const perOccurrence = pod.totalNim / Math.max(pod.occurrenceCount, 1);
  return (
    <MobileScreen>
      <WizardHeader current={4} label="Create a Pod" onClose={() => navigate("today")} total={5} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>NIM commitment</span>
          <h2>Make showing up matter</h2>
          <p>Participants fund the maximum commitment upfront. You review proof but never fund or receive participant money.</p>
        </section>
        <label className={styles.nimInput}>
          <span>Per occurrence</span>
          <div><input defaultValue={perOccurrence.toFixed(1)} inputMode="decimal" /><strong>NIM</strong></div>
        </label>
        <section className={styles.commitmentEquation}>
          <div><span>Occurrences</span><strong>{pod.occurrenceCount}</strong></div>
          <i>×</i>
          <div><span>Each</span><strong>{formatNim(perOccurrence)}</strong></div>
          <i>=</i>
          <div><span>Maximum upfront</span><strong>{formatNim(pod.totalNim)}</strong></div>
        </section>
        <div className={styles.commitmentConsequence}>
          <Receipt size={21} />
          <span><strong>Proportional Testnet settlement</strong><small>Approved work is bonus-eligible. Protected principal never enters the bonus pool.</small></span>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("create-review")}>Review frozen contract</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateReviewScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: LegacyNavigate;
}) {
  return (
    <MobileScreen>
      <WizardHeader current={5} label="Create a Pod" onClose={() => navigate("today")} total={5} />
      <ScreenBody>
        <section className={styles.publishHero}>
          <span><ShieldCheck size={28} /></span>
          <small>Ready to freeze</small>
          <h2>{pod.name}</h2>
          <p>Publishing creates the occurrence schedule and makes every financial and evidence term immutable.</p>
        </section>
        <div className={styles.contractSummary}>
          <div><span>Template</span><strong>{templateLabel[pod.templateId]}</strong></div>
          <div><span>Schedule</span><strong>{pod.occurrenceCount} occurrences · Mon, Wed, Fri</strong></div>
          <div><span>Community</span><strong>Public · Applications · Visitors allowed</strong></div>
          <div><span>Commitment</span><strong>{formatNim(pod.totalNim)} maximum per participant</strong></div>
          <div><span>Verifier</span><strong>You, the Pod creator</strong></div>
        </div>
        <div className={styles.publishConsent}><button aria-pressed="true" type="button"><Check size={14} /></button><p>I accept the creator-review authority, no-appeal rule, custodial treasury, timeout protection, and exact maximum commitment shown above.</p></div>
        <PrimaryButton onClick={() => navigate("publishing")}>Publish Pod</PrimaryButton>
      </ScreenBody>
    </MobileScreen>
  );
}

function LegacyScreenContent({
  data,
  records,
  screen,
  navigate,
  selected
}: {
  data: NativeMomentumPreviewData;
  records: PreviewRecords;
  screen: ScreenId;
  navigate: LegacyNavigate;
  selected: SelectedEntities;
}) {
  const pod = data.pods.find((candidate) => candidate.id === selected.podId)
    ?? data.pods[0]
    ?? {
    id: "preview-pod",
    name: "Pods in Pods",
    purpose: "Build the accountability product in public with the team.",
    templateId: "build" as const,
    state: "active",
    stage: "live" as const,
    totalNim: 0.3,
    occurrenceCount: 3,
    minParticipants: 2,
    maxParticipants: 5,
    visibility: "public" as const,
    visitorsAllowed: true
  };
  const creator = data.people[0] ?? {
    displayName: "Ari Vale",
    handle: "arivale",
    avatarSeed: "Ari Vale",
    bio: "Shipping small products with careful craft."
  };
  const person = data.people.find(
    (candidate) => candidate.handle === selected.personHandle
  ) ?? data.people[1] ?? creator;
  const application = records.applications.find(
    (candidate) => candidate.id === selected.applicationId
  ) ?? records.applications.find(
    (candidate) => candidate.person.handle === person.handle
  ) ?? {
    id: `application-${person.handle}`,
    person,
    motivation: "I want to build visible momentum with this group.",
    responseCount: 1,
    appliedAt: "Today"
  };
  const submission = records.submissions.find(
    (candidate) => candidate.id === selected.submissionId
  ) ?? records.submissions.find(
    (candidate) => candidate.person.handle === person.handle
  ) ?? {
    id: `submission-${person.handle}`,
    person,
    occurrence: 1,
    commitment: "Complete the locked occurrence work.",
    result: `${person.displayName} submitted the committed work.`,
    artifactLabel: "Shared artifact",
    age: "46m"
  };
  const transfer = records.transfers.find(
    (candidate) => candidate.id === selected.transferId
  ) ?? records.transfers[0]!;

  switch (screen) {
    case "discover": return <DiscoverScreen data={data} navigate={navigate} />;
    case "pod-preview": return <PodPreviewScreen creator={creator} navigate={navigate} pod={pod} />;
    case "visitor-room": return <VisitorRoomScreen data={data} navigate={navigate} pod={pod} />;
    case "public-proof": return <PublicProofScreen data={data} navigate={navigate} />;
    case "apply": return <ApplicationScreen navigate={navigate} pod={pod} />;
    case "invite": return <InviteScreen creator={creator} navigate={navigate} pod={{ ...pod, visibility: "private" }} />;
    case "invalid-invite": return <InvalidInviteScreen navigate={navigate} />;
    case "today": return <TodayScreen data={data} navigate={navigate} pod={pod} />;
    case "my-pods": return <MyPodsScreen data={data} navigate={navigate} />;
    case "funding": return <FinancialJourney data={data} kind="funding" navigate={navigate} />;
    case "waiting": return <WaitingScreen navigate={navigate} pod={pod} />;
    case "room": return <RoomScreen data={data} navigate={navigate} pod={pod} />;
    case "commitment": return <CommitmentScreen navigate={navigate} pod={pod} />;
    case "proof-type": return <ProofTypeScreen navigate={navigate} />;
    case "proof-evidence": return <ProofEvidenceScreen navigate={navigate} />;
    case "proof-review": return <ProofReviewScreen navigate={navigate} />;
    case "submission-review": return <SubmissionStatusScreen approved={false} data={data} navigate={navigate} />;
    case "submission-approved": return <SubmissionStatusScreen approved data={data} navigate={navigate} />;
    case "proof-approved": return <SubmissionStatusScreen approved data={data} navigate={navigate} />;
    case "proof-rejected": return <ProofRejectedScreen navigate={navigate} />;
    case "refund": return <FinancialJourney data={data} kind="refund" navigate={navigate} />;
    case "settlement": return <FinancialJourney data={data} kind="settlement" navigate={navigate} />;
    case "updates": return <UpdatesScreen navigate={navigate} pod={pod} />;
    case "members": return <MembersScreen data={data} navigate={navigate} />;
    case "rules": return <RulesScreen navigate={navigate} pod={pod} />;
    case "command-center": return <CreatorCommandScreen data={data} navigate={navigate} pod={pod} />;
    case "applications": return <ApplicationsScreen applications={records.applications} navigate={navigate} />;
    case "application-detail": return <ApplicationDetailScreen application={application} navigate={navigate} />;
    case "creator-funding": return <CreatorFundingScreen data={data} navigate={navigate} pod={pod} />;
    case "review-queue": return <ReviewQueueScreen navigate={navigate} submissions={records.submissions} />;
    case "review-proof": return <ReviewProofScreen navigate={navigate} submission={submission} />;
    case "creator-settlement": return <CreatorSettlementScreen data={data} navigate={navigate} />;
    case "private-profile": return <PrivateProfileScreen data={data} navigate={navigate} />;
    case "public-profile": return <PublicProfileScreen navigate={navigate} person={person} />;
    case "people-search": return <PeopleSearchScreen data={data} navigate={navigate} />;
    case "messages": return <MessagesScreen data={data} navigate={navigate} />;
    case "requests": return <RequestsScreen data={data} navigate={navigate} />;
    case "direct-message": return <DirectMessageScreen data={data} navigate={navigate} />;
    case "transfer-queue": return <TransferQueueScreen navigate={navigate} transfers={records.transfers} />;
    case "transfer-detail": return <TransferDetailScreen data={data} navigate={navigate} transfer={transfer} />;
    case "public-safety": return <PublicSafetyScreen data={data} />;
    case "landing": return <LandingScreen navigate={navigate} />;
    case "connect": return <ConnectScreen navigate={navigate} />;
    case "signature-waiting": return <SignatureWaitingScreen navigate={navigate} />;
    case "setup-complete": return <SetupCompleteScreen navigate={navigate} />;
    case "profile-identity": return <ProfileIdentityScreen data={data} navigate={navigate} />;
    case "profile-avatar": return <ProfileAvatarScreen data={data} navigate={navigate} />;
    case "profile-privacy": return <ProfilePrivacyScreen navigate={navigate} />;
    case "create-template": return <CreateTemplateScreen navigate={navigate} />;
    case "create-activity": return <CreateActivityScreen navigate={navigate} pod={pod} />;
    case "create-community": return <CreateCommunityScreen navigate={navigate} />;
    case "create-commitment": return <CreateCommitmentScreen navigate={navigate} pod={pod} />;
    case "create-review": return <CreateReviewScreen navigate={navigate} pod={pod} />;
    default:
      throw new Error(`No visual renderer exists for ${String(screen)}`);
  }
}

const LIVE_PUBLIC_SCREENS = new Set<LegacyScreenId>([
  "discover",
  "pod-preview",
  "visitor-room",
  "public-proof",
  "people-search",
  "public-profile"
]);

export function LegacyScreenRenderer({
  data,
  screen,
  navigate,
  selected,
  scenario
}: {
  data: NativeMomentumPreviewData;
  screen: LegacyScreenId;
  navigate: LegacyNavigate;
  selected: SelectedEntities;
  scenario: ScenarioId;
}) {
  const selectedPerson = data.people.find(
    (candidate) => candidate.handle === selected.personHandle
  );
  const selectedPod = data.pods.find(
    (candidate) => candidate.id === selected.podId
  );
  const records = buildPreviewRecords();
  const selectedData = {
    ...data,
    people: selectedPerson
      ? [
          selectedPerson,
          ...data.people.filter(
            (candidate) => candidate.handle !== selectedPerson.handle
          )
        ]
      : data.people,
    pods: selectedPod
      ? [
          selectedPod,
          ...data.pods.filter((candidate) => candidate.id !== selectedPod.id)
        ]
      : data.pods
  };
  const journeyData: NativeMomentumPreviewData = {
    ...selectedData,
    viewer: {
      displayName: PREVIEW_FIXTURE_PROFILE.displayName,
      handle: PREVIEW_FIXTURE_PROFILE.handle,
      avatarSeed: PREVIEW_FIXTURE_PROFILE.avatarSeed
    },
    people: [...JOURNEY_FIXTURE_PEOPLE],
    roomEntries: [...JOURNEY_FIXTURE_ROOM_ENTRIES]
  };

  return (
    <div
      data-preview-scenario={scenario}
      data-testid="legacy-scenario-renderer"
    >
      <LegacyScreenContent
        data={LIVE_PUBLIC_SCREENS.has(screen) ? selectedData : journeyData}
        navigate={navigate}
        records={records}
        screen={screen}
        selected={selected}
      />
    </div>
  );
}
