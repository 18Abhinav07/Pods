import type { ProfileAvatar } from "@pods/domain";

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
        role="img"
      >
        <i aria-hidden="true" className="profile-avatar-signal" />
        <span aria-hidden="true" className="profile-avatar-glyph">{displayName.slice(0, 1).toUpperCase()}</span>
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
