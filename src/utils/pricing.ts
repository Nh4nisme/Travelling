export const FEES = { kayak: 5, parking: 5 } as const;

export function calcPrice(pricePerNight: number, nights: number) {
  const subtotal = pricePerNight * nights;
  const fees = FEES.kayak + FEES.parking;
  return { subtotal, fees, total: subtotal + fees };
}
