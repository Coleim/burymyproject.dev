import { Main } from "@/shared/components/Main";
import { Navbar } from "@/shared/components/Navbar";
import type { ReactNode } from "react";
import styles from "./GraveForm.module.css";

type GraveFormShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function GraveFormShell({ title, subtitle, children }: GraveFormShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <Main className={styles.wrapper}>
          <div className={styles.card}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
            {children}
          </div>
        </Main>
      </div>
    </div>
  );
}
