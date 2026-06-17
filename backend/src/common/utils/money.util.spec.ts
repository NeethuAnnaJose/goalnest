import { Test, TestingModule } from '@nestjs/testing';
import { toMinorUnits, fromMinorUnits, addMoney, sumMoney, formatMoney } from './money.util';

describe('MoneyUtil', () => {
  describe('toMinorUnits', () => {
    it('converts INR correctly', () => {
      expect(toMinorUnits('1234.56', 'INR')).toBe(123456n);
      expect(toMinorUnits(100, 'INR')).toBe(10000n);
    });

    it('converts USD correctly', () => {
      expect(toMinorUnits('99.99', 'USD')).toBe(9999n);
    });

    it('handles JPY with zero decimals', () => {
      expect(toMinorUnits(1000, 'JPY')).toBe(1000n);
    });

    it('throws on negative amounts', () => {
      expect(() => toMinorUnits(-1, 'INR')).toThrow();
    });
  });

  describe('fromMinorUnits', () => {
    it('converts back to major units', () => {
      expect(fromMinorUnits(123456n, 'INR')).toBe('1234.56');
    });
  });

  describe('arithmetic', () => {
    it('adds amounts correctly', () => {
      expect(addMoney(100n, 200n)).toBe(300n);
    });

    it('sums array of amounts', () => {
      expect(sumMoney([100n, 200n, 300n])).toBe(600n);
    });
  });

  describe('formatMoney', () => {
    it('formats INR with symbol', () => {
      expect(formatMoney(123456n, 'INR')).toBe('₹1234.56');
    });
  });
});
