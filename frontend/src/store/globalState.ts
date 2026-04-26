import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GlobalState {
  apiKey: string | null;
  userId: string | null;
  setApiKey: (key: string, userId: string) => void;
  clear: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      apiKey: null,
      userId: null,
      setApiKey: (apiKey, userId) => set({ apiKey, userId }),
      clear: () => set({ apiKey: null, userId: null }),
    }),
    { name: "life-tracker-global" }
  )
);
