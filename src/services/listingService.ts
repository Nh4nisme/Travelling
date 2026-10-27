import { LISTINGS } from '@/data/listings';
import type { Listing } from '@/types/listing';

/**
 * Điểm mở rộng để nối backend sau này (REST/GraphQL/Supabase...).
 * Hiện đọc từ mock data; chỉ cần thay thân hàm, giữ nguyên chữ ký.
 */
export const listingService = {
  getAll: (): Listing[] => LISTINGS,
  getById: (id: string): Listing => LISTINGS.find((l) => l.id === id)!,
};
