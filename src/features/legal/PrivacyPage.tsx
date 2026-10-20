import { Navbar } from "@/shared/components/Navbar";
import styles from "./PrivacyPage.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

export function PrivacyPage() {
  usePageTitle("Privacy");
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.updated}>Last updated: October 2026</p>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Who we are</h2>
              <p>
                burymyproject.dev is a small side project where developers can
                create a public "grave" for their abandoned projects. This
                page explains what data we collect and how it's used.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>
                What data we collect
              </h2>
              <ul>
                <li>
                  <strong>Account data</strong>: your email address and
                  password (or your Google account identifier, if you sign in
                  with Google), managed by Supabase Auth.
                </li>
                <li>
                  <strong>Grave content</strong>: anything you choose to
                  submit when creating a grave — project name, epitaph,
                  description, dates, cause of death, and tech stack. Graves
                  marked "public" are visible to anyone with the link or
                  browsing the global cemetery.
                </li>
              </ul>
              <p>We do not collect payment information or phone numbers.</p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>
                How your data is stored
              </h2>
              <p>
                All data is stored in a PostgreSQL database hosted by{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Supabase
                </a>
                , protected by row-level security policies so that private
                graves are only visible to their author. Your session is kept
                in your browser's local storage — we don't use third-party
                tracking cookies.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Third parties</h2>
              <p>
                We rely on two third-party services to run this app:{" "}
                <strong>Supabase</strong> (authentication and database) and,
                if you choose to sign in that way, <strong>Google</strong>{" "}
                (OAuth sign-in). Neither is used for advertising or analytics.
                We currently don't use any analytics or tracking tools.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Your rights</h2>
              <p>
                You can delete any grave you've created at any time from{" "}
                <strong>My Graveyard</strong>. If you'd like your account and
                all associated data permanently deleted, or have any question
                about your data, contact us and we'll take care of it.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Contact</h2>
              <p>
                Questions about this policy or your data? Email us at{" "}
                <a href="mailto:burymyproject@gmail.com">
                  burymyproject@gmail.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
