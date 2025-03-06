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
      activity_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          updated_at: string
          updated_fields: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          updated_at?: string
          updated_fields?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          updated_at?: string
          updated_fields?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_details: {
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
      client_admins: {
        Row: {
          business_name: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          primary_color_hex: string | null
          secondary_color_hex: string | null
          updated_at: string
        }
        Insert: {
          business_name: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          primary_color_hex?: string | null
          secondary_color_hex?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
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
          project_id: string | null
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
          project_id?: string | null
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
          project_id?: string | null
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
          color: string | null
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          multiplier: number | null
          name: string
          time_to_start: unknown | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          multiplier?: number | null
          name: string
          time_to_start?: unknown | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          multiplier?: number | null
          name?: string
          time_to_start?: unknown | null
          updated_at?: string
        }
        Relationships: []
      }
      project_assignees: {
        Row: {
          created_at: string
          id: number
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          project_id?: string | null
          user_id?: string | null
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
          encrypted: boolean
          id: number
          password: string | null
          project_id: string | null
          type: string
          updated_at: string
          url: string
          username: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          encrypted?: boolean
          id?: number
          password?: string | null
          project_id?: string | null
          type: string
          updated_at?: string
          url: string
          username?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          encrypted?: boolean
          id?: number
          password?: string | null
          project_id?: string | null
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
      project_layouts: {
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
      project_phases: {
        Row: {
          actual_time: unknown | null
          created_at: string
          description: string | null
          estimated_time: unknown | null
          id: number
          is_milestone: boolean | null
          name: string
          phase_order: number
          progress: number | null
          project_id: string
          status_id: number | null
          tasks: Json | null
          updated_at: string
        }
        Insert: {
          actual_time?: unknown | null
          created_at?: string
          description?: string | null
          estimated_time?: unknown | null
          id?: number
          is_milestone?: boolean | null
          name: string
          phase_order: number
          progress?: number | null
          project_id: string
          status_id?: number | null
          tasks?: Json | null
          updated_at?: string
        }
        Update: {
          actual_time?: unknown | null
          created_at?: string
          description?: string | null
          estimated_time?: unknown | null
          id?: number
          is_milestone?: boolean | null
          name?: string
          phase_order?: number
          progress?: number | null
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
          auto_renew: boolean
          billing_cycle: Database["public"]["Enums"]["billing_cycle_enum"]
          created_at: string
          hours_allotted: number
          id: string
          max_concurrent_tasks: number
          next_renewal_date: string
          project_id: string
          start_date: string
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          billing_cycle?: Database["public"]["Enums"]["billing_cycle_enum"]
          created_at?: string
          hours_allotted?: number
          id?: string
          max_concurrent_tasks?: number
          next_renewal_date: string
          project_id: string
          start_date?: string
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          billing_cycle?: Database["public"]["Enums"]["billing_cycle_enum"]
          created_at?: string
          hours_allotted?: number
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
          layout_id: number | null
          logo_url: string | null
          max_concurrent_tasks: number
          name: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          primary_color_hex: string | null
          progress: number | null
          secondary_color_hex: string | null
          status_id: number | null
          status_options: Json
          task_fields: Json
          task_type_options: Json | null
          types: Json | null
          updated_at: string
          uses_phases: boolean
        }
        Insert: {
          client_admin_id?: string | null
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          layout_id?: number | null
          logo_url?: string | null
          max_concurrent_tasks?: number
          name: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          primary_color_hex?: string | null
          progress?: number | null
          secondary_color_hex?: string | null
          status_id?: number | null
          status_options?: Json
          task_fields?: Json
          task_type_options?: Json | null
          types?: Json | null
          updated_at?: string
          uses_phases?: boolean
        }
        Update: {
          client_admin_id?: string | null
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          layout_id?: number | null
          logo_url?: string | null
          max_concurrent_tasks?: number
          name?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          primary_color_hex?: string | null
          progress?: number | null
          secondary_color_hex?: string | null
          status_id?: number | null
          status_options?: Json
          task_fields?: Json
          task_type_options?: Json | null
          types?: Json | null
          updated_at?: string
          uses_phases?: boolean
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
            foreignKeyName: "projects_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "project_layouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage: {
        Row: {
          created_at: string
          hours_allotted: number
          hours_spent: number
          id: string
          metadata: Json | null
          month_year: string
          notes: string | null
          project_id: string
          status: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours_allotted: number
          hours_spent: number
          id?: string
          metadata?: Json | null
          month_year: string
          notes?: string | null
          project_id: string
          status?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours_allotted?: number
          hours_spent?: number
          id?: string
          metadata?: Json | null
          month_year?: string
          notes?: string | null
          project_id?: string
          status?: string | null
          subscription_id?: string
          updated_at?: string
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
      subtasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          name: string
          parent_task_id: string | null
          status_id: number | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          parent_task_id?: string | null
          status_id?: number | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_task_id?: string | null
          status_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "task_timelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comment_views: {
        Row: {
          created_at: string
          id: number
          last_viewed_at: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          last_viewed_at?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          last_viewed_at?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comment_views_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_timelines"
            referencedColumns: ["id"]
          },
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
          task_id: string | null
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
          task_id?: string | null
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
          task_id?: string | null
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
            referencedRelation: "task_timelines"
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
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_types: {
        Row: {
          base_duration: unknown | null
          category: Database["public"]["Enums"]["task_categories"]
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          base_duration?: unknown | null
          category: Database["public"]["Enums"]["task_categories"]
          created_at?: string
          description?: string | null
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          base_duration?: unknown | null
          category?: Database["public"]["Enums"]["task_categories"]
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours_spent: number | null
          actual_start_time: string | null
          assigned_user_id: string | null
          complexity_level_id: number | null
          created_at: string
          created_by: string
          current_status_id: number
          dependent_task_id: string | null
          details: string
          eta: string | null
          hours_needed: number | null
          hours_spent: number | null
          id: string
          images: Json | null
          last_status_id: number | null
          priority_level_id: number
          project_id: string
          queue_position: number | null
          reference_links: Json | null
          start_time: string | null
          target_device: Database["public"]["Enums"]["device_type"]
          task_code: string | null
          task_completed_at: string | null
          task_type_id: number
          updated_at: string
        }
        Insert: {
          actual_hours_spent?: number | null
          actual_start_time?: string | null
          assigned_user_id?: string | null
          complexity_level_id?: number | null
          created_at?: string
          created_by: string
          current_status_id?: number
          dependent_task_id?: string | null
          details: string
          eta?: string | null
          hours_needed?: number | null
          hours_spent?: number | null
          id?: string
          images?: Json | null
          last_status_id?: number | null
          priority_level_id?: number
          project_id: string
          queue_position?: number | null
          reference_links?: Json | null
          start_time?: string | null
          target_device?: Database["public"]["Enums"]["device_type"]
          task_code?: string | null
          task_completed_at?: string | null
          task_type_id: number
          updated_at?: string
        }
        Update: {
          actual_hours_spent?: number | null
          actual_start_time?: string | null
          assigned_user_id?: string | null
          complexity_level_id?: number | null
          created_at?: string
          created_by?: string
          current_status_id?: number
          dependent_task_id?: string | null
          details?: string
          eta?: string | null
          hours_needed?: number | null
          hours_spent?: number | null
          id?: string
          images?: Json | null
          last_status_id?: number | null
          priority_level_id?: number
          project_id?: string
          queue_position?: number | null
          reference_links?: Json | null
          start_time?: string | null
          target_device?: Database["public"]["Enums"]["device_type"]
          task_code?: string | null
          task_completed_at?: string | null
          task_type_id?: number
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
            foreignKeyName: "tasks_dependent_task_id_fkey"
            columns: ["dependent_task_id"]
            isOneToOne: false
            referencedRelation: "task_timelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_dependent_task_id_fkey"
            columns: ["dependent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      task_timelines: {
        Row: {
          actual_hours_spent: number | null
          actual_start_time: string | null
          assigned_user_id: string | null
          calculated_eta: string | null
          calculated_start_time: string | null
          channel_id: number | null
          channel_load: number | null
          complexity_level_id: number | null
          created_at: string | null
          created_by: string | null
          current_status_id: number | null
          dependent_task_id: string | null
          details: string | null
          eta: string | null
          hours_needed: number | null
          hours_spent: number | null
          id: string | null
          images: Json | null
          last_status_id: number | null
          position_in_channel: number | null
          priority_level_id: number | null
          project_id: string | null
          reference_links: Json | null
          start_time: string | null
          target_device: Database["public"]["Enums"]["device_type"] | null
          task_completed_at: string | null
          task_type_id: number | null
          timeline_status: string | null
          total_tasks_in_project: number | null
          updated_at: string | null
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
            foreignKeyName: "tasks_dependent_task_id_fkey"
            columns: ["dependent_task_id"]
            isOneToOne: false
            referencedRelation: "task_timelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_dependent_task_id_fkey"
            columns: ["dependent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      usage_view: {
        Row: {
          hours_allotted: number | null
          hours_spent: number | null
          month_year: string | null
          project_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_correct_queue_position: {
        Args: {
          p_project_id: string
          p_priority_level_id: number
        }
        Returns: number
      }
      calculate_eta: {
        Args: {
          created_at: string
          hours_needed: number
        }
        Returns: string
      }
      calculate_hours_spent: {
        Args: {
          actual_start: string
          task_completed_at: string
          priority_level_id: number
        }
        Returns: number
      }
      calculate_monthly_subscription_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_start_time:
        | {
            Args: {
              created_at: string
              priority_id: number
            }
            Returns: string
          }
        | {
            Args: {
              created_at: string
              priority_id: number
              project_id: string
            }
            Returns: string
          }
      count_active_tasks: {
        Args: {
          project_id: string
        }
        Returns: number
      }
      fix_existing_queues: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      should_queue_task: {
        Args: {
          p_project_id: string
        }
        Returns: boolean
      }
      update_in_progress_tasks: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      validate_queue_integrity: {
        Args: {
          project_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      attachment_type: "image" | "document" | "other"
      billing_cycle_enum: "monthly" | "quarterly" | "yearly" | "half yearly"
      device_type: "Mobile" | "Desktop" | "Both"
      gender_enum: "Male" | "Female" | "Other"
      input_status: "requested" | "submitted" | "approved" | "re-requested"
      payment_status: "paid" | "pending" | "overdue" | "cancelled"
      subscription_status: "active" | "inactive"
      task_categories:
        | "Design"
        | "Development"
        | "SEO"
        | "Marketing"
        | "General"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
