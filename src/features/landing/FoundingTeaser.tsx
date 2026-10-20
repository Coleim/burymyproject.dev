import { foundingSpotsMessage } from "@/lib/founding";
import { Link } from "react-router-dom";
import styles from "./FoundingTeaser.module.css";

type FoundingTeaserProps = {
  /** Slots already taken, or null while loading / if it could not be loaded. */
  claimed: number | null;
};

// The space is always reserved: the teaser appears after a network call, and
// letting it push the page down would be a layout shift.
export function FoundingTeaser({ claimed }: FoundingTeaserProps) {
  const message = claimed === null ? null : foundingSpotsMessage(claimed);

  return (
    <div className={styles.slot}>
      {message &&
        (message.claimable ? (
          <Link to="/graves/new" className={styles.teaser} data-testid="founding-teaser">
            <span aria-hidden="true">👻</span> {message.text}
            <span className={styles.cta}>Claim yours →</span>
          </Link>
        ) : (
          <p className={styles.teaser} data-testid="founding-teaser">
            <span aria-hidden="true">👻</span> {message.text}
          </p>
        ))}
    </div>
  );
}
