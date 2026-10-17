import { pickRandomGravePair, resolveGraveImages } from "@/shared/lib/randomGrave";
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
  /** Filename of the assigned background image, e.g. "grave_bg_03.png".
   * If omitted, a random pairing is picked (only meant for places without
   * a persisted tombstone assignment yet, like an unsaved preview). */
  bgImage?: string;
  /** Filename of the assigned foreground image, e.g. "grave_07.png". */
  fgImage?: string;
};

export function TombstoneCard({
  name,
  startDate,
  endDate,
  epitaph,
  cause,
  slug,
  featured,
  bgImage,
  fgImage,
}: TombstoneCardProps) {
  const pair = bgImage && fgImage ? { bg: bgImage, fg: fgImage } : pickRandomGravePair();
  const { bgUrl, fgUrl } = resolveGraveImages(pair.bg, pair.fg);

  const content = (
    <div className={styles["tombstone-image"]}>
      <img src={bgUrl} alt="" className={styles["grave-bg"]} />
      <img src={fgUrl} alt={`Grave of ${name}`} className={styles["grave-fg"]} />
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
        aria-label={`View the grave of ${name}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
