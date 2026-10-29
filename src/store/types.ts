export type SearchState = { location: string; query: string; start?: Date; end?: Date; adults: number; children: number };

export type FilterState = { min: number; max: number; types: string[]; facilities: string[]; total: boolean };

export type User = { id: string; name: string; email: string; phone?: string };

// ---------- Booking (dữ liệu lấy từ server, ngày luôn là chuỗi 'YYYY-MM-DD') ----------
export type PaymentMethod = 'full' | 'part';
export type PaymentStatus = 'paid' | 'partial' | 'refunded' | 'partially_refunded' | 'no_refund';
export type BookingStage = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type PriceBreakdown = {
  nightly: number; nights: number; subtotal: number;
  fees: { label: string; amount: number }[]; feesTotal: number; total: number;
};

export type Booking = {
  id: string; ref: string;
  status: 'confirmed' | 'cancelled';
  stage: BookingStage;
  listing: { id: string; title: string; city: string; country: string; image: string; price: number; checkInTime: string; checkOutTime: string };
  checkIn: string; checkOut: string; nights: number;
  adults: number; children: number; guests: number;
  price: PriceBreakdown;
  payment: {
    method: PaymentMethod; status: PaymentStatus;
    amountPaid: number; balanceDue: number; refundAmount: number;
    provider: string; paidAt: string | null; balancePaidAt: string | null;
  };
  cancellation: { allowed: boolean; refundPercent: number; refundAmount: number; reason?: string };
  createdAt: string | null; cancelledAt: string | null;
};

export type StayInput = { listingId: string; checkIn: string; checkOut: string; adults: number; children: number };

export type Quote = {
  listingId: string; checkIn: string; checkOut: string; nights: number;
  adults: number; children: number; guests: number;
  price: PriceBreakdown;
  options: Record<PaymentMethod, { payNow: number; balanceDue: number }>;
};
