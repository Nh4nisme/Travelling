import type { Booking, BookingStage } from '@/store/types';
import { fmtISO, fmtDateTime } from '@/utils/date';
import { money } from '@/utils/pricing';

export type BookingTab = 'upcoming' | 'past' | 'cancelled';

export const tabOf = (b: Booking): BookingTab =>
  b.stage === 'cancelled' ? 'cancelled' : b.stage === 'completed' ? 'past' : 'upcoming';

export const STAGE_LABEL: Record<BookingStage, string> = {
  upcoming: 'Upcoming', ongoing: 'Staying now', completed: 'Completed', cancelled: 'Cancelled',
};
export const STAGE_COLOR: Record<BookingStage, { fg: string; bg: string }> = {
  upcoming: { fg: '#0A7F8F', bg: '#DDF7FA' },
  ongoing: { fg: '#1B7F43', bg: '#DDF6E6' },
  completed: { fg: '#5B6170', bg: '#EEF0F3' },
  cancelled: { fg: '#B3323D', bg: '#FDE7E9' },
};

export function paymentSummary(b: Booking): { label: string; color: string } {
  switch (b.payment.status) {
    case 'paid': return { label: 'Paid in full', color: '#22A559' };
    case 'partial': return { label: `Deposit paid · ${money(b.payment.balanceDue)} due at check-in`, color: '#C27A00' };
    case 'refunded': return { label: 'Refunded', color: '#5B6170' };
    case 'partially_refunded': return { label: 'Partially refunded', color: '#5B6170' };
    default: return { label: 'No refund', color: '#5B6170' };
  }
}

export const methodLabel = (b: Booking) => (b.payment.method === 'full' ? 'Pay in full' : 'Deposit (pay the rest later)');

/** Sắp xếp theo từng tab: sắp tới -> gần nhất trước; đã qua / đã huỷ -> mới nhất trước. */
export function sortForTab(list: Booking[], tab: BookingTab): Booking[] {
  const copy = [...list];
  if (tab === 'upcoming') return copy.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  if (tab === 'past') return copy.sort((a, b) => b.checkOut.localeCompare(a.checkOut));
  return copy.sort((a, b) => (b.cancelledAt ?? '').localeCompare(a.cancelledAt ?? ''));
}

export function receiptText(b: Booking): string {
  const lines = [
    'Travelling - booking receipt',
    `Ref: ${b.ref}`,
    `Place: ${b.listing.title}, ${b.listing.city}, ${b.listing.country}`,
    `Check-in: ${fmtISO(b.checkIn)} (from ${b.listing.checkInTime})`,
    `Check-out: ${fmtISO(b.checkOut)} (until ${b.listing.checkOutTime})`,
    `Guests: ${b.guests} · ${b.nights} night${b.nights > 1 ? 's' : ''}`,
    `${money(b.price.nightly)} x ${b.nights} night${b.nights > 1 ? 's' : ''}: ${money(b.price.subtotal)}`,
    ...b.price.fees.map((f) => `${f.label}: ${money(f.amount)}`),
    `Total: ${money(b.price.total)}`,
    `Paid: ${money(b.payment.amountPaid)}${b.payment.balanceDue > 0 ? ` (remaining ${money(b.payment.balanceDue)} due at check-in)` : ''}`,
    `Booked on: ${fmtDateTime(b.createdAt)}`,
    'Demo payment - no real charge was made.',
  ];
  return lines.join('\n');
}
