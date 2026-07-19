import Link from "next/link";

const items = [
  ["today", "/today", "Today"],
  ["discover", "/discover", "Discover"],
  ["my-pods", "/my-pods", "My Pods"],
  ["inbox", "/inbox", "Inbox"]
] as const;

export function PrimaryNav({ active }: { active: (typeof items)[number][0] }) {
  return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(([id, href, label]) => <Link aria-current={active === id ? "page" : undefined} href={href} key={id}>{label}</Link>)}</nav>;
}
