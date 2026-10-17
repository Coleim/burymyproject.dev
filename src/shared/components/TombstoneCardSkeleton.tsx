import styles from "./TombstoneCard.module.css";

export function TombstoneCardSkeleton() {
  return (
    <div className={styles.tombstone} aria-hidden="true">
      <div className={styles["tombstone-image"]}>
        <div className={styles.skeleton} />
      </div>
    </div>
  );
}
