export type Database = {
  public: {
    Tables: {
      graves: {
        Row: {
          id: string;
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
          hidden: boolean;
          founding_rank: number | null;
          tombstone_bg: string;
          tombstone_fg: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          name: string;
          description?: string | null;
          epitaph?: string | null;
          born?: string | null;
          died?: string | null;
          cause?: string | null;
          tech_stack?: string[];
          project_url?: string | null;
          public_slug?: string;
          hidden?: boolean;
          tombstone_bg: string;
          tombstone_fg: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          name?: string;
          description?: string | null;
          epitaph?: string | null;
          born?: string | null;
          died?: string | null;
          cause?: string | null;
          tech_stack?: string[];
          project_url?: string | null;
          public_slug?: string;
          hidden?: boolean;
          tombstone_bg?: string;
          tombstone_fg?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      founding_spots_claimed: {
        Args: Record<never, never>;
        Returns: number;
      };
      home_stats: {
        Args: Record<never, never>;
        Returns: {
          total_graves: number;
          developers: number;
          top_cause: string | null;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
