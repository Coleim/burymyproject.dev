import logo from "@/assets/grave-logo.png";
import { LinkButton } from "@/shared/components/LinkButton";
import { Navbar } from "@/shared/components/Navbar";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Grave } from "@/features/grave/types";
import { Hero } from "./Hero";
import styles from "./LandingPage.module.css";

export function LandingPage() {
  const [recentGraves, setRecentGraves] = useState<Grave[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("graves")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!cancelled) setRecentGraves(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.content}>
      <div className={styles.inner}>
        <Navbar />
        <Hero />
        <div className={styles["social-proof"]}>
          <div className={styles["proof-item"]}>
            <span className={styles["proof-icon"]}>⚰️</span>
            <span className={styles["proof-value"]}>1,243</span>
            <span className={styles["proof-label"]}>projects buried</span>
          </div>

          <span className={styles["proof-divider"]}>✦</span>

          <div className={styles["proof-item"]}>
            <span className={styles["proof-icon"]}>💀</span>
            <span className={styles["proof-value"]}>638</span>
            <span className={styles["proof-label"]}>developers</span>
          </div>

          <span className={styles["proof-divider"]}>✦</span>

          <div className={styles["proof-item"]}>
            <span className={styles["proof-icon"]}>☠️</span>
            <span className={styles["proof-label"]}>
              Most common cause of death:
            </span>
            <span className={styles["proof-highlight"]}>
              Shiny New Idea Syndrome
            </span>
          </div>
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
                  slug={grave.public_slug}
                  featured={i === 1}
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

        <footer className={styles["footer"]}>
          <div className={styles["footer-left"]}>
            <span className={styles["footer-logo"]}>
              <img
                src={logo}
                alt="burymyproject.dev logo"
                className={styles["footer-logo-img"]}
              />
              burymyproject.dev
            </span>
            <span className={styles["footer-tagline"]}>
              Made by a developer who ships too little.
            </span>
          </div>
          <div className={styles["footer-links"]}>
            <a href="#">Twitter</a>
            <a href="#">GitHub</a>
            <a href="#">Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
