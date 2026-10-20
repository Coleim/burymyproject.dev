import styles from "./RouteFallback.module.css";

export function RouteFallback() {
  return (
    <div className={styles.fallback} role="status">
      Loading...
    </div>
  );
}
