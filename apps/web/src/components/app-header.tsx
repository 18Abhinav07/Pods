import type { ProfileAvatar as ProfileAvatarType } from "@pods/domain";
import Link from "next/link";
import type { ReactNode } from "react";

import { ProfileAvatar } from "./profile-avatar";

export function AppHeader({
  profile,
  unreadUpdates = 0,
  action,
  title,
  showPeopleSearch = true
}: {
  profile: { displayName: string; avatar: ProfileAvatarType };
  unreadUpdates?: number;
  action?: ReactNode;
  title?: string;
  showPeopleSearch?: boolean;
}) {
  return (
    <header className="app-topbar social-topbar entrance entrance-topbar">
      {title ? (
        <h1 className="app-route-title"><span className="pod-mark" aria-hidden="true" />{title}</h1>
      ) : (
        <Link className="wordmark" href="/today" aria-label="Pods Today">
          <span className="pod-mark" aria-hidden="true" />
          pods
        </Link>
      )}
      <div className="social-topbar-actions">
        {action}
        {showPeopleSearch ? (
          <Link className="topbar-icon" href="/people/search" aria-label="Search people">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="5.8" />
              <path d="m15.3 15.3 4.2 4.2" />
            </svg>
          </Link>
        ) : null}
        <Link className="update-bell" href="/updates" aria-label="Open updates">
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.5 16.5h11l-1.2-1.8V10a4.3 4.3 0 0 0-8.6 0v4.7l-1.2 1.8Z" /><path d="M10 19h4" /></svg>
          {unreadUpdates > 0 ? <span>{Math.min(unreadUpdates, 99)}</span> : null}
        </Link>
        <Link className="profile-entry" href="/profile" aria-label="Open wallet profile">
          <ProfileAvatar avatar={profile.avatar} displayName={profile.displayName} size="small" />
        </Link>
      </div>
    </header>
  );
}
