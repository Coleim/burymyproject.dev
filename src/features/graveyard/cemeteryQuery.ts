import { supabase } from "@/lib/supabase";

export const PAGE_SIZE = 24;
// Pages restored in a single request when coming back to the cemetery. Capped
// so a crafted `?pages=` can't ask for the whole table (PostgREST caps at 1000).
export const MAX_RESTORED_PAGES = 10;

export function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function parsePages(raw: string | null): number {
  const pages = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(pages) || pages < 1) return 1;
  return Math.min(pages, MAX_RESTORED_PAGES);
}

type FetchGravesOptions = {
  from: number;
  limit: number;
  term: string;
  /** Counting scans every matching row: only ask for it once per search. */
  withCount: boolean;
};

export async function fetchGraves({
  from,
  limit,
  term,
  withCount,
}: FetchGravesOptions) {
  let query = supabase
    .from("graves")
    .select("*", withCount ? { count: "exact" } : undefined)
    .eq("is_public", true)
    .eq("hidden", false);

  if (term) query = query.ilike("name", `%${escapeLike(term)}%`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw error;
  return { data: data ?? [], count };
}
