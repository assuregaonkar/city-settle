export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          salary_inr: number | null;
          office_lat: number | null;
          office_lng: number | null;
          office_address: string | null;
          office_city: 'bengaluru' | 'mumbai' | null;
          preferences: Json;
          family_status: string | null;
          chosen_neighborhood_id: string | null;
          onboarded_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          salary_inr?: number | null;
          office_lat?: number | null;
          office_lng?: number | null;
          office_address?: string | null;
          office_city?: 'bengaluru' | 'mumbai' | null;
          preferences?: Json;
          family_status?: string | null;
          chosen_neighborhood_id?: string | null;
          onboarded_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          salary_inr?: number | null;
          office_lat?: number | null;
          office_lng?: number | null;
          office_address?: string | null;
          office_city?: 'bengaluru' | 'mumbai' | null;
          preferences?: Json;
          family_status?: string | null;
          chosen_neighborhood_id?: string | null;
          onboarded_at?: string | null;
        };
      };
      neighborhoods: {
        Row: {
          id: string;
          city: string;
          name: string;
          lat: number | null;
          lng: number | null;
          avg_rent_1bhk: number | null;
          avg_rent_2bhk: number | null;
          safety_score: number | null;
          aqi: number | null;
          amenities: Json | null;
          vibe_tags: string[] | null;
        };
        Insert: {
          id?: string;
          city: string;
          name: string;
          lat?: number | null;
          lng?: number | null;
          avg_rent_1bhk?: number | null;
          avg_rent_2bhk?: number | null;
          safety_score?: number | null;
          aqi?: number | null;
          amenities?: Json | null;
          vibe_tags?: string[] | null;
        };
        Update: {
          city?: string;
          name?: string;
          lat?: number | null;
          lng?: number | null;
          avg_rent_1bhk?: number | null;
          avg_rent_2bhk?: number | null;
          safety_score?: number | null;
          aqi?: number | null;
          amenities?: Json | null;
          vibe_tags?: string[] | null;
        };
      };
      recommendations: {
        Row: {
          id: string;
          user_id: string;
          neighborhood_id: string;
          score: number | null;
          affordability_score: number | null;
          commute_score: number | null;
          safety_score: number | null;
          aqi_score: number | null;
          vibe_score: number | null;
          commute_minutes: number | null;
          rationale: string | null;
          generated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          neighborhood_id: string;
          score?: number | null;
          affordability_score?: number | null;
          commute_score?: number | null;
          safety_score?: number | null;
          aqi_score?: number | null;
          vibe_score?: number | null;
          commute_minutes?: number | null;
          rationale?: string | null;
          generated_at?: string;
        };
        Update: {
          score?: number | null;
          affordability_score?: number | null;
          commute_score?: number | null;
          safety_score?: number | null;
          aqi_score?: number | null;
          vibe_score?: number | null;
          commute_minutes?: number | null;
          rationale?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          user_id: string;
          neighborhood_id: string | null;
          task: string;
          category: string | null;
          why: string | null;
          completed: boolean;
          order_index: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          neighborhood_id?: string | null;
          task: string;
          category?: string | null;
          why?: string | null;
          completed?: boolean;
          order_index?: number | null;
          created_at?: string;
        };
        Update: {
          task?: string;
          category?: string | null;
          why?: string | null;
          completed?: boolean;
          order_index?: number | null;
        };
      };
      commute_cache: {
        Row: {
          id: string;
          origin_lat: number;
          origin_lng: number;
          dest_id: string;
          hour_bucket: number | null;
          duration_seconds: number | null;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          origin_lat: number;
          origin_lng: number;
          dest_id: string;
          hour_bucket?: number | null;
          duration_seconds?: number | null;
          fetched_at?: string;
        };
        Update: {
          duration_seconds?: number | null;
          fetched_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
