import { redirect } from "next/navigation";

export default async function PodFeedCompatibilityPage({
  params
}: {
  params: Promise<{ podId: string }>;
}) {
  const { podId } = await params;
  redirect(`/pods/${podId}/room`);
}
