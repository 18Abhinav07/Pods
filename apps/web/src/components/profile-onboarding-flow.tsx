"use client";

import {
  profileAvatarPresets,
  type DmPolicy,
  type ProfileAvatarPreset,
  type ProfileInput,
  type ProfileVisibility,
  validateProfileInput
} from "@pods/domain";
import { ArrowRight, Check, ImageSquare } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./entry-flow.module.css";
import { ProfileAvatar } from "./profile-avatar";

const stepLabels = ["Identity", "Portrait", "Boundaries"] as const;

type FieldErrors = Partial<Record<keyof ProfileInput, string>>;

function stepForErrors(errors: FieldErrors): number {
  if (errors.handle || errors.displayName || errors.bio) return 0;
  if (errors.avatar) return 1;
  return 2;
}

function ForwardAction({
  children,
  disabled,
  onClick
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={styles.primaryButton}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{children}</span>
      <i aria-hidden="true"><ArrowRight weight="bold" /></i>
    </button>
  );
}

export function ProfileOnboardingForm({
  returnTo,
  initialProfile,
  onSaved
}: {
  returnTo: string;
  initialProfile?: ProfileInput;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const isEditing = Boolean(initialProfile);
  const [step, setStep] = useState(0);
  const [handle, setHandle] = useState(initialProfile?.handle ?? "");
  const [displayName, setDisplayName] = useState(initialProfile?.displayName ?? "");
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [avatarPreset, setAvatarPreset] = useState<ProfileAvatarPreset>(
    initialProfile?.avatar.kind === "preset" ? initialProfile.avatar.preset : "ember"
  );
  const [visibility, setVisibility] = useState<ProfileVisibility>(
    initialProfile?.visibility ?? "private"
  );
  const [dmPolicy, setDmPolicy] = useState<DmPolicy>(initialProfile?.dmPolicy ?? "friends");
  const [activityStatusVisible, setActivityStatusVisible] = useState(
    initialProfile?.activityStatusVisible ?? true
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function identityValid() {
    const next: FieldErrors = {};
    if (!/^[a-z0-9_]{3,20}$/.test(handle.trim().toLowerCase())) {
      next.handle = "Use 3 to 20 lowercase letters, numbers, or underscores";
    }
    if (displayName.trim().length < 2 || displayName.trim().length > 40) {
      next.displayName = "Add a display name in 2 to 40 characters";
    }
    if (bio.trim().length > 160) {
      next.bio = "Keep your bio within 160 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    const input: ProfileInput = {
      handle,
      displayName,
      bio,
      avatar: { kind: "preset", preset: avatarPreset },
      visibility,
      dmPolicy,
      activityStatusVisible
    };
    const validation = validateProfileInput(input as unknown as Record<string, unknown>);
    if (!validation.success) {
      setErrors(validation.errors);
      setStep(stepForErrors(validation.errors));
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input)
      });
      const data = (await response.json()) as {
        errors?: FieldErrors;
        error?: string;
      };
      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
          setStep(stepForErrors(data.errors));
        } else {
          setErrors({ bio: data.error ?? "Profile could not be saved" });
          setStep(0);
        }
        return;
      }
      router.replace(returnTo);
      router.refresh();
      onSaved?.();
    } catch {
      setErrors({ bio: "Profile could not be saved. Check your connection and try again." });
      setStep(0);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-label={isEditing ? "Edit your Pods profile" : "Create your Pods profile"}
      className={`${styles.onboardingForm} ${isEditing ? styles.onboardingFormEditing : ""}`}
    >
      <div className={styles.progress} aria-label={`Step ${step + 1} of ${stepLabels.length}`}>
        {stepLabels.map((label, index) => (
          <span
            aria-hidden="true"
            data-complete={index < step}
            data-current={index === step}
            key={label}
          />
        ))}
      </div>

      {step === 0 ? (
        <div className={styles.step}>
          <div className={styles.prompt}>
            <span>Your identity</span>
            <h1>Make your work recognizable</h1>
            <p>This is how people see you in rooms, applications, and public activity.</p>
          </div>
          <div className={styles.fields}>
            <label className={styles.field} htmlFor="profile-display-name">
              <span>Display name</span>
              <input
                aria-label="Display name"
                aria-invalid={Boolean(errors.displayName)}
                id="profile-display-name"
                maxLength={40}
                onChange={(event) => setDisplayName(event.target.value)}
                value={displayName}
              />
              {errors.displayName ? <small role="alert">{errors.displayName}</small> : null}
            </label>
            <label className={styles.field} htmlFor="profile-handle">
              <span>Handle</span>
              <div className={styles.handleField}>
                <b>@</b>
                <input
                  aria-label="Handle"
                  aria-invalid={Boolean(errors.handle)}
                  autoCapitalize="none"
                  autoComplete="off"
                  id="profile-handle"
                  maxLength={20}
                  onChange={(event) => setHandle(event.target.value)}
                  value={handle}
                />
              </div>
              {errors.handle ? (
                <small role="alert">{errors.handle}</small>
              ) : (
                <em>Lowercase letters, numbers, and underscores.</em>
              )}
            </label>
            <label className={styles.field} htmlFor="profile-bio">
              <span>Short bio</span>
              <textarea
                aria-label="Short bio"
                aria-invalid={Boolean(errors.bio)}
                id="profile-bio"
                maxLength={160}
                onChange={(event) => setBio(event.target.value)}
                placeholder="What are you practicing, building, or becoming?"
                rows={4}
                value={bio}
              />
              <span className={styles.fieldMeta}>
                {errors.bio ? <small role="alert">{errors.bio}</small> : <small />}
                <em>{bio.length} / 160</em>
              </span>
            </label>
          </div>
          <div className={`${styles.actions} ${styles.actionsSingle}`}>
            <ForwardAction onClick={() => identityValid() && setStep(1)}>
              Choose an avatar
            </ForwardAction>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className={styles.step}>
          <div className={styles.prompt}>
            <span>Your portrait</span>
            <h1>Choose a signal that feels like you</h1>
            <p>Pick an illustrated portrait now. Personal photo upload is coming next.</p>
          </div>
          <div className={styles.avatarGrid} aria-label="Choose a Pods avatar">
            {profileAvatarPresets.map((preset) => (
              <button
                aria-label={`Choose ${preset} avatar`}
                aria-pressed={avatarPreset === preset}
                className={styles.avatarOption}
                data-selected={avatarPreset === preset}
                key={preset}
                onClick={() => setAvatarPreset(preset)}
                type="button"
              >
                <ProfileAvatar
                  avatar={{ kind: "preset", preset }}
                  displayName={displayName || preset}
                  size="large"
                />
                {avatarPreset === preset ? (
                  <i aria-hidden="true"><Check weight="bold" /></i>
                ) : null}
              </button>
            ))}
          </div>
          <button
            aria-label="Upload your own photo"
            className={styles.uploadTile}
            disabled
            type="button"
          >
            <i aria-hidden="true"><ImageSquare size={19} /></i>
            <span>
              <strong>Upload your own photo</strong>
              <small>Coming in the next profile update</small>
            </span>
          </button>
          <div className={styles.actions}>
            <button className={styles.secondaryButton} onClick={() => setStep(0)} type="button">
              Back
            </button>
            <ForwardAction onClick={() => setStep(2)}>Set boundaries</ForwardAction>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className={styles.step}>
          <div className={styles.prompt}>
            <span>Your boundaries</span>
            <h1>Choose what people can discover</h1>
            <p>These controls can be changed later. Private Pod activity always stays private.</p>
          </div>
          <fieldset className={styles.choiceGroup}>
            <legend>Profile visibility</legend>
            <label className={styles.choiceCard} data-selected={visibility === "public"}>
              <input
                aria-label="Public profile"
                checked={visibility === "public"}
                name="visibility"
                onChange={() => setVisibility("public")}
                type="radio"
              />
              <span className={styles.choiceCopy}>
                <strong>Public profile</strong>
                <span>People can search, follow, and see public milestones.</span>
              </span>
              <i className={styles.choiceIndicator} aria-hidden="true">
                {visibility === "public" ? <Check weight="bold" /> : null}
              </i>
            </label>
            <label className={styles.choiceCard} data-selected={visibility === "private"}>
              <input
                aria-label="Private profile"
                checked={visibility === "private"}
                name="visibility"
                onChange={() => setVisibility("private")}
                type="radio"
              />
              <span className={styles.choiceCopy}>
                <strong>Private profile</strong>
                <span>Your handle exists, but profile content stays hidden.</span>
              </span>
              <i className={styles.choiceIndicator} aria-hidden="true">
                {visibility === "private" ? <Check weight="bold" /> : null}
              </i>
            </label>
          </fieldset>
          <fieldset className={styles.choiceGroup}>
            <legend>Who can contact you</legend>
            <label className={styles.choiceCard} data-selected={dmPolicy === "requests"}>
              <input
                aria-label="Allow message requests"
                checked={dmPolicy === "requests"}
                name="dm-policy"
                onChange={() => setDmPolicy("requests")}
                type="radio"
              />
              <span className={styles.choiceCopy}>
                <strong>Friends and requests</strong>
                <span>Non-friends can send one introduction.</span>
              </span>
              <i className={styles.choiceIndicator} aria-hidden="true">
                {dmPolicy === "requests" ? <Check weight="bold" /> : null}
              </i>
            </label>
            <label className={styles.choiceCard} data-selected={dmPolicy === "friends"}>
              <input
                aria-label="Friends only"
                checked={dmPolicy === "friends"}
                name="dm-policy"
                onChange={() => setDmPolicy("friends")}
                type="radio"
              />
              <span className={styles.choiceCopy}>
                <strong>Friends only</strong>
                <span>Only accepted friends can start a chat.</span>
              </span>
              <i className={styles.choiceIndicator} aria-hidden="true">
                {dmPolicy === "friends" ? <Check weight="bold" /> : null}
              </i>
            </label>
            <label className={styles.choiceCard} data-selected={dmPolicy === "none"}>
              <input
                aria-label="No direct messages"
                checked={dmPolicy === "none"}
                name="dm-policy"
                onChange={() => setDmPolicy("none")}
                type="radio"
              />
              <span className={styles.choiceCopy}>
                <strong>No direct messages</strong>
                <span>Pod room conversations still work.</span>
              </span>
              <i className={styles.choiceIndicator} aria-hidden="true">
                {dmPolicy === "none" ? <Check weight="bold" /> : null}
              </i>
            </label>
          </fieldset>
          <label className={styles.statusCard} data-checked={activityStatusVisible}>
            <span>
              <strong>Show activity status</strong>
              <small>Friends may see when you were recently active.</small>
            </span>
            <input
              checked={activityStatusVisible}
              onChange={(event) => setActivityStatusVisible(event.target.checked)}
              type="checkbox"
            />
            <span className={styles.switch} aria-hidden="true" />
          </label>
          <p className={styles.privacyNote}>
            Wallet identity, deposits, and creator-only evidence stay private.
          </p>
          <div className={styles.actions}>
            <button className={styles.secondaryButton} onClick={() => setStep(1)} type="button">
              Back
            </button>
            <button
              aria-busy={submitting}
              className={styles.primaryButton}
              disabled={submitting}
              onClick={submit}
              type="button"
            >
              <span className={styles.buttonLabel}>
                {submitting ? (
                  <span
                    aria-hidden="true"
                    className={styles.saveSpinner}
                    data-testid="profile-save-spinner"
                  />
                ) : null}
                <span>{submitting ? "Saving profile" : isEditing ? "Save profile" : "Enter Pods"}</span>
              </span>
              <i aria-hidden="true"><ArrowRight weight="bold" /></i>
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
