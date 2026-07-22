import Link from "next/link";
import Image from "next/image";

export function HomePage() {
  return (
    <main className="foundation-shell landing-shell">
      <header className="topbar landing-topbar entrance entrance-topbar">
        <div className="wordmark" aria-label="Pods">
          <span className="pod-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          PODS
        </div>
        <Link className="landing-discover-link" href="/discover">Discover</Link>
      </header>

      <section className="landing-visual entrance entrance-hero" aria-label="Activities on Pods">
        <div className="landing-media landing-media-main">
          <Image alt="Builder working with a focused team" fill priority sizes="(max-width: 520px) 92vw, 520px" src="/media/build.jpg" />
          <span>Build together</span>
        </div>
        <div className="landing-media landing-media-side">
          <Image alt="A runner training at night" fill sizes="160px" src="/media/fitness.jpg" />
          <span>Move</span>
        </div>
      </section>

      <section className="landing-copy entrance entrance-status">
        <p className="eyebrow">Activity with real commitment</p>
        <h1>Show up for what matters.</h1>
        <p>
          Put NIM behind a shared goal, prove the work, and build momentum with people who care.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href="/connect?returnTo=%2Ftoday">Connect wallet</Link>
          <Link className="secondary-action" href="/discover">Explore public Pods</Link>
        </div>
      </section>
    </main>
  );
}
