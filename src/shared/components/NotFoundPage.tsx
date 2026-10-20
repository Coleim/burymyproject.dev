import { LinkButton } from "./LinkButton";
import { Main } from "./Main";
import { Navbar } from "./Navbar";
import styles from "./NotFoundPage.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

export function NotFoundPage() {
  usePageTitle("Page not found");
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <Main className={styles.state}>
          <h1 className={styles["state-title"]}>This page doesn't exist...</h1>
          <p>... or never did. 🪦</p>
          <LinkButton to="/">Back home</LinkButton>
        </Main>
      </div>
    </div>
  );
}
