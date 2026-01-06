import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  getNextSlNo: (date: string) => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      entries: [],
      theme: 'dark',
      
      login: (username: string) => {
        set({ user: { username, isAuthenticated: true } });
      },
      
      logout: () => {
        set({ user: null });
      },
      
      addEntry: (entry) => {
        const state = get();
        const dateKey = entry.dateTime.split('T')[0];
        const slNo = state.getNextSlNo(dateKey);
        
        const newEntry: FormEntry = {
          ...entry,
          id: crypto.randomUUID(),
          slNo,
        };
        
        set({ entries: [...state.entries, newEntry] });
      },
      
      deleteEntry: (id: string) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },
      
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        }));
      },
      
      getNextSlNo: (date: string) => {
        const state = get();
        const sameDateEntries = state.entries.filter(
          (e) => e.dateTime.split('T')[0] === date
        );
        return sameDateEntries.length + 1;
      },
    }),
    {
      name: 'transport-app-storage',
    }
  )
);
