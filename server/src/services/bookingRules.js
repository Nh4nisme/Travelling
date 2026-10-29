/**
 * Luật nghiệp vụ của booking (hàm thuần, không đụng DB) để dễ kiểm thử.
 * Ngày đặt phòng luôn là "ngày thuần" dạng YYYY-MM-DD, lưu ở 00:00 UTC => không bị lệch múi giờ.
 * "Đêm" (night) = ngày nhận phòng tới trước ngày trả phòng. Ví dụ 10/11 -> 12/11 gồm 2 đêm: 10 và 11.
 * Vì vậy khách A trả phòng ngày 12 và khách B nhận phòng ngày 12 là hợp lệ.
 */
const crypto = require('crypto');

const DAY_MS = 86_400_000;
const MAX_NIGHTS = 30;
const MAX_ADVANCE_DAYS = 365;
const DEPOSIT_RATE = 0.5;
const PAYMENT_METHODS = ['full', 'part'];
const FEES = [
  { key: 'kayak', label: 'Kayak fee', amount: 5 },
  { key: 'parking', label: 'Street parking fee', amount: 5 },
];
// Chính sách huỷ: >= 7 ngày trước nhận phòng hoàn 100%, 2-6 ngày hoàn 50%, 1 ngày không hoàn,
// từ ngày nhận phòng trở đi không thể huỷ.
const REFUND_TIERS = [
  { minDays: 7, percent: 100 },
  { minDays: 2, percent: 50 },
  { minDays: 1, percent: 0 },
];
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function httpError(status, message, code = 'ERROR') {
  return Object.assign(new Error(message), { status, code });
}

/** Múi giờ dùng để xác định "hôm nay" (mặc định UTC+7). Đổi bằng BOOKING_UTC_OFFSET_MINUTES trong .env */
function utcOffsetMinutes() {
  const raw = process.env.BOOKING_UTC_OFFSET_MINUTES;
  const n = raw === undefined || raw === '' ? 420 : Number(raw);
  return Number.isFinite(n) ? n : 420;
}

function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

const toDateOnly = (date) => date.toISOString().slice(0, 10);
const addDays = (date, n) => new Date(date.getTime() + n * DAY_MS);
const diffDays = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY_MS);

function todayUTC(now = Date.now(), offsetMin = utcOffsetMinutes()) {
  const local = new Date(now + offsetMin * 60_000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

function eachNight(checkIn, nights) {
  return Array.from({ length: nights }, (_, i) => addDays(checkIn, i));
}

function toInt(value) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

/** Kiểm tra dữ liệu đặt phòng. Ném lỗi 400 nếu sai, trả về dữ liệu đã chuẩn hoá nếu đúng. */
function parseStay(input, listing, today) {
  const body = input || {};
  const checkIn = parseDateOnly(body.checkIn);
  const checkOut = parseDateOnly(body.checkOut);
  if (!checkIn || !checkOut) throw httpError(400, 'Check-in and check-out dates are required (YYYY-MM-DD).', 'VALIDATION');
  if (checkIn < today) throw httpError(400, 'Check-in date cannot be in the past.', 'VALIDATION');
  if (checkOut <= checkIn) throw httpError(400, 'Check-out must be after check-in.', 'VALIDATION');
  const nights = diffDays(checkIn, checkOut);
  if (nights > MAX_NIGHTS) throw httpError(400, `You can book at most ${MAX_NIGHTS} nights at a time.`, 'VALIDATION');
  if (diffDays(today, checkIn) > MAX_ADVANCE_DAYS) throw httpError(400, `Bookings open up to ${MAX_ADVANCE_DAYS} days in advance.`, 'VALIDATION');

  const adults = toInt(body.adults);
  const children = body.children === undefined || body.children === null ? 0 : toInt(body.children);
  if (adults === null || adults < 1) throw httpError(400, 'At least 1 adult is required.', 'VALIDATION');
  if (children === null) throw httpError(400, 'Number of children is invalid.', 'VALIDATION');
  if (adults + children > listing.maxGuests) {
    throw httpError(400, `This place accepts up to ${listing.maxGuests} guests.`, 'VALIDATION');
  }
  return { checkIn, checkOut, nights, adults, children };
}

function priceStay(pricePerNight, nights) {
  const subtotal = Math.round(pricePerNight * nights * 100) / 100;
  const fees = FEES.map(({ label, amount }) => ({ label, amount }));
  const feesTotal = fees.reduce((sum, f) => sum + f.amount, 0);
  return { nightly: pricePerNight, nights, subtotal, fees, feesTotal, total: Math.round((subtotal + feesTotal) * 100) / 100 };
}

function paymentOptions(total) {
  const deposit = Math.round(total * DEPOSIT_RATE);
  return {
    full: { payNow: total, balanceDue: 0 },
    part: { payNow: deposit, balanceDue: Math.round((total - deposit) * 100) / 100 },
  };
}

/**
 * Ghi nhận thanh toán. LƯU Ý: chưa nối cổng thanh toán thật (Stripe/VNPay...), provider = 'simulated'.
 * Khi tích hợp cổng thật, thay phần này bằng việc tạo/giữ giao dịch rồi mới tạo booking.
 */
function paymentFor(method, total) {
  if (!PAYMENT_METHODS.includes(method)) throw httpError(400, 'Choose a payment option.', 'VALIDATION');
  const opt = paymentOptions(total)[method];
  return {
    method,
    status: method === 'full' ? 'paid' : 'partial',
    amountPaid: opt.payNow,
    balanceDue: opt.balanceDue,
    refundAmount: 0,
    provider: 'simulated',
    paidAt: new Date(),
  };
}

function stageOf(status, checkIn, checkOut, today) {
  if (status === 'cancelled') return 'cancelled';
  if (today < checkIn) return 'upcoming';
  if (today < checkOut) return 'ongoing';
  return 'completed';
}

function cancellationInfo({ status, checkIn, amountPaid }, today) {
  if (status !== 'confirmed') {
    return { allowed: false, refundPercent: 0, refundAmount: 0, reason: 'This booking is already cancelled.' };
  }
  const days = diffDays(today, checkIn);
  const tier = REFUND_TIERS.find((t) => days >= t.minDays);
  if (!tier) {
    return { allowed: false, refundPercent: 0, refundAmount: 0, reason: 'Bookings cannot be cancelled on or after the check-in date.' };
  }
  return { allowed: true, refundPercent: tier.percent, refundAmount: Math.round((amountPaid * tier.percent) / 100) };
}

function generateRef() {
  let out = '';
  for (let i = 0; i < 8; i += 1) out += REF_ALPHABET[crypto.randomInt(REF_ALPHABET.length)];
  return `TRV-${out}`;
}

/** Khoá chống bấm đúp: chữ/số/gạch, 8-64 ký tự. Không hợp lệ thì coi như không có. */
function normalizeKey(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(value) ? value : null;
}

const isDuplicateKey = (err) =>
  err?.code === 11000 || /E11000/.test(String(err?.message)) ||
  (Array.isArray(err?.writeErrors) && err.writeErrors.some((e) => (e?.code ?? e?.err?.code) === 11000));

module.exports = {
  DAY_MS, MAX_NIGHTS, MAX_ADVANCE_DAYS, PAYMENT_METHODS, FEES, REFUND_TIERS,
  httpError, parseDateOnly, toDateOnly, addDays, diffDays, todayUTC, eachNight,
  parseStay, priceStay, paymentOptions, paymentFor, stageOf, cancellationInfo,
  generateRef, normalizeKey, isDuplicateKey,
};
