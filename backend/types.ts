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
      chunks: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      criteria: {
        Row: {
          created_at: string | null
          description: string | null
          group_name: string | null
          id: string
          order_index: number | null
          project_id: string | null
          title: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_name?: string | null
          id?: string
          order_index?: number | null
          project_id?: string | null
          title: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_name?: string | null
          id?: string
          order_index?: number | null
          project_id?: string | null
          title?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "criteria_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_text: string
          created_at: string | null
          doc_id: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          chunk_text: string
          created_at?: string | null
          doc_id?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          chunk_text?: string
          created_at?: string | null
          doc_id?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: []
      }
      project_assessments: {
        Row: {
          basic_info: Json | null
          budget: Json | null
          created_at: string | null
          criteria: Json | null
          dates: Json | null
          id: string
          project_id: string
          requirements: Json | null
          risks: Json | null
          selection: Json | null
          summary: Json | null
          updated_at: string | null
        }
        Insert: {
          basic_info?: Json | null
          budget?: Json | null
          created_at?: string | null
          criteria?: Json | null
          dates?: Json | null
          id?: string
          project_id: string
          requirements?: Json | null
          risks?: Json | null
          selection?: Json | null
          summary?: Json | null
          updated_at?: string | null
        }
        Update: {
          basic_info?: Json | null
          budget?: Json | null
          created_at?: string | null
          criteria?: Json | null
          dates?: Json | null
          id?: string
          project_id?: string
          requirements?: Json | null
          risks?: Json | null
          selection?: Json | null
          summary?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assessments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_sources: {
        Row: {
          created_at: string | null
          project_id: string
          source_id: string
        }
        Insert: {
          created_at?: string | null
          project_id: string
          source_id: string
        }
        Update: {
          created_at?: string | null
          project_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_sources_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          id: string
          owner_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          bio: string | null
          certificates: string[] | null
          created_at: string | null
          id: string
          name: string
          project_id: string | null
          role: string | null
          seniority: number | null
          skills: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          certificates?: string[] | null
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
          role?: string | null
          seniority?: number | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          certificates?: string[] | null
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
          role?: string | null
          seniority?: number | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          content_draft: string | null
          created_at: string | null
          criteria_ids: string[] | null
          draft_sources: Json | null
          id: string
          order_index: number | null
          parent_id: string | null
          project_id: string | null
          title: string
        }
        Insert: {
          content_draft?: string | null
          created_at?: string | null
          criteria_ids?: string[] | null
          draft_sources?: Json | null
          id?: string
          order_index?: number | null
          parent_id?: string | null
          project_id?: string | null
          title: string
        }
        Update: {
          content_draft?: string | null
          created_at?: string | null
          criteria_ids?: string[] | null
          draft_sources?: Json | null
          id?: string
          order_index?: number | null
          parent_id?: string | null
          project_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          images: Json | null
          origin_url: string | null
          pages: Json | null
          project_id: string | null
          source_type: string | null
          status: string | null
          summary: string | null
          title: string
          topics: string[] | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          images?: Json | null
          origin_url?: string | null
          pages?: Json | null
          project_id?: string | null
          source_type?: string | null
          status?: string | null
          summary?: string | null
          title: string
          topics?: string[] | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          images?: Json | null
          origin_url?: string | null
          pages?: Json | null
          project_id?: string | null
          source_type?: string | null
          status?: string | null
          summary?: string | null
          title?: string
          topics?: string[] | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          id: string
          project_id: string
          requirement_text: string
          section_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          requirement_text: string
          section_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          requirement_text?: string
          section_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_subscriptions: {
        Row: {
          created_at: string
          id: number
          is_active: boolean | null
          keyword: string
          schedule_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          keyword: string
          schedule_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          keyword?: string
          schedule_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenders: {
        Row: {
          created_at: string
          id: number
          keyword_tag: string | null
          org_name: string | null
          publish_date: string | null
          source: string | null
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: number
          keyword_tag?: string | null
          org_name?: string | null
          publish_date?: string | null
          source?: string | null
          title: string
          url: string
        }
        Update: {
          created_at?: string
          id?: number
          keyword_tag?: string | null
          org_name?: string | null
          publish_date?: string | null
          source?: string | null
          title?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_chunks:
        | {
            Args: {
              filter_project_id: string
              match_count: number
              match_threshold: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              similarity: number
              source_title: string
            }[]
          }
        | {
            Args: {
              filter_source_ids?: string[]
              match_count: number
              match_threshold: number
              query_embedding: string
            }
            Returns: {
              content: string
              id: string
              metadata: Json
              similarity: number
              source_id: string
            }[]
          }
      match_chunks_by_project: {
        Args: {
          filter_project_id: string
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          source_id: string
          source_title: string
        }[]
      }
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
        }[]
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
