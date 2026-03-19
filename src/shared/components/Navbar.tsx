import logo from "@/assets/grave-logo.png";
import { Link } from "react-router-dom";
import { LinkButton } from "./LinkButton";
import styles from "./Navbar.module.css";

type NavbarProps = {};

export function Navbar({}: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles["navbar-brand"]}>
        <img src={logo} alt="Sideplot logo" className={styles["navbar-logo"]} />
        <span className={styles["navbar-name"]}>burymyproject.dev</span>
      </Link>

      <div className={styles["navbar-actions"]}>
        <LinkButton to="/login" variant="secondary">
          Log In
        </LinkButton>
        <LinkButton to="/signup" variant="accent">
          Sign Up
        </LinkButton>
      </div>
    </nav>

    // [NAVBAR] 🪦 Sideplot [LOGO]     My Graveyard [LINK]   Stats [LINK]   Public Profile [LINK]     👤 @john [AVATAR + USERNAME]
  );
}
