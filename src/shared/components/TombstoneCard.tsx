import {
  pickRandomGravePair,
  resolveGraveImages,
} from "@/shared/lib/randomGrave";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FOUNDING_TITLE } from "@/lib/founding";
import styles from "./TombstoneCard.module.css";

export type TombstoneCardProps = {
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  epitaph?: string | null;
  cause?: string | null;
  slug?: string;
  featured?: boolean;
  /** 1-10: one of the first ten people to bury a grave (their first one). */
  foundingRank?: number | null;
  /** Heading level of the project name, so the page outline stays in order. */
  headingLevel?: 1 | 2 | 3 | 4;
  /** Filename of the assigned background image, e.g. "grave_bg_03.webp".
   * If omitted, a random pairing is picked (only meant for places without
   * a persisted tombstone assignment yet, like an unsaved preview). */
  bgImage?: string;
  /** Filename of the assigned foreground image, e.g. "grave_07.webp". */
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
  foundingRank,
  headingLevel = 2,
  bgImage,
  fgImage,
}: TombstoneCardProps) {
  const Heading = `h${headingLevel}` as const;
  const [loaded, setLoaded] = useState(false);
  const pair =
    bgImage && fgImage ? { bg: bgImage, fg: fgImage } : pickRandomGravePair();
  const { bgUrl, fgUrl } = resolveGraveImages(pair.bg, pair.fg);

  const content = (
    <div className={styles["tombstone-image"]}>
      {!loaded && <div className={styles.skeleton} aria-hidden="true" />}
      <img
        src={bgUrl}
        alt=""
        loading={featured ? "eager" : "lazy"}
        decoding="async"
        className={styles["grave-bg"]}
        onLoad={() => setLoaded(true)}
      />
      <img
        src={fgUrl}
        alt=""
        loading={featured ? "eager" : "lazy"}
        decoding="async"
        className={styles["grave-fg"]}
      />
      <div className={styles["tombstone-overlay"]}>
        {foundingRank ? (
          <span className={styles["founding-badge"]}>
            <span aria-hidden="true">👻</span> {FOUNDING_TITLE} #{foundingRank}
          </span>
        ) : null}
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
          <Heading className={styles["tombstone-name"]}>{name}</Heading>
          {epitaph && (
            <p className={styles["tombstone-epitaph"]}>"{epitaph}"</p>
          )}
        </div>
      </div>
    </div>
  );

  const className = [
    styles["tombstone"],
    featured && styles["tombstone--featured"],
    foundingRank && styles["tombstone--founding"],
  ]
    .filter(Boolean)
    .join(" ");

  if (slug) {
    return (
      <Link
        to={`/graves/${slug}`}
        className={`${className} ${styles["tombstone-link"]}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
