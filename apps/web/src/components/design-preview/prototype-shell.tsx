"use client";

import { CaretRight, SlidersHorizontal, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

import type {
  NativeMomentumPreviewData,
  PreviewActorId,
  ScenarioId,
  ScreenId
} from "./model";
import {
  ACTOR_DEFINITIONS,
  SCREEN_REGISTRY,
  type ActorDefinition,
  type TransitionDefinition
} from "./registry";
import { SCENARIOS } from "./scenarios";
import styles from "./prototype.module.css";

export function PrototypeShell({
  actor,
  screen,
  data,
  scenario,
  onActorChange,
  onScenarioChange,
  onScreenChange,
  onTransition,
  transitions,
  children
}: {
  actor: PreviewActorId;
  screen: ScreenId;
  data: NativeMomentumPreviewData;
  scenario: ScenarioId;
  onActorChange: (actor: PreviewActorId) => void;
  onScenarioChange: (scenario: ScenarioId) => void;
  onScreenChange: (screen: ScreenId) => void;
  onTransition: (actionId: string) => void;
  transitions: readonly TransitionDefinition[];
  children: ReactNode;
}) {
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const actors = Object.values(ACTOR_DEFINITIONS);
  const activeActor = ACTOR_DEFINITIONS[actor];
  const activeScreen = SCREEN_REGISTRY[screen];

  return (
    <main className={`${styles.foundation} ${styles.prototypeShell}`}>
      <button
        aria-expanded={mobileControlsOpen}
        aria-label="Open preview controls"
        className={styles.mobileControlTrigger}
        onClick={() => setMobileControlsOpen(true)}
        type="button"
      >
        <SlidersHorizontal aria-hidden="true" size={20} weight="bold" />
        Preview
      </button>
      <aside className={styles.prototypeSidebar}>
        <div className={styles.prototypeBrand}>
          <span className={styles.previewWordmark}>
            <i aria-hidden="true" />
            pods
          </span>
          <span className={styles.previewBadge}>Visual system</span>
        </div>
        <div className={styles.prototypeIntro}>
          <span>Connected mobile journeys</span>
          <h1>Every state has one clear next action.</h1>
          <p>
            Live public data is kept separate from simulated journey fixtures.
            No preview action mutates production state.
          </p>
        </div>
        <ActorNavigation
          active={actor}
          actors={actors}
          onActorChange={onActorChange}
        />
        <div className={styles.dataStatus}>
          <i data-live={data.databaseStatus === "connected"} />
          <span>
            <strong>
              {data.databaseStatus === "connected"
                ? "Live public data with simulated journey fixtures"
                : "Representative preview data"}
            </strong>
            <small>
              {data.pods.length} Pods · {data.people.length} profiles ·{" "}
              {data.roomEntries.length} room events
            </small>
          </span>
        </div>
      </aside>

      <section className={styles.prototypeStage}>
        <header className={styles.stageHeader}>
          <div>
            <h1>{activeActor.label} journey</h1>
            <h2>{activeScreen.label}</h2>
          </div>
          <p>{activeScreen.note}</p>
          <label className={styles.scenarioControl}>
            <span>Visual state</span>
            <select
              aria-label="Visual state"
              onChange={(event) =>
                onScenarioChange(event.currentTarget.value as ScenarioId)
              }
              value={scenario}
            >
              {SCENARIOS.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
        </header>
        <ScreenNavigation
          actor={activeActor}
          active={screen}
          onScreenChange={onScreenChange}
        />
        <div className={styles.deviceStage}>
          <div className={styles.deviceFrame}>
            <div className={styles.deviceStatus} aria-hidden="true">
              <span>9:41</span>
              <i />
              <b />
            </div>
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className={styles.screenMotion}
              data-preview-label={activeScreen.label}
              initial={false}
              key={`${actor}-${screen}`}
              transition={{
                duration: reducedMotion ? 0 : 0.32,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              {children}
            </motion.div>
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
          {activeActor.screens.map((candidate, index) => {
            const definition = SCREEN_REGISTRY[candidate];
            return (
              <li data-active={candidate === screen} key={candidate}>
                <button onClick={() => onScreenChange(candidate)} type="button">
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>
                    <strong>{definition.label}</strong>
                    <small>{definition.note}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <section className={styles.prototypeRules}>
          <span>Visual contract</span>
          <p>
            One dominant action, persistent actor identity, selected entities
            carried through navigation, and motion only for state feedback.
          </p>
        </section>
        <TransitionActions
          onTransition={onTransition}
          transitions={transitions}
        />
      </aside>

      {mobileControlsOpen ? (
        <section
          aria-label="Preview controls"
          aria-modal="true"
          className={styles.mobileCompanion}
          role="dialog"
        >
          <header>
            <div>
              <span>Mobile companion</span>
              <h2>Preview controls</h2>
            </div>
            <button
              aria-label="Close preview controls"
              onClick={() => setMobileControlsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </header>
          <div aria-label="Preview actor" className={styles.mobileActorGrid} role="group">
            {actors.map((definition) => (
              <button
                aria-pressed={actor === definition.id}
                key={definition.id}
                onClick={() => onActorChange(definition.id)}
                type="button"
              >
                {definition.label}
              </button>
            ))}
          </div>
          <label className={styles.mobileScenarioControl}>
            <span>Visual state</span>
            <select
              aria-label="Mobile visual state"
              onChange={(event) =>
                onScenarioChange(event.currentTarget.value as ScenarioId)
              }
              value={scenario}
            >
              {SCENARIOS.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <TransitionActions
            onTransition={onTransition}
            transitions={transitions}
          />
        </section>
      ) : null}
    </main>
  );
}

function TransitionActions({
  transitions,
  onTransition
}: {
  transitions: readonly TransitionDefinition[];
  onTransition: (actionId: string) => void;
}) {
  if (transitions.length === 0) return null;
  return (
    <div aria-label="Journey actions" className={styles.transitionActions} role="group">
      {transitions.map((transition) => (
        <button
          aria-label={`Run transition ${transition.actionId}`}
          key={`${transition.from}-${transition.actionId}`}
          onClick={() => onTransition(transition.actionId)}
          type="button"
        >
          {transition.actionId.replaceAll("-", " ")}
          <CaretRight aria-hidden="true" size={14} weight="bold" />
        </button>
      ))}
    </div>
  );
}

function ActorNavigation({
  actors,
  active,
  onActorChange
}: {
  actors: ActorDefinition[];
  active: PreviewActorId;
  onActorChange: (actor: PreviewActorId) => void;
}) {
  return (
    <nav aria-label="Preview actors" className={styles.actorNav}>
      {actors.map((definition) => (
        <button
          aria-current={active === definition.id ? "page" : undefined}
          aria-label={definition.label}
          key={definition.id}
          onClick={() => onActorChange(definition.id)}
          type="button"
        >
          <span>{definition.label}</span>
          <small>{definition.screens.length} screens</small>
          <CaretRight aria-hidden="true" size={16} weight="bold" />
        </button>
      ))}
    </nav>
  );
}

function ScreenNavigation({
  actor,
  active,
  onScreenChange
}: {
  actor: ActorDefinition;
  active: ScreenId;
  onScreenChange: (screen: ScreenId) => void;
}) {
  return (
    <nav
      aria-label={`${actor.label} screens`}
      className={styles.screenRail}
    >
      {actor.screens.map((candidate, index) => (
        <button
          aria-current={candidate === active ? "page" : undefined}
          aria-label={SCREEN_REGISTRY[candidate].label}
          key={candidate}
          onClick={() => onScreenChange(candidate)}
          type="button"
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          {SCREEN_REGISTRY[candidate].label}
        </button>
      ))}
    </nav>
  );
}
