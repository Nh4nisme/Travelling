import type { FaqCategoryId } from '@/features/profile/types';

export type RootStackParamList = {
  Splash: undefined; Auth: undefined; Main: { screen?: keyof MainTabParamList } | undefined;
  SearchModal: undefined; Results: undefined; Filters: undefined;
  Detail: { id: string }; Facilities: { id: string }; Reviews: { id: string }; Description: { id?: string } | undefined;
  Confirm: { id: string }; Success: { id: string; total: number; method: 'full' | 'part' };
  PersonalInfo: undefined; Payments: undefined; Notifications: undefined; HelpCenter: undefined; Settings: undefined;
  Faq: { category?: FaqCategoryId; faqId?: string; query?: string } | undefined; ContactSupport: undefined; ReportProblem: undefined;
};
export type MainTabParamList = { Search: undefined; Favorites: undefined; Bookings: undefined; Inbox: undefined; Profile: undefined };
