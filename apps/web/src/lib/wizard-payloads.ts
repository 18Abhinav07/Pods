import type {
  ActivityStepInput,
  CommunityStepInput,
  TemplateId
} from "@pods/domain";

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function texts(form: FormData, name: string): string[] {
  return form
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function buildActivityPayload(
  templateId: TemplateId,
  form: FormData
): ActivityStepInput {
  const shared = {
    name: text(form, "name"),
    purpose: text(form, "purpose"),
    startDate: text(form, "startDate"),
    endDate: text(form, "endDate"),
    timeZone: text(form, "timeZone"),
    weekdays: texts(form, "weekdays").map(Number)
  };

  if (templateId === "fitness") {
    return {
      ...shared,
      config: {
        activityType: text(form, "activityType"),
        measurableMinimum: text(form, "measurableMinimum")
      }
    };
  }
  if (templateId === "reading") {
    return {
      ...shared,
      config: {
        bookOrTheme: text(form, "bookOrTheme"),
        targetType: text(form, "targetType"),
        targetAmount: Number(text(form, "targetAmount"))
      }
    };
  }
  if (templateId === "study") {
    return {
      ...shared,
      config: {
        subject: text(form, "subject"),
        minimumExpectation: text(form, "minimumExpectation")
      }
    };
  }
  if (templateId === "build") {
    return {
      ...shared,
      config: {
        projectTheme: text(form, "projectTheme"),
        allowedDeliverables: texts(form, "allowedDeliverables"),
        commitmentCutoff: text(form, "commitmentCutoff")
      }
    };
  }
  return {
    ...shared,
    config: {
      discipline: text(form, "discipline"),
      minimumExpectation: text(form, "minimumExpectation"),
      commitmentCutoff: text(form, "commitmentCutoff")
    }
  };
}

export function buildCommunityPayload(form: FormData): CommunityStepInput {
  const minParticipants = Number(text(form, "minParticipants"));
  const maxParticipants = Number(text(form, "maxParticipants"));
  if (text(form, "visibility") === "private") {
    return {
      visibility: "private",
      minParticipants,
      maxParticipants,
      inviteExpiryHours: Number(text(form, "inviteExpiryHours"))
    };
  }
  return {
    visibility: "public",
    minParticipants,
    maxParticipants,
    applicationQuestions: text(form, "applicationQuestions")
      .split("\n")
      .map((question) => question.trim())
      .filter(Boolean),
    roomAudience:
      text(form, "roomAudience") === "public_read_only"
        ? "public_read_only"
        : "members_only"
  };
}
