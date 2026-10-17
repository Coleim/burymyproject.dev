import { Navbar } from "@/shared/components/Navbar";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Grave } from "@/features/grave/types";
import styles from "@/shared/components/GraveGrid.module.css";

const PAGE_SIZE = 24;

export function CemeteryPage() {
  const [graves, setGraves] = useState<Grave[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("graves")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data }) => {
        if (!cancelled) setGraves(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <div className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.label}>The whole graveyard</span>
            <h1 className={styles.title}>Global Cemetery</h1>
          </div>
        </div>

        {graves === null && (
          <div className={styles.loading}>Opening the gates...</div>
        )}

        {graves !== null && graves.length === 0 && (
          <div className={styles["empty-state"]}>
            <p>The cemetery is still empty. Be the first to bury a project here. 🪦</p>
          </div>
        )}

        {graves !== null && graves.length > 0 && (
          <div className={styles.grid}>
            {graves.map((grave) => (
              <TombstoneCard
                key={grave.id}
                name={grave.name}
                startDate={grave.born}
                endDate={grave.died}
                epitaph={grave.epitaph}
                cause={grave.cause}
                slug={grave.public_slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
