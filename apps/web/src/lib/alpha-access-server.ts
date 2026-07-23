import { alphaRequiresAuthenticatedBrowsing } from "./alpha-access";
import {
  getCurrentSession,
  getOptionalProfileSession,
  requireSession
} from "./session";

export async function alphaAwarePageSession(returnTo: string) {
  if (alphaRequiresAuthenticatedBrowsing(process.env)) {
    return requireSession(returnTo);
  }
  return getOptionalProfileSession(returnTo);
}

export async function publicPodPageSession() {
  return getCurrentSession();
}
