import { describe, expect, it } from "vitest";

import {
  buildActivityPayload,
  buildCommunityPayload
} from "../src/lib/wizard-payloads";

function commonActivityForm() {
  const form = new FormData();
  form.set("name", "Build Pods in Public");
  form.set("purpose", "A focused group that ships one visible improvement on every scheduled day.");
  form.set("startDate", "2026-08-03");
  form.set("endDate", "2026-08-14");
  form.set("timeZone", "Asia/Kolkata");
  form.append("weekdays", "1");
  form.append("weekdays", "3");
  form.append("weekdays", "5");
  return form;
}

describe("creator wizard payloads", () => {
  it("builds a distinct Fitness criterion", () => {
    const form = commonActivityForm();
    form.set("activityType", "Strength training");
    form.set("measurableMinimum", "Complete 35 focused minutes");

    expect(buildActivityPayload("fitness", form).config).toEqual({
      activityType: "Strength training",
      measurableMinimum: "Complete 35 focused minutes"
    });
  });

  it("builds a per-occurrence Build contract with allowed deliverables", () => {
    const form = commonActivityForm();
    form.set("projectTheme", "Pods Cycle I");
    form.append("allowedDeliverables", "pull_request");
    form.append("allowedDeliverables", "live_artifact");
    form.set("commitmentCutoff", "09:30");

    expect(buildActivityPayload("build", form).config).toEqual({
      projectTheme: "Pods Cycle I",
      allowedDeliverables: ["pull_request", "live_artifact"],
      commitmentCutoff: "09:30"
    });
  });

  it("keeps public applications and private invitations as different contracts", () => {
    const publicForm = new FormData();
    publicForm.set("visibility", "public");
    publicForm.set("minParticipants", "3");
    publicForm.set("maxParticipants", "8");
    publicForm.set("applicationQuestions", "What will you ship?\nLink your current work.");

    expect(buildCommunityPayload(publicForm)).toEqual({
      visibility: "public",
      minParticipants: 3,
      maxParticipants: 8,
      applicationQuestions: ["What will you ship?", "Link your current work."]
    });

    const privateForm = new FormData();
    privateForm.set("visibility", "private");
    privateForm.set("minParticipants", "2");
    privateForm.set("maxParticipants", "5");
    privateForm.set("inviteExpiryHours", "168");
    expect(buildCommunityPayload(privateForm)).toEqual({
      visibility: "private",
      minParticipants: 2,
      maxParticipants: 5,
      inviteExpiryHours: 168
    });
  });
});
