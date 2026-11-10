import { api } from '@/services/api';
import type { Listing } from '@/types/listing';
import type { FilterState, SearchState } from '@/store/types';

function queryString(params: Record<string, string | number>) {
  return Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
}

export const listingService = {
  getAll: (): Promise<Listing[]> => api('/listings'),
  getById: (id: string): Promise<Listing> => api(`/listings/${encodeURIComponent(id)}`),
  search: (search: SearchState, filters: FilterState): Promise<Listing[]> => {
    const params: Record<string, string | number> = {
      q: search.query.trim(),
      region: search.location,
      minPrice: filters.min,
      maxPrice: filters.max,
    };
    if (filters.types.length) params.types = filters.types.join(',');
    if (filters.facilities.length) params.facilities = filters.facilities.join(',');
    // BR06: Truyền presentTotal và số đêm để server lọc theo tổng giá
    params.presentTotal = String(filters.total);
    if (filters.total && search.start && search.end) {
      const diff = new Date(search.end).getTime() - new Date(search.start).getTime();
      const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      params.nights = nights;
    }
    return api(`/listings/search?${queryString(params)}`);
  },
};
