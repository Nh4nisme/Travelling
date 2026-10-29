import { addDays, toISO } from './date';
import { MAX_ADVANCE_DAYS, MAX_NIGHTS } from './pricing';

/**
 * Luật khoá ngày trên lịch đặt phòng. `sortedBooked` là các ĐÊM đã có người đặt ('YYYY-MM-DD', đã sắp xếp).
 * Đêm = từ ngày nhận phòng tới trước ngày trả phòng, nên có thể nhận phòng đúng ngày khách trước trả phòng.
 *  - Đang chọn ngày nhận phòng: khoá các đêm đã đặt.
 *  - Đang chọn ngày trả phòng (đã có ngày nhận): chọn được tới đúng ngày của đêm đã đặt kế tiếp, không vượt qua nó,
 *    và tối đa MAX_NIGHTS đêm.
 *  - Không đặt xa quá MAX_ADVANCE_DAYS ngày.
 */
export function isDateBlocked(date: Date, start: Date | undefined, end: Date | undefined, sortedBooked: string[], today: Date): boolean {
  const key = toISO(date);
  if (date > addDays(today, MAX_ADVANCE_DAYS)) return true;
  if (start && !end && date > start) {
    if (date > addDays(start, MAX_NIGHTS)) return true;
    const startKey = toISO(start);
    const next = sortedBooked.find((n) => n >= startKey);
    return next !== undefined && key > next;
  }
  return sortedBooked.includes(key);
}

/** Khoảng [start, end) có đè lên đêm đã đặt nào không. */
export function rangeHitsBooked(start: Date, end: Date, sortedBooked: string[]): boolean {
  const a = toISO(start), b = toISO(end);
  return sortedBooked.some((n) => n >= a && n < b);
}
