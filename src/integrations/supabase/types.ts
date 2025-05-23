export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agency_settings: {
        Row: {
          created_at: string
          id: number
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      billing: {
        Row: {
          agency_gstin: string | null
          amount_due: number | null
          amount_payable: number | null
          amount_total: number | null
          bill_status: Database["public"]["Enums"]["doc_status"]
          billing_number: string | null
          billing_type: Database["public"]["Enums"]["billing_type"]
          client_gstin: string | null
          client_id: string
          created_at: string | null
          gst_details: Json | null
          id: string
          items: Json | null
          linked_billing_id: string | null
          payment_status: Database["public"]["Enums"]["billing_payment_status"]
          place_of_supply: string | null
          reason: string | null
          snapshot_data: Json | null
          tds_amount: number | null
          tds_rate: number | null
          updated_at: string | null
        }
        Insert: {
          agency_gstin?: string | null
          amount_due?: number | null
          amount_payable?: number | null
          amount_total?: number | null
          bill_status?: Database["public"]["Enums"]["doc_status"]
          billing_number?: string | null
          billing_type: Database["public"]["Enums"]["billing_type"]
          client_gstin?: string | null
          client_id: string
          created_at?: string | null
          gst_details?: Json | null
          id?: string
          items?: Json | null
          linked_billing_id?: string | null
          payment_status?: Database["public"]["Enums"]["billing_payment_status"]
          place_of_supply?: string | null
          reason?: string | null
          snapshot_data?: Json | null
          tds_amount?: number | null
          tds_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          agency_gstin?: string | null
          amount_due?: number | null
          amount_payable?: number | null
          amount_total?: number | null
          bill_status?: Database["public"]["Enums"]["doc_status"]
          billing_number?: string | null
          billing_type?: Database["public"]["Enums"]["billing_type"]
          client_gstin?: string | null
          client_id?: string
          created_at?: string | null
          gst_details?: Json | null
          id?: string
          items?: Json | null
          linked_billing_id?: string | null
          payment_status?: Database["public"]["Enums"]["billing_payment_status"]
          place_of_supply?: string | null
          reason?: string | null
          snapshot_data?: Json | null
          tds_amount?: number | null
          tds_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      client_admins: {
        Row: {
          address: string | null
          business_name: string
          created_at: string
          description: string | null
          gstin: string | null
          id: string
          logo_url: string | null
          primary_color_hex: string | null
          secondary_color_hex: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name: string
          created_at?: string
          description?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          primary_color_hex?: string | null
          secondary_color_hex?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string
          created_at?: string
          description?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          primary_color_hex?: string | null
          secondary_color_hex?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complexity_levels: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          multiplier: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          multiplier?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          multiplier?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          content: string | null
          created_at: string | null
          id: number
          title: string | null
          type: Database["public"]["Enums"]["doc_type"] | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: number
          title?: string | null
          type?: Database["public"]["Enums"]["doc_type"] | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: number
          title?: string | null
          type?: Database["public"]["Enums"]["doc_type"] | null
        }
        Relationships: []
      }
      file_types: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          file_description: string | null
          file_name: string
          file_type_id: number | null
          file_url: string
          id: string
          project_id: string
          size: number | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_description?: string | null
          file_name: string
          file_type_id?: number | null
          file_url: string
          id?: string
          project_id: string
          size?: number | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_description?: string | null
          file_name?: string
          file_type_id?: number | null
          file_url?: string
          id?: string
          project_id?: string
          size?: number | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_file_type_id_fkey"
            columns: ["file_type_id"]
            isOneToOne: false
            referencedRelation: "file_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inputs: {
        Row: {
          attachment_url: string | null
          created_at: string
          description: string
          id: string
          project_id: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["input_status"] | null
          submitted_at: string | null
          submitted_by: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          description: string
          id?: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["input_status"] | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          description?: string
          id?: string
          project_id?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["input_status"] | null
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inputs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inputs_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      priority_levels: {
        Row: {
          color_hex: string | null
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          multiplier: number | null
          name: string
          start_delay: unknown | null
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          multiplier?: number | null
          name: string
          start_delay?: unknown | null
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          multiplier?: number | null
          name?: string
          start_delay?: unknown | null
          updated_at?: string
        }
        Relationships: []
      }
      project_assignees: {
        Row: {
          created_at: string
          id: number
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_credentials: {
        Row: {
          created_at: string
          details: string | null
          id: number
          is_encrypted: boolean
          password: string | null
          project_id: string
          type: string
          updated_at: string
          url: string
          username: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: number
          is_encrypted?: boolean
          password?: string | null
          project_id: string
          type: string
          updated_at?: string
          url: string
          username?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: number
          is_encrypted?: boolean
          password?: string | null
          project_id?: string
          type?: string
          updated_at?: string
          url?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_duration: unknown | null
          created_at: string
          description: string | null
          est_duration: unknown | null
          id: number
          is_milestone: boolean | null
          name: string
          phase_order: number
          progress: number
          project_id: string
          status_id: number | null
          tasks: Json | null
          updated_at: string
        }
        Insert: {
          actual_duration?: unknown | null
          created_at?: string
          description?: string | null
          est_duration?: unknown | null
          id?: number
          is_milestone?: boolean | null
          name: string
          phase_order: number
          progress?: number
          project_id: string
          status_id?: number | null
          tasks?: Json | null
          updated_at?: string
        }
        Update: {
          actual_duration?: unknown | null
          created_at?: string
          description?: string | null
          est_duration?: unknown | null
          id?: number
          is_milestone?: boolean | null
          name?: string
          phase_order?: number
          progress?: number
          project_id?: string
          status_id?: number | null
          tasks?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      project_subscriptions: {
        Row: {
          allocated_duration: unknown
          auto_renew: boolean
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string
          id: string
          max_concurrent_tasks: number
          next_renewal_date: string
          project_id: string
          start_date: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          allocated_duration: unknown
          auto_renew?: boolean
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          id?: string
          max_concurrent_tasks?: number
          next_renewal_date: string
          project_id: string
          start_date?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          allocated_duration?: unknown
          auto_renew?: boolean
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string
          id?: string
          max_concurrent_tasks?: number
          next_renewal_date?: string
          project_id?: string
          start_date?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_types: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_admin_id: string | null
          created_at: string
          details: string | null
          due_date: string | null
          id: string
          is_using_phases: boolean
          layout_type: Database["public"]["Enums"]["layout_type"] | null
          logo_url: string | null
          max_concurrent_tasks: number
          name: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          primary_color_hex: string | null
          progress: number
          secondary_color_hex: string | null
          status_id: number | null
          status_options: Json
          task_fields: Json
          task_type_options: Json | null
          types: number | null
          updated_at: string
        }
        Insert: {
          client_admin_id?: string | null
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          is_using_phases?: boolean
          layout_type?: Database["public"]["Enums"]["layout_type"] | null
          logo_url?: string | null
          max_concurrent_tasks?: number
          name: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          primary_color_hex?: string | null
          progress?: number
          secondary_color_hex?: string | null
          status_id?: number | null
          status_options?: Json
          task_fields?: Json
          task_type_options?: Json | null
          types?: number | null
          updated_at?: string
        }
        Update: {
          client_admin_id?: string | null
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          is_using_phases?: boolean
          layout_type?: Database["public"]["Enums"]["layout_type"] | null
          logo_url?: string | null
          max_concurrent_tasks?: number
          name?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          primary_color_hex?: string | null
          progress?: number
          secondary_color_hex?: string | null
          status_id?: number | null
          status_options?: Json
          task_fields?: Json
          task_type_options?: Json | null
          types?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_admin_id_fkey"
            columns: ["client_admin_id"]
            isOneToOne: false
            referencedRelation: "client_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_types_fkey"
            columns: ["types"]
            isOneToOne: false
            referencedRelation: "project_types"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_templates: {
        Row: {
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_html: string
          thumbnail_url: string | null
        }
        Insert: {
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_html: string
          thumbnail_url?: string | null
        }
        Update: {
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_html?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage: {
        Row: {
          allocated_duration: unknown | null
          billing_period: string
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          project_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_id: string
          updated_at: string
          used_duration: unknown | null
        }
        Insert: {
          allocated_duration?: unknown | null
          billing_period: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          project_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          subscription_id: string
          updated_at?: string
          used_duration?: unknown | null
        }
        Update: {
          allocated_duration?: unknown | null
          billing_period?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          subscription_id?: string
          updated_at?: string
          used_duration?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "project_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      task_blocking_history: {
        Row: {
          blocking_type: string
          created_at: string
          ended_at: string | null
          id: string
          reason: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          blocking_type: string
          created_at?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          blocking_type?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_blocking_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comment_views: {
        Row: {
          created_at: string
          id: number
          task_id: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          task_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          task_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comment_views_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comment_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          file_url: string | null
          id: string
          images: Json | null
          is_input_request: boolean | null
          is_input_response: boolean | null
          parent_id: string | null
          task_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          images?: Json | null
          is_input_request?: boolean | null
          is_input_response?: boolean | null
          parent_id?: string | null
          task_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          images?: Json | null
          is_input_request?: boolean | null
          is_input_response?: boolean | null
          parent_id?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_statuses: {
        Row: {
          color_hex: string | null
          description: string | null
          id: number
          is_default: boolean
          name: string
          type: Database["public"]["Enums"]["task_status_type"] | null
        }
        Insert: {
          color_hex?: string | null
          description?: string | null
          id?: number
          is_default?: boolean
          name: string
          type?: Database["public"]["Enums"]["task_status_type"] | null
        }
        Update: {
          color_hex?: string | null
          description?: string | null
          id?: number
          is_default?: boolean
          name?: string
          type?: Database["public"]["Enums"]["task_status_type"] | null
        }
        Relationships: []
      }
      task_types: {
        Row: {
          category: Database["public"]["Enums"]["task_categories"]
          created_at: string
          default_duration: unknown | null
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["task_categories"]
          created_at?: string
          default_duration?: unknown | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["task_categories"]
          created_at?: string
          default_duration?: unknown | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_duration: unknown | null
          assigned_user_id: string | null
          completed_at: string | null
          complexity_level_id: number | null
          created_at: string
          created_by: string
          current_status_id: number
          details: string
          est_duration: unknown | null
          est_end: string | null
          est_start: string | null
          id: string
          images: Json | null
          is_awaiting_input: boolean | null
          is_onhold: boolean | null
          last_status_id: number | null
          logged_duration: unknown | null
          priority_level_id: number
          project_id: string
          queue_position: number | null
          reference_links: Json | null
          started_at: string | null
          target_device: Database["public"]["Enums"]["device_type"]
          task_code: string | null
          task_type_id: number
          total_blocked_duration: unknown | null
          updated_at: string
        }
        Insert: {
          actual_duration?: unknown | null
          assigned_user_id?: string | null
          completed_at?: string | null
          complexity_level_id?: number | null
          created_at?: string
          created_by: string
          current_status_id?: number
          details: string
          est_duration?: unknown | null
          est_end?: string | null
          est_start?: string | null
          id?: string
          images?: Json | null
          is_awaiting_input?: boolean | null
          is_onhold?: boolean | null
          last_status_id?: number | null
          logged_duration?: unknown | null
          priority_level_id?: number
          project_id: string
          queue_position?: number | null
          reference_links?: Json | null
          started_at?: string | null
          target_device?: Database["public"]["Enums"]["device_type"]
          task_code?: string | null
          task_type_id: number
          total_blocked_duration?: unknown | null
          updated_at?: string
        }
        Update: {
          actual_duration?: unknown | null
          assigned_user_id?: string | null
          completed_at?: string | null
          complexity_level_id?: number | null
          created_at?: string
          created_by?: string
          current_status_id?: number
          details?: string
          est_duration?: unknown | null
          est_end?: string | null
          est_start?: string | null
          id?: string
          images?: Json | null
          is_awaiting_input?: boolean | null
          is_onhold?: boolean | null
          last_status_id?: number | null
          logged_duration?: unknown | null
          priority_level_id?: number
          project_id?: string
          queue_position?: number | null
          reference_links?: Json | null
          started_at?: string | null
          target_device?: Database["public"]["Enums"]["device_type"]
          task_code?: string | null
          task_type_id?: number
          total_blocked_duration?: unknown | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_complexity_level_id_fkey"
            columns: ["complexity_level_id"]
            isOneToOne: false
            referencedRelation: "complexity_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_current_status_id_fkey"
            columns: ["current_status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_last_status_id_fkey"
            columns: ["last_status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_priority_level_id_fkey"
            columns: ["priority_level_id"]
            isOneToOne: false
            referencedRelation: "priority_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          billing_id: string | null
          created_at: string | null
          discount_amount: number | null
          id: string
          linked_billing_id: string | null
          payment_method: string | null
          payment_percentage: number | null
          payment_type: string | null
          receipt_number: number | null
          reference_number: string | null
          tds_deducted: number | null
          transaction_date: string | null
          transaction_proof_url: string | null
          transaction_status: Database["public"]["Enums"]["transaction_status"]
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          billing_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          linked_billing_id?: string | null
          payment_method?: string | null
          payment_percentage?: number | null
          payment_type?: string | null
          receipt_number?: number | null
          reference_number?: string | null
          tds_deducted?: number | null
          transaction_date?: string | null
          transaction_proof_url?: string | null
          transaction_status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          billing_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          linked_billing_id?: string | null
          payment_method?: string | null
          payment_percentage?: number | null
          payment_type?: string | null
          receipt_number?: number | null
          reference_number?: string | null
          tds_deducted?: number | null
          transaction_date?: string | null
          transaction_proof_url?: string | null
          transaction_status?: Database["public"]["Enums"]["transaction_status"]
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billing"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          client_admin_id: string | null
          created_at: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_enum"]
          id: string
          job_role_id: number | null
          last_name: string
          updated_at: string
          user_role_id: number
          username: string
        }
        Insert: {
          client_admin_id?: string | null
          created_at?: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_enum"]
          id?: string
          job_role_id?: number | null
          last_name: string
          updated_at?: string
          user_role_id: number
          username: string
        }
        Update: {
          client_admin_id?: string | null
          created_at?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_enum"]
          id?: string
          job_role_id?: number | null
          last_name?: string
          updated_at?: string
          user_role_id?: number
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_client_admin_id_fkey"
            columns: ["client_admin_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_user_role_id_fkey"
            columns: ["user_role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_final_work_base_time: {
        Args: {
          p_project_id: string
          p_priority_level_id: number
          p_created_at: string
        }
        Returns: string
      }
      calculate_schedule_for_existing_task: {
        Args: { p_input_project_id: string }
        Returns: undefined
      }
      calculate_schedule_for_new_task: {
        Args: {
          p_project_id: string
          p_priority_level_id: number
          p_task_type_id: number
          p_complexity_level_id: number
          p_created_at: string
        }
        Returns: Record<string, unknown>
      }
      calculate_working_hours: {
        Args: { start_time: string; end_time: string }
        Returns: unknown
      }
      calculate_working_timestamp: {
        Args: { start_time: string; work_hours: unknown }
        Returns: string
      }
      find_next_available_working_timestamp: {
        Args: { input_ts: string }
        Returns: string
      }
      find_next_working_day: {
        Args: {
          input_date: string
          working_days: string[]
          holidays: string[]
          start_time: string
        }
        Returns: string
      }
      generate_billing_number: {
        Args: {
          billing_type_param: Database["public"]["Enums"]["billing_type"]
        }
        Returns: string
      }
      get_next_billing_number: {
        Args: {
          billing_type_param: Database["public"]["Enums"]["billing_type"]
        }
        Returns: string
      }
      get_task_schedule: {
        Args: {
          p_project_id: string
          p_priority_level_id: number
          p_task_type_id: number
          p_complexity_level_id: number
        }
        Returns: {
          est_start: string
          est_end: string
          initial_status_id: number
          calculated_est_duration: unknown
        }[]
      }
    }
    Enums: {
      access_type: "public" | "private"
      attachment_type: "image" | "document" | "other"
      billing_cycle: "monthly" | "quarterly" | "yearly" | "half yearly"
      billing_payment_status: "unpaid" | "paid" | "partially_paid"
      billing_type: "estimate" | "invoice" | "credit_note" | "debit_note"
      device_type: "mobile" | "desktop" | "both"
      doc_status: "draft" | "final" | "sent" | "cancelled"
      doc_type: "proposal" | "contract" | "nda"
      gender_enum: "male" | "female" | "other"
      input_status: "requested" | "submitted" | "approved" | "re-requested"
      layout_type: "RETAINER" | "REGULAR" | "FUSION"
      payment_status: "paid" | "pending" | "overdue" | "cancelled"
      subscription_status: "active" | "inactive"
      task_categories:
        | "design"
        | "development"
        | "seo"
        | "marketing"
        | "general"
      task_status_type: "scheduled" | "active" | "completed" | "specialcase"
      transaction_status:
        | "pending"
        | "success"
        | "failed"
        | "reversed"
        | "cancelled"
      transaction_type: "receipt" | "refund" | "adjustment"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_type: ["public", "private"],
      attachment_type: ["image", "document", "other"],
      billing_cycle: ["monthly", "quarterly", "yearly", "half yearly"],
      billing_payment_status: ["unpaid", "paid", "partially_paid"],
      billing_type: ["estimate", "invoice", "credit_note", "debit_note"],
      device_type: ["mobile", "desktop", "both"],
      doc_status: ["draft", "final", "sent", "cancelled"],
      doc_type: ["proposal", "contract", "nda"],
      gender_enum: ["male", "female", "other"],
      input_status: ["requested", "submitted", "approved", "re-requested"],
      layout_type: ["RETAINER", "REGULAR", "FUSION"],
      payment_status: ["paid", "pending", "overdue", "cancelled"],
      subscription_status: ["active", "inactive"],
      task_categories: ["design", "development", "seo", "marketing", "general"],
      task_status_type: ["scheduled", "active", "completed", "specialcase"],
      transaction_status: [
        "pending",
        "success",
        "failed",
        "reversed",
        "cancelled",
      ],
      transaction_type: ["receipt", "refund", "adjustment"],
    },
  },
} as const
