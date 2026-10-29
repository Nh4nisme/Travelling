import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { defaultSearch, defaultFilters } from '@/store/defaults';
import type { SearchState, FilterState, Booking, User } from '@/store/types';
import { authService } from '@/services/authService';
import { tokenStorage } from '@/services/tokenStorage';
import { listingService } from '@/services/listingService';
import type { Listing } from '@/types/listing';
import { bookingService } from '@/services/bookingService';

type Ctx = {
  user: User | null; loggedIn: boolean; authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (p: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  favs: string[]; toggleFav: (id: string) => void;
  search: SearchState; setSearch: (s: SearchState) => void;
  filters: FilterState; setFilters: (f: FilterState) => void;
  bookings: Booking[]; bookingsLoading: boolean; bookingsError: string | null;
  refreshBookings: () => Promise<void>; upsertBooking: (b: Booking) => void;
  listings: Listing[]; listingsLoading: boolean; listingsError: string | null; refreshListings: () => Promise<void>;
};

const C = createContext<Ctx>(null as any);

export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);
  const [search, setSearch] = useState(defaultSearch);
  const [filters, setFilters] = useState(defaultFilters);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const refreshListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      setListings(await listingService.getAll());
      setListingsError(null);
    } catch (error) {
      setListingsError(error instanceof Error ? error.message : 'Unable to load places.');
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => { void refreshListings(); }, [refreshListings]);

  // Khôi phục phiên đăng nhập khi mở app
  useEffect(() => {
    (async () => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          const { user } = await authService.me(token);
          setUser(user);
        }
      } catch (e: any) {
        // 401 = token hết hạn/sai -> xoá; lỗi mạng thì giữ token để thử lại lần sau
        if (e?.status === 401) await tokenStorage.clear();
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token, user } = await authService.login(email.trim(), password);
    await tokenStorage.set(token);
    setUser(user);
  }, []);

  const signUp = useCallback(async (p: { name: string; email: string; password: string; phone?: string }) => {
    const { token, user } = await authService.register({ ...p, email: p.email.trim(), name: p.name.trim() });
    await tokenStorage.set(token);
    setUser(user);
  }, []);

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);
    const refreshBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const { bookings } = await bookingService.list();
      setBookings(bookings);
      setBookingsError(null);
    } catch (e: any) {
      setBookingsError(e?.message ?? 'Unable to load bookings.');
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void refreshBookings();
    else { setBookings([]); setBookingsError(null); }
  }, [user?.id, refreshBookings]);

  const upsertBooking = useCallback((b: Booking) => {
    setBookings((prev) => (prev.some((x) => x.id === b.id) ? prev.map((x) => (x.id === b.id ? b : x)) : [b, ...prev]));
  }, []);
  const toggleFav = (id: string) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  

  return (
    <C.Provider value={{ user, loggedIn: !!user, authReady, signIn, signUp, signOut, updateUser, favs, toggleFav, search, setSearch, filters, setFilters, bookings, bookingsLoading, bookingsError, refreshBookings, upsertBooking, listings, listingsLoading, listingsError, refreshListings }}>
      {children}
    </C.Provider>
  );
}
