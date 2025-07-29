export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_anonymous: boolean
          message: string
          organization_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_anonymous?: boolean
          message: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_anonymous?: boolean
          message?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key: string
          language_code: string
          page: string
          section: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          language_code?: string
          page: string
          section: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          language_code?: string
          page?: string
          section?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          arrival_time: string | null
          created_at: string
          date: string
          description: string | null
          estimated_end_time: string | null
          id: string
          image_url: string | null
          location: string | null
          max_participants: number | null
          organization_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string
          date: string
          description?: string | null
          estimated_end_time?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          organization_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          arrival_time?: string | null
          created_at?: string
          date?: string
          description?: string | null
          estimated_end_time?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          organization_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          chat_notifications: boolean
          created_at: string
          email_frequency: string
          event_updates: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_notifications?: boolean
          created_at?: string
          email_frequency?: string
          event_updates?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_notifications?: boolean
          created_at?: string
          email_frequency?: string
          event_updates?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          chat_message_id: string | null
          created_at: string
          email_sent: boolean
          event_id: string | null
          id: string
          notification_type: string
          scheduled_for: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          chat_message_id?: string | null
          created_at?: string
          email_sent?: boolean
          event_id?: string | null
          id?: string
          notification_type: string
          scheduled_for?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          chat_message_id?: string | null
          created_at?: string
          email_sent?: boolean
          event_id?: string | null
          id?: string
          notification_type?: string
          scheduled_for?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_chat_message_id_fkey"
            columns: ["chat_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contact_email: string
          created_at: string
          description: string | null
          email_confirmed: boolean
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contact_email: string
          created_at?: string
          description?: string | null
          email_confirmed?: boolean
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string
          created_at?: string
          description?: string | null
          email_confirmed?: boolean
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dorm: string | null
          email: string
          id: string
          status: string
          updated_at: string
          user_id: string
          wing: string | null
        }
        Insert: {
          created_at?: string
          dorm?: string | null
          email: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          wing?: string | null
        }
        Update: {
          created_at?: string
          dorm?: string | null
          email?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          wing?: string | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          event_id: string
          id: string
          signed_up_at: string
          signed_up_by: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          signed_up_at?: string
          signed_up_by?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          signed_up_at?: string
          signed_up_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
      check_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      confirm_organization_email: {
        Args: { user_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_pa: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "pa" | "user"
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
    Enums: {
      user_role: ["admin", "pa", "user"],
    },
  },
} as const
