import logo from "@/assets/grave-logo.png";
import styles from "./Navbar.module.css";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    // <div className={styles.navbar}>
    //   <img src={logo} alt="burymyproject logo" style={{ height: "30px" }} />
    //   <span style={{ color: "white" }}>burymyproject.dev</span>
    //   <button>login/signup</button>
    // </div>

    <nav className={styles.navbar}>
      <Link to="/" className={styles["navbar-brand"]}>
        <img src={logo} alt="Sideplot logo" className={styles["navbar-logo"]} />
        <span className={styles["navbar-name"]}>burymyproject.dev</span>
      </Link>
      <div className={styles["navbar-actions"]}>
        <Link to="/login" className={styles["button-ghost"]}>
          Log In
        </Link>
        <Link to="/signup" className={styles["button-primary"]}>
          Sign Up
        </Link>
      </div>
    </nav>

    // [NAVBAR] 🪦 Sideplot [LOGO]     My Graveyard [LINK]   Stats [LINK]   Public Profile [LINK]     👤 @john [AVATAR + USERNAME]
  );
}
