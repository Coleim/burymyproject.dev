import { Main } from "@/shared/components/Main";
import { Navbar } from "@/shared/components/Navbar";
import type { ReactNode } from "react";
import styles from "./GraveForm.module.css";

type GraveFormShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Decorative artwork standing on the card's top edge. */
  illustration?: ReactNode;
};

export function GraveFormShell({
  title,
  subtitle,
  children,
  illustration,
}: GraveFormShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <Main
          className={`${styles.wrapper} ${illustration ? styles["wrapper-illustrated"] : ""}`}
        >
          <div className={styles.card}>
            {illustration}
            <div className={illustration ? styles["card-header-illustrated"] : undefined}>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
            {children}
          </div>
        </Main>
      </div>
    </div>
  );
}
