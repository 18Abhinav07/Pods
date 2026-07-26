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
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useMemo, useState } from "react";

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

type ActorId =
  | "visitor"
  | "participant"
  | "creator"
  | "social"
  | "operations"
  | "onboarding";

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
  | "refund-queued"
  | "refund-prepared"
  | "refund-submitted"
  | "refund-confirming"
  | "refund-review"
  | "refund"
  | "settlement-final-review"
  | "settlement-calculated"
  | "settlement-prepared"
  | "settlement-submitted"
  | "settlement-confirming"
  | "settlement-review"
  | "settlement-zero"
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
  | "profile-identity"
  | "profile-avatar"
  | "profile-privacy"
  | "create-template"
  | "create-activity"
  | "create-community"
  | "create-commitment"
  | "create-review";

export type LegacyScreenId = ScreenId;

type ScreenDefinition = {
  id: ScreenId;
  label: string;
  note: string;
};

type ActorDefinition = {
  id: ActorId;
  label: string;
  description: string;
  screens: ScreenDefinition[];
};

type ProofDraftPreview = {
  format: "artifact" | "image" | "written";
  shareEvidenceWithPod: boolean;
};

type CreateDraftPreview = {
  templateId: NativeMomentumPreviewPod["templateId"];
  name: string;
  purpose: string;
  weekdays: number[];
  starts: string;
  ends: string;
  access: "public" | "private";
  visitorsAllowed: boolean;
  minParticipants: string;
  maxParticipants: string;
  perOccurrenceNim: string;
};

type FinancialJourneyState =
  | "funding-secured"
  | "refund-queued"
  | "refund-prepared"
  | "refund-submitted"
  | "refund-confirming"
  | "refund-review"
  | "refund-confirmed"
  | "settlement-final-review"
  | "settlement-calculated"
  | "settlement-prepared"
  | "settlement-submitted"
  | "settlement-confirming"
  | "settlement-review"
  | "settlement-zero"
  | "settlement-paid";

const actorDefinitions: ActorDefinition[] = [
  {
    id: "visitor",
    label: "Visitor",
    description: "Discovery, public rooms, applications, and private invitations.",
    screens: [
      { id: "discover", label: "Discover", note: "Browse live, open, and recent public Pods." },
      { id: "pod-preview", label: "Pod preview", note: "Understand the group before applying." },
      { id: "visitor-room", label: "Visitor room", note: "Read-only build-in-public experience." },
      { id: "public-proof", label: "Public proof", note: "Sanitized proof for public viewers." },
      { id: "apply", label: "Application", note: "Apply without implying that a place is reserved." },
      { id: "invite", label: "Invitation", note: "Review the frozen contract before accepting." },
      { id: "invalid-invite", label: "Unavailable invite", note: "A safe state that reveals no private Pod data." }
    ]
  },
  {
    id: "participant",
    label: "Participant",
    description: "Daily action, commitment, proof, room, finance, and completion.",
    screens: [
      { id: "today", label: "Today", note: "The single most important action." },
      { id: "my-pods", label: "My Pods", note: "Lifecycle inventory with one next action per row." },
      { id: "funding", label: "Funding", note: "Current financial state first, detail on demand." },
      { id: "waiting", label: "Waiting room", note: "Roster state, cutoff, and next meaningful event." },
      { id: "room", label: "Pod room", note: "Chat-first group activity." },
      { id: "commitment", label: "Commitment", note: "A focused first step with one decision." },
      { id: "proof-type", label: "Proof type", note: "Choose the clearest evidence format." },
      { id: "proof-evidence", label: "Evidence", note: "Separate creator-only and Pod-shared evidence." },
      { id: "proof-review", label: "Review proof", note: "Final check before creator review." },
      { id: "submission-review", label: "Under review", note: "Outcome, reviewer, and audience without repetition." },
      { id: "submission-approved", label: "Approved", note: "A concise success state and earned momentum." },
      { id: "refund-queued", label: "Refund queued", note: "Return created, with no wallet action implied." },
      { id: "refund-prepared", label: "Refund prepared", note: "A safe transfer is ready for broadcast." },
      { id: "refund-submitted", label: "Refund submitted", note: "Transaction identity becomes available." },
      { id: "refund-confirming", label: "Refund confirming", note: "Chain confirmation is visible without claiming completion." },
      { id: "refund-review", label: "Refund review", note: "A delayed return has a clear protected state." },
      { id: "refund", label: "Refund confirmed", note: "A terminal financial branch, never a waiting state." },
      { id: "settlement-final-review", label: "Final review", note: "Occurrence outcomes freeze before settlement math." },
      { id: "settlement-calculated", label: "Payout calculated", note: "The entitlement is final before transfer preparation." },
      { id: "settlement-prepared", label: "Payout prepared", note: "The worker has prepared one idempotent transfer." },
      { id: "settlement-submitted", label: "Payout submitted", note: "The chain transaction is visible and pending." },
      { id: "settlement-confirming", label: "Payout confirming", note: "Finality remains distinct from submission." },
      { id: "settlement-review", label: "Payout review", note: "Ambiguous chain state never triggers a blind retry." },
      { id: "settlement-zero", label: "No transfer", note: "A zero entitlement closes without an empty transaction." },
      { id: "settlement", label: "Payout paid", note: "Payout first, ledger detail on demand." },
      { id: "updates", label: "Updates", note: "Action history grouped by meaning." },
      { id: "members", label: "Members", note: "People, progress, and within-Pod streaks." },
      { id: "rules", label: "Contract", note: "Readable rules with expandable technical terms." }
    ]
  },
  {
    id: "creator",
    label: "Creator",
    description: "Applications, funding, proof decisions, and settlement.",
    screens: [
      { id: "command-center", label: "Command center", note: "The one urgent creator action leads." },
      { id: "applications", label: "Applications", note: "Identity first, answers disclosed only when needed." },
      { id: "application-detail", label: "Application detail", note: "Read one application before making one decision." },
      { id: "creator-funding", label: "Funding", note: "Recognizable participants and one status line." },
      { id: "review-queue", label: "Review queue", note: "Compact proof worklist ordered by deadline." },
      { id: "review-proof", label: "Review proof", note: "Sticky decision dock and readable evidence." },
      { id: "creator-settlement", label: "Settlement", note: "Conservation summary with simple member rows." }
    ]
  },
  {
    id: "social",
    label: "Social",
    description: "Profiles, people, requests, and direct messages.",
    screens: [
      { id: "private-profile", label: "My profile", note: "Identity, activity, and connections without a directory wall." },
      { id: "public-profile", label: "Public profile", note: "Earned identity and public milestones." },
      { id: "people-search", label: "People search", note: "Search-led discovery, never an unbounded directory." },
      { id: "messages", label: "Messages", note: "Dense conversation rows and clear unread state." },
      { id: "requests", label: "Requests", note: "One primary response with secondary actions in overflow." },
      { id: "direct-message", label: "Direct message", note: "Native conversation density and visible reply context." }
    ]
  },
  {
    id: "operations",
    label: "Operations",
    description: "Transfer recovery and public-safety queues.",
    screens: [
      { id: "transfer-queue", label: "Transfer queue", note: "Compact operational rows with filters." },
      { id: "transfer-detail", label: "Transfer detail", note: "Raw identifiers only when an operator asks." },
      { id: "public-safety", label: "Public safety", note: "Reports and moderation decisions with audit context." }
    ]
  },
  {
    id: "onboarding",
    label: "Onboarding",
    description: "Wallet entry, profile setup, and Pod creation.",
    screens: [
      { id: "landing", label: "Landing", note: "The product promise before wallet entry." },
      { id: "connect", label: "Wallet", note: "One wallet action with an honest Testnet boundary." },
      { id: "profile-identity", label: "Identity", note: "Handle, name, and bio in one focused step." },
      { id: "profile-avatar", label: "Avatar", note: "Art-directed portraits plus real photo upload." },
      { id: "profile-privacy", label: "Privacy", note: "Plain-language visibility and message controls." },
      { id: "create-template", label: "Template", note: "Five polished activity contracts." },
      { id: "create-activity", label: "Activity", note: "Purpose, cadence, and schedule." },
      { id: "create-community", label: "Community", note: "Public or private access and visitor policy." },
      { id: "create-commitment", label: "NIM commitment", note: "Maximum upfront amount in one clear equation." },
      { id: "create-review", label: "Publish review", note: "Freeze the complete contract with informed consent." }
    ]
  }
];

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
  size = "medium",
  variant
}: {
  name: string;
  size?: "small" | "medium" | "large" | "hero";
  variant?: number;
}) {
  const seed = variant ?? seedNumber(name);
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  const items = [
    { id: "today", label: "Today", icon: House, screen: "today" as ScreenId, actor: "participant" as ActorId },
    { id: "discover", label: "Discover", icon: Compass, screen: "discover" as ScreenId, actor: "visitor" as ActorId },
    { id: "pods", label: "My Pods", icon: Users, screen: "my-pods" as ScreenId, actor: "participant" as ActorId },
    { id: "messages", label: "Messages", icon: ChatCircleDots, screen: "messages" as ScreenId, actor: "social" as ActorId }
  ];
  return (
    <nav aria-label="Prototype primary navigation" className={styles.bottomNav}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            aria-current={active === item.id ? "page" : undefined}
            key={item.id}
            onClick={() => navigate(item.screen, item.actor)}
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
  disabled = false
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: boolean;
  disabled?: boolean;
}) {
  return (
    <button className={styles.primaryButton} disabled={disabled} onClick={onClick} type="button">
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
          {data.pods.map((pod, index) => (
            <PodRow
              key={pod.id}
              onClick={() => navigate(index === 0 ? "pod-preview" : "pod-preview")}
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
        <PrimaryButton onClick={() => navigate("funding", "participant")}>Submit application</PrimaryButton>
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
          <PrimaryButton onClick={() => navigate("funding", "participant")}>Accept and continue</PrimaryButton>
          <SecondaryButton>Decline invitation</SecondaryButton>
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function InvalidInviteScreen({ navigate }: { navigate: (screen: ScreenId, actor?: ActorId) => void }) {
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  data,
  navigate,
  state
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  state: FinancialJourneyState;
}) {
  type FinancialConfig = {
    kind: "funding" | "refund" | "settlement";
    eyebrow: string;
    title: string;
    copy: string;
    stages: string[];
    completedThrough: number;
    activeIndex: number | null;
    tone: "success" | "warning" | "neutral";
    notice?: string;
    problem?: boolean;
    showBreakdown?: boolean;
    transactionAvailable?: boolean;
    actionLabel?: string;
  };

  const refundStages = ["Queued", "Prepared", "Submitted", "Confirmed"];
  const settlementStages = ["Review", "Calculated", "Prepared", "Submitted", "Paid"];
  let config: FinancialConfig;

  switch (state) {
    case "funding-secured":
      config = {
        kind: "funding",
        eyebrow: "Place secured",
        title: formatNim(data.finance.commitmentNim),
        copy: "Your finalized deposit is credited and included in the locked roster.",
        stages: ["Wallet", "Submitted", "Finalized", "Secured"],
        completedThrough: 3,
        activeIndex: null,
        tone: "success",
        transactionAvailable: true,
        actionLabel: "Continue to waiting room"
      };
      break;
    case "refund-queued":
      config = {
        kind: "refund",
        eyebrow: "Return queued",
        title: formatNim(data.finance.returnedNim),
        copy: "Your protected principal is scheduled to return. No wallet action is needed.",
        stages: refundStages,
        completedThrough: -1,
        activeIndex: 0,
        tone: "neutral",
        notice: "The return is recorded before any transaction is prepared."
      };
      break;
    case "refund-prepared":
      config = {
        kind: "refund",
        eyebrow: "Return prepared",
        title: formatNim(data.finance.returnedNim),
        copy: "One idempotent transfer is ready for the worker to broadcast.",
        stages: refundStages,
        completedThrough: 0,
        activeIndex: 1,
        tone: "neutral",
        notice: "Retry safety prevents a second transfer from being created."
      };
      break;
    case "refund-submitted":
      config = {
        kind: "refund",
        eyebrow: "Return submitted",
        title: formatNim(data.finance.returnedNim),
        copy: "The transaction is on chain and waiting for final confirmation.",
        stages: refundStages,
        completedThrough: 2,
        activeIndex: 3,
        tone: "neutral",
        transactionAvailable: true
      };
      break;
    case "refund-confirming":
      config = {
        kind: "refund",
        eyebrow: "Confirming return",
        title: formatNim(data.finance.returnedNim),
        copy: "The transaction is visible. Pods is waiting for final chain certainty.",
        stages: refundStages,
        completedThrough: 2,
        activeIndex: 3,
        tone: "warning",
        transactionAvailable: true,
        notice: "Closing this screen does not interrupt confirmation."
      };
      break;
    case "refund-review":
      config = {
        kind: "refund",
        eyebrow: "Return needs review",
        title: formatNim(data.finance.returnedNim),
        copy: "Chain state is ambiguous, so automatic retry is paused.",
        stages: refundStages,
        completedThrough: 2,
        activeIndex: 3,
        tone: "warning",
        transactionAvailable: true,
        notice: "Your ledger claim remains intact while the existing transaction is reconciled.",
        problem: true
      };
      break;
    case "refund-confirmed":
      config = {
        kind: "refund",
        eyebrow: "Return confirmed",
        title: formatNim(data.finance.returnedNim),
        copy: "Your protected principal has returned to the funding wallet.",
        stages: refundStages,
        completedThrough: 3,
        activeIndex: null,
        tone: "success",
        transactionAvailable: true,
        actionLabel: "Return to My Pods"
      };
      break;
    case "settlement-final-review":
      config = {
        kind: "settlement",
        eyebrow: "Final review",
        title: "3 outcomes",
        copy: "Every occurrence decision must become final before payout math begins.",
        stages: settlementStages,
        completedThrough: -1,
        activeIndex: 0,
        tone: "neutral",
        notice: "Outstanding clarification or dispute states keep settlement safely paused."
      };
      break;
    case "settlement-calculated":
      config = {
        kind: "settlement",
        eyebrow: "Payout calculated",
        title: formatNim(data.finance.payoutNim),
        copy: `${formatNim(data.finance.commitmentNim)} principal plus ${formatNim(data.finance.bonusNim)} earned bonus.`,
        stages: settlementStages,
        completedThrough: 1,
        activeIndex: 2,
        tone: "neutral",
        showBreakdown: true,
        notice: "The entitlement is frozen before transfer preparation."
      };
      break;
    case "settlement-prepared":
      config = {
        kind: "settlement",
        eyebrow: "Payout prepared",
        title: formatNim(data.finance.payoutNim),
        copy: "One transfer is ready for safe broadcast from the Testnet treasury.",
        stages: settlementStages,
        completedThrough: 2,
        activeIndex: 3,
        tone: "neutral",
        showBreakdown: true,
        notice: "A unique transfer leg prevents duplicate payouts."
      };
      break;
    case "settlement-submitted":
      config = {
        kind: "settlement",
        eyebrow: "Payout submitted",
        title: formatNim(data.finance.payoutNim),
        copy: "The transfer is on chain and waiting for final confirmation.",
        stages: settlementStages,
        completedThrough: 3,
        activeIndex: 4,
        tone: "neutral",
        showBreakdown: true,
        transactionAvailable: true
      };
      break;
    case "settlement-confirming":
      config = {
        kind: "settlement",
        eyebrow: "Confirming payout",
        title: formatNim(data.finance.payoutNim),
        copy: "Pods has observed the transaction and is waiting for final chain certainty.",
        stages: settlementStages,
        completedThrough: 3,
        activeIndex: 4,
        tone: "warning",
        showBreakdown: true,
        transactionAvailable: true,
        notice: "No additional wallet action is required."
      };
      break;
    case "settlement-review":
      config = {
        kind: "settlement",
        eyebrow: "Payout needs review",
        title: formatNim(data.finance.payoutNim),
        copy: "Automatic retry is paused until the existing chain state is reconciled.",
        stages: settlementStages,
        completedThrough: 3,
        activeIndex: 4,
        tone: "warning",
        showBreakdown: true,
        transactionAvailable: true,
        notice: "Your entitlement remains final. Review affects transfer delivery only.",
        problem: true
      };
      break;
    case "settlement-zero":
      config = {
        kind: "settlement",
        eyebrow: "No transfer required",
        title: "0 NIM",
        copy: "The final entitlement is zero, so the ledger closes without an empty transaction.",
        stages: ["Review", "Calculated", "Closed"],
        completedThrough: 2,
        activeIndex: null,
        tone: "neutral",
        notice: "Occurrence outcomes remain available in the final record.",
        actionLabel: "Return to My Pods"
      };
      break;
    case "settlement-paid":
      config = {
        kind: "settlement",
        eyebrow: "Final payout",
        title: formatNim(data.finance.payoutNim),
        copy: `${formatNim(data.finance.commitmentNim)} principal plus ${formatNim(data.finance.bonusNim)} earned bonus.`,
        stages: settlementStages,
        completedThrough: 4,
        activeIndex: null,
        tone: "success",
        showBreakdown: true,
        transactionAvailable: true,
        actionLabel: "Return to My Pods"
      };
      break;
  }

  const kind = config.kind;
  return (
    <MobileScreen className={`${styles.financialScreen} ${styles[`financialScreen-${kind}`]}`}>
      <ScreenHeader back onBack={() => navigate("my-pods")} title={kind === "funding" ? "Funding" : kind === "refund" ? "Refund" : "Settlement"} trailing="actions" />
      <ScreenBody>
        <section className={`${styles.financialHero} ${styles[`financial-${config.tone}`]}`}>
          <span className={styles.financialToken}>
            {kind === "funding" ? <Wallet size={29} weight="regular" /> : <Image alt="NIM" height={48} src="/media/nimiq-signet.svg" width={48} />}
          </span>
          <span>{config.eyebrow}</span>
          <h2>{config.title}</h2>
          <p>{config.copy}</p>
        </section>
        <ol className={styles.compactTimeline}>
          {config.stages.map((stage, index) => (
            <li
              className={[
                index <= config.completedThrough ? styles.timelineComplete : "",
                index === config.activeIndex ? styles.timelineCurrent : "",
                index === config.activeIndex && config.problem ? styles.timelineProblem : ""
              ].filter(Boolean).join(" ")}
              key={stage}
            >
              <i>
                {index <= config.completedThrough ? <Check size={12} weight="bold" /> : null}
                {index === config.activeIndex && !config.problem ? <Clock size={12} weight="bold" /> : null}
                {index === config.activeIndex && config.problem ? <Flag size={12} weight="fill" /> : null}
              </i>
              <span>{stage}</span>
            </li>
          ))}
        </ol>
        {config.notice ? (
          <section className={`${styles.financialNotice} ${config.problem ? styles.financialNoticeProblem : ""}`}>
            {config.problem ? <Flag size={19} weight="fill" /> : <ShieldCheck size={19} />}
            <p>{config.notice}</p>
          </section>
        ) : null}
        {config.showBreakdown ? (
          <section className={styles.moneyBreakdown}>
            <div><span>Principal</span><strong>{formatNim(data.finance.commitmentNim)}</strong></div>
            <div><span>Earned bonus</span><strong>+{formatNim(data.finance.bonusNim)}</strong></div>
            <div><span>Total payout</span><strong>{formatNim(data.finance.payoutNim)}</strong></div>
          </section>
        ) : null}
        <div className={styles.disclosureList}>
          <DisclosureRow
            icon={<Receipt size={19} />}
            label={config.transactionAvailable ? "Transaction details" : "Transfer record"}
            value={config.transactionAvailable ? shortenHash(data.finance.transactionHash) : "Not broadcast yet"}
          />
          <DisclosureRow icon={<FileText size={19} />} label={kind === "settlement" ? "Occurrence outcomes" : "Contract and ledger"} value="Open the full record" />
        </div>
        {config.actionLabel ? <div className={styles.financialAction}>
          <PrimaryButton onClick={() => navigate(kind === "funding" ? "waiting" : "my-pods")}>
            {config.actionLabel}
          </PrimaryButton>
        </div> : null}
      </ScreenBody>
    </MobileScreen>
  );
}

function WaitingScreen({
  pod,
  navigate
}: {
  pod: NativeMomentumPreviewPod;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate,
  proofDraft,
  updateProofDraft
}: {
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  proofDraft: ProofDraftPreview;
  updateProofDraft: (patch: Partial<ProofDraftPreview>) => void;
}) {
  const choices = [
    { id: "artifact" as const, icon: LinkSimple, title: "Public artifact", copy: "Pull request, deployment, or public document" },
    { id: "image" as const, icon: ImageSquare, title: "Image evidence", copy: "A clear screenshot or camera capture" },
    { id: "written" as const, icon: FileText, title: "Written result", copy: "A concise result the creator can inspect" }
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
          {choices.map(({ id, icon: Icon, title, copy }) => (
            <button
              aria-pressed={proofDraft.format === id}
              key={title}
              onClick={() => updateProofDraft({ format: id })}
              type="button"
            >
              <i><Icon size={21} /></i>
              <span><strong>{title}</strong><small>{copy}</small></span>
              <b>{proofDraft.format === id ? <Check size={14} weight="bold" /> : null}</b>
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
  navigate,
  proofDraft,
  updateProofDraft
}: {
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  proofDraft: ProofDraftPreview;
  updateProofDraft: (patch: Partial<ProofDraftPreview>) => void;
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
            <button
              aria-pressed={!proofDraft.shareEvidenceWithPod}
              onClick={() => updateProofDraft({ shareEvidenceWithPod: false })}
              type="button"
            >
              {!proofDraft.shareEvidenceWithPod ? <Check size={13} weight="bold" /> : null}
              Creator only
            </button>
            <button
              aria-pressed={proofDraft.shareEvidenceWithPod}
              onClick={() => updateProofDraft({ shareEvidenceWithPod: true })}
              type="button"
            >
              {proofDraft.shareEvidenceWithPod ? <Check size={13} weight="bold" /> : null}
              Share with Pod
            </button>
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
  navigate,
  proofDraft
}: {
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  proofDraft: ProofDraftPreview;
}) {
  const proofFormat = proofDraft.format === "artifact"
    ? "Public artifact"
    : proofDraft.format === "image"
      ? "Image evidence"
      : "Written result";
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
          <div><span>Proof format</span><strong>{proofFormat}</strong></div>
          <div><span>Public artifact</span><strong>Pull request 184</strong></div>
          <div><span>Reviewer evidence</span><strong>{proofDraft.shareEvidenceWithPod ? "1 Pod-shared image" : "1 creator-only image"}</strong></div>
          <div><span>Public sharing</span><strong>{proofDraft.shareEvidenceWithPod ? "Artifact and selected image" : "Artifact only"}</strong></div>
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
        <PrimaryButton onClick={() => navigate(approved ? "room" : "submission-approved")}>
          {approved ? "Return to Pod room" : "Preview approved state"}
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  data,
  navigate,
  selectApplicant
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  selectApplicant: (handle: string) => void;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("command-center")} title="Applications" trailing="actions" />
      <ScreenBody>
        <div className={styles.queueSummary}><span>2 waiting</span><strong>Decide before funding cutoff</strong></div>
        {data.people.map((person, index) => (
          <button
            aria-label={`Review ${person.displayName}`}
            className={styles.applicationCard}
            key={person.handle}
            onClick={() => selectApplicant(person.handle)}
            type="button"
          >
            <div className={styles.applicationIdentity}>
              <PreviewAvatar name={person.avatarSeed} />
              <span><strong>{person.displayName}</strong><small>@{person.handle}</small></span>
              <CaretRight size={18} weight="bold" />
            </div>
            <p>{person.bio}</p>
            <span className={styles.applicationMeta}>
              <FileText size={17} />
              {index === 0 ? "2 responses" : "1 response"}
            </span>
          </button>
        ))}
      </ScreenBody>
    </MobileScreen>
  );
}

function ApplicationDetailScreen({
  data,
  navigate,
  selectedApplicantHandle
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  selectedApplicantHandle: string | null;
}) {
  const person = data.people.find((candidate) => candidate.handle === selectedApplicantHandle)
    ?? data.people[0]!;
  return (
    <MobileScreen className={styles.applicationDetailScreen}>
      <ScreenHeader back onBack={() => navigate("applications")} title="Application" trailing="none" />
      <ScreenBody>
        <section className={styles.applicantHero}>
          <PreviewAvatar name={person.avatarSeed} size="large" />
          <span>
            <small>@{person.handle}</small>
            <h2>{person.displayName}</h2>
            <p>{person.bio}</p>
          </span>
        </section>
        <div className={styles.applicantContext}>
          <span>1 shared public Pod</span>
          <span>3-occurrence streak</span>
        </div>
        <section className={styles.applicationAnswers}>
          <article>
            <small>Why do you want to join?</small>
            <p>I want a visible rhythm for shipping the proof flow with people who will notice when I disappear.</p>
          </article>
          <article>
            <small>What will you ship?</small>
            <p>A complete mobile submission path with public artifacts and creator-only evidence.</p>
          </article>
        </section>
        <p className={styles.applicationDecisionNote}>Acceptance opens funding. A place is secured only after the deposit finalizes.</p>
        <div className={styles.stickyActionSpacer} />
      </ScreenBody>
      <div className={styles.decisionDock}>
        <SecondaryButton>Decline application</SecondaryButton>
        <PrimaryButton icon={false}>Accept application</PrimaryButton>
      </div>
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("command-center")} title="Review queue" trailing="actions" />
      <ScreenBody>
        <section className={styles.reviewQueueLead}>
          <span>2</span>
          <div><small>Proofs waiting</small><h2>Oldest first</h2><p>One reaches its 12-hour target in 46 minutes.</p></div>
        </section>
        <div className={styles.reviewQueue}>
          {data.people.map((person, index) => (
            <button key={person.handle} onClick={() => navigate("review-proof")} type="button">
              <PreviewAvatar name={person.avatarSeed} />
              <span><small>Occurrence {index + 1}</small><strong>{person.displayName}</strong><p>{index === 0 ? "Ship the compact room and proof flow" : "Publish the funding-state audit"}</p></span>
              <time>{index === 0 ? "46m" : "3h"}</time>
              <CaretRight size={16} weight="bold" />
            </button>
          ))}
        </div>
      </ScreenBody>
    </MobileScreen>
  );
}

function ReviewProofScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  const person = data.people[0]!;
  return (
    <MobileScreen className={styles.themeBuild}>
      <ScreenHeader back onBack={() => navigate("review-queue")} title="Review proof" trailing="actions" />
      <ScreenBody>
        <div className={styles.reviewPerson}>
          <PreviewAvatar name={person.avatarSeed} />
          <span><strong>{person.displayName}</strong><small>@{person.handle} · Occurrence 2</small></span>
          <StatusPill tone="warning">10h 14m open</StatusPill>
        </div>
        <section className={styles.reviewComparison}>
          <div><span>Locked commitment</span><strong>Ship the compact Pod room and proof entry flow.</strong></div>
          <div><span>Submitted result</span><strong>The responsive room and submission path are ready.</strong></div>
        </section>
        <div className={styles.reviewEvidence}>
          <Image alt="Creator-only build workspace evidence" height={480} src="/media/build-workspace.jpg" width={720} />
          <span><LockKey size={16} /><strong>Creator only</strong></span>
        </div>
        <div className={styles.reviewTools}>
          <DisclosureRow icon={<LinkSimple size={19} />} label="Pull request 184" value="Public artifact" />
          <button className={styles.optionalNote} type="button">Add a private review note <Plus size={16} /></button>
        </div>
        <div className={styles.stickyActionSpacer} />
      </ScreenBody>
      <div className={styles.decisionDock}>
        <SecondaryButton>Reject</SecondaryButton>
        <PrimaryButton icon={false}>Approve proof</PrimaryButton>
      </div>
    </MobileScreen>
  );
}

function CreatorSettlementScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
            <button key={person.handle} onClick={() => navigate("public-profile")} type="button">
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
            <PersonRow key={person.handle} onClick={() => navigate("public-profile")} person={person} />
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("messages")} title="Requests" trailing="actions" />
      <ScreenBody>
        <SectionHeading eyebrow="Message introduction" title="Choose who enters your space" />
        <article className={styles.requestCard}>
          <div className={styles.requestIdentity}>
            <PreviewAvatar name={data.people[1]?.avatarSeed ?? "Noah"} />
            <span><strong>{data.people[1]?.displayName ?? "Noah Mercer"}</strong><small>@{data.people[1]?.handle ?? "noahmercer"} · 1 shared Pod</small></span>
          </div>
          <p>I would like to compare notes on making public activity rooms easier to follow.</p>
          <div className={styles.requestActions}>
            <SecondaryButton>Decline</SecondaryButton>
            <PrimaryButton icon={false}>Accept</PrimaryButton>
          </div>
        </article>
        <SectionHeading eyebrow="Friend request" title="People who want to connect" />
        <article className={styles.requestCard}>
          <div className={styles.requestIdentity}>
            <PreviewAvatar name={data.people[0]?.avatarSeed ?? "Ari"} />
            <span><strong>{data.people[0]?.displayName ?? "Ari Vale"}</strong><small>@{data.people[0]?.handle ?? "arivale"}</small></span>
          </div>
          <p>You met in {data.pods[0]?.name ?? "a public Pod"}.</p>
          <div className={styles.requestActions}>
            <SecondaryButton>Decline</SecondaryButton>
            <PrimaryButton icon={false}>Accept</PrimaryButton>
          </div>
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
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
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  const rows = [
    { pod: data.pods[0]?.name ?? "Pods in Pods", state: "Unknown", tone: "warning" as const, amount: data.finance.payoutNim, age: "4m" },
    { pod: "Night Run Club", state: "Retry required", tone: "danger" as const, amount: 0.2, age: "18m" },
    { pod: "Reading Reset", state: "Late", tone: "warning" as const, amount: 0.1, age: "1h" }
  ];
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
          {rows.map((row) => (
            <button key={`${row.pod}-${row.state}`} onClick={() => navigate("transfer-detail")} type="button">
              <span><StatusPill tone={row.tone}>{row.state}</StatusPill><strong>{row.pod}</strong><small>{formatNim(row.amount)} · Payout leg</small></span>
              <time>{row.age}</time>
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
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  return (
    <MobileScreen>
      <ScreenHeader back onBack={() => navigate("transfer-queue")} title="Transfer detail" trailing="actions" />
      <ScreenBody>
        <section className={styles.opsDetailHero}>
          <StatusPill tone="warning">Unknown</StatusPill>
          <h2>{formatNim(data.finance.payoutNim)}</h2>
          <p>Broadcast exists, but chain confirmation is not yet conclusive. Reconcile before any retry.</p>
        </section>
        <div className={styles.opsFacts}>
          <div><span>Pod</span><strong>{data.pods[0]?.name ?? "Pods in Pods"}</strong></div>
          <div><span>Network</span><strong>Nimiq Testnet</strong></div>
          <div><span>Transfer leg</span><code>7e320c14...a881</code></div>
          <div><span>Transaction</span><code>{shortenHash(data.finance.transactionHash)}</code></div>
          <div><span>Last checked</span><strong>4 minutes ago</strong></div>
        </div>
        <div className={styles.operatorNotice}><ShieldCheck size={20} /><span><strong>Retry safety is active</strong><small>The worker must prove absence before creating another broadcast.</small></span></div>
        <div className={styles.operatorActions}>
          <PrimaryButton icon={false}>Reconcile on chain</PrimaryButton>
          <SecondaryButton>Move to manual review</SecondaryButton>
        </div>
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  return (
    <MobileScreen className={styles.landingScreen}>
      <header className={styles.landingHeader}>
        <span className={styles.previewWordmark}><i />pods</span>
        <button onClick={() => navigate("discover", "visitor")} type="button">Pods</button>
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  return (
    <MobileScreen className={styles.walletScreen}>
      <ScreenHeader title="Wallet" trailing="none" />
      <ScreenBody>
        <section className={styles.walletHero}>
          <span className={styles.walletSignal}>
            <i />
            <Image alt="Nimiq" height={64} src="/media/nimiq-signet.svg" width={64} />
          </span>
          <h2>Connect your wallet</h2>
          <p>One signature creates your Pods account.</p>
        </section>
        <section className={styles.walletPromise}>
          <ShieldCheck size={20} />
          <span><strong>Private identity</strong><small>Your public profile never displays your wallet address.</small></span>
        </section>
      </ScreenBody>
      <div className={styles.actionDock}>
        <PrimaryButton onClick={() => navigate("profile-identity")}>Connect wallet</PrimaryButton>
        <p className={styles.testnetNote}>Testnet beta. Test NIM has no real-world value.</p>
      </div>
    </MobileScreen>
  );
}

function ProfileIdentityScreen({
  data,
  navigate
}: {
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  return (
    <MobileScreen className={styles.onboardingScreen}>
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  const [selectedAvatar, setSelectedAvatar] = useState(0);
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
    <MobileScreen className={styles.onboardingScreen}>
      <WizardHeader current={2} label="Set up profile" onClose={() => navigate("landing")} total={3} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Your portrait</span>
          <h2>Choose a signal that feels like you</h2>
          <p>Pick a portrait or use your own photo.</p>
        </section>
        <div className={styles.avatarGrid}>
          {names.map((name, index) => (
            <button
              aria-label={`Choose portrait ${index + 1}`}
              aria-pressed={selectedAvatar === index}
              key={name}
              onClick={() => setSelectedAvatar(index)}
              type="button"
            >
              <PreviewAvatar name={name} size="large" variant={index} />
              {selectedAvatar === index ? <i><Check size={14} weight="bold" /></i> : null}
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
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [contactPolicy, setContactPolicy] = useState<"requests" | "friends">("requests");
  return (
    <MobileScreen className={styles.onboardingScreen}>
      <WizardHeader current={3} label="Set up profile" onClose={() => navigate("landing")} total={3} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Your boundaries</span>
          <h2>Choose what people can discover</h2>
          <p>These controls can be changed later. Wallet identity and private Pod activity always remain private.</p>
        </section>
        <div className={styles.flatChoices}>
          <button aria-pressed={visibility === "public"} onClick={() => setVisibility("public")} type="button"><span><strong>Public profile</strong><small>People can search, follow, and see public milestones.</small></span><b>{visibility === "public" ? <Check size={14} /> : null}</b></button>
          <button aria-pressed={visibility === "private"} onClick={() => setVisibility("private")} type="button"><span><strong>Private profile</strong><small>Your handle exists, but profile content stays hidden.</small></span><b>{visibility === "private" ? <Check size={14} /> : null}</b></button>
        </div>
        <div className={styles.choiceSectionTitle}><h2>Who can contact you</h2></div>
        <div className={styles.flatChoices}>
          <button aria-pressed={contactPolicy === "requests"} onClick={() => setContactPolicy("requests")} type="button"><span><strong>Friends and requests</strong><small>Non-friends can send one introduction.</small></span><b>{contactPolicy === "requests" ? <Check size={14} /> : null}</b></button>
          <button aria-pressed={contactPolicy === "friends"} onClick={() => setContactPolicy("friends")} type="button"><span><strong>Friends only</strong><small>Only accepted friends can start a chat.</small></span><b>{contactPolicy === "friends" ? <Check size={14} /> : null}</b></button>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("today", "participant")}>Enter Pods</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateTemplateScreen({
  createDraft,
  navigate,
  updateCreateDraft
}: {
  createDraft: CreateDraftPreview;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  updateCreateDraft: (patch: Partial<CreateDraftPreview>) => void;
}) {
  const templates: NativeMomentumPreviewPod["templateId"][] = ["build", "fitness", "reading", "study", "create"];
  return (
    <MobileScreen className={styles.onboardingScreen}>
      <WizardHeader current={1} label="Create a Pod" onClose={() => navigate("today", "participant")} total={5} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Activity contract</span>
          <h2>What kind of momentum are you building?</h2>
          <p>Each template carries its own evidence fields, cadence, and visual rhythm.</p>
        </section>
        <div className={styles.templateList}>
          {templates.map((template) => (
            <button
              aria-pressed={createDraft.templateId === template}
              key={template}
              onClick={() => updateCreateDraft({ templateId: template })}
              type="button"
            >
              <Image alt="" height={160} src={templateMedia[template]} width={160} />
              <span><strong>{templateLabel[template]}</strong><small>{template === "build" ? "Daily output and public artifacts" : template === "fitness" ? "Movement, distance, or attendance" : template === "reading" ? "Pages, reflections, and consistency" : template === "study" ? "Focused sessions and learning outputs" : "Practice sessions and finished work"}</small></span>
              <b>{createDraft.templateId === template ? <Check size={14} weight="bold" /> : null}</b>
            </button>
          ))}
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("create-activity")}>Shape the activity</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateActivityScreen({
  createDraft,
  navigate,
  updateCreateDraft
}: {
  createDraft: CreateDraftPreview;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  updateCreateDraft: (patch: Partial<CreateDraftPreview>) => void;
}) {
  const weekdayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  function toggleWeekday(index: number) {
    if (createDraft.weekdays.includes(index) && createDraft.weekdays.length === 1) return;
    const weekdays = createDraft.weekdays.includes(index)
      ? createDraft.weekdays.filter((weekday) => weekday !== index)
      : [...createDraft.weekdays, index].sort((left, right) => left - right);
    updateCreateDraft({ weekdays });
  }

  return (
    <MobileScreen className={styles.onboardingScreen}>
      <WizardHeader current={2} label="Create a Pod" onClose={() => navigate("today", "participant")} total={5} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>{templateLabel[createDraft.templateId]}</span>
          <h2>Give the group a clear rhythm</h2>
          <p>Name the activity, explain why it exists, and choose when people show up.</p>
        </section>
        <label className={styles.inputField}><span>Pod name</span><input onChange={(event) => updateCreateDraft({ name: event.target.value })} value={createDraft.name} /></label>
        <label className={styles.textAreaField}><span>Purpose</span><textarea onChange={(event) => updateCreateDraft({ purpose: event.target.value })} value={createDraft.purpose} /></label>
        <div className={styles.cadencePicker}>
          <span>Active weekdays</span>
          <div>
            {weekdayLabels.map((day, index) => (
              <button
                aria-label={day}
                aria-pressed={createDraft.weekdays.includes(index)}
                key={day}
                onClick={() => toggleWeekday(index)}
                type="button"
              >
                {day.slice(0, 1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.dualFields}>
          <label className={styles.inputField}><span>Starts</span><input onChange={(event) => updateCreateDraft({ starts: event.target.value })} value={createDraft.starts} /></label>
          <label className={styles.inputField}><span>Ends</span><input onChange={(event) => updateCreateDraft({ ends: event.target.value })} value={createDraft.ends} /></label>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("create-community")}>Set community access</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateCommunityScreen({
  createDraft,
  navigate,
  updateCreateDraft
}: {
  createDraft: CreateDraftPreview;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  updateCreateDraft: (patch: Partial<CreateDraftPreview>) => void;
}) {
  return (
    <MobileScreen className={styles.onboardingScreen}>
      <WizardHeader current={3} label="Create a Pod" onClose={() => navigate("today", "participant")} total={5} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>Community access</span>
          <h2>Who gets to take part?</h2>
          <p>Applications and invitations always require creator acceptance before funding.</p>
        </section>
        <div className={styles.flatChoices}>
          <button aria-pressed={createDraft.access === "public"} onClick={() => updateCreateDraft({ access: "public" })} type="button"><span><strong>Public Pod</strong><small>Listed in Discover. People apply before funding.</small></span><b>{createDraft.access === "public" ? <Check size={14} /> : null}</b></button>
          <button aria-pressed={createDraft.access === "private"} onClick={() => updateCreateDraft({ access: "private", visitorsAllowed: false })} type="button"><span><strong>Private Pod</strong><small>Accessible only through a revocable invitation.</small></span><b>{createDraft.access === "private" ? <Check size={14} /> : null}</b></button>
        </div>
        {createDraft.access === "public" ? (
          <section className={styles.visitorChoice}>
            <Eye size={21} />
            <span><strong>Allow read-only visitors</strong><small>Anyone with the link can watch messages and explicitly public proof after roster lock.</small></span>
            <button
              aria-label="Allow read-only visitors"
              aria-pressed={createDraft.visitorsAllowed}
              onClick={() => updateCreateDraft({ visitorsAllowed: !createDraft.visitorsAllowed })}
              type="button"
            >
              <i />
            </button>
          </section>
        ) : (
          <section className={styles.memberOnlyNote}>
            <LockKey size={20} />
            <span><strong>Members only</strong><small>Private Pod rooms and proof stay unavailable to visitors.</small></span>
          </section>
        )}
        <div className={styles.dualFields}>
          <label className={styles.inputField}><span>Minimum</span><input inputMode="numeric" onChange={(event) => updateCreateDraft({ minParticipants: event.target.value })} value={createDraft.minParticipants} /></label>
          <label className={styles.inputField}><span>Maximum</span><input inputMode="numeric" onChange={(event) => updateCreateDraft({ maxParticipants: event.target.value })} value={createDraft.maxParticipants} /></label>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("create-commitment")}>Set NIM commitment</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateCommitmentScreen({
  createDraft,
  pod,
  navigate,
  updateCreateDraft
}: {
  createDraft: CreateDraftPreview;
  pod: NativeMomentumPreviewPod;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  updateCreateDraft: (patch: Partial<CreateDraftPreview>) => void;
}) {
  const parsedPerOccurrence = Number(createDraft.perOccurrenceNim);
  const perOccurrence = Number.isFinite(parsedPerOccurrence) && parsedPerOccurrence >= 0
    ? parsedPerOccurrence
    : 0;
  const maximumUpfront = perOccurrence * pod.occurrenceCount;
  return (
    <MobileScreen className={styles.onboardingScreen}>
      <WizardHeader current={4} label="Create a Pod" onClose={() => navigate("today", "participant")} total={5} />
      <ScreenBody>
        <section className={styles.wizardPrompt}>
          <span>NIM commitment</span>
          <h2>Make showing up matter</h2>
          <p>Participants fund the maximum commitment upfront. You review proof but never fund or receive participant money.</p>
        </section>
        <section className={styles.nimCommitmentCard}>
          <span className={styles.nimTokenMark}>
            <i />
            <Image alt="NIM" height={72} src="/media/nimiq-signet.svg" width={72} />
          </span>
          <label className={styles.nimInput}>
            <span>Per occurrence</span>
            <div><input aria-label="Per occurrence" inputMode="decimal" onChange={(event) => updateCreateDraft({ perOccurrenceNim: event.target.value })} value={createDraft.perOccurrenceNim} /><strong>NIM</strong></div>
          </label>
          <p>Each completed occurrence protects this slice and keeps it bonus-eligible.</p>
        </section>
        <section className={styles.commitmentEquation}>
          <div><span>Occurrences</span><strong>{pod.occurrenceCount}</strong></div>
          <i>×</i>
          <div><span>Each</span><strong>{formatNim(perOccurrence)}</strong></div>
          <i>=</i>
          <div><span>Maximum upfront</span><strong>{formatNim(maximumUpfront)}</strong></div>
        </section>
        <div className={styles.commitmentConsequence}>
          <Receipt size={21} />
          <span><strong>How settlement works</strong><small>Approved work can earn a share of forfeited slices. Protected principal never enters the bonus pool.</small></span>
        </div>
      </ScreenBody>
      <div className={styles.actionDock}><PrimaryButton onClick={() => navigate("create-review")}>Review frozen contract</PrimaryButton></div>
    </MobileScreen>
  );
}

function CreateReviewScreen({
  createDraft,
  pod,
  navigate
}: {
  createDraft: CreateDraftPreview;
  pod: NativeMomentumPreviewPod;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const schedule = createDraft.weekdays.map((weekday) => weekdayLabels[weekday]).join(", ");
  const perOccurrence = Number(createDraft.perOccurrenceNim);
  const maximumUpfront = (Number.isFinite(perOccurrence) ? Math.max(perOccurrence, 0) : 0) * pod.occurrenceCount;
  const community = createDraft.access === "public"
    ? `Public · Applications · ${createDraft.visitorsAllowed ? "Visitors allowed" : "Members only"}`
    : "Private · Invitations · Members only";
  return (
    <MobileScreen className={styles.onboardingScreen}>
      <WizardHeader current={5} label="Create a Pod" onClose={() => navigate("today", "participant")} total={5} />
      <ScreenBody>
        <section className={styles.publishVisual}>
          <Image alt="" height={360} src={templateMedia[createDraft.templateId]} width={720} />
          <span><ShieldCheck size={18} /> Ready to publish</span>
        </section>
        <section className={styles.publishHero}>
          <h2>{createDraft.name}</h2>
          <p>Publishing locks the schedule, evidence rules, and NIM commitment.</p>
        </section>
        <div className={styles.contractSummary}>
          <div><span>Template</span><strong>{templateLabel[createDraft.templateId]}</strong></div>
          <div><span>Schedule</span><strong>{pod.occurrenceCount} occurrences · {schedule}</strong></div>
          <div><span>Community</span><strong>{community}</strong></div>
          <div><span>Commitment</span><strong>{formatNim(maximumUpfront)} maximum per participant</strong></div>
          <div><span>Verifier</span><strong>You, the Pod creator</strong></div>
        </div>
        <div className={styles.publishConsent}>
          <button aria-label="Accept frozen terms" aria-pressed={accepted} onClick={() => setAccepted((current) => !current)} type="button">{accepted ? <Check size={14} /> : null}</button>
          <p>I accept the frozen review, custody, timeout, and commitment terms shown above.</p>
        </div>
        <div className={styles.stickyActionSpacer} />
      </ScreenBody>
      <div className={styles.actionDock}>
        <PrimaryButton disabled={!accepted} onClick={() => navigate("command-center", "creator")}>Publish Pod</PrimaryButton>
      </div>
    </MobileScreen>
  );
}

export function LegacyScreenRenderer({
  createDraft,
  data,
  navigate,
  proofDraft,
  screen,
  selectedApplicantHandle,
  selectApplicant,
  updateCreateDraft,
  updateProofDraft
}: {
  createDraft: CreateDraftPreview;
  data: NativeMomentumPreviewData;
  navigate: (screen: ScreenId, actor?: ActorId) => void;
  proofDraft: ProofDraftPreview;
  screen: ScreenId;
  selectedApplicantHandle: string | null;
  selectApplicant: (handle: string) => void;
  updateCreateDraft: (patch: Partial<CreateDraftPreview>) => void;
  updateProofDraft: (patch: Partial<ProofDraftPreview>) => void;
}) {
  const pod = data.pods[0] ?? {
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
  const person = data.people[1] ?? creator;

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
    case "funding": return <FinancialJourney data={data} navigate={navigate} state="funding-secured" />;
    case "waiting": return <WaitingScreen navigate={navigate} pod={pod} />;
    case "room": return <RoomScreen data={data} navigate={navigate} pod={pod} />;
    case "commitment": return <CommitmentScreen navigate={navigate} pod={pod} />;
    case "proof-type": return <ProofTypeScreen navigate={navigate} proofDraft={proofDraft} updateProofDraft={updateProofDraft} />;
    case "proof-evidence": return <ProofEvidenceScreen navigate={navigate} proofDraft={proofDraft} updateProofDraft={updateProofDraft} />;
    case "proof-review": return <ProofReviewScreen navigate={navigate} proofDraft={proofDraft} />;
    case "submission-review": return <SubmissionStatusScreen approved={false} data={data} navigate={navigate} />;
    case "submission-approved": return <SubmissionStatusScreen approved data={data} navigate={navigate} />;
    case "refund-queued": return <FinancialJourney data={data} navigate={navigate} state="refund-queued" />;
    case "refund-prepared": return <FinancialJourney data={data} navigate={navigate} state="refund-prepared" />;
    case "refund-submitted": return <FinancialJourney data={data} navigate={navigate} state="refund-submitted" />;
    case "refund-confirming": return <FinancialJourney data={data} navigate={navigate} state="refund-confirming" />;
    case "refund-review": return <FinancialJourney data={data} navigate={navigate} state="refund-review" />;
    case "refund": return <FinancialJourney data={data} navigate={navigate} state="refund-confirmed" />;
    case "settlement-final-review": return <FinancialJourney data={data} navigate={navigate} state="settlement-final-review" />;
    case "settlement-calculated": return <FinancialJourney data={data} navigate={navigate} state="settlement-calculated" />;
    case "settlement-prepared": return <FinancialJourney data={data} navigate={navigate} state="settlement-prepared" />;
    case "settlement-submitted": return <FinancialJourney data={data} navigate={navigate} state="settlement-submitted" />;
    case "settlement-confirming": return <FinancialJourney data={data} navigate={navigate} state="settlement-confirming" />;
    case "settlement-review": return <FinancialJourney data={data} navigate={navigate} state="settlement-review" />;
    case "settlement-zero": return <FinancialJourney data={data} navigate={navigate} state="settlement-zero" />;
    case "settlement": return <FinancialJourney data={data} navigate={navigate} state="settlement-paid" />;
    case "updates": return <UpdatesScreen navigate={navigate} pod={pod} />;
    case "members": return <MembersScreen data={data} navigate={navigate} />;
    case "rules": return <RulesScreen navigate={navigate} pod={pod} />;
    case "command-center": return <CreatorCommandScreen data={data} navigate={navigate} pod={pod} />;
    case "applications": return <ApplicationsScreen data={data} navigate={navigate} selectApplicant={selectApplicant} />;
    case "application-detail": return <ApplicationDetailScreen data={data} navigate={navigate} selectedApplicantHandle={selectedApplicantHandle} />;
    case "creator-funding": return <CreatorFundingScreen data={data} navigate={navigate} pod={pod} />;
    case "review-queue": return <ReviewQueueScreen data={data} navigate={navigate} />;
    case "review-proof": return <ReviewProofScreen data={data} navigate={navigate} />;
    case "creator-settlement": return <CreatorSettlementScreen data={data} navigate={navigate} />;
    case "private-profile": return <PrivateProfileScreen data={data} navigate={navigate} />;
    case "public-profile": return <PublicProfileScreen navigate={navigate} person={person} />;
    case "people-search": return <PeopleSearchScreen data={data} navigate={navigate} />;
    case "messages": return <MessagesScreen data={data} navigate={navigate} />;
    case "requests": return <RequestsScreen data={data} navigate={navigate} />;
    case "direct-message": return <DirectMessageScreen data={data} navigate={navigate} />;
    case "transfer-queue": return <TransferQueueScreen data={data} navigate={navigate} />;
    case "transfer-detail": return <TransferDetailScreen data={data} navigate={navigate} />;
    case "public-safety": return <PublicSafetyScreen data={data} />;
    case "landing": return <LandingScreen navigate={navigate} />;
    case "connect": return <ConnectScreen navigate={navigate} />;
    case "profile-identity": return <ProfileIdentityScreen data={data} navigate={navigate} />;
    case "profile-avatar": return <ProfileAvatarScreen data={data} navigate={navigate} />;
    case "profile-privacy": return <ProfilePrivacyScreen navigate={navigate} />;
    case "create-template": return <CreateTemplateScreen createDraft={createDraft} navigate={navigate} updateCreateDraft={updateCreateDraft} />;
    case "create-activity": return <CreateActivityScreen createDraft={createDraft} navigate={navigate} updateCreateDraft={updateCreateDraft} />;
    case "create-community": return <CreateCommunityScreen createDraft={createDraft} navigate={navigate} updateCreateDraft={updateCreateDraft} />;
    case "create-commitment": return <CreateCommitmentScreen createDraft={createDraft} navigate={navigate} pod={pod} updateCreateDraft={updateCreateDraft} />;
    case "create-review": return <CreateReviewScreen createDraft={createDraft} navigate={navigate} pod={pod} />;
    default: return <DiscoverScreen data={data} navigate={navigate} />;
  }
}

export function LegacyNativeMomentumPrototype({
  data
}: {
  data: NativeMomentumPreviewData;
}) {
  const reducedMotion = useReducedMotion();
  const previewPod = data.pods[0];
  const [actor, setActor] = useState<ActorId>("visitor");
  const [screen, setScreen] = useState<ScreenId>("discover");
  const [selectedApplicantHandle, setSelectedApplicantHandle] = useState<string | null>(
    data.people[0]?.handle ?? null
  );
  const [proofDraft, setProofDraft] = useState<ProofDraftPreview>({
    format: "artifact",
    shareEvidenceWithPod: false
  });
  const [createDraft, setCreateDraft] = useState<CreateDraftPreview>(() => ({
    templateId: previewPod?.templateId ?? "build",
    name: previewPod?.name ?? "Pods in Pods",
    purpose: previewPod?.purpose ?? "Build the accountability product in public with the team.",
    weekdays: [0, 2, 4],
    starts: "Jul 27",
    ends: "Aug 02",
    access: previewPod?.visibility ?? "public",
    visitorsAllowed: previewPod?.visitorsAllowed ?? true,
    minParticipants: String(previewPod?.minParticipants ?? 2),
    maxParticipants: String(previewPod?.maxParticipants ?? 5),
    perOccurrenceNim: (
      (previewPod?.totalNim ?? 0.3) / Math.max(previewPod?.occurrenceCount ?? 3, 1)
    ).toFixed(1)
  }));
  const activeActor = useMemo(
    () => actorDefinitions.find((definition) => definition.id === actor) ?? actorDefinitions[0]!,
    [actor]
  );
  const activeScreen = activeActor.screens.find((definition) => definition.id === screen)
    ?? activeActor.screens[0]!;

  function selectActor(nextActor: ActorId) {
    const definition = actorDefinitions.find((item) => item.id === nextActor);
    if (!definition) return;
    setActor(nextActor);
    setScreen(definition.screens[0]!.id);
  }

  function navigate(nextScreen: ScreenId, nextActor?: ActorId) {
    if (nextActor) {
      setActor(nextActor);
      setScreen(nextScreen);
      return;
    }
    const owner = actorDefinitions.find((definition) =>
      definition.screens.some((candidate) => candidate.id === nextScreen)
    );
    if (owner && !activeActor.screens.some((candidate) => candidate.id === nextScreen)) {
      setActor(owner.id);
    }
    setScreen(nextScreen);
  }

  function selectApplicant(handle: string) {
    setSelectedApplicantHandle(handle);
    setScreen("application-detail");
  }

  function updateCreateDraft(patch: Partial<CreateDraftPreview>) {
    setCreateDraft((current) => ({ ...current, ...patch }));
  }

  function updateProofDraft(patch: Partial<ProofDraftPreview>) {
    setProofDraft((current) => ({ ...current, ...patch }));
  }

  return (
    <main className={styles.prototypeShell}>
      <aside className={styles.prototypeSidebar}>
        <div className={styles.prototypeBrand}>
          <span className={styles.previewWordmark}><i />pods</span>
          <StatusPill tone="live">Native Momentum</StatusPill>
        </div>
        <div className={styles.prototypeIntro}>
          <span>Interactive visual system</span>
          <h1>Every Pods flow, redesigned.</h1>
          <p>Independent screens use current database content where available. Buttons move through the visual flow without mutating product state.</p>
        </div>
        <nav aria-label="Preview actors" className={styles.actorNav}>
          {actorDefinitions.map((definition) => (
            <button
              aria-label={definition.label}
              aria-current={actor === definition.id ? "page" : undefined}
              key={definition.id}
              onClick={() => selectActor(definition.id)}
              type="button"
            >
              <span>{definition.label}</span>
              <small>{definition.screens.length} screens</small>
              <CaretRight size={16} weight="bold" />
            </button>
          ))}
        </nav>
        <div className={styles.dataStatus}>
          <i className={data.databaseStatus === "connected" ? styles.dataLive : ""} />
          <span>
            <strong>{data.databaseStatus === "connected" ? "Live database preview" : "Representative preview data"}</strong>
            <small>{data.pods.length} Pods · {data.people.length} profiles · {data.roomEntries.length} room events</small>
          </span>
        </div>
      </aside>

      <section className={styles.prototypeStage}>
        <header className={styles.stageHeader}>
          <div><span>{activeActor.label} flow</span><h2>{activeScreen.label}</h2></div>
          <p>{activeScreen.note}</p>
        </header>
        <nav aria-label={`${activeActor.label} screens`} className={styles.screenRail}>
          {activeActor.screens.map((definition, index) => (
            <button
              aria-label={definition.label}
              aria-current={definition.id === screen ? "page" : undefined}
              key={definition.id}
              onClick={() => setScreen(definition.id)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {definition.label}
            </button>
          ))}
        </nav>
        <div className={styles.deviceStage}>
          <div className={styles.deviceFrame}>
            <div className={styles.deviceStatus}><span>9:41</span><i /><b /></div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className={styles.screenMotion}
                data-preview-label={activeScreen.label}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
                key={`${actor}-${screen}`}
                transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <LegacyScreenRenderer
                  createDraft={createDraft}
                  data={data}
                  navigate={navigate}
                  proofDraft={proofDraft}
                  screen={screen}
                  selectedApplicantHandle={selectedApplicantHandle}
                  selectApplicant={selectApplicant}
                  updateCreateDraft={updateCreateDraft}
                  updateProofDraft={updateProofDraft}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <aside className={styles.flowInspector}>
        <div>
          <span>Actor contract</span>
          <h2>{activeActor.label}</h2>
          <p>{activeActor.description}</p>
        </div>
        <ol>
          {activeActor.screens.map((definition, index) => (
            <li className={definition.id === screen ? styles.flowStepActive : ""} key={definition.id}>
              <button onClick={() => setScreen(definition.id)} type="button">
                <i>{String(index + 1).padStart(2, "0")}</i>
                <span><strong>{definition.label}</strong><small>{definition.note}</small></span>
              </button>
            </li>
          ))}
        </ol>
        <section className={styles.prototypeRules}>
          <span>Visual contract</span>
          <p>One primary action. One enclosing surface. Secondary detail in disclosures. Motion only for state, navigation, and feedback.</p>
        </section>
      </aside>
    </main>
  );
}
