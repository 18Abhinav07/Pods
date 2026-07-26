"use client";

import { ArrowRight, Check, ImageSquare, UploadSimple } from "@phosphor-icons/react";
import { useId, type ReactNode } from "react";

import styles from "./prototype.module.css";

function formatAmount(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 5
  }).format(value);
}

export function ChoiceIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={styles.choiceIndicator}
      data-selected={selected}
      data-testid={`choice-indicator-${selected ? "selected" : "unselected"}`}
    >
      {selected ? <Check aria-hidden="true" size={16} weight="bold" /> : null}
    </span>
  );
}

export function ChoiceCard({
  name,
  value,
  title,
  description,
  selected,
  onSelect,
  media,
  disabled = false
}: {
  name: string;
  value: string;
  title: string;
  description: string;
  selected: boolean;
  onSelect: (value: string) => void;
  media?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={styles.choiceCard} data-selected={selected}>
      <input
        checked={selected}
        disabled={disabled}
        name={name}
        onClick={() => onSelect(value)}
        readOnly
        type="radio"
        value={value}
      />
      {media ? <span className={styles.choiceMedia}>{media}</span> : null}
      <span className={styles.choiceCopy}>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <ChoiceIndicator selected={selected} />
    </label>
  );
}

export function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  return (
    <div className={styles.switchRow}>
      <span>
        <strong id={labelId}>{label}</strong>
        <small id={descriptionId}>{description}</small>
      </span>
      <button
        aria-checked={checked}
        aria-describedby={descriptionId}
        aria-labelledby={labelId}
        className={styles.switch}
        data-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        role="switch"
        type="button"
      >
        <i />
      </button>
    </div>
  );
}

type Action = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export function ActionDock({
  primary,
  secondary
}: {
  primary: Action;
  secondary?: Action;
}) {
  return (
    <section aria-label="Screen actions" className={styles.actionDock}>
      <button
        className={styles.primaryAction}
        disabled={primary.disabled}
        onClick={primary.onClick}
        type="button"
      >
        <span>{primary.label}</span>
        <i>
          <ArrowRight aria-hidden="true" size={21} weight="bold" />
        </i>
      </button>
      {secondary ? (
        <button
          className={styles.secondaryAction}
          disabled={secondary.disabled}
          onClick={secondary.onClick}
          type="button"
        >
          {secondary.label}
        </button>
      ) : null}
    </section>
  );
}

export function ActionGroup({ children }: { children: ReactNode }) {
  return <div className={styles.actionGroup}>{children}</div>;
}

export function RequestCard({
  name,
  context,
  introduction,
  onAccept,
  onDecline,
  onBlock
}: {
  name: string;
  context: string;
  introduction?: string;
  onAccept: () => void;
  onDecline: () => void;
  onBlock?: () => void;
}) {
  return (
    <article className={styles.requestCard}>
      <div className={styles.requestIdentity}>
        <span aria-hidden="true">{name.slice(0, 1)}</span>
        <div>
          <strong>{name}</strong>
          <small>{context}</small>
        </div>
      </div>
      {introduction ? <p>{introduction}</p> : null}
      <div className={styles.requestActions}>
        <button
          aria-label={`Accept ${name}`}
          className={styles.acceptAction}
          onClick={onAccept}
          type="button"
        >
          Accept
        </button>
        <button
          aria-label={`Decline ${name}`}
          className={styles.declineAction}
          onClick={onDecline}
          type="button"
        >
          Decline
        </button>
      </div>
      {onBlock ? (
        <button className={styles.tertiaryAction} onClick={onBlock} type="button">
          Block or report
        </button>
      ) : null}
    </article>
  );
}

export function NimMedallion({ size = "large" }: { size?: "small" | "large" }) {
  return (
    <span className={styles.nimMedallion} data-size={size}>
      <img alt="Nimiq" src="/media/nimiq-signet.svg" />
    </span>
  );
}

export function FinancialReceipt({
  occurrenceCount,
  amountPerOccurrence,
  currency
}: {
  occurrenceCount: number;
  amountPerOccurrence: number;
  currency: "NIM";
}) {
  const total = Number((occurrenceCount * amountPerOccurrence).toFixed(5));
  return (
    <dl className={styles.financialReceipt}>
      <div>
        <dt>Commitment</dt>
        <dd>
          {occurrenceCount} occurrences x {formatAmount(amountPerOccurrence)}{" "}
          {currency}
        </dd>
      </div>
      <div>
        <dt>Maximum upfront</dt>
        <dd>
          Maximum upfront: {formatAmount(total)} {currency}
        </dd>
      </div>
    </dl>
  );
}

export function TransferTracker({
  steps,
  current
}: {
  steps: readonly { id: string; label: string }[];
  current: string;
}) {
  const currentIndex = steps.findIndex((step) => step.id === current);
  return (
    <ol aria-label="Transfer progress" className={styles.transferTracker}>
      {steps.map((step, index) => {
        const state =
          index < currentIndex
            ? "complete"
            : index === currentIndex
              ? "current"
              : "upcoming";
        return (
          <li data-state={state} key={step.id}>
            <i aria-hidden="true">
              {state === "complete" ? <Check size={12} weight="bold" /> : null}
            </i>
            <span aria-current={state === "current" ? "step" : undefined}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function OutcomeStrip({
  label,
  tone,
  detail
}: {
  label: string;
  tone: "success" | "pending" | "danger" | "neutral";
  detail?: string;
}) {
  return (
    <div className={styles.outcomeStrip} data-tone={tone} role="status">
      <i aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        {detail ? <small>{detail}</small> : null}
      </span>
    </div>
  );
}

export function ConsentPanel({
  label,
  description,
  checked,
  onCheckedChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label className={styles.consentPanel}>
      <input
        aria-label={label}
        checked={checked}
        onChange={(event) => onCheckedChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span className={styles.consentIndicator}>
        {checked ? <Check aria-hidden="true" size={17} weight="bold" /> : null}
      </span>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
    </label>
  );
}

export function TerminalOutcome({
  heading,
  message,
  amount,
  tone,
  action
}: {
  heading: string;
  message: string;
  amount?: string;
  tone: "success" | "danger" | "neutral";
  action?: Action;
}) {
  return (
    <section className={styles.terminalOutcome} data-tone={tone} role="status">
      <span className={styles.terminalMark} aria-hidden="true">
        <Check size={24} weight="bold" />
      </span>
      <div>
        <h2>{heading}</h2>
        {amount ? <strong className={styles.terminalAmount}>{amount}</strong> : null}
        <p>{message}</p>
      </div>
      {action ? (
        <button onClick={action.onClick} type="button">
          {action.label}
        </button>
      ) : null}
    </section>
  );
}

export function UploadAvatarTile({
  onSelect,
  disabled = false
}: {
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label="Upload your photo"
      className={styles.uploadAvatarTile}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <span>
        <ImageSquare aria-hidden="true" size={24} />
        <UploadSimple aria-hidden="true" size={16} weight="bold" />
      </span>
      <strong>Upload your photo</strong>
      <small>JPG, PNG, or WebP up to 5 MB</small>
    </button>
  );
}

export function ScreenHeader({
  title,
  eyebrow,
  trailing
}: {
  title: string;
  eyebrow?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className={styles.screenHeader}>
      <div>
        {eyebrow ? <span>{eyebrow}</span> : null}
        <h1>{title}</h1>
      </div>
      {trailing}
    </header>
  );
}

export function JourneySwitcher({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={label} className={styles.journeySwitcher}>
      {children}
    </nav>
  );
}
