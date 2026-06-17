export function parseBankAmount(raw: string): string | null {
  if (!raw?.trim()) return null;

  const cleaned = raw
    .replace(/[₹$€£,\s]/g, '')
    .replace(/\((.+)\)/, '-$1')
    .trim();

  if (!cleaned || cleaned === '-') return null;

  const value = Math.abs(parseFloat(cleaned));
  if (!Number.isFinite(value) || value === 0) return null;

  return value.toFixed(2);
}

export function isDebitAmount(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.startsWith('-') || trimmed.startsWith('(') || /dr$/i.test(trimmed);
}
