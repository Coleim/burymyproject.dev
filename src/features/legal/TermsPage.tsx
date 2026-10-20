import { CONTACT_EMAIL } from "@/lib/contact";
import { Main } from "@/shared/components/Main";
import { Navbar } from "@/shared/components/Navbar";
import { usePageTitle } from "@/shared/lib/usePageTitle";
import { Link } from "react-router-dom";
import styles from "./LegalPage.module.css";

export function TermsPage() {
  usePageTitle("Terms");
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <Main className={styles.wrapper}>
          <div className={styles.card}>
            <h1 className={styles.title}>Terms of Service</h1>
            <p className={styles.updated}>Last updated: October 2026</p>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>The short version</h2>
              <p>
                burymyproject.dev is a small, free side project where
                developers give their abandoned projects a funny, public
                send-off. Be kind, don't post anything harmful or illegal, and
                understand that we may hide content that breaks these rules.
                By signing in or using the site you agree to these terms and to
                our <Link to="/privacy">Privacy Policy</Link>.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Your account</h2>
              <p>
                You sign in with Google or GitHub. You must be at least 16
                years old, you're responsible for what happens under your
                account, and you can ask us to delete it at any time (see the
                Privacy Policy).
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Your content</h2>
              <p>
                You keep ownership of what you post (project name, epitaph,
                description, dates, cause of death, tech stack, project link).
                By posting it you give us permission to store it and to display
                it on the site — graves are public, and appear in places such
                as the cemetery, the home page and search engines.
                You confirm that you have the right to post it.
              </p>
              <p>Please don't post content that:</p>
              <ul>
                <li>is illegal, hateful, harassing, threatening or sexually explicit;</li>
                <li>reveals other people's personal information;</li>
                <li>infringes someone's copyright, trademark or privacy;</li>
                <li>
                  links to malware, phishing, scams or anything else designed
                  to harm visitors;
                </li>
                <li>is spam, an advertisement, or impersonates someone else.</li>
              </ul>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Links to other sites</h2>
              <p>
                The project link on a grave is supplied by its author. We
                don't control or endorse where it leads, and you follow it at
                your own risk. Such links are marked <code>nofollow</code>, so
                they don't give anyone a search-ranking benefit.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Reporting and moderation</h2>
              <p>
                Every grave has a "Report this grave" link, and you can always
                write to{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We may
                hide or remove any content, and suspend or delete accounts, at
                our discretion and without prior notice, in particular for
                content that breaks these rules. If you think we got it wrong,
                email us and we'll take another look.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>No guarantees</h2>
              <p>
                The service is provided "as is", for free, by one person in
                their spare time. It can change, break or disappear, and we
                can't promise that your content will always be available, so
                keep your own copy of anything you care about. To the extent
                the law allows, we aren't liable for any loss or damage arising
                from your use of the site.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Changes</h2>
              <p>
                We may update these terms; the date at the top shows the latest
                version. Continuing to use the site after a change means you
                accept it.
              </p>
            </div>

            <div className={styles.section}>
              <h2 className={styles["section-title"]}>Contact</h2>
              <p>
                Questions about these terms? Email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </p>
            </div>
          </div>
        </Main>
      </div>
    </div>
  );
}
