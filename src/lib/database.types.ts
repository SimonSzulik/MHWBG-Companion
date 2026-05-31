/**
 * Hand-written types mirroring supabase/schema.sql. When the cloud sync layer
 * lands, these give the Supabase client end-to-end type safety. Keep in sync
 * with the SQL (or replace with `supabase gen types typescript` output).
 */
export interface Database {
  public: {
    Tables: {
      campaign: {
        Row: {
          id: string;
          name: string;
          box: string;
          join_code: string;
          day: number;
          max_day: number;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          box?: string;
          day?: number;
          max_day?: number;
          owner_id: string;
        };
        Update: Partial<{
          name: string;
          box: string;
          day: number;
          max_day: number;
        }>;
      };
      campaign_member: {
        Row: {
          campaign_id: string;
          user_id: string;
          role: "owner" | "player";
          joined_at: string;
        };
        Insert: {
          campaign_id: string;
          user_id: string;
          role?: "owner" | "player";
        };
        Update: Partial<{ role: "owner" | "player" }>;
      };
      hunter: {
        Row: {
          id: string;
          campaign_id: string;
          user_id: string | null;
          name: string;
          palico_name: string | null;
          player_name: string | null;
          weapon_type: string;
          equipped: Record<string, string>;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id?: string | null;
          name?: string;
          palico_name?: string | null;
          player_name?: string | null;
          weapon_type: string;
          equipped?: Record<string, string>;
          notes?: string | null;
        };
        Update: Partial<{
          user_id: string | null;
          name: string;
          palico_name: string | null;
          player_name: string | null;
          weapon_type: string;
          equipped: Record<string, string>;
          notes: string | null;
        }>;
      };
      campaign_state: {
        Row: {
          campaign_id: string;
          zenny: number;
          materials: Record<string, number>;
          items: Record<string, number>;
          owned_gear: string[];
          hunts_completed: Record<string, boolean>;
          updated_at: string;
        };
        Insert: {
          campaign_id: string;
          zenny?: number;
          materials?: Record<string, number>;
          items?: Record<string, number>;
          owned_gear?: string[];
          hunts_completed?: Record<string, boolean>;
        };
        Update: Partial<{
          zenny: number;
          materials: Record<string, number>;
          items: Record<string, number>;
          owned_gear: string[];
          hunts_completed: Record<string, boolean>;
        }>;
      };
    };
    Functions: {
      join_campaign: {
        Args: { code: string };
        Returns: string;
      };
      is_campaign_member: {
        Args: { cid: string };
        Returns: boolean;
      };
    };
  };
}
