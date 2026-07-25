import type { ProfileAvatar as ProfileAvatarType } from "@pods/domain";
import Link from "next/link";

import {
  AppHeaderMenu,
  type AppHeaderAction
} from "./app-header-menu";
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
  action?: AppHeaderAction;
  title?: string;
  showPeopleSearch?: boolean;
}) {
  return (
    <header className="app-topbar social-topbar entrance entrance-topbar">
      <div className="brand-runtime">
        {title ? (
          <h1 className="app-route-title"><span className="pod-mark" aria-hidden="true" />{title}</h1>
        ) : (
          <Link className="wordmark" href="/today" aria-label="Pods Today">
            <span className="pod-mark" aria-hidden="true" />
            pods
          </Link>
        )}
      </div>
      <div className="social-topbar-actions">
        <AppHeaderMenu
          showPeopleSearch={showPeopleSearch}
          unreadUpdates={unreadUpdates}
          {...(action ? { action } : {})}
        />
        <Link className="profile-entry" href="/profile" aria-label="Open wallet profile">
          <ProfileAvatar avatar={profile.avatar} displayName={profile.displayName} size="small" />
        </Link>
      </div>
    </header>
  );
}
