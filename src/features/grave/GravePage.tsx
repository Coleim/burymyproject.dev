import { useAuth } from "@/features/auth/useAuth";
import { Main } from "@/shared/components/Main";
import { Navbar } from "@/shared/components/Navbar";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { TombstoneCardSkeleton } from "@/shared/components/TombstoneCardSkeleton";
import { Button } from "@/shared/components/Button";
import { LinkButton } from "@/shared/components/LinkButton";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Grave } from "./types";
import styles from "./GravePage.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

export function GravePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grave, setGrave] = useState<Grave | null>(null);
  const [status, setStatus] = useState<
    "loading" | "found" | "not-found" | "error"
  >("loading");
  const [attempt, setAttempt] = useState(0);
  const [deleteFailed, setDeleteFailed] = useState(false);

  usePageTitle(
    status === "found" && grave
      ? `${grave.name} — RIP`
      : status === "not-found"
        ? "Grave not found"
        : undefined,
  );

  useEffect(() => {
    let cancelled = false;
    if (!slug) return;

    supabase
      .from("graves")
      .select("*")
      .eq("public_slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus("error");
        } else if (data) {
          setGrave(data);
          setStatus("found");
        } else {
          setStatus("not-found");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  function retry() {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }

  async function handleDelete() {
    if (!grave) return;
    if (!confirm("Permanently dig up this project?")) return;
    setDeleteFailed(false);
    const { error } = await supabase.from("graves").delete().eq("id", grave.id);
    if (error) {
      setDeleteFailed(true);
      return;
    }
    navigate("/my-graves");
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />

        {status === "loading" && (
          <Main className={styles.wrapper}>
            <TombstoneCardSkeleton />
            <div className={styles.details}>
              <div className={styles["skeleton-line"]} />
              <div
                className={`${styles["skeleton-line"]} ${styles["skeleton-line--short"]}`}
              />
            </div>
          </Main>
        )}

        {status === "error" && (
          <Main className={styles.state}>
            <h1 className={styles["state-title"]}>Something went wrong</h1>
            <p role="alert">
              We couldn't dig up this grave. Please try again in a moment.
            </p>
            <Button onClick={retry}>Try again</Button>
          </Main>
        )}

        {status === "not-found" && (
          <Main className={styles.state}>
            <h1 className={styles["state-title"]}>This grave doesn't exist...</h1>
            <p>... or never did. 🪦</p>
            <LinkButton to="/">Back home</LinkButton>
          </Main>
        )}

        {status === "found" && grave && (
          <Main className={styles.wrapper}>
            <TombstoneCard
              name={grave.name}
              startDate={grave.born}
              endDate={grave.died}
              epitaph={grave.epitaph}
              cause={grave.cause}
              bgImage={grave.tombstone_bg}
              fgImage={grave.tombstone_fg}
              featured
              headingLevel={1}
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

              {grave.project_url && /^https?:\/\//i.test(grave.project_url) && (
                <a
                  className={styles["project-link"]}
                  href={grave.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit the project's remains ↗
                </a>
              )}

              <div className={styles.meta}>
                <span>
                  Buried on{" "}
                  {new Date(grave.created_at).toLocaleDateString("en-US")}
                </span>
              </div>

              {user?.id === grave.author_id && (
                <div className={styles.actions}>
                  <LinkButton
                    to={`/graves/${grave.public_slug}/edit`}
                    variant="secondary"
                  >
                    Edit this grave
                  </LinkButton>
                  <button
                    type="button"
                    className={styles["delete-button"]}
                    onClick={handleDelete}
                    aria-label={`Delete the grave of ${grave.name}`}
                  >
                    Delete this grave
                  </button>
                  {deleteFailed && (
                    <p className={styles["action-error"]} role="alert">
                      Couldn't delete this grave. Please try again.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Main>
        )}
      </div>
    </div>
  );
}
