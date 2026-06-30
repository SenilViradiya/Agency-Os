import { create } from 'zustand';
import dayjs, { Dayjs } from 'dayjs';

interface AnalyticsStore {
  dateRange: [Dayjs, Dayjs];
  setDateRange: (range: [Dayjs, Dayjs]) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  dateRange: [dayjs().subtract(30, 'day'), dayjs()],
  setDateRange: (range) => set({ dateRange: range }),
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
