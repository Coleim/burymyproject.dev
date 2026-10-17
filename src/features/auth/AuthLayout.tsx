import { Navbar } from "@/shared/components/Navbar";
import styles from "./AuthLayout.module.css";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className={styles.content}>
      <div className={styles.inner}>
        <Navbar />
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
