
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subscription_usage: {
        Row: {
          id: string
          project_id: string
          subscription_id: string
          billing_period: string
          allocated_duration: unknown
          used_duration: unknown
          status: string
          created_at: string
          updated_at: string
        }
      }
      project_subscriptions: {
        Row: {
          id: string
          project_id: string
          allocated_duration: unknown
          billing_cycle: string
          subscription_status: string
          max_concurrent_tasks: number
          start_date: string
          next_renewal_date: string
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          logged_duration: unknown
          actual_duration: unknown
          completed_at: string | null
        }
      }
    }
    Functions: {
      calculate_monthly_usage: {
        Args: {
          p_project_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_logged_duration: number
        }[]
      }
    }
  }
}
