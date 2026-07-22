"use client";

import {
  profileAvatarPresets,
  type DmPolicy,
  type ProfileAvatarPreset,
  type ProfileInput,
  type ProfileVisibility,
  validateProfileInput
} from "@pods/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileAvatar } from "./profile-avatar";

const stepLabels = ["Profile", "About", "Privacy"] as const;

type FieldErrors = Partial<Record<keyof ProfileInput, string>>;

export function ProfileOnboardingForm({
  returnTo,
  initialProfile
}: {
  returnTo: string;
  initialProfile?: ProfileInput;
}) {
  const router = useRouter();
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
      setStep(validation.errors.handle || validation.errors.displayName ? 0 : 1);
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
          if (data.errors.handle || data.errors.displayName) setStep(0);
        } else {
          setErrors({ bio: data.error ?? "Profile could not be saved" });
        }
        return;
      }
      router.replace(returnTo);
      router.refresh();
    } catch {
      setErrors({ bio: "Profile could not be saved. Check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="profile-onboarding" aria-label="Create your Pods profile">
      <div className="onboarding-progress" aria-label={`Step ${step + 1} of ${stepLabels.length}`}>
        {stepLabels.map((label, index) => (
          <span aria-hidden="true" className={index === step ? "is-current" : index < step ? "is-complete" : ""} key={label} />
        ))}
      </div>

      {step === 0 ? (
        <div className="onboarding-step onboarding-step-identity">
          <h1>Choose how people know you.</h1>
          <p className="screen-copy">
            Your wallet stays private. Your profile is what the community sees.
          </p>
          <div className="avatar-stage">
            <ProfileAvatar avatar={{ kind: "preset", preset: avatarPreset }} displayName={displayName || "Pods"} size="large" />
            <strong>Avatar</strong>
          </div>
          <div className="avatar-picker" aria-label="Choose a Pods avatar">
            {profileAvatarPresets.map((preset) => (
              <button
                aria-label={`Choose ${preset} avatar`}
                aria-pressed={avatarPreset === preset}
                className={avatarPreset === preset ? "is-selected" : ""}
                key={preset}
                onClick={() => setAvatarPreset(preset)}
                type="button"
              >
                <ProfileAvatar avatar={{ kind: "preset", preset }} displayName={displayName || preset} size="small" />
              </button>
            ))}
          </div>
          <label className="profile-field" htmlFor="profile-handle">
            <span>Handle</span>
            <div className="handle-input"><i>@</i><input aria-label="Handle" aria-invalid={Boolean(errors.handle)} autoCapitalize="none" autoComplete="off" id="profile-handle" maxLength={20} onChange={(event) => setHandle(event.target.value)} value={handle} /></div>
            {errors.handle ? <small role="alert">{errors.handle}</small> : <em>Lowercase letters, numbers, and underscores.</em>}
          </label>
          <label className="profile-field" htmlFor="profile-display-name">
            <span>Display name</span>
            <input aria-label="Display name" aria-invalid={Boolean(errors.displayName)} id="profile-display-name" maxLength={40} onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
            {errors.displayName ? <small role="alert">{errors.displayName}</small> : null}
          </label>
          <button className="primary-action full-action" onClick={() => identityValid() && setStep(1)} type="button">
            Continue to your story
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="onboarding-step">
          <h1>What are you showing up for?</h1>
          <p className="screen-copy">A short introduction is enough.</p>
          <label className="profile-field" htmlFor="profile-bio">
            <span>Short bio</span>
            <textarea aria-label="Short bio" aria-invalid={Boolean(errors.bio)} id="profile-bio" maxLength={160} onChange={(event) => setBio(event.target.value)} placeholder="What are you practicing, building, or becoming?" rows={5} value={bio} />
            <em>{bio.length} / 160</em>
            {errors.bio ? <small role="alert">{errors.bio}</small> : null}
          </label>
          <fieldset className="choice-grid">
            <legend>Profile visibility</legend>
            <label className={visibility === "public" ? "is-selected" : ""}>
              <input aria-label="Public profile" checked={visibility === "public"} name="visibility" onChange={() => setVisibility("public")} type="radio" />
              <strong>Public profile</strong>
              <span>Discoverable by handle with public Pod achievements.</span>
            </label>
            <label className={visibility === "private" ? "is-selected" : ""}>
              <input aria-label="Private profile" checked={visibility === "private"} name="visibility" onChange={() => setVisibility("private")} type="radio" />
              <strong>Private profile</strong>
              <span>Only people who share a Pod can open your limited profile.</span>
            </label>
          </fieldset>
          <div className="split-actions">
            <button className="secondary-action" onClick={() => setStep(0)} type="button">Back</button>
            <button className="primary-action" onClick={() => setStep(2)} type="button">Continue to privacy</button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="onboarding-step">
          <h1>Stay social on your terms.</h1>
          <p className="screen-copy">Choose who can reach you.</p>
          <fieldset className="choice-stack">
            <legend>Who can message you?</legend>
            <label className={dmPolicy === "friends" ? "is-selected" : ""}>
              <input aria-label="Friends only" checked={dmPolicy === "friends"} name="dm-policy" onChange={() => setDmPolicy("friends")} type="radio" />
              <strong>Friends only</strong><span>People you accept can start a conversation.</span>
            </label>
            <label className={dmPolicy === "requests" ? "is-selected" : ""}>
              <input aria-label="Allow message requests" checked={dmPolicy === "requests"} name="dm-policy" onChange={() => setDmPolicy("requests")} type="radio" />
              <strong>Allow message requests</strong><span>Non-friends may send one text introduction for approval.</span>
            </label>
            <label className={dmPolicy === "none" ? "is-selected" : ""}>
              <input aria-label="No direct messages" checked={dmPolicy === "none"} name="dm-policy" onChange={() => setDmPolicy("none")} type="radio" />
              <strong>No direct messages</strong><span>Pod room conversations still work for members.</span>
            </label>
          </fieldset>
          <label className="status-toggle">
            <input checked={activityStatusVisible} onChange={(event) => setActivityStatusVisible(event.target.checked)} type="checkbox" />
            <span><strong>Show activity status</strong><small>Friends may see when you were recently active.</small></span>
          </label>
          <div className="privacy-note">Your wallet address, deposits, private Pod names, and reviewer evidence never enter your social profile.</div>
          <div className="split-actions">
            <button className="secondary-action" onClick={() => setStep(1)} type="button">Back</button>
            <button className="primary-action" disabled={submitting} onClick={submit} type="button">{submitting ? "Saving profile" : "Enter Pods"}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
