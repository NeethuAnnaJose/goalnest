import { parseBankDate } from './parse-date.util';

describe('parseBankDate', () => {
  it('parses ISO dates', () => {
    expect(parseBankDate('2026-06-01')).toBe('2026-06-01');
  });

  it('parses DD/MM/YYYY dates', () => {
    expect(parseBankDate('01/06/2026')).toBe('2026-06-01');
  });

  it('parses DD-MM-YYYY dates', () => {
    expect(parseBankDate('15-06-2026')).toBe('2026-06-15');
  });

  it('returns null for invalid dates', () => {
    expect(parseBankDate('not-a-date')).toBeNull();
  });
});
