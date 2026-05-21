import type { Database } from '../lib/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

export type Recommendation = Database['public']['Tables']['recommendations']['Row'];

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];

export type CommuteCache = Database['public']['Tables']['commute_cache']['Row'];

export type City = 'bengaluru' | 'mumbai';

export type FamilyStatus = 'single' | 'couple' | 'family_with_kids' | 'family_with_parents';

export type VibeTag =
  | 'quiet'
  | 'vibrant'
  | 'green'
  | 'walkable'
  | 'pet_friendly'
  | 'foodie'
  | 'nightlife'
  | 'family_friendly'
  | 'expat_friendly'
  | 'affordable';
