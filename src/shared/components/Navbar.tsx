import logo from "@/assets/grave-logo.png";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { LinkButton } from "./LinkButton";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <nav
      className={styles.navbar}
      onKeyDown={(e) => {
        if (e.key === "Escape") setMenuOpen(false);
      }}
    >
      <Link to="/" className={styles["navbar-brand"]}>
        <img
          src={logo}
          alt="burymyproject.dev logo"
          className={styles["navbar-logo"]}
        />
        <span className={styles["navbar-name"]}>burymyproject.dev</span>
      </Link>
      <button
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
            <LinkButton to="/cemetery" variant="secondary">
              Cemetery
            </LinkButton>
            <Button
              variant="accent"
              onClick={handleLogout}
              aria-label="Log out"
            >
              Log Out
            </Button>
          </>
        ) : (
          <>
            <LinkButton to="/login" variant="secondary">
              Log In
            </LinkButton>
            <LinkButton to="/signup" variant="accent">
              Sign Up
            </LinkButton>
          </>
        )}
      </div>
    </nav>
  );
}
