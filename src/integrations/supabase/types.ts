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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          message: string
          sender_id: string
          sender_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          message: string
          sender_id: string
          sender_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          message?: string
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          author_id: string
          author_name: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          author_name?: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          author_name: string
          body: string
          category: string
          created_at: string
          id: string
          image_url: string | null
          language: string | null
          like_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name?: string
          body: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          language?: string | null
          like_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          language?: string | null
          like_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cooperative_groups: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          member_count: number
          name: string
          owner_id: string
          primary_crop: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          member_count?: number
          name: string
          owner_id: string
          primary_crop?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          member_count?: number
          name?: string
          owner_id?: string
          primary_crop?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cooperative_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          member_id: string
          member_name: string
          role: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          member_id: string
          member_name?: string
          role?: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          member_id?: string
          member_name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "cooperative_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_events: {
        Row: {
          created_at: string
          crop: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          is_completed: boolean
          plot_name: string | null
          priority: string
          reminder_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crop?: string | null
          description?: string | null
          event_date: string
          event_type?: string
          id?: string
          is_completed?: boolean
          plot_name?: string | null
          priority?: string
          reminder_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crop?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_completed?: boolean
          plot_name?: string | null
          priority?: string
          reminder_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          contact_phone: string | null
          created_at: string
          crop_type: string
          description: string | null
          id: string
          image_url: string | null
          listing_type: string
          location: string | null
          price_per_unit: number
          quantity: number
          status: string
          title: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_phone?: string | null
          created_at?: string
          crop_type: string
          description?: string | null
          id?: string
          image_url?: string | null
          listing_type?: string
          location?: string | null
          price_per_unit: number
          quantity: number
          status?: string
          title: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_phone?: string | null
          created_at?: string
          crop_type?: string
          description?: string | null
          id?: string
          image_url?: string | null
          listing_type?: string
          location?: string | null
          price_per_unit?: number
          quantity?: number
          status?: string
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          farm_size: string | null
          full_name: string | null
          id: string
          language_preference: string | null
          location: string | null
          phone: string | null
          primary_crop: string | null
          soil_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          farm_size?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          location?: string | null
          phone?: string | null
          primary_crop?: string | null
          soil_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          farm_size?: string | null
          full_name?: string | null
          id?: string
          language_preference?: string | null
          location?: string | null
          phone?: string | null
          primary_crop?: string | null
          soil_type?: string | null
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
      [_ in never]: never
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
