const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatMoney(
  value: string | number | bigint | null | undefined,
  currency = 'INR',
): string {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'bigint' ? Number(value) / 100 : Number(value);
  const major = typeof value === 'string' && value.includes('.')
    ? parseFloat(value)
    : num >= 10000 && Number.isInteger(num)
      ? num / 100
      : num;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol}${major.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDueShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDayOfMonth(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  const last = day % 10;
  if (last === 1) return `${day}st`;
  if (last === 2) return `${day}nd`;
  if (last === 3) return `${day}rd`;
  return `${day}th`;
}

export function formatCompactMoney(amount: number, currency = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  return `${symbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
