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
          player_name: string | null;
          weapon_type: string;
          equipped: Record<string, string>;
          materials: Record<string, number>;
          owned_gear: string[];
          element_resistance: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          user_id?: string | null;
          name?: string;
          player_name?: string | null;
          weapon_type: string;
          equipped?: Record<string, string>;
          materials?: Record<string, number>;
          owned_gear?: string[];
          element_resistance?: string | null;
          notes?: string | null;
        };
        Update: Partial<{
          user_id: string | null;
          name: string;
          player_name: string | null;
          weapon_type: string;
          equipped: Record<string, string>;
          materials: Record<string, number>;
          owned_gear: string[];
          element_resistance: string | null;
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
          active_quest: unknown | null;
          day_log: Record<string, unknown>;
          active_downtime: unknown | null;
          pending_handler_quest: string | null;
          pending_trades: unknown[];
          updated_at: string;
        };
        Insert: {
          campaign_id: string;
          zenny?: number;
          materials?: Record<string, number>;
          items?: Record<string, number>;
          owned_gear?: string[];
          hunts_completed?: Record<string, number | boolean>;
          active_quest?: unknown | null;
          day_log?: Record<string, unknown>;
          active_downtime?: unknown | null;
          pending_handler_quest?: string | null;
          pending_trades?: unknown[];
        };
        Update: Partial<{
          zenny: number;
          materials: Record<string, number>;
          items: Record<string, number>;
          owned_gear: string[];
          hunts_completed: Record<string, number | boolean>;
          active_quest: unknown | null;
          day_log: Record<string, unknown>;
          active_downtime: unknown | null;
          pending_handler_quest: string | null;
          pending_trades: unknown[];
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
        Returns: {
          campaign_id: string;
          taken_weapons: string[];
          already_member: boolean;
        };
      };
      is_campaign_member: {
        Args: { cid: string };
        Returns: boolean;
      };
      list_my_campaigns: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      /**
       * Atomically writes `campaign_state.active_quest`. The caller is
       * authoritative only for its own hunter's entries in `readyHunterIds`,
       * `lootProgress` and `investigationLoot`; every other hunter's are taken
       * from the stored row under a row lock. Returns the merged quest.
       */
      merge_active_quest: {
        Args: {
          p_campaign_id: string;
          p_quest: unknown;
          p_hunter_id: string;
        };
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
