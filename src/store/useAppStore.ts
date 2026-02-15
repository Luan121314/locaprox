import { create } from 'zustand';

import { RentalFormDraft } from '../types/domain';

type AppState = {
  dbReady: boolean;
  dataVersion: number;
  rentalFormDraft: RentalFormDraft | null;
  setDbReady: (ready: boolean) => void;
  bumpDataVersion: () => void;
  setRentalFormDraft: (draft: RentalFormDraft) => void;
  clearRentalFormDraft: () => void;
};

export const useAppStore = create<AppState>(set => ({
  dbReady: false,
  dataVersion: 0,
  rentalFormDraft: null,
  setDbReady: ready => set({ dbReady: ready }),
  bumpDataVersion: () => set(state => ({ dataVersion: state.dataVersion + 1 })),
  setRentalFormDraft: draft => set({ rentalFormDraft: draft }),
  clearRentalFormDraft: () => set({ rentalFormDraft: null }),
}));
