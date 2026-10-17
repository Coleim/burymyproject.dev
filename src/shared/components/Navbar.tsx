import logo from "@/assets/grave-logo.png";
import { useAuth } from "@/features/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { LinkButton } from "./LinkButton";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles["navbar-brand"]}>
        <img
          src={logo}
          alt="burymyproject.dev logo"
          className={styles["navbar-logo"]}
        />
        <span className={styles["navbar-name"]}>burymyproject.dev</span>
      </Link>
      <div></div>
      <div className={styles["navbar-actions"]}>
        {!loading && session ? (
          <>
            <LinkButton to="/my-graves" variant="secondary">
              My Graveyard
            </LinkButton>
            <LinkButton to="/cemetery" variant="secondary">
              Global Cemetery
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
