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
          is_public: boolean;
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
          is_public?: boolean;
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
          is_public?: boolean;
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
