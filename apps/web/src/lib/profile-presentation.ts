import type { ProfileAvatar } from "@pods/domain";

export type PresentedProfile = {
  displayName: string;
  avatar: ProfileAvatar;
};

export function profileForSession(session: unknown): PresentedProfile {
  const profile =
    typeof session === "object" &&
    session !== null &&
    "profile" in session &&
    typeof session.profile === "object" &&
    session.profile !== null &&
    "displayName" in session.profile &&
    typeof session.profile.displayName === "string" &&
    "avatar" in session.profile
      ? (session.profile as PresentedProfile)
      : null;
  return profile ?? {
    displayName: "Pods member",
    avatar: { kind: "preset", preset: "indigo" }
  };
}
