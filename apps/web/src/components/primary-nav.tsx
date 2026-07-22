import Link from "next/link";

type NavId = "today" | "discover" | "my-pods" | "messages";

const items = [
  ["today", "/today", "Today"],
  ["discover", "/discover", "Discover"],
  ["my-pods", "/my-pods", "My Pods"],
  ["messages", "/messages", "Messages"]
] as const satisfies ReadonlyArray<readonly [NavId, string, string]>;

function NavIcon({ id }: { id: NavId }) {
  if (id === "today") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 11.2 12 4l8 7.2v8.3H7.2V13h9.6v6.5" /></svg>;
  }
  if (id === "discover") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="m15.2 8.8-2 4.4-4.4 2 2-4.4 4.4-2Z" /></svg>;
  }
  if (id === "my-pods") {
    return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="8" cy="13" r="4.2" /><circle cx="16" cy="13" r="4.2" /><circle cx="12" cy="7.5" r="4.2" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5.5h14v10.7H9l-4 3v-13.7Z" /><path d="M8.5 9.3h7M8.5 12.5h4.5" /></svg>;
}

export function PrimaryNav({
  active,
  unreadMessages = 0
}: {
  active: NavId | "inbox";
  unreadMessages?: number;
}) {
  return (
    <nav className="bottom-nav social-bottom-nav" aria-label="Primary navigation">
      {items.map(([id, href, label]) => {
        const selected = active === id || (active === "inbox" && id === "messages");
        return (
          <Link aria-current={selected ? "page" : undefined} href={href} key={id}>
            <span className="nav-icon"><NavIcon id={id} />{id === "messages" && unreadMessages > 0 ? <i>{Math.min(unreadMessages, 99)}</i> : null}</span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
