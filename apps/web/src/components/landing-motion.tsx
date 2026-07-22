"use client";

import { ArrowUpRight, Wallet } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const revealEase = [0.16, 1, 0.3, 1] as const;
const orbitEase = [0.45, 0, 0.55, 1] as const;

function useSafeInView(ref: React.RefObject<HTMLDivElement | null>) {
  const [observerReady, setObserverReady] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || !ref.current) return;

    setObserverReady(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return { inView, observerReady };
}

export function LandingReveal({
  children,
  className = "",
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { inView, observerReady } = useSafeInView(ref);
  const revealed = reduceMotion || !observerReady || inView;

  return (
    <motion.div
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0.001, y: 42 }}
      className={className}
      initial={false}
      ref={ref}
      transition={{ duration: reduceMotion ? 0 : 0.82, delay, ease: revealEase }}
    >
      {children}
    </motion.div>
  );
}

export function LandingActions() {
  return (
    <div className="atlas-actions">
      <motion.div
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          className="atlas-action atlas-action-primary"
          href="/connect?returnTo=%2Ftoday"
        >
          <Wallet aria-hidden="true" size={18} weight="light" />
          <span>Connect wallet</span>
          <i aria-hidden="true">
            <ArrowUpRight size={15} weight="light" />
          </i>
        </Link>
      </motion.div>
      <motion.div
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link className="atlas-action atlas-action-secondary" href="/discover">
          <span>Discover Pods</span>
          <i aria-hidden="true">
            <ArrowUpRight size={15} weight="light" />
          </i>
        </Link>
      </motion.div>
    </div>
  );
}

export function ActivityAtlasVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`atlas-visual${reduceMotion ? " is-static" : ""}`}
    >
      <motion.figure
        animate={reduceMotion ? {} : { y: [0, -8, 0], rotate: [-1, -0.25, -1] }}
        className="atlas-frame atlas-frame-build"
        transition={{ duration: 7.5, repeat: Infinity, ease: orbitEase }}
      >
        <Image
          alt=""
          fill
          fetchPriority="high"
          loading="eager"
          sizes="(max-width: 767px) 78vw, 430px"
          src="/media/build-workspace.jpg"
        />
        <figcaption>
          <span>Build & Ship</span>
          <strong>Proof due today</strong>
        </figcaption>
      </motion.figure>

      <motion.figure
        animate={reduceMotion ? {} : { y: [0, 7, 0], rotate: [1.25, 0.5, 1.25] }}
        className="atlas-frame atlas-frame-fitness"
        transition={{ duration: 8.4, repeat: Infinity, ease: orbitEase }}
      >
        <Image alt="" fill sizes="170px" src="/media/fitness.jpg" />
        <figcaption>Fitness</figcaption>
      </motion.figure>

      <motion.figure
        animate={reduceMotion ? {} : { y: [0, -5, 0], rotate: [-0.8, 0.2, -0.8] }}
        className="atlas-frame atlas-frame-reading"
        transition={{ duration: 9.1, repeat: Infinity, ease: orbitEase }}
      >
        <Image alt="" fill sizes="150px" src="/media/reading.jpg" />
        <figcaption>Reading</figcaption>
      </motion.figure>

      <div className="atlas-occurrence">
        <span>Today · occurrence 04</span>
        <strong>Ship wallet-safe evidence capture</strong>
        <small>Proof window is open</small>
        <i />
      </div>
      <div className="atlas-signal atlas-signal-study">Study & Focus</div>
      <div className="atlas-signal atlas-signal-create">Practice & Create</div>
      <div className="atlas-orbit atlas-identity-mark">
        <span className="pod-mark" />
      </div>
    </div>
  );
}

export const ActivityRibbon = memo(function ActivityRibbon() {
  const reduceMotion = useReducedMotion();
  const labels = [
    "Build & Ship",
    "Fitness & Movement",
    "Reading",
    "Study & Focus",
    "Practice & Create"
  ];

  return (
    <div
      aria-label="Five activity templates"
      className={`activity-ribbon${reduceMotion ? " is-static" : ""}`}
    >
      <div>
        {[...labels, ...labels].map((label, index) => (
          <span key={`${label}-${index}`}>
            {label}
            <i aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
});
