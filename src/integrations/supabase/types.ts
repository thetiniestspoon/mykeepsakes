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
      accommodations: {
        Row: {
          address: string | null
          check_in: string | null
          check_out: string | null
          created_at: string | null
          id: string
          is_deprioritized: boolean | null
          is_selected: boolean | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          sort_order: number | null
          title: string
          trip_id: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          address?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          id?: string
          is_deprioritized?: boolean | null
          is_selected?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          sort_order?: number | null
          title: string
          trip_id: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          address?: string | null
          check_in?: string | null
          check_out?: string | null
          created_at?: string | null
          id?: string
          is_deprioritized?: boolean | null
          is_selected?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          sort_order?: number | null
          title?: string
          trip_id?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_order: {
        Row: {
          activity_id: string
          created_at: string
          day_id: string
          id: string
          is_hidden: boolean
          order_index: number
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          day_id: string
          id?: string
          is_hidden?: boolean
          order_index?: number
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          day_id?: string
          id?: string
          is_hidden?: boolean
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      activity_overrides: {
        Row: {
          activity_id: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          link: string | null
          link_label: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          notes: string | null
          phone: string | null
          time: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          activity_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          link?: string | null
          link_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          phone?: string | null
          time?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          link?: string | null
          link_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          phone?: string | null
          time?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          item_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          item_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          item_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      collapsed_sections: {
        Row: {
          created_at: string
          id: string
          is_collapsed: boolean
          section_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_collapsed?: boolean
          section_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_collapsed?: boolean
          section_id?: string
        }
        Relationships: []
      }
      custom_activities: {
        Row: {
          category: string
          created_at: string
          day_id: string
          description: string | null
          id: string
          link: string | null
          link_label: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          map_link: string | null
          notes: string | null
          order_index: number
          phone: string | null
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          day_id: string
          description?: string | null
          id?: string
          link?: string | null
          link_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          map_link?: string | null
          notes?: string | null
          order_index?: number
          phone?: string | null
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          day_id?: string
          description?: string | null
          id?: string
          link?: string | null
          link_label?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          map_link?: string | null
          notes?: string | null
          order_index?: number
          phone?: string | null
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_contacts: {
        Row: {
          category: string
          created_at: string
          emergency_info: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          emergency_info?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          emergency_info?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          entity_type: string | null
          id: string
          item_id: string
          item_type: string
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          entity_type?: string | null
          id?: string
          item_id: string
          item_type: string
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          entity_type?: string | null
          id?: string
          item_id?: string
          item_type?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_days: {
        Row: {
          created_at: string | null
          date: string
          id: string
          sort_index: number
          title: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          sort_index?: number
          title?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          sort_index?: number
          title?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string | null
          day_id: string
          description: string | null
          end_time: string | null
          external_ref: string | null
          id: string
          item_type: string
          link: string | null
          link_label: string | null
          location_id: string | null
          notes: string | null
          phone: string | null
          sort_index: number
          source: string | null
          start_time: string | null
          status: string | null
          title: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string | null
          day_id: string
          description?: string | null
          end_time?: string | null
          external_ref?: string | null
          id?: string
          item_type?: string
          link?: string | null
          link_label?: string | null
          location_id?: string | null
          notes?: string | null
          phone?: string | null
          sort_index?: number
          source?: string | null
          start_time?: string | null
          status?: string | null
          title: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string | null
          day_id?: string
          description?: string | null
          end_time?: string | null
          external_ref?: string | null
          id?: string
          item_type?: string
          link?: string | null
          link_label?: string | null
          location_id?: string | null
          notes?: string | null
          phone?: string | null
          sort_index?: number
          source?: string | null
          start_time?: string | null
          status?: string | null
          title?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      location_days: {
        Row: {
          created_at: string | null
          day_id: string
          id: string
          location_id: string
        }
        Insert: {
          created_at?: string | null
          day_id: string
          id?: string
          location_id: string
        }
        Update: {
          created_at?: string | null
          day_id?: string
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_days_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_days_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          category: string | null
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          phone: string | null
          trip_id: string
          updated_at: string | null
          url: string | null
          visited_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          trip_id: string
          updated_at?: string | null
          url?: string | null
          visited_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          trip_id?: string
          updated_at?: string | null
          url?: string | null
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      lodging_options: {
        Row: {
          address: string | null
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          cons: string[] | null
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          is_selected: boolean
          location_lat: number | null
          location_lng: number | null
          max_guests: number | null
          name: string
          notes: string | null
          photos: string[] | null
          price_per_night: number | null
          pros: string[] | null
          total_price: number | null
          updated_at: string
          url: string | null
          votes_down: number
          votes_up: number
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          cons?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_selected?: boolean
          location_lat?: number | null
          location_lng?: number | null
          max_guests?: number | null
          name: string
          notes?: string | null
          photos?: string[] | null
          price_per_night?: number | null
          pros?: string[] | null
          total_price?: number | null
          updated_at?: string
          url?: string | null
          votes_down?: number
          votes_up?: number
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          cons?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_selected?: boolean
          location_lat?: number | null
          location_lng?: number | null
          max_guests?: number | null
          name?: string
          notes?: string | null
          photos?: string[] | null
          price_per_night?: number | null
          pros?: string[] | null
          total_price?: number | null
          updated_at?: string
          url?: string | null
          votes_down?: number
          votes_up?: number
        }
        Relationships: []
      }
      memories: {
        Row: {
          created_at: string | null
          day_id: string | null
          id: string
          itinerary_item_id: string | null
          location_id: string | null
          note: string | null
          title: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          day_id?: string | null
          id?: string
          itinerary_item_id?: string | null
          location_id?: string | null
          note?: string | null
          title?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string | null
          day_id?: string | null
          id?: string
          itinerary_item_id?: string | null
          location_id?: string | null
          note?: string | null
          title?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_itinerary_item_id_fkey"
            columns: ["itinerary_item_id"]
            isOneToOne: false
            referencedRelation: "itinerary_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_media: {
        Row: {
          byte_size: number | null
          created_at: string | null
          duration_seconds: number | null
          height: number | null
          id: string
          media_type: string
          memory_id: string
          mime_type: string | null
          storage_path: string
          thumbnail_path: string | null
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          media_type: string
          memory_id: string
          mime_type?: string | null
          storage_path: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          height?: number | null
          id?: string
          media_type?: string
          memory_id?: string
          mime_type?: string | null
          storage_path?: string
          thumbnail_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_media_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          item_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          item_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          item_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          item_id: string
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          item_id: string
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          item_id?: string
          storage_path?: string
        }
        Relationships: []
      }
      trip_share_links: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          permission: string | null
          token: string
          trip_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permission?: string | null
          token?: string
          trip_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          permission?: string | null
          token?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_share_links_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          location_name: string | null
          start_date: string
          timezone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          location_name?: string | null
          start_date: string
          timezone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          location_name?: string | null
          start_date?: string
          timezone?: string | null
          title?: string
          updated_at?: string | null
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
