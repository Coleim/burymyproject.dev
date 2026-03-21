import { LinkButton } from "@/shared/components/LinkButton";
import { Navbar } from "@/shared/components/Navbar";
import { Hero } from "./Hero";
import styles from "./LandingPage.module.css";

const graveBgs = import.meta.glob("@/assets/graves/grave_bg_*.png", {
  eager: true,
  import: "default",
});
const graves = import.meta.glob("@/assets/graves/grave_[0-9]*.png", {
  eager: true,
  import: "default",
});

const graveBgList = Object.values(graveBgs) as string[];
const graveList = Object.values(graves) as string[];

function shuffle<T>(arr: T[]): T[] {
  // TODO : DO IT BETTER ; AI SUCKS
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let shuffledBgs = shuffle(graveBgList);
let shuffledFgs = shuffle(graveList);
let bgCursor = 0;
let fgCursor = 0;

function getRandomGravePair() {
  if (bgCursor >= shuffledBgs.length) {
    shuffledBgs = shuffle(graveBgList);
    bgCursor = 0;
  }
  if (fgCursor >= shuffledFgs.length) {
    shuffledFgs = shuffle(graveList);
    fgCursor = 0;
  }
  return { bg: shuffledBgs[bgCursor++], fg: shuffledFgs[fgCursor++] };
}

interface TombstoneProps {
  name: string;
  startDate: string;
  endDate: string;
  epitaph: string;
  cause: string;
  featured?: boolean;
}

function Tombstone({
  name,
  startDate,
  endDate,
  epitaph,
  cause,
  featured,
}: TombstoneProps) {
  const { bg, fg } = getRandomGravePair();
  return (
    <div
      className={`${styles["tombstone"]} ${featured ? styles["tombstone--featured"] : ""}`}
    >
      <div className={styles["tombstone-image"]}>
        <img src={bg} alt="" className={styles["grave-bg"]} />
        <img
          src={fg}
          alt={`Grave for ${name}`}
          className={styles["grave-fg"]}
        />
        <div className={styles["tombstone-overlay"]}>
          <div className={styles["tombstone-top-row"]}>
            <span className={styles["tombstone-dates"]}>
              <span>{startDate}</span>
              <span>{endDate}</span>
            </span>{" "}
            <span className={styles["tombstone-cause"]}>{cause}</span>
          </div>
          <div className={styles["tombstone-center"]}>
            <h4 className={styles["tombstone-name"]}>{name}</h4>
            <p className={styles["tombstone-epitaph"]}>{epitaph}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
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

          <div className={styles["tombstone-grid"]}>
            <Tombstone
              name="HealthTracker Pro"
              startDate="Jan 2024"
              endDate="Feb 2024"
              epitaph="It tracked everything except its own survival."
              cause="Lost Interest"
            />
            <Tombstone
              name="DevFlow"
              startDate="Jan 2024"
              endDate="Feb 2024"
              epitaph="The README was the entire product."
              cause="Scope Creep"
              featured
            />
            <Tombstone
              name="CryptoWallet v3"
              startDate="Jan 2024"
              endDate="Feb 2024"
              epitaph="Born in a bull run, died in a reality check."
              cause="Market Timing"
            />
            <Tombstone
              name="CryptoWallet v3"
              startDate="Jan 2024"
              endDate="Feb 2024"
              epitaph="Born in a bull run, died in a reality check."
              cause="Market Timing"
            />
            <Tombstone
              name="CryptoWallet v3"
              startDate="Jan 2024"
              endDate="Feb 2024"
              epitaph="Born in a bull run, died in a reality check."
              cause="Market Timing"
            />

            <Tombstone
              name="CryptoWallet v3"
              startDate="Jan 2024"
              endDate="Feb 2024"
              epitaph="Born in a bull run, died in a reality check."
              cause="Market Timing"
            />
          </div>

          <div className={styles["preview-cta"]}>
            <LinkButton to="/new-grave" variant="secondary">
              See the full graveyard →
            </LinkButton>
          </div>
        </div>

        <section className={styles["cta-section"]}>
          <h2 className={styles["cta-title"]}>Ready to let it go?</h2>
          <p className={styles["cta-subtitle"]}>
            Your side projects deserve a dignified end.
          </p>
          <LinkButton to="/new-grave" size="lg">
            🪦 Dig Your First Grave{" "}
          </LinkButton>
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
