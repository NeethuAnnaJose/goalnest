export const FY_STORAGE_KEY = 'selectedFinancialYear';

export interface FinancialYearRange {
  label: string;
  startYear: number;
  endYear: number;
  startDate: Date;
  endDate: Date;
}

/** Indian FY: April 1 – March 31. Label format "2025-26". */
export function parseFinancialYear(fy: string): FinancialYearRange {
  const match = fy.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid financial year: ${fy}`);
  }
  const startYear = Number(match[1]);
  const endShort = Number(match[2]);
  const endYear = Math.floor(startYear / 100) * 100 + endShort;
  if (endYear !== startYear + 1) {
    throw new Error(`Invalid financial year: ${fy}`);
  }
  return {
    label: fy,
    startYear,
    endYear,
    startDate: new Date(startYear, 3, 1),
    endDate: new Date(endYear, 2, 31, 23, 59, 59, 999),
  };
}

export function getCurrentFinancialYear(date = new Date()): FinancialYearRange {
  const month = date.getMonth();
  const year = date.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = startYear + 1;
  return parseFinancialYear(`${startYear}-${String(endYear).slice(-2)}`);
}

export function listFinancialYears(count = 6, fromDate = new Date()): FinancialYearRange[] {
  const current = getCurrentFinancialYear(fromDate);
  const years: FinancialYearRange[] = [current];
  for (let i = 1; i < count; i++) {
    const prevStart = current.startYear - i;
    const prevEnd = prevStart + 1;
    years.push(parseFinancialYear(`${prevStart}-${String(prevEnd).slice(-2)}`));
  }
  return years;
}

export function monthsInFinancialYear(fy: string): string[] {
  const { startYear, endYear } = parseFinancialYear(fy);
  const months: string[] = [];
  for (let m = 4; m <= 12; m++) {
    months.push(`${startYear}-${String(m).padStart(2, '0')}`);
  }
  for (let m = 1; m <= 3; m++) {
    months.push(`${endYear}-${String(m).padStart(2, '0')}`);
  }
  return months;
}

export function isDateInFinancialYear(date: Date, fy: string): boolean {
  const range = parseFinancialYear(fy);
  return date >= range.startDate && date <= range.endDate;
}

export function effectiveMonthInFY(fy: string, date = new Date()): string {
  if (isDateInFinancialYear(date, fy)) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  const months = monthsInFinancialYear(fy);
  return months[months.length - 1];
}

export function previousMonthKey(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatFinancialYearLabel(fy: string): string {
  const { startYear, endYear } = parseFinancialYear(fy);
  return `FY ${startYear}-${String(endYear).slice(-2)}`;
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Default expense date when viewing a month: today if in that month, else last day of month. */
export function defaultDateForMonth(monthKey: string, now = new Date()): string {
  const [year, m] = monthKey.split('-').map(Number);
  if (now.getFullYear() === year && now.getMonth() + 1 === m) {
    return `${year}-${String(m).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const lastDay = new Date(year, m, 0).getDate();
  return `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function isDateInMonth(dateStr: string, monthKey: string): boolean {
  const [year, m] = monthKey.split('-').map(Number);
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() + 1 === m;
}

export function formatFinancialYearRange(fy: string): string {
  const { startYear, endYear } = parseFinancialYear(fy);
  return `Apr ${startYear} to Mar ${endYear}`;
}
