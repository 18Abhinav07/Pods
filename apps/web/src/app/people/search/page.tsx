import { AppHeader } from "../../../components/app-header";
import { PublicProfileCard } from "../../../components/public-profile-card";
import styles from "../../../components/social-flow.module.css";
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
  const rawQuery = q.trim();
  const query = rawQuery.replace(/^@+/, "");
  const results =
    query.length >= 2
      ? await podsRepository.searchPublicProfiles({ query, limit: 20 })
      : [];

  return (
    <main className={`app-shell ${styles.page}`}>
      <AppHeader
        action={{
          description: "Return to your profile",
          href: "/profile",
          kind: "done",
          label: "Done"
        }}
        profile={profileForSession(session)}
        showPeopleSearch={false}
        title="Find people"
      />
      <form
        action="/people/search"
        className={styles.searchForm}
        method="get"
        role="search"
      >
        <label htmlFor="people-query">Search by name or handle</label>
        <div className={styles.searchField}>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="10.8" cy="10.8" r="5.8" />
            <path d="m15.3 15.3 4.2 4.2" />
          </svg>
          <input
            autoComplete="off"
            defaultValue={rawQuery}
            id="people-query"
            minLength={2}
            name="q"
            placeholder="Name or @handle"
            type="search"
          />
        </div>
      </form>
      {query.length < 2 ? (
        <section className={styles.searchGuidance}>
          <h2>Find someone by intention</h2>
          <p>Type at least 2 characters.</p>
        </section>
      ) : results.length > 0 ? (
        <section
          aria-label="People matching your search"
          className={styles.searchResults}
        >
          {results.map((person) => (
            <PublicProfileCard key={person.handle} profile={person} variant="search" />
          ))}
        </section>
      ) : (
        <section className={styles.searchGuidance}>
          <h2>No public profile found</h2>
          <p>Check the spelling or try a different handle.</p>
        </section>
      )}
    </main>
  );
}
