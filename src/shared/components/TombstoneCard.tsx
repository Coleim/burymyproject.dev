import { getRandomGravePair } from "@/shared/lib/randomGrave";
import { Link } from "react-router-dom";
import styles from "./TombstoneCard.module.css";

export type TombstoneCardProps = {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  epitaph?: string | null;
  cause?: string | null;
  slug?: string;
  featured?: boolean;
};

export function TombstoneCard({
  name,
  startDate,
  endDate,
  epitaph,
  cause,
  slug,
  featured,
}: TombstoneCardProps) {
  const { bg, fg } = getRandomGravePair();

  const content = (
    <div className={styles["tombstone-image"]}>
      <img src={bg} alt="" className={styles["grave-bg"]} />
      <img src={fg} alt={`Tombe de ${name}`} className={styles["grave-fg"]} />
      <div className={styles["tombstone-overlay"]}>
        <div className={styles["tombstone-top-row"]}>
          <span className={styles["tombstone-dates"]}>
            <span>{startDate ?? "?"}</span>
            <span>{endDate ?? "?"}</span>
          </span>{" "}
          {cause && (
            <span className={styles["tombstone-cause"]}>{cause}</span>
          )}
        </div>
        <div className={styles["tombstone-center"]}>
          <h4 className={styles["tombstone-name"]}>{name}</h4>
          {epitaph && (
            <p className={styles["tombstone-epitaph"]}>"{epitaph}"</p>
          )}
        </div>
      </div>
    </div>
  );

  const className = `${styles["tombstone"]} ${featured ? styles["tombstone--featured"] : ""}`;

  if (slug) {
    return (
      <Link
        to={`/graves/${slug}`}
        className={className}
        aria-label={`Voir la tombe de ${name}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
