export const FEES = { kayak: 5, parking: 5 } as const;

/** Giới hạn đặt phòng (phải khớp với server: server/src/services/bookingRules.js) */
export const MAX_NIGHTS = 30;
export const MAX_ADVANCE_DAYS = 365;

/** Ước tính nhanh ở màn chọn ngày. Giá chính thức do server báo ở màn xác nhận. */
export function calcPrice(pricePerNight: number, nights: number) {
  const subtotal = pricePerNight * nights;
  const fees = FEES.kayak + FEES.parking;
  return { subtotal, fees, total: subtotal + fees };
}

export const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
