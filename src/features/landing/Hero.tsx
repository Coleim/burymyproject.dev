import { LinkButton } from "@/shared/components/LinkButton";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <div className={styles.hero}>
      <h2 className={styles["hero-subtitle"]}>
        The final resting place for your abandoned ideas
      </h2>
      <h1 className={styles["hero-title"]}>Bury Your Dead Projects</h1>
      <p className={styles["hero-description"]}>
        Every developer has abandoned a project. <br />
        Bury it. Turn the page.
      </p>
      <LinkButton to="/new-grave" size="lg">
        🪦 Dig a grave - It's Free
      </LinkButton>
      <span className={styles["text-small"]}>
        No credit card required. Just bring your corpses.
      </span>
    </div>
  );
}
