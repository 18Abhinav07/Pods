import type { ProfileAvatar as ProfileAvatarType } from "@pods/domain";
import Link from "next/link";

import { ProfileAvatar } from "./profile-avatar";
import styles from "./social-flow.module.css";

export function PublicProfileCard({
  profile,
  variant = "default"
}: {
  profile: {
    handle: string;
    displayName: string;
    bio: string;
    avatar: ProfileAvatarType;
    activityStatusVisible: boolean;
  };
  variant?: "default" | "search";
}) {
  return (
    <Link
      className={
        variant === "search"
          ? `public-profile-card is-search-result ${styles.searchCard}`
          : `public-profile-card ${styles.card}`
      }
      href={`/u/${profile.handle}`}
    >
      <ProfileAvatar avatar={profile.avatar} displayName={profile.displayName} />
      <span>
        <strong>{profile.displayName}</strong>
        <small>@{profile.handle}</small>
        {variant === "default" ? <p>{profile.bio || "Moving with intention on Pods."}</p> : null}
      </span>
      {variant === "search" ? (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="m9 5 7 7-7 7" />
        </svg>
      ) : <i aria-hidden="true">View</i>}
    </Link>
  );
}
