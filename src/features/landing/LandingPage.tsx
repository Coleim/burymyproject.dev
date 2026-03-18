import { Navbar } from "@/shared/components/Navbar";
import styles from "./LandingPage.module.css";

export function LandingPage() {
  return (
    <div className={styles.content}>
      <div className={styles.inner}>
        <Navbar />
        {/* HERO */}
        <div className={styles.hero}>
          <h2 className={styles["hero-subtitle"]}>
            The final resting place for your abandoned ideas
          </h2>
          <h1 className={styles["hero-title"]}>Bury Your Dead Projects</h1>
          <p className={styles["hero-description"]}>
            Every developer has abandoned a project. <br />
            Bury it. Turn the page.
          </p>
          <button
            className={styles["button-primary"]}
            aria-label="Dig a grave for your abandoned projects"
          >
            🪦 Dig a grave - It's Free
          </button>

          <span className={styles["text-small"]}>
            No credit card required. Just bring your corpses.
          </span>
        </div>

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
            <p className={styles["section-label"]}>Recently interred</p>
            <h2 className={styles["section-title"]}>Recently Buried</h2>
          </div>

          <div className={styles["tombstone-grid"]}>
            <div className={styles["tombstone"]}>
              <div className={styles["tombstone-top"]} />
              <div className={styles["tombstone-body"]}>
                <p className={styles["tombstone-rip"]}>R.I.P.</p>
                <h4 className={styles["tombstone-name"]}>HealthTracker Pro</h4>
                <p className={styles["tombstone-dates"]}>Jan 2024 — Feb 2024</p>
                <p className={styles["tombstone-epitaph"]}>
                  "It tracked everything except its own survival."
                </p>
                <span className={styles["tombstone-cause"]}>Lost Interest</span>
              </div>
              <span className={styles["tombstone-candle"]}>🕯️</span>
            </div>

            <div
              className={`${styles["tombstone"]} ${styles["tombstone--featured"]}`}
            >
              <div className={styles["tombstone-top"]} />
              <div className={styles["tombstone-body"]}>
                <p className={styles["tombstone-rip"]}>R.I.P.</p>
                <h4 className={styles["tombstone-name"]}>DevFlow</h4>
                <p className={styles["tombstone-dates"]}>Mar 2022 — May 2023</p>
                <p className={styles["tombstone-epitaph"]}>
                  "The README was the entire product."
                </p>
                <span className={styles["tombstone-cause"]}>Scope Creep</span>
              </div>
              <span className={styles["tombstone-candle"]}>🕯️</span>
            </div>

            <div className={styles["tombstone"]}>
              <div className={styles["tombstone-top"]} />
              <div className={styles["tombstone-body"]}>
                <p className={styles["tombstone-rip"]}>R.I.P.</p>
                <h4 className={styles["tombstone-name"]}>CryptoWallet v3</h4>
                <p className={styles["tombstone-dates"]}>Nov 2021 — Dec 2021</p>
                <p className={styles["tombstone-epitaph"]}>
                  "Born in a bull run, died in a reality check."
                </p>
                <span className={styles["tombstone-cause"]}>Market Timing</span>
              </div>
              <span className={styles["tombstone-candle"]}>🕯️</span>
            </div>
          </div>

          <div className={styles["preview-cta"]}>
            <button className={styles["button-secondary"]}>
              See the full graveyard →
            </button>
          </div>
        </div>

        <section className={styles["cta-section"]}>
          <p className={styles["section-label"]}>It's time</p>
          <h2 className={styles["cta-title"]}>Ready to let go?</h2>
          <p className={styles["cta-subtitle"]}>
            Your side projects deserve a dignified end.
          </p>
          <button className={styles["button-primary"]}>
            🪦 Dig Your First Grave
          </button>
        </section>

        <footer className={styles["footer"]}>
          <div className={styles["footer-left"]}>
            <span className={styles["footer-logo"]}>🪦 burymyproject.dev</span>
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
