import { useAuth } from "@/features/auth/useAuth";
import { Navbar } from "@/shared/components/Navbar";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { TombstoneCardSkeleton } from "@/shared/components/TombstoneCardSkeleton";
import { LinkButton } from "@/shared/components/LinkButton";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Grave } from "./types";
import styles from "./GravePage.module.css";

export function GravePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grave, setGrave] = useState<Grave | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "not-found">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;

    supabase
      .from("graves")
      .select("*")
      .eq("public_slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setGrave(data);
          setStatus("found");
        } else {
          setStatus("not-found");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleDelete() {
    if (!grave) return;
    if (!confirm("Permanently dig up this project?")) return;
    await supabase.from("graves").delete().eq("id", grave.id);
    navigate("/my-graves");
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />

        {status === "loading" && (
          <div className={styles.wrapper}>
            <TombstoneCardSkeleton />
            <div className={styles.details}>
              <div className={styles["skeleton-line"]} />
              <div
                className={`${styles["skeleton-line"]} ${styles["skeleton-line--short"]}`}
              />
            </div>
          </div>
        )}

        {status === "not-found" && (
          <div className={styles.state}>
            <h1 className={styles["state-title"]}>This grave doesn't exist...</h1>
            <p>... or never did. 🪦</p>
            <LinkButton to="/">Back home</LinkButton>
          </div>
        )}

        {status === "found" && grave && (
          <div className={styles.wrapper}>
            <TombstoneCard
              name={grave.name}
              startDate={grave.born}
              endDate={grave.died}
              epitaph={grave.epitaph}
              cause={grave.cause}
              bgImage={grave.tombstone_bg}
              fgImage={grave.tombstone_fg}
              featured
            />

            <div className={styles.details}>
              {grave.description && (
                <p className={styles.description}>{grave.description}</p>
              )}

              {grave.tech_stack.length > 0 && (
                <div className={styles.tags}>
                  {grave.tech_stack.map((tech) => (
                    <span key={tech} className={styles.tag}>
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.meta}>
                <span>
                  Buried on{" "}
                  {new Date(grave.created_at).toLocaleDateString("en-US")}
                </span>
              </div>

              {user?.id === grave.author_id && (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles["delete-button"]}
                    onClick={handleDelete}
                    aria-label={`Delete the grave of ${grave.name}`}
                  >
                    Delete this grave
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
