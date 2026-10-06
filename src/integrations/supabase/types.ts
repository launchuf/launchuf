export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus = "new" | "contacted" | "in_progress" | "review" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

type OrderRow = {
  id: string;
  order_number: string;
  package_code: "start" | "growth" | "premium" | "uf" | "custom";
  source: "web" | "manual";
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  brief: Json;
  needs_quote: boolean;
  domain_option: "none" | "owned" | "setup";
  domain_name: string | null;
  launch_date: string | null;
  logo_path: string | null;
  pay_preference: "now" | "later";
  status: OrderStatus;
  payment_status: PaymentStatus;
  amount_kr: number;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  internal_notes: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  created_at: string;
};

type ClientRow = { id: string; name: string; url: string; description: string; sort_order: number; visible: boolean; created_at: string };

type SettingRow = { key: string; value: string; updated_at: string };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      orders: {
        Row: OrderRow;
        Insert: Partial<OrderRow> &
          Pick<OrderRow, "order_number" | "package_code" | "company_name" | "amount_kr">;
        Update: Partial<OrderRow>;
        Relationships: [];
      };
      contact_messages: {
        Row: MessageRow;
        Insert: Partial<MessageRow> & Pick<MessageRow, "name" | "email" | "message">;
        Update: Partial<MessageRow>;
        Relationships: [];
      };
      client_sites: {
        Row: ClientRow;
        Insert: Partial<ClientRow> & Pick<ClientRow, "name" | "url">;
        Update: Partial<ClientRow>;
        Relationships: [];
      };
      site_settings: {
        Row: SettingRow;
        Insert: Partial<SettingRow> & Pick<SettingRow, "key" | "value">;
        Update: Partial<SettingRow>;
        Relationships: [];
      };
      user_roles: {
        Row: { id: string; user_id: string; role: "admin" | "user"; created_at: string };
        Insert: { id?: string; user_id: string; role: "admin" | "user"; created_at?: string };
        Update: { id?: string; user_id?: string; role?: "admin" | "user"; created_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      has_role: { Args: { _role: "admin" | "user" }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "user";
      order_status: OrderStatus;
      payment_status: PaymentStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
