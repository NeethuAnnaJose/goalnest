import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/** Smallest currency unit (e.g. paise for INR, cents for USD) */
export type MoneyMinor = bigint;

export const CURRENCY_DECIMALS: Record<string, number> = {
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
};

export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
}

/** Convert major units (e.g. 1234.56) to minor units (123456) */
export function toMinorUnits(amount: string | number, currency: string): MoneyMinor {
  const decimals = getCurrencyDecimals(currency);
  const d = new Decimal(amount);
  if (!d.isFinite() || d.isNegative()) {
    throw new Error('Amount must be a non-negative finite number');
  }
  const multiplier = new Decimal(10).pow(decimals);
  return BigInt(d.mul(multiplier).round().toFixed(0));
}

/** Convert minor units to major units string */
export function fromMinorUnits(amount: MoneyMinor, currency: string): string {
  const decimals = getCurrencyDecimals(currency);
  const divisor = new Decimal(10).pow(decimals);
  return new Decimal(amount.toString()).div(divisor).toFixed(decimals);
}

export function formatMoney(amount: MoneyMinor, currency: string): string {
  const major = fromMinorUnits(amount, currency);
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const symbol = symbols[currency.toUpperCase()] ?? currency;
  return `${symbol}${major}`;
}

export function addMoney(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  return a + b;
}

export function subtractMoney(a: MoneyMinor, b: MoneyMinor): MoneyMinor {
  return a - b;
}

export function multiplyMoney(amount: MoneyMinor, factor: string | number): MoneyMinor {
  const result = new Decimal(amount.toString()).mul(factor).round();
  return BigInt(result.toFixed(0));
}

export function divideMoney(amount: MoneyMinor, divisor: string | number): MoneyMinor {
  const d = new Decimal(divisor);
  if (d.isZero()) throw new Error('Division by zero');
  const result = new Decimal(amount.toString()).div(d).round();
  return BigInt(result.toFixed(0));
}

export function percentageOf(amount: MoneyMinor, percent: string | number): MoneyMinor {
  return multiplyMoney(amount, new Decimal(percent).div(100).toString());
}

export function sumMoney(amounts: MoneyMinor[]): MoneyMinor {
  return amounts.reduce((acc, val) => acc + val, 0n);
}

export function assertNonNegative(amount: MoneyMinor, field: string): void {
  if (amount < 0n) throw new Error(`${field} cannot be negative`);
}
