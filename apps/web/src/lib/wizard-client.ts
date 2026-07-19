import type {
  ActivityStepInput,
  CommitmentStepInput,
  CommunityStepInput,
  TemplateId
} from "@pods/domain";

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;
type DraftStepValue = ActivityStepInput | CommunityStepInput | CommitmentStepInput;

async function requestJson(
  path: string,
  init: RequestInit,
  fetcher: Fetcher
): Promise<Record<string, unknown>> {
  const response = await fetcher(path, init);
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const errors = Array.isArray(data.errors)
      ? data.errors.filter((item): item is string => typeof item === "string")
      : [];
    throw new Error(
      errors.join(". ") ||
        (typeof data.error === "string" ? data.error : "Pod draft request failed")
    );
  }
  return data;
}

export async function createPodDraft(
  templateId: TemplateId,
  fetcher: Fetcher = fetch
) {
  const data = await requestJson(
    "/api/pods/drafts",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateId })
    },
    fetcher
  );
  return data.draft as { id: string };
}

export async function savePodDraftStep(
  podId: string,
  step: "activity" | "community" | "commitment",
  value: DraftStepValue,
  fetcher: Fetcher = fetch
) {
  return requestJson(
    `/api/pods/drafts/${podId}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ step, value })
    },
    fetcher
  );
}

export async function publishPodDraft(podId: string, fetcher: Fetcher = fetch) {
  return requestJson(
    `/api/pods/drafts/${podId}/publish`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ acceptedFrozenContract: true })
    },
    fetcher
  );
}

export async function deletePodDraft(podId: string, fetcher: Fetcher = fetch) {
  const response = await fetcher(`/api/pods/drafts/${podId}`, { method: "DELETE" });
  if (response.ok) return;
  const data = (await response.json()) as Record<string, unknown>;
  throw new Error(
    typeof data.error === "string" ? data.error : "Pod draft could not be deleted"
  );
}
