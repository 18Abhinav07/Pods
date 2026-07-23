import Link from "next/link";

import { AppHeader } from "../../../components/app-header";
import { PublicProfileCard } from "../../../components/public-profile-card";
import { profileForSession } from "../../../lib/profile-presentation";
import { podsRepository } from "../../../lib/server-db";
import { requireSession } from "../../../lib/session";

export default async function PeopleSearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSession("/people/search");
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query.length >= 2
    ? await podsRepository.searchPublicProfiles({ query, limit: 20 })
    : [];

  return (
    <main className="app-shell people-search-shell">
      <AppHeader
        profile={profileForSession(session)}
        title="Find people"
        showPeopleSearch={false}
        action={<Link className="text-header-action" href="/profile">Done</Link>}
      />
      <form className="people-search-form" action="/people/search" method="get" role="search">
        <label htmlFor="people-query">Search by name or handle</label>
        <div>
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="5.8" /><path d="m15.3 15.3 4.2 4.2" /></svg>
          <input
            autoComplete="off"
            defaultValue={query}
            id="people-query"
            minLength={2}
            name="q"
            placeholder="Name or @handle"
            type="search"
          />
        </div>
      </form>
      {query.length < 2 ? (
        <section className="search-guidance">
          <h2>Search with intent.</h2>
          <p>Type at least 2 characters.</p>
        </section>
      ) : results.length > 0 ? (
        <section className="public-profile-list people-search-results" aria-label="People matching your search">
          {results.map((person) => <PublicProfileCard key={person.handle} profile={person} variant="search" />)}
        </section>
      ) : (
        <section className="search-guidance">
          <h2>No public profile found.</h2>
          <p>Try another name or handle.</p>
        </section>
      )}
    </main>
  );
}
