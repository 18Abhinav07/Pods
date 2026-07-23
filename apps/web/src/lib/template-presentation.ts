import type { TemplateId } from "@pods/domain";

export type AdaptiveTheme = "build" | "practice" | "fitness" | "reading" | "study";

export function adaptiveThemeForTemplate(templateId: TemplateId): AdaptiveTheme {
  if (templateId === "create") return "practice";
  return templateId;
}

function varyMedia(media: { hero: string; proof: string }, seed?: string | number) {
  if (seed === undefined) return media;
  const checksum = typeof seed === "number"
    ? seed
    : Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return checksum % 2 === 0 ? media : { hero: media.proof, proof: media.hero };
}

export function mediaForTemplate(templateId: TemplateId, seed?: string | number) {
  if (templateId === "fitness") {
    return varyMedia({ hero: "/media/fitness.jpg", proof: "/media/fitness-proof.jpg" }, seed);
  }
  if (templateId === "reading") {
    return varyMedia({ hero: "/media/reading.jpg", proof: "/media/reading-proof.jpg" }, seed);
  }
  if (templateId === "study") {
    return varyMedia({ hero: "/media/reading-proof.jpg", proof: "/media/reading.jpg" }, seed);
  }
  if (templateId === "create") {
    return varyMedia({ hero: "/media/build-proof.jpg", proof: "/media/build.jpg" }, seed);
  }
  return { hero: "/media/build-workspace.jpg", proof: "/media/build-proof.jpg" };
}
