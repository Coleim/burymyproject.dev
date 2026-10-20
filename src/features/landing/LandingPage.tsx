import logo from "@/assets/grave-logo.png";
import { LinkButton } from "@/shared/components/LinkButton";
import { Main } from "@/shared/components/Main";
import { Navbar } from "@/shared/components/Navbar";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Grave } from "@/features/grave/types";
import { Link } from "react-router-dom";
import { Hero } from "./Hero";
import styles from "./LandingPage.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

type HomeStats = {
  totalGraves: number;
  developers: number;
  topCause: string | null;
};

export function LandingPage() {
  usePageTitle();
  const [recentGraves, setRecentGraves] = useState<Grave[] | null>(null);
  const [stats, setStats] = useState<HomeStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("graves")
      .select("*")
      .eq("is_public", true)
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!cancelled) setRecentGraves(data ?? []);
      });

    supabase
      .rpc("home_stats")
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setStats({
          totalGraves: data.total_graves,
          developers: data.developers,
          topCause: data.top_cause,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.content}>
      <div className={styles.inner}>
        <Navbar />
        <Main>
          <Hero />
          <div className={styles["social-proof"]}>
            {stats ? (
              <>
                <div className={styles["proof-item"]}>
                  <span className={styles["proof-icon"]}>⚰️</span>
                  <span
                    className={styles["proof-value"]}
                    data-testid="stat-total-graves"
                  >
                    {stats.totalGraves.toLocaleString()}
                  </span>
                  <span className={styles["proof-label"]}>projects buried</span>
                </div>

                <span className={styles["proof-divider"]}>✦</span>

                <div className={styles["proof-item"]}>
                  <span className={styles["proof-icon"]}>💀</span>
                  <span
                    className={styles["proof-value"]}
                    data-testid="stat-developers"
                  >
                    {stats.developers.toLocaleString()}
                  </span>
                  <span className={styles["proof-label"]}>developers</span>
                </div>

                {stats.topCause && (
                  <>
                    <span className={styles["proof-divider"]}>✦</span>

                    <div className={styles["proof-item"]}>
                      <span className={styles["proof-icon"]}>☠️</span>
                      <span className={styles["proof-label"]}>
                        Most common cause of death:
                      </span>
                      <span
                        className={styles["proof-highlight"]}
                        data-testid="stat-top-cause"
                      >
                        {stats.topCause}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className={styles["proof-item"]}>
                  <span className={styles["proof-skeleton"]} />
                </div>
                <span className={styles["proof-divider"]}>✦</span>
                <div className={styles["proof-item"]}>
                  <span className={styles["proof-skeleton"]} />
                </div>
                <span className={styles["proof-divider"]}>✦</span>
                <div className={styles["proof-item"]}>
                  <span
                    className={`${styles["proof-skeleton"]} ${styles["proof-skeleton--wide"]}`}
                  />
                </div>
              </>
            )}
          </div>

          <div className={styles["preview"]}>
            <div className={styles["preview-header"]}>
              <h2 className={styles["section-title"]}>Recently Buried</h2>
            </div>

            {recentGraves && recentGraves.length > 0 ? (
              <div className={styles["tombstone-grid"]}>
                {recentGraves.map((grave, i) => (
                  <TombstoneCard
                    key={grave.id}
                    name={grave.name}
                    startDate={grave.born}
                    endDate={grave.died}
                    epitaph={grave.epitaph}
                    cause={grave.cause}
                    bgImage={grave.tombstone_bg}
                    fgImage={grave.tombstone_fg}
                    slug={grave.public_slug}
                    featured={i === 1}
                  headingLevel={3}
                  />
                ))}
              </div>
            ) : null}

            <div className={styles["preview-cta"]}>
              <LinkButton to="/cemetery" variant="secondary">
                See the full graveyard →
              </LinkButton>
            </div>
          </div>

          <section className={styles["cta-section"]}>
            <h2 className={styles["cta-title"]}>Ready to let it go?</h2>
            <p className={styles["cta-subtitle"]}>
              Your side projects deserve a dignified end.
            </p>
            <LinkButton to="/graves/new" size="lg">
              🪦 Dig Your First Grave{" "}
            </LinkButton>
          </section>
        </Main>

        <footer className={styles["footer"]}>
          <div className={styles["footer-left"]}>
            <span className={styles["footer-logo"]}>
              <img
                src={logo}
                alt=""
                className={styles["footer-logo-img"]}
              />
              burymyproject.dev
            </span>
            <span className={styles["footer-tagline"]}>
              Made by a developer who ships too little.
            </span>
          </div>
          <div className={styles["footer-links"]}>
            <a
              href="https://x.com/coleim_ninja"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
            <a
              href="https://github.com/Coleim"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/clement-oliva/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
