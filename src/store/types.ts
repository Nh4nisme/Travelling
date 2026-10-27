export type SearchState = { location: string; query: string; start?: Date; end?: Date; adults: number; children: number };

export type FilterState = { min: number; max: number; types: string[]; facilities: string[]; total: boolean };

export type Booking = { id: string; listingId: string; ref: string; start?: Date; end?: Date; total: number; paidAt: string };
