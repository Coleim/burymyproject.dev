import logo from "@/assets/grave-logo.webp";
import { useAuth } from "@/features/auth/useAuth";
import { EMAIL_AUTH_ENABLED } from "@/lib/features";
import { supabase } from "@/lib/supabase";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { MAIN_ID } from "./Main";
import { LinkButton } from "./LinkButton";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function skipToMain(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const main = document.getElementById(MAIN_ID);
    main?.focus();
    main?.scrollIntoView();
  }

  const cemeteryLink = (
    <LinkButton to="/cemetery" variant="secondary">
      Cemetery
    </LinkButton>
  );

  return (
    <>
      <a
        href={`#${MAIN_ID}`}
        className={styles["skip-link"]}
        onClick={skipToMain}
      >
        Skip to main content
      </a>
      <nav
        className={styles.navbar}
        onKeyDown={(e) => {
          if (e.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            toggleRef.current?.focus();
          }
        }}
      >
        <Link to="/" className={styles["navbar-brand"]}>
          <img
            src={logo}
            alt=""
            width={34}
            height={28}
            className={styles["navbar-logo"]}
          />
          <span className={styles["navbar-name"]}>burymyproject.dev</span>
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className={styles["menu-toggle"]}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="navbar-actions"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
        </button>
        <div
          id="navbar-actions"
          className={`${styles["navbar-actions"]} ${menuOpen ? styles["navbar-actions-open"] : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          {!loading && session ? (
            <>
              <LinkButton to="/my-graves" variant="secondary">
                My Graveyard
              </LinkButton>
              {cemeteryLink}
              <Button
                variant="accent"
                onClick={handleLogout}
                aria-label="Log out"
              >
                Log Out
              </Button>
            </>
          ) : EMAIL_AUTH_ENABLED ? (
            <>
              {cemeteryLink}
              <LinkButton to="/login" variant="secondary">
                Log In
              </LinkButton>
              <LinkButton to="/signup" variant="accent">
                Sign Up
              </LinkButton>
            </>
          ) : (
            <>
              {cemeteryLink}
              <LinkButton to="/login" variant="accent">
                Sign in
              </LinkButton>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
