import React, { createContext, useContext, useState } from 'react';
import { defaultSearch, defaultFilters } from '@/store/defaults';
import type { SearchState, FilterState, Booking } from '@/store/types';

type Ctx = {
  loggedIn: boolean; setLoggedIn: (v: boolean) => void;
  favs: string[]; toggleFav: (id: string) => void;
  search: SearchState; setSearch: (s: SearchState) => void;
  filters: FilterState; setFilters: (f: FilterState) => void;
  bookings: Booking[]; addBooking: (b: Booking) => void;
};

const C = createContext<Ctx>(null as any);

export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [favs, setFavs] = useState<string[]>(['1', '3']);
  const [search, setSearch] = useState(defaultSearch);
  const [filters, setFilters] = useState(defaultFilters);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const toggleFav = (id: string) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const addBooking = (b: Booking) => setBookings((x) => [b, ...x]);
  return <C.Provider value={{ loggedIn, setLoggedIn, favs, toggleFav, search, setSearch, filters, setFilters, bookings, addBooking }}>{children}</C.Provider>;
}
