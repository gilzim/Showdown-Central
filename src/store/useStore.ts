import { create } from "zustand";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  saps_balance: number;
  role: "player" | "host" | "admin";
}

interface AppState {
  userProfile: UserProfile;
  activeTournamentId: string | null;

  setUserProfile: (profile: Partial<UserProfile>) => void;
  setSapsBalance: (balance: number) => void;
  setActiveTournamentId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  userProfile: {
    id: "",
    username: "",
    email: "",
    saps_balance: 500,
    role: "player",
  },
  activeTournamentId: null,

  setUserProfile: (profile) =>
    set((state) => ({
      userProfile: { ...state.userProfile, ...profile },
    })),

  setSapsBalance: (balance) =>
    set((state) => ({
      userProfile: { ...state.userProfile, saps_balance: balance },
    })),

  setActiveTournamentId: (id) => set({ activeTournamentId: id }),
}));
