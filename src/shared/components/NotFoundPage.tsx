import { LinkButton } from "./LinkButton";
import { Navbar } from "./Navbar";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <div className={styles.state}>
          <h1 className={styles["state-title"]}>This page doesn't exist...</h1>
          <p>... or never did. 🪦</p>
          <LinkButton to="/">Back home</LinkButton>
        </div>
      </div>
    </div>
  );
}
