import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* =======================
   Types
======================= */

export interface FormEntry {
  id: string;
  slNo: number;
  dateTime: string;
  name: string;
  phoneNumber: string;
  vendor: string;
  location: string;
  carNumber: string;
  wheels: number;
  cft: number;
  cost: number;
  cash: number;
  upi: number;
  remark: string;
  trip: '1st' | '2nd';
  policeStations?: string[];
}

interface User {
  username: string;
  isAuthenticated: boolean;
}

interface AppState {
  user: User | null;
  entries: FormEntry[];
  theme: 'dark' | 'light';

  login: (username: string) => void;
  logout: () => void;
  addEntry: (entry: Omit<FormEntry, 'id' | 'slNo'>) => void;
  deleteEntry: (id: string) => void;
  toggleTheme: () => void;
  getNextSlNo: (dateTime: string) => number;
}

/* =======================
   Helper (LOCAL DATE SAFE)
======================= */

const getDateKey = (dateTime: string) =>
  new Date(dateTime).toLocaleDateString('en-CA'); // YYYY-MM-DD (local time)

/* =======================
   Store
======================= */

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      entries: [],
      theme: 'dark',

      /* ---------- Auth ---------- */

      login: (username) => {
        set({ user: { username, isAuthenticated: true } });
      },

      logout: () => {
        set({ user: null });
      },

      /* ---------- Entries ---------- */

      addEntry: (entry) => {
        const state = get();
        const dateKey = getDateKey(entry.dateTime);
        const slNo = state.getNextSlNo(entry.dateTime);

        const newEntry: FormEntry = {
          ...entry,
          id: crypto.randomUUID(),
          slNo,
        };

        set({ entries: [...state.entries, newEntry] });
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      /* ---------- Theme ---------- */

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        }));
      },

      /* ---------- Date-wise SL ---------- */

      getNextSlNo: (dateTime: string) => {
        const state = get();
        const dateKey = getDateKey(dateTime);

        const sameDateEntries = state.entries.filter(
          (e) => getDateKey(e.dateTime) === dateKey
        );

        if (sameDateEntries.length === 0) return 1;

        const maxSlNo = Math.max(...sameDateEntries.map((e) => e.slNo));
        return maxSlNo + 1;
      },
    }),
    {
      name: 'transport-app-storage',
    }
  )
);
