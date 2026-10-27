import type { Listing } from '@/types/listing';
import type { FilterState, SearchState } from '@/store/types';

export function filterListings(all: Listing[], s: SearchState, f: FilterState): Listing[] {
  const q = s.query.trim().toLowerCase();
  return all.filter(
    (l) =>
      (s.location === 'Anywhere' || l.region === s.location) &&
      (!q || `${l.city} ${l.country} ${l.title}`.toLowerCase().includes(q)) &&
      l.price >= f.min && l.price <= f.max &&
      (!f.types.length || f.types.includes(l.type)) &&
      f.facilities.every((x) => l.facilities.includes(x)),
  );
}
