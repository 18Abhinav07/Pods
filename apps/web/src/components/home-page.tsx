import Image from "next/image";

import {
  ActivityAtlasVisual,
  ActivityRibbon,
  LandingActions,
  LandingReveal
} from "./landing-motion";
import {
  AccountabilityLoop,
  FundingRailPreview,
  PodRoomPreview
} from "./landing-previews";

const rituals = [
  {
    className: "ritual-build",
    eyebrow: "Build & Ship",
    title: "Make the next deliverable concrete.",
    copy: "Lock a task, then submit the pull request, commit, issue, or live artifact that proves it moved.",
    image: "/media/build-workspace.jpg",
    alt: "A laptop with source code open beside a coffee cup"
  },
  {
    className: "ritual-fitness",
    eyebrow: "Fitness & Movement",
    title: "Show the session happened.",
    copy: "Use a session summary and supporting image when the activity calls for it.",
    image: "/media/fitness.jpg",
    alt: "A runner training outdoors"
  },
  {
    className: "ritual-reading",
    eyebrow: "Reading",
    title: "Turn pages into a shared rhythm.",
    copy: "Record the reading result and keep the group cadence visible.",
    image: "/media/reading.jpg",
    alt: "An open book in a quiet reading setting"
  },
  {
    className: "ritual-study",
    eyebrow: "Study & Focus",
    title: "Protect focused time.",
    copy: "Commit to the session before the work begins.",
    image: "/media/reading-proof.jpg",
    alt: "Study notes and reading material"
  },
  {
    className: "ritual-create",
    eyebrow: "Practice & Create",
    title: "Keep the practice alive.",
    copy: "Make creative repetitions visible without turning them into a performance metric.",
    image: "/media/build-proof.jpg",
    alt: "Creative work taking shape on a desk"
  }
] as const;

export function HomePage() {
  return (
    <main className="activity-atlas-page">
      <header className="atlas-header">
        <div aria-label="Pods" className="atlas-brand">
          <span aria-hidden="true" className="pod-mark" />
          pods
        </div>
      </header>

      <section className="atlas-hero" aria-labelledby="atlas-hero-title">
        <LandingReveal className="atlas-hero-copy">
          <p className="atlas-eyebrow">Accountability, backed by NIM</p>
          <h1 id="atlas-hero-title">Make showing up feel real.</h1>
          <p className="atlas-hero-body">
            Create a Pod. Put NIM behind the activity. Prove the work together.
          </p>
          <LandingActions />
          <p className="atlas-hero-note">
            <span>Five activity modes</span>
            <span>Human-reviewed proof</span>
            <span>Built inside Nimiq Pay</span>
          </p>
        </LandingReveal>
        <LandingReveal className="atlas-hero-visual" delay={0.1}>
          <ActivityAtlasVisual />
        </LandingReveal>
      </section>

      <section className="atlas-ribbon-section">
        <ActivityRibbon />
      </section>

      <section
        className="atlas-section accountability-section"
        aria-labelledby="accountability-loop-title"
      >
        <LandingReveal className="accountability-layout">
          <div className="atlas-section-heading">
            <p className="atlas-eyebrow">From intention to evidence</p>
            <h2 id="accountability-loop-title">The accountability loop.</h2>
            <p>
              A Pod keeps the rule, money, work, and people in one understandable sequence.
            </p>
          </div>
          <AccountabilityLoop />
        </LandingReveal>
      </section>

      <section
        className="atlas-section rituals-section"
        aria-labelledby="rituals-title"
      >
        <LandingReveal className="atlas-section-heading rituals-heading">
          <p className="atlas-eyebrow">Activity, not one category</p>
          <h2 id="rituals-title">One engine. Five rituals.</h2>
          <p>
            The evidence changes with the activity. The shared commitment stays consistent.
          </p>
        </LandingReveal>
        <div className="ritual-gallery">
          {rituals.map((ritual, index) => (
            <LandingReveal
              className={`ritual-card ${ritual.className}`}
              delay={index * 0.04}
              key={ritual.eyebrow}
            >
              <figure>
                <Image
                  alt={ritual.alt}
                  fill
                  sizes="(max-width: 767px) 92vw, 50vw"
                  src={ritual.image}
                />
              </figure>
              <div>
                <span>{ritual.eyebrow}</span>
                <h3>{ritual.title}</h3>
                <p>{ritual.copy}</p>
              </div>
            </LandingReveal>
          ))}
        </div>
      </section>

      <section className="atlas-section room-section" aria-labelledby="room-title">
        <LandingReveal className="room-section-copy">
          <p className="atlas-eyebrow">Accountability has a room</p>
          <h2 id="room-title">Inside a Pod.</h2>
          <p>
            Commitments become shared activity cards. Members can talk, reply, and support
            the work without changing its review outcome.
          </p>
          <ul>
            <li>Creator announcements stay distinct.</li>
            <li>Proof remains connected to the occurrence.</li>
            <li>You choose whether the image is Pod-shared or reviewer-only.</li>
          </ul>
        </LandingReveal>
        <LandingReveal className="room-section-preview" delay={0.08}>
          <PodRoomPreview />
        </LandingReveal>
      </section>

      <section className="atlas-section funding-section" aria-labelledby="funding-title">
        <LandingReveal className="funding-section-preview">
          <FundingRailPreview />
        </LandingReveal>
        <LandingReveal className="funding-section-copy" delay={0.08}>
          <p className="atlas-eyebrow">NIM-native commitment</p>
          <h2 id="funding-title">NIM makes commitment visible.</h2>
          <p>
            Funding is not a spinner and a promise. Pods shows the participant every stage
            from wallet confirmation to a secured place.
          </p>
          <div className="funding-principle">
            <span>One upfront deposit</span>
            <strong>A clear state at every step.</strong>
          </div>
        </LandingReveal>
      </section>

      <section className="atlas-section spaces-section" aria-labelledby="spaces-title">
        <LandingReveal className="atlas-section-heading spaces-heading">
          <p className="atlas-eyebrow">Choose the community shape</p>
          <h2 id="spaces-title">
            Public when you want reach. Private when you want focus.
          </h2>
        </LandingReveal>
        <div className="spaces-grid">
          <LandingReveal className="space-panel space-panel-public">
            <span>Public Pods</span>
            <h3>Discover, apply, get accepted.</h3>
            <p>
              Public activities can be shared with a wider community while the creator keeps
              the roster intentional.
            </p>
            <small>Visible in Discover</small>
          </LandingReveal>
          <LandingReveal className="space-panel space-panel-private" delay={0.06}>
            <span>Private Pods</span>
            <h3>Invite the people already in the room.</h3>
            <p>
              Private activities stay out of discovery and open only through a direct
              invitation.
            </p>
            <small>Invitation only</small>
          </LandingReveal>
        </div>
      </section>

      <footer className="atlas-footer">
        <div className="atlas-footer-card">
          <div className="atlas-footer-mark atlas-identity-mark" aria-hidden="true">
            <span className="pod-mark" />
          </div>
          <p>Small commitments become visible momentum.</p>
          <small>pods · a Nimiq Pay Mini App</small>
        </div>
        <strong className="atlas-footer-wordmark">pods</strong>
      </footer>
    </main>
  );
}
