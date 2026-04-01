export type Grave = {
  id: string;
  created_at: string;
  author_id: string;
  name: string;
  description: string;
  epitaph: string;
  born: string;
  died: string;
  cause_of_death: string;
  tech_stack_tags: string[];
  public_link: string | null;
};
