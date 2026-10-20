import { CONTACT_EMAIL } from "@/lib/contact";
import { Main } from "@/shared/components/Main";
import { Navbar } from "@/shared/components/Navbar";
import { Link } from "react-router-dom";
import styles from "./LegalPage.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

export function PrivacyPage() {
  usePageTitle("Privacy");
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <Main className={styles.wrapper}>
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
                  <strong>Account data</strong>: you sign in with Google or
                  GitHub, so we receive your email address, your account
                  identifier and the basic profile details that provider
                  shares (such as your name and avatar URL), managed by
                  Supabase Auth. We never see or store a password.
                </li>
                <li>
                  <strong>Grave content</strong>: anything you choose to
                  submit when creating a grave — project name, epitaph,
                  description, dates, cause of death, tech stack, and an
                  optional link to the project. Every
                  grave is public: it is visible to anyone with the link and in
                  the global cemetery.
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
                , protected by row-level security policies. Your session is kept
                in your browser's local storage — we don't use third-party
                tracking cookies.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Third parties</h2>
              <p>
                We rely on a few third-party services to run this app:{" "}
                <strong>Supabase</strong> (authentication and database), and{" "}
                <strong>Google</strong> or <strong>GitHub</strong> if you
                choose to sign in with them (OAuth sign-in). The site's fonts
                and scripts are served from the site itself, so visiting it
                doesn't send your IP address to any font or tracking
                provider. None of these services is used for advertising or
                analytics, and we currently don't use any analytics or
                tracking tools.
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
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See
                also our <Link to="/terms">Terms of Service</Link>.
              </p>
            </div>
          </div>
        </Main>
      </div>
    </div>
  );
}
