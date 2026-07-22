import Link from "next/link";
import type { ReactNode } from "react";

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
    <main className="app-shell creator-shell adaptive-creator-shell">
      <header className="app-topbar entrance entrance-topbar">
        <Link className="wordmark" href="/today" aria-label="Pods Today">
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
        <Link className="quiet-link" href="/my-pods">Save and exit</Link>
      </header>
      <nav className="wizard-progress entrance entrance-hero" aria-label="Pod creation progress">
        {steps.map((step, index) => (
          <span
            aria-current={index === activeStep ? "step" : undefined}
            className={index < activeStep ? "is-complete" : ""}
            key={step}
          >
            <i>{index + 1}</i>
            <b>{step}</b>
          </span>
        ))}
      </nav>
      <section className="wizard-intro entrance entrance-status">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
      </section>
      <section className="wizard-surface entrance entrance-templates">{children}</section>
    </main>
  );
}
