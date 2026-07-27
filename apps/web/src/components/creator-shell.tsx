import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./creator-flow.module.css";

const steps = ["Template", "Activity", "Community", "Commitment", "Review"] as const;

export function CreatorShell({
  activeStep,
  children,
  eyebrow,
  title,
  copy
}: {
  activeStep: number;
  children: ReactNode;
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <main className={styles.creatorShell}>
      <header className={styles.topBar}>
        <Link className={styles.wordmark} href="/today" aria-label="Pods Today">
          <Image alt="" aria-hidden="true" height={24} src="/brand/pods-mark.svg" width={24} />
          pods
        </Link>
        <Link className={styles.exitButton} href="/my-pods">Exit</Link>
      </header>
      <nav className={styles.progress} aria-label={`Create a Pod, step ${activeStep + 1} of ${steps.length}`}>
        {steps.map((step, index) => (
          <span
            aria-label={`${step}${index < activeStep ? ", complete" : index === activeStep ? ", current" : ""}`}
            aria-current={index === activeStep ? "step" : undefined}
            className={styles.progressDot}
            data-complete={index < activeStep}
            key={step}
            title={step}
          />
        ))}
      </nav>
      <section className={styles.intro}>
        <p className={styles.introEyebrow}>{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </section>
      <section className={styles.surface}>{children}</section>
    </main>
  );
}
