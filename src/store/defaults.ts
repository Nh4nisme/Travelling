import type { SearchState, FilterState } from '@/store/types';

export const defaultSearch: SearchState = { location: 'Anywhere', query: '', adults: 0, children: 0 };

export const defaultFilters: FilterState = { min: 10, max: 250, types: ['Entire place'], facilities: ['Kitchen', 'Outdoor space', 'Internet access'], total: true };
