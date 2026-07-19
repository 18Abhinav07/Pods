export type ApplicationStatus =
  | "applied"
  | "accepted_unfunded"
  | "application_rejected"
  | "application_expired";

export type MembershipState = ApplicationStatus | "invite_expired";
export type ApplicationDecision = "accept" | "reject";
export type AdmissionSource = "public_application" | "private_invitation";

export type ApplicationAnswer = {
  question: string;
  answer: string;
};

export function validateApplicationAnswers(
  answers: unknown,
  expectedCount: number
):
  | { success: true; value: string[] }
  | { success: false; errors: string[] } {
  if (
    !Number.isInteger(expectedCount) ||
    expectedCount < 0 ||
    !Array.isArray(answers) ||
    answers.length !== expectedCount
  ) {
    return { success: false, errors: ["Answer every application question"] };
  }
  const value = answers.map((answer) =>
    typeof answer === "string" ? answer.trim() : ""
  );
  if (value.some((answer) => answer.length < 2 || answer.length > 500)) {
    return {
      success: false,
      errors: ["Each answer must contain 2 to 500 characters"]
    };
  }
  return { success: true, value };
}

export function canDecideApplication(
  current: ApplicationStatus,
  _decision: ApplicationDecision
): boolean {
  return current === "applied";
}

export function normalizeInvitationToken(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value)
    ? value
    : null;
}
