import { create } from 'zustand';

interface OnboardingState {
  name: string;
  officeCity: 'bengaluru' | 'mumbai' | null;
  officeLat: number | null;
  officeLng: number | null;
  officeAddress: string | null;
  salaryRaw: string;
  vibes: string[];
  familyStatus: string | null;

  setName: (name: string) => void;
  setOfficeCity: (city: 'bengaluru' | 'mumbai') => void;
  setOfficeLocation: (lat: number, lng: number, address: string) => void;
  setSalaryRaw: (salary: string) => void;
  toggleVibe: (vibe: string) => void;
  setFamilyStatus: (status: string) => void;
  reset: () => void;
}

const initial = {
  name: '',
  officeCity: null as 'bengaluru' | 'mumbai' | null,
  officeLat: null as number | null,
  officeLng: null as number | null,
  officeAddress: null as string | null,
  salaryRaw: '',
  vibes: [] as string[],
  familyStatus: null as string | null,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initial,

  setName: (name) => set({ name }),
  setOfficeCity: (officeCity) => set({ officeCity }),
  setOfficeLocation: (officeLat, officeLng, officeAddress) =>
    set({ officeLat, officeLng, officeAddress }),
  setSalaryRaw: (salaryRaw) => set({ salaryRaw }),

  toggleVibe: (vibe) => {
    const { vibes } = get();
    if (vibes.includes(vibe)) {
      set({ vibes: vibes.filter((v) => v !== vibe) });
    } else if (vibes.length < 5) {
      set({ vibes: [...vibes, vibe] });
    }
  },

  setFamilyStatus: (familyStatus) => set({ familyStatus }),
  reset: () => set(initial),
}));
