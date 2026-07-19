export const templates = [
  {
    id: "move",
    name: "Move",
    detail: "Fitness and movement",
    evidence: "In-app photo, completion note, measurable activity minimum"
  },
  {
    id: "read",
    name: "Read",
    detail: "Reading progress",
    evidence: "Title, pages or minutes, reading artifact, optional note"
  },
  {
    id: "focus",
    name: "Focus",
    detail: "Study and deep work",
    evidence: "Topic, duration, focus artifact, short takeaway"
  },
  {
    id: "build",
    name: "Build",
    detail: "Ship visible work",
    evidence: "Locked task, result summary, GitHub or live artifact link"
  },
  {
    id: "create",
    name: "Create",
    detail: "Practice and create",
    evidence: "Locked output goal, artifact, reflection"
  }
] as const;

export type TemplateId = (typeof templates)[number]["id"];
