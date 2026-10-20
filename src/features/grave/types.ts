export type Grave = {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  name: string;
  description: string | null;
  epitaph: string | null;
  born: string | null;
  died: string | null;
  cause: string | null;
  tech_stack: string[];
  project_url: string | null;
  public_slug: string;
  /** Set by moderators only; the author still sees their own hidden grave. */
  hidden: boolean;
  /** 1-10 for the first ten people to bury a grave (their first grave), else null. */
  founding_rank: number | null;
  tombstone_bg: string;
  tombstone_fg: string;
};
