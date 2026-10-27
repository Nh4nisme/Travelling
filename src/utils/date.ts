export const fmt = (d?: Date) => (d ? `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}` : '');

export const nightsBetween = (a?: Date, b?: Date) => (a && b ? Math.max(1, Math.round((+b - +a) / 864e5)) : 1);
