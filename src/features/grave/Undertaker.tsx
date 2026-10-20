import small from "@/assets/undertaker-340.webp";
import large from "@/assets/undertaker-560.webp";
import styles from "./Undertaker.module.css";

// Purely decorative: the page title already says what the page is for.
export function Undertaker() {
  return (
    <div className={styles.undertaker} data-testid="undertaker" aria-hidden="true">
      <img
        className={styles.image}
        src={small}
        srcSet={`${small} 312w, ${large} 514w`}
        sizes="(max-width: 760px) 88px, 150px"
        alt=""
        width={312}
        height={340}
        decoding="async"
      />
    </div>
  );
}
