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
  is_public: boolean;
  tombstone_bg: string;
  tombstone_fg: string;
};
