
import { Database } from "@/integrations/supabase/types";

export type BillingRow = Database["public"]["Tables"]["billing"]["Row"];
export type BillingInsert = Database["public"]["Tables"]["billing"]["Insert"];
export type BillingUpdate = Database["public"]["Tables"]["billing"]["Update"];

export type BillingType = "estimate" | "invoice" | "credit_note" | "debit_note";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  sac_code: string;
}

export interface GSTDetails {
  cgst: number;
  sgst: number;
  igst: number;
  total_gst: number;
  taxable_amount: number;
  total_amount: number;
  [key: string]: number; // Add index signature for JSON compatibility
}

export interface ClientDetails {
  id: string;
  business_name: string;
  address: string;
  gstin: string;
  state: string;
}

export interface AgencyGSTDetails {
  gstin: string;
  state: string;
  pan: string;
  state_code: string;
  [key: string]: string; // Add index signature for JSON compatibility
}

export interface TDSRate {
  label: string;
  value: number;
}

export interface BillingFormData {
  billing_type: BillingType;
  client_id: string;
  place_of_supply: string;
  tds_rate: number;
  items: LineItem[];
  notes?: string;
  due_date?: Date;
  billing_number?: string;
}
