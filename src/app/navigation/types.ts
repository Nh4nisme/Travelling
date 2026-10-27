export type RootStackParamList = {
  Splash: undefined; Auth: undefined; Main: { screen?: keyof MainTabParamList } | undefined;
  SearchModal: undefined; Results: undefined; Filters: undefined;
  Detail: { id: string }; Facilities: { id: string }; Reviews: { id: string }; Description: { id?: string } | undefined;
  Confirm: { id: string }; Success: { id: string; total: number; method: 'full' | 'part' };
};
export type MainTabParamList = { Search: undefined; Favorites: undefined; Bookings: undefined; Inbox: undefined; Profile: undefined };
