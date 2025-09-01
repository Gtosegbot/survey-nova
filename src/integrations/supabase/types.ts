export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_agents: {
        Row: {
          conversation_count: number | null
          created_at: string
          created_from_prompt: string | null
          id: string
          livekit_room_id: string | null
          name: string
          prompt: string
          status: string | null
          updated_at: string
          user_id: string | null
          voice_config: Json | null
        }
        Insert: {
          conversation_count?: number | null
          created_at?: string
          created_from_prompt?: string | null
          id?: string
          livekit_room_id?: string | null
          name: string
          prompt: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          voice_config?: Json | null
        }
        Update: {
          conversation_count?: number | null
          created_at?: string
          created_from_prompt?: string | null
          id?: string
          livekit_room_id?: string | null
          name?: string
          prompt?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
          voice_config?: Json | null
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          cost_per_1k_tokens: number | null
          created_at: string
          current_usage: number | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          priority: number
          rate_limit_per_minute: number | null
          type: string
          updated_at: string
        }
        Insert: {
          cost_per_1k_tokens?: number | null
          created_at?: string
          current_usage?: number | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          priority: number
          rate_limit_per_minute?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          cost_per_1k_tokens?: number | null
          created_at?: string
          current_usage?: number | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          priority?: number
          rate_limit_per_minute?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metrics: Json | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metrics?: Json | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metrics?: Json | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          ai_generated: boolean | null
          content: Json | null
          created_at: string
          id: string
          name: string
          schedule_date: string | null
          sent_count: number | null
          status: string | null
          success_count: number | null
          target_audience: Json | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          content?: Json | null
          created_at?: string
          id?: string
          name: string
          schedule_date?: string | null
          sent_count?: number | null
          status?: string | null
          success_count?: number | null
          target_audience?: Json | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: Json | null
          created_at?: string
          id?: string
          name?: string
          schedule_date?: string | null
          sent_count?: number | null
          status?: string | null
          success_count?: number | null
          target_audience?: Json | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          kanban_stage: string | null
          metadata: Json | null
          name: string
          phone: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          kanban_stage?: string | null
          metadata?: Json | null
          name: string
          phone?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          kanban_stage?: string | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          service_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          service_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          service_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          api_key: string | null
          config: Json | null
          created_at: string
          endpoint_url: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          api_key?: string | null
          config?: Json | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          api_key?: string | null
          config?: Json | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          base_cost: number
          created_at: string
          final_price: number
          id: string
          is_active: boolean
          margin_percentage: number
          service_type: string
          unit: string
          updated_at: string
        }
        Insert: {
          base_cost: number
          created_at?: string
          final_price: number
          id?: string
          is_active?: boolean
          margin_percentage?: number
          service_type: string
          unit?: string
          updated_at?: string
        }
        Update: {
          base_cost?: number
          created_at?: string
          final_price?: number
          id?: string
          is_active?: boolean
          margin_percentage?: number
          service_type?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          ai_generated: boolean | null
          content: string
          created_at: string
          engagement_metrics: Json | null
          id: string
          media_urls: string[] | null
          platform: string
          published_date: string | null
          scheduled_date: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          content: string
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          media_urls?: string[] | null
          platform: string
          published_date?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: string
          created_at?: string
          engagement_metrics?: Json | null
          id?: string
          media_urls?: string[] | null
          platform?: string
          published_date?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          current_balance: number
          id: string
          total_purchased: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          id?: string
          total_purchased?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          id?: string
          total_purchased?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_service_type?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
