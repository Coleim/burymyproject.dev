import { useAuth } from "@/features/auth/useAuth";
import { Navbar } from "@/shared/components/Navbar";
import { LinkButton } from "@/shared/components/LinkButton";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Grave } from "@/features/grave/types";
import styles from "@/shared/components/GraveGrid.module.css";

export function MyGravesPage() {
  const { user } = useAuth();
  const [graves, setGraves] = useState<Grave[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from("graves")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setGraves(data ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleDelete(id: string) {
    if (!confirm("Permanently dig up this project?")) return;
    await supabase.from("graves").delete().eq("id", id);
    setGraves((prev) => prev?.filter((g) => g.id !== id) ?? null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <div className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.label}>Your burial grounds</span>
            <h1 className={styles.title}>My Graveyard</h1>
          </div>
          <LinkButton to="/graves/new">🪦 Bury New Project</LinkButton>
        </div>

        {graves === null && (
          <div className={styles.loading}>Loading your graveyard...</div>
        )}

        {graves !== null && graves.length === 0 && (
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
              <div key={grave.id} className={styles.card}>
                <TombstoneCard
                  name={grave.name}
                  startDate={grave.born}
                  endDate={grave.died}
                  epitaph={grave.epitaph}
                  cause={grave.cause}
                  slug={grave.public_slug}
                />
                <button
                  type="button"
                  className={styles["delete-button"]}
                  onClick={() => handleDelete(grave.id)}
                  aria-label={`Delete the grave of ${grave.name}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
