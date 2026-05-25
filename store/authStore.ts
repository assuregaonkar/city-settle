import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface ProfileSnap {
  onboarded_at: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  profile: ProfileSnap | null;
  profileLoaded: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (initialized: boolean) => void;
  setProfile: (profile: ProfileSnap | null) => void;
  setProfileLoaded: (loaded: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  profile: null,
  profileLoaded: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setInitialized: (initialized) => set({ initialized }),
  setProfile: (profile) => set({ profile }),
  setProfileLoaded: (profileLoaded) => set({ profileLoaded }),
  clear: () =>
    set({ session: null, user: null, initialized: false, profile: null, profileLoaded: false }),
}));
