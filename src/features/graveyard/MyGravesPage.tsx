import { useAuth } from "@/features/auth/useAuth";
import { Main } from "@/shared/components/Main";
import { Navbar } from "@/shared/components/Navbar";
import { Button } from "@/shared/components/Button";
import { LinkButton } from "@/shared/components/LinkButton";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { TombstoneCardSkeleton } from "@/shared/components/TombstoneCardSkeleton";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Grave } from "@/features/grave/types";
import styles from "@/shared/components/GraveGrid.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

const SKELETON_COUNT = 8;

export function MyGravesPage() {
  usePageTitle("My graveyard");
  const { user } = useAuth();
  const [graves, setGraves] = useState<Grave[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from("graves")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        setError(!!error);
        setGraves(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [user, attempt]);

  function retry() {
    setGraves(null);
    setError(false);
    setAttempt((n) => n + 1);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <Main className={styles.main}>
          <div className={styles.header}>
            <div className={styles.heading}>
              <span className={styles.label}>Your burial grounds</span>
              <h1 className={styles.title}>My Graveyard</h1>
            </div>
            <LinkButton to="/graves/new">🪦 Bury New Project</LinkButton>
          </div>

          {graves === null && (
            <div className={styles.grid}>
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <TombstoneCardSkeleton key={i} />
              ))}
            </div>
          )}

          {graves !== null && graves.length === 0 && error && (
            <div className={styles["empty-state"]} role="alert">
              <p>Something went wrong while digging. Please try again in a moment.</p>
              <Button variant="secondary" onClick={retry}>
                Try again
              </Button>
            </div>
          )}

          {graves !== null && graves.length === 0 && !error && (
            <div className={styles["empty-state"]}>
              <p>
                No projects buried here... yet. Are all your projects still
                alive? 🪦
              </p>
              <LinkButton to="/graves/new">Bury a project</LinkButton>
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
                  bgImage={grave.tombstone_bg}
                  fgImage={grave.tombstone_fg}
                  slug={grave.public_slug}
                />
              ))}
            </div>
          )}
        </Main>
      </div>
    </div>
  );
}
