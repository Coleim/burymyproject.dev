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
          public_slug: string;
          is_public: boolean;
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
          public_slug?: string;
          is_public?: boolean;
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
          public_slug?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
