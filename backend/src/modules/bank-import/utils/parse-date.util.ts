const DATE_PATTERNS = [
  /^(\d{4})-(\d{2})-(\d{2})$/,
  /^(\d{2})\/(\d{2})\/(\d{4})$/,
  /^(\d{2})-(\d{2})-(\d{4})$/,
  /^(\d{2})\.(\d{2})\.(\d{4})$/,
  /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/,
];

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export function parseBankDate(raw: string): string | null {
  const value = raw?.trim();
  if (!value) return null;

  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime()) && value.includes('-') && value.length >= 10) {
    return iso.toISOString().slice(0, 10);
  }

  for (const pattern of DATE_PATTERNS) {
    const match = value.match(pattern);
    if (!match) continue;

    if (pattern === DATE_PATTERNS[0]) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }

    if (pattern === DATE_PATTERNS[4]) {
      const month = MONTHS[match[2].toLowerCase().slice(0, 3)];
      if (month === undefined) continue;
      const day = match[1].padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      return `${match[3]}-${monthStr}-${day}`;
    }

    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString().slice(0, 10);
}
