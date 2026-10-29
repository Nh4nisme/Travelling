const pad = (n: number) => String(n).padStart(2, '0');

export const fmt = (d?: Date) => (d ? `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}` : '');

export const nightsBetween = (a?: Date, b?: Date) => (a && b ? Math.max(1, Math.round((+b - +a) / 864e5)) : 1);

/** Date (giờ địa phương) -> 'YYYY-MM-DD'. KHÔNG dùng toISOString(): ở UTC+7 nó lùi về ngày hôm trước. */
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM-DD' -> Date 00:00 giờ địa phương. */
export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** '2026-11-10' -> '10 Nov 2026' */
export const fmtISO = (s: string) => fromISO(s).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtISORange = (a: string, b: string) => `${fmtISO(a)} - ${fmtISO(b)}`;

/** ISO timestamp -> '29 Oct 2026, 14:05' */
export const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
