import { Button } from "@/shared/components/Button";
import { LinkButton } from "@/shared/components/LinkButton";
import { Main } from "@/shared/components/Main";
import { Navbar } from "@/shared/components/Navbar";
import { TombstoneCard } from "@/shared/components/TombstoneCard";
import { TombstoneCardSkeleton } from "@/shared/components/TombstoneCardSkeleton";
import { useEffect, useRef, useState } from "react";
import { useNavigationType, useSearchParams } from "react-router-dom";
import {
  fetchGraves,
  MAX_RESTORED_PAGES,
  PAGE_SIZE,
  parsePages,
} from "./cemeteryQuery";
import type { Grave } from "@/features/grave/types";
import styles from "@/shared/components/GraveGrid.module.css";
import { usePageTitle } from "@/shared/lib/usePageTitle";

const SKELETON_COUNT = 8;
const SEARCH_DEBOUNCE_MS = 300;
const scrollKey = (term: string) => `cemetery-scroll:${term}`;

type CemeteryData = {
  term: string;
  graves: Grave[];
  total: number;
  error: boolean;
};

export function CemeteryPage() {
  usePageTitle("Cemetery");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigationType = useNavigationType();
  const term = (searchParams.get("q") ?? "").trim();

  // What the visitor is typing, remembered with the term it was typed on top
  // of: if the URL changes under us (nav link, back button) the draft is
  // simply ignored, with no effect needed to keep the two in sync.
  const [draft, setDraft] = useState<{ text: string; basedOn: string } | null>(
    null,
  );
  const inputValue = draft && draft.basedOn === term ? draft.text : term;

  // Pages that were loaded when the visitor left (read once, from the URL).
  const [restore] = useState(() => ({
    term,
    pages: parsePages(searchParams.get("pages")),
  }));
  const pagesToLoad = term === restore.term ? restore.pages : 1;

  const [data, setData] = useState<CemeteryData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const trackScroll = useRef(false);
  const firstLoad = useRef(true);
  // Scroll offset to restore once the cards are actually in the DOM.
  const pendingScroll = useRef<number | null>(null);

  useEffect(() => {
    if (!draft) return;
    const next = draft.text.trim();
    if (next === term) return;
    const timer = setTimeout(() => {
      setDraft({ text: draft.text, basedOn: next });
      setSearchParams(next ? { q: next } : {}, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, term, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    trackScroll.current = false;

    fetchGraves({
      from: 0,
      limit: pagesToLoad * PAGE_SIZE,
      term,
      withCount: true,
    })
      .then(({ data, count }) => {
        if (cancelled) return;
        setData({
          term,
          graves: data,
          total: count ?? data.length,
          error: false,
        });
        // Back/forward: put the visitor back where they were, once the
        // cards are rendered (see the effect below).
        const isFirst = firstLoad.current;
        firstLoad.current = false;
        pendingScroll.current =
          isFirst && navigationType === "POP"
            ? Number(sessionStorage.getItem(scrollKey(term))) || 0
            : 0;
      })
      .catch(() => {
        if (cancelled) return;
        pendingScroll.current = 0;
        setData({ term, graves: [], total: 0, error: true });
      });

    return () => {
      cancelled = true;
    };
    // Only a new search term refetches; the page count is read when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  useEffect(() => {
    // The browser can't restore the scroll of content that loads after the
    // page does, so we do it ourselves.
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    let frame = 0;
    const onScroll = () => {
      if (!trackScroll.current || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        sessionStorage.setItem(scrollKey(term), String(window.scrollY));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      window.history.scrollRestoration = previous;
    };
  }, [term]);

  const loading = data === null || data.term !== term;
  const graves = loading ? [] : data.graves;
  const total = loading ? 0 : data.total;
  const error = !loading && data.error;

  useEffect(() => {
    if (loading || pendingScroll.current === null) return;
    if (pendingScroll.current > 0) window.scrollTo(0, pendingScroll.current);
    pendingScroll.current = null;
    trackScroll.current = true;
  }, [loading, data]);

  async function loadMore() {
    if (loading) return;
    setLoadingMore(true);
    try {
      const page = await fetchGraves({
        from: data.graves.length,
        limit: PAGE_SIZE,
        term: data.term,
        withCount: false,
      });
      const merged = (() => {
        const seen = new Set(data.graves.map((g) => g.id));
        return [...data.graves, ...page.data.filter((g) => !seen.has(g.id))];
      })();
      setData((current) =>
        current && current.term === data.term
          ? {
              ...current,
              graves: merged,
              // A short page means we reached the end, whatever the old count said.
              total: page.data.length < PAGE_SIZE ? merged.length : current.total,
              error: false,
            }
          : current,
      );
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params);
          next.set(
            "pages",
            String(Math.min(Math.ceil(merged.length / PAGE_SIZE), MAX_RESTORED_PAGES)),
          );
          return next;
        },
        { replace: true },
      );
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
        <Main className={styles.main}>
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
              value={inputValue}
              onChange={(e) =>
                setDraft({ text: e.target.value, basedOn: term })
              }
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
              <Button
                variant="secondary"
                onClick={() => {
                  setDraft(null);
                  setSearchParams({}, { replace: true });
                }}
              >
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
        </Main>
      </div>
    </div>
  );
}
