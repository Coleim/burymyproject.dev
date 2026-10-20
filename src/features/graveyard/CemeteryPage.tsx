import { Button } from "@/shared/components/Button";
import { LinkButton } from "@/shared/components/LinkButton";
import { Navbar } from "@/shared/components/Navbar";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { TombstoneCardSkeleton } from "@/shared/components/TombstoneCardSkeleton";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { Grave } from "@/features/grave/types";
import styles from "@/shared/components/GraveGrid.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

const PAGE_SIZE = 24;
const SKELETON_COUNT = 8;
const SEARCH_DEBOUNCE_MS = 300;

type CemeteryData = {
  term: string;
  graves: Grave[];
  total: number;
  error: boolean;
};

function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function fetchPage(from: number, term: string) {
  let query = supabase
    .from("graves")
    .select("*", { count: "exact" })
    .eq("is_public", true);

  if (term) query = query.ilike("name", `%${escapeLike(term)}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export function CemeteryPage() {
  usePageTitle("Cemetery");
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [data, setData] = useState<CemeteryData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    let cancelled = false;

    fetchPage(0, term)
      .then(({ data, count }) => {
        if (cancelled) return;
        setData({ term, graves: data, total: count, error: false });
      })
      .catch(() => {
        if (cancelled) return;
        setData({ term, graves: [], total: 0, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [term]);

  const loading = data === null || data.term !== term;
  const graves = loading ? [] : data.graves;
  const total = loading ? 0 : data.total;
  const error = !loading && data.error;

  async function loadMore() {
    if (loading) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(data.graves.length, data.term);
      setData((current) => {
        if (!current || current.term !== data.term) return current;
        const seen = new Set(current.graves.map((g) => g.id));
        return {
          ...current,
          graves: [
            ...current.graves,
            ...page.data.filter((g) => !seen.has(g.id)),
          ],
          total: page.count,
          error: false,
        };
      });
    } catch {
      setData((current) =>
        current && current.term === data.term
          ? { ...current, error: true }
          : current,
      );
    } finally {
      setLoadingMore(false);
    }
  }

  const hasMore = graves.length < total;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Navbar />
        <div className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.label}>The whole graveyard</span>
            <h1 className={styles.title}>Cemetery</h1>
          </div>
          <LinkButton to="/graves/new">🪦 Bury New Project</LinkButton>
        </div>

        <div className={styles["search-bar"]}>
          <label className={styles["search-label"]} htmlFor="cemetery-search">
            Search graves
          </label>
          <input
            id="cemetery-search"
            type="search"
            className={styles["search-input"]}
            placeholder="Search by project name..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
          />
        </div>

        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <TombstoneCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && graves.length === 0 && !error && term === "" && (
          <div className={styles["empty-state"]}>
            <p>The cemetery is still empty. Be the first to bury a project here. 🪦</p>
          </div>
        )}

        {!loading && graves.length === 0 && !error && term !== "" && (
          <div className={styles["empty-state"]}>
            <p>No graves match “{term}”. Maybe it's still alive? 🪦</p>
            <Button variant="secondary" onClick={() => setInput("")}>
              Clear search
            </Button>
          </div>
        )}

        {!loading && graves.length === 0 && error && (
          <div className={styles["empty-state"]} role="alert">
            <p>Something went wrong while digging. Please try again in a moment.</p>
          </div>
        )}

        {!loading && graves.length > 0 && (
          <>
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
              {loadingMore &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TombstoneCardSkeleton key={`more-${i}`} />
                ))}
            </div>

            <div className={styles["load-more"]}>
              <p className={styles["load-more-count"]} aria-live="polite">
                Showing {graves.length} of {total} graves
              </p>
              {error && (
                <p className={styles["load-more-error"]} role="alert">
                  Couldn't load more graves. Please try again.
                </p>
              )}
              {hasMore && (
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Digging..." : "Load more"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
