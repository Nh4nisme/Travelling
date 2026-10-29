import { api, ApiError } from './api';
import { tokenStorage } from './tokenStorage';
import type { Booking, PaymentMethod, Quote, StayInput } from '@/store/types';

type Opts = { method?: 'GET' | 'POST'; body?: unknown };

/** Gọi API cần đăng nhập: tự gắn token đã lưu. */
async function authed<T>(path: string, opts: Opts = {}): Promise<T> {
  const token = await tokenStorage.get();
  if (!token) throw new ApiError('Please sign in to continue.', 401);
  return api<T>(path, { ...opts, token });
}

export const bookingService = {
  /** Các đêm đã có người đặt của một chỗ ở (không cần đăng nhập). */
  availability: (listingId: string) =>
    api<{ bookedNights: string[] }>(`/listings/${encodeURIComponent(listingId)}/availability`),

  /** Báo giá + kiểm tra ngày còn trống. Giá do SERVER tính, app chỉ hiển thị. */
  quote: (stay: StayInput) => authed<{ quote: Quote }>('/bookings/quote', { method: 'POST', body: stay }),

  create: (stay: StayInput & { paymentMethod: PaymentMethod; idempotencyKey: string }) =>
    authed<{ booking: Booking }>('/bookings', { method: 'POST', body: stay }),

  list: () => authed<{ bookings: Booking[] }>('/bookings'),
  get: (id: string) => authed<{ booking: Booking }>(`/bookings/${encodeURIComponent(id)}`),
  cancel: (id: string) => authed<{ booking: Booking }>(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' }),
  payBalance: (id: string) => authed<{ booking: Booking }>(`/bookings/${encodeURIComponent(id)}/pay-balance`, { method: 'POST' }),
};

/** Khoá chống bấm đúp: cùng khoá => server chỉ tạo 1 booking. */
export const makeIdempotencyKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
