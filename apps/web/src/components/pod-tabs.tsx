import Link from "next/link";

const tabs = [
  { id: "room", label: "Room", path: "room" },
  { id: "today", label: "Today", path: "today" },
  { id: "activity", label: "Activity", path: "activity" },
  { id: "members", label: "Members", path: "members" },
  { id: "contract", label: "Contract", path: "rules" }
] as const;

export function PodTabs({
  podId,
  active
}: {
  podId: string;
  active: (typeof tabs)[number]["id"];
}) {
  return (
    <nav className="pod-tabs" aria-label="Pod sections">
      {tabs.map((tab) => (
        <Link
          aria-current={active === tab.id ? "page" : undefined}
          href={`/pods/${podId}/${tab.path}`}
          key={tab.id}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
