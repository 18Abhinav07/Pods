import type { ProfileAvatar as ProfileAvatarType } from "@pods/domain";
import Link from "next/link";

import { ProfileAvatar } from "./profile-avatar";

export function PublicProfileCard({
  profile
}: {
  profile: {
    handle: string;
    displayName: string;
    bio: string;
    avatar: ProfileAvatarType;
    activityStatusVisible: boolean;
  };
}) {
  return (
    <Link className="public-profile-card" href={`/u/${profile.handle}`}>
      <ProfileAvatar avatar={profile.avatar} displayName={profile.displayName} />
      <span>
        <strong>{profile.displayName}</strong>
        <small>@{profile.handle}</small>
        <p>{profile.bio || "Moving with intention on Pods."}</p>
      </span>
      <i aria-hidden="true">View</i>
    </Link>
  );
}
