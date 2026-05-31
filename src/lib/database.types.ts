/**
 * Hand-written types mirroring supabase/schema.sql.
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
          leader_hunter_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          box?: string;
          join_code?: string;
          day?: number;
          max_day?: number;
          owner_id: string;
          leader_hunter_id?: string | null;
        };
        Update: Partial<{
          name: string;
          box: string;
          day: number;
          max_day: number;
          leader_hunter_id: string | null;
        }>;
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      campaign_state: {
        Row: {
          campaign_id: string;
          zenny: number;
          materials: Record<string, number>;
          items: Record<string, number>;
          owned_gear: string[];
          hunts_completed: Record<string, number | boolean>;
          updated_at: string;
        };
        Insert: {
          campaign_id: string;
          zenny?: number;
          materials?: Record<string, number>;
          items?: Record<string, number>;
          owned_gear?: string[];
          hunts_completed?: Record<string, number | boolean>;
        };
        Update: Partial<{
          zenny: number;
          materials: Record<string, number>;
          items: Record<string, number>;
          owned_gear: string[];
          hunts_completed: Record<string, number | boolean>;
        }>;
        Relationships: [];
      };
      player_profile: {
        Row: {
          user_id: string;
          username: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
        };
        Update: Partial<{ username: string }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_campaign: {
        Args: { code: string };
        Returns: string;
      };
      join_campaign_hunter: {
        Args: { code: string; hunter_name: string; weapon_type: string };
        Returns: string;
      };
      peek_join_campaign: {
        Args: { code: string };
        Returns: { campaign_id: string; taken_weapons: string[] };
      };
      is_campaign_member: {
        Args: { cid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
