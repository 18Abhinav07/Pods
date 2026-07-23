import type { ProfileAvatar, ProfileAvatarPreset } from "@pods/domain";

const portraitPalette: Record<ProfileAvatarPreset, {
  background: string;
  skin: string;
  hair: string;
  shirt: string;
  accent: string;
}> = {
  ember: { background: "#f3ece8", skin: "#d88f68", hair: "#22201f", shirt: "#d75d39", accent: "#f2c14f" },
  moss: { background: "#e8eee5", skin: "#9b5b39", hair: "#171916", shirt: "#4e8667", accent: "#d6ea8b" },
  indigo: { background: "#e9e9f2", skin: "#e8aa7d", hair: "#2f4059", shirt: "#6678b8", accent: "#a9b8ee" },
  coral: { background: "#f2e7e2", skin: "#75452f", hair: "#171412", shirt: "#e38268", accent: "#f4c1a6" },
  sun: { background: "#f2eddf", skin: "#c2764c", hair: "#a64e2d", shirt: "#e4b83d", accent: "#fff0ad" },
  stone: { background: "#e8e8e5", skin: "#efb58b", hair: "#20201f", shirt: "#73777c", accent: "#d4d0c8" }
};

function IllustratedPortrait({ preset }: { preset: ProfileAvatarPreset }) {
  const palette = portraitPalette[preset];
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 120 120">
      <rect fill={palette.background} height="120" width="120" />
      <path d="M19 121c1-23 15-37 41-37s40 14 41 37H19Z" fill={palette.shirt} />
      <path d="M51 76h18v17c-2 5-16 5-18 0V76Z" fill={palette.skin} />
      <ellipse cx="60" cy="55" fill={palette.skin} rx="27" ry="32" />
      <ellipse cx="33" cy="58" fill={palette.skin} rx="4" ry="7" />
      <ellipse cx="87" cy="58" fill={palette.skin} rx="4" ry="7" />

      {preset === "ember" ? <path d="M33 52c-2-25 12-38 30-38 17 0 28 11 26 33-7-2-11-9-12-18-9 11-25 16-44 14v9Z" fill={palette.hair} /> : null}
      {preset === "moss" ? <path d="M32 55c-3-27 11-40 29-40 20 0 31 14 27 43l-8-12-5-19c-9 14-23 20-43 20v8Z" fill={palette.hair} /> : null}
      {preset === "indigo" ? <path d="M33 49c0-24 13-36 31-36 15 0 27 9 28 26-10-6-18-15-20-24-6 15-21 24-39 26v8Z" fill={palette.hair} /> : null}
      {preset === "coral" ? <><path d="M31 57c-2-28 9-42 28-42 22 0 33 15 30 42l-7-8c-3-5-5-11-5-19-8 9-24 15-46 14v13Z" fill={palette.hair} /><circle cx="78" cy="20" fill={palette.hair} r="9" /></> : null}
      {preset === "sun" ? <path d="M31 51c1-25 13-38 31-38 18 0 31 13 29 35-6-7-9-15-8-24-8 12-26 20-52 18v9Z" fill={palette.hair} /> : null}
      {preset === "stone" ? <path d="M33 52c-2-23 9-37 27-39 17-2 31 9 32 27-9-2-17-8-22-18-8 12-21 18-37 19v11Z" fill={palette.hair} /> : null}

      <path d="M46 55h1M72 55h1" stroke="#171716" strokeLinecap="round" strokeWidth="4" />
      <path d="M60 57l-2 8h5" fill="none" stroke="#171716" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M52 71c5 4 11 4 16 0" fill="none" stroke="#171716" strokeLinecap="round" strokeWidth="2" />

      {preset === "ember" ? <><path d="M39 52h16v10H39zM65 52h16v10H65z" fill="none" stroke="#171716" strokeWidth="2" /><path d="M55 56h10" stroke="#171716" strokeWidth="2" /></> : null}
      {preset === "indigo" ? <><circle cx="47" cy="56" fill="none" r="8" stroke={palette.accent} strokeWidth="3" /><circle cx="73" cy="56" fill="none" r="8" stroke={palette.accent} strokeWidth="3" /><path d="M55 56h10" stroke={palette.accent} strokeWidth="3" /></> : null}
      {preset === "moss" ? <><path d="M82 58c7 2 8 10 3 14" fill="none" stroke="#f4f0e7" strokeLinecap="round" strokeWidth="2.5" /><path d="M84 70v12" stroke="#f4f0e7" strokeLinecap="round" strokeWidth="2.5" /></> : null}
      {preset === "coral" ? <><path d="M34 63l-6 6 6 6 6-6-6-6ZM86 63l-6 6 6 6 6-6-6-6Z" fill="none" stroke={palette.accent} strokeWidth="2.5" /></> : null}
      {preset === "sun" ? <><path d="M38 52h18M64 52h18" stroke="#fff" strokeLinecap="round" strokeWidth="3" /><path d="M56 54h8" stroke="#fff" strokeWidth="2" /></> : null}
      {preset === "stone" ? <rect fill={palette.accent} height="8" rx="4" width="66" x="27" y="33" /> : null}
    </svg>
  );
}

export function ProfileAvatar({
  avatar,
  displayName,
  size = "medium"
}: {
  avatar: ProfileAvatar;
  displayName: string;
  size?: "small" | "medium" | "large" | "cover";
  priority?: boolean;
}) {
  if (avatar.kind === "preset") {
    return (
      <span
        aria-label={`${displayName} avatar`}
        className={`profile-avatar profile-avatar-${size} avatar-${avatar.preset}`}
        data-avatar-kind="preset"
        data-avatar-preset={avatar.preset}
        data-portrait={avatar.preset}
        role="img"
      >
        <IllustratedPortrait preset={avatar.preset} />
      </span>
    );
  }

  if (avatar.kind === "upload") {
    return (
      <span
        aria-label={`${displayName} avatar`}
        className={`profile-avatar profile-avatar-${size} profile-avatar-upload`}
        data-media-id={avatar.mediaId}
        data-avatar-kind="upload"
        role="img"
      >
        {displayName.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return null;
}
