import {
  calculateEmi,
  calculateRemainingMonths,
  calculateHousePlanner,
  analyzeAffordability,
  projectWealth,
  calculateEmergencyFundTarget,
  calculateFinancialHealthScore,
} from './emi.util';
import { toMinorUnits } from './money.util';

describe('EmiUtil', () => {
  const currency = 'INR';

  describe('calculateEmi', () => {
    it('calculates standard home loan EMI', () => {
      const principal = toMinorUnits(5000000, currency);
      const result = calculateEmi({
        principal,
        annualInterestRate: 8.5,
        tenureMonths: 240,
        currency,
      });
      expect(Number(result.emiAmount)).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0n);
      expect(result.totalPayment).toBe(result.emiAmount * 240n);
    });

    it('handles zero interest rate', () => {
      const principal = toMinorUnits(120000, currency);
      const result = calculateEmi({
        principal,
        annualInterestRate: 0,
        tenureMonths: 12,
        currency,
      });
      expect(result.emiAmount).toBe(toMinorUnits(10000, currency));
      expect(result.totalInterest).toBe(0n);
    });

    it('throws on invalid tenure', () => {
      expect(() =>
        calculateEmi({
          principal: toMinorUnits(100000, currency),
          annualInterestRate: 10,
          tenureMonths: 0,
          currency,
        }),
      ).toThrow();
    });
  });

  describe('calculateRemainingMonths', () => {
    it('calculates remaining months', () => {
      const months = calculateRemainingMonths({
        remainingBalance: toMinorUnits(500000, currency),
        emiAmount: toMinorUnits(10000, currency),
        annualInterestRate: 10,
      });
      expect(months).toBeGreaterThan(0);
    });
  });

  describe('calculateHousePlanner', () => {
    it('returns complete house planning data from monthly payment', () => {
      const result = calculateHousePlanner({
        propertyPrice: toMinorUnits(5000000, currency),
        downPaymentPercent: 20,
        annualInterestRate: 8.5,
        monthlyPayment: toMinorUnits(35000, currency),
        currentSavings: toMinorUnits(500000, currency),
        monthlyIncome: toMinorUnits(100000, currency),
        currency,
      });
      expect(result.requiredDownPayment).toBe(toMinorUnits(1000000, currency));
      expect(result.loanAmount).toBe(toMinorUnits(4000000, currency));
      expect(result.monthlyEmi).toBe(toMinorUnits(35000, currency));
      expect(result.tenureMonths).toBeGreaterThan(0);
      expect(result.tenureMonths).toBeLessThanOrEqual(360);
    });
  });

  describe('analyzeAffordability', () => {
    it('returns AFFORDABLE when savings cover cost with buffer', () => {
      const result = analyzeAffordability({
        productCost: toMinorUnits(10000, currency),
        currentSavings: toMinorUnits(100000, currency),
        monthlyIncome: toMinorUnits(50000, currency),
        monthlyExpenses: toMinorUnits(30000, currency),
        totalEmiObligations: toMinorUnits(5000, currency),
        currency,
      });
      expect(result.verdict).toBe('AFFORDABLE');
    });

    it('returns AFFORDABLE for small purchases relative to savings', () => {
      const result = analyzeAffordability({
        productCost: toMinorUnits(5000, currency),
        currentSavings: toMinorUnits(100000, currency),
        monthlyIncome: toMinorUnits(50000, currency),
        monthlyExpenses: toMinorUnits(40000, currency),
        totalEmiObligations: toMinorUnits(5000, currency),
        currency,
      });
      expect(result.verdict).toBe('AFFORDABLE');
    });

    it('returns NOT_RECOMMENDED when no disposable income', () => {
      const result = analyzeAffordability({
        productCost: toMinorUnits(50000, currency),
        currentSavings: toMinorUnits(0, currency),
        monthlyIncome: toMinorUnits(30000, currency),
        monthlyExpenses: toMinorUnits(25000, currency),
        totalEmiObligations: toMinorUnits(10000, currency),
        currency,
      });
      expect(result.verdict).toBe('NOT_RECOMMENDED');
    });

    it('returns RECOMMENDED_AFTER when shortfall is saveable within 3 months', () => {
      const result = analyzeAffordability({
        productCost: toMinorUnits(20000, currency),
        currentSavings: toMinorUnits(5000, currency),
        monthlyIncome: toMinorUnits(50000, currency),
        monthlyExpenses: toMinorUnits(30000, currency),
        totalEmiObligations: toMinorUnits(5000, currency),
        currency,
      });
      expect(result.verdict).toBe('RECOMMENDED_AFTER');
    });
  });

  describe('projectWealth', () => {
    it('projects wealth over years', () => {
      const points = projectWealth({
        monthlySavings: toMinorUnits(10000, currency),
        annualIncreasePercent: 5,
        annualReturnPercent: 12,
        years: 10,
        currency,
      });
      expect(points).toHaveLength(10);
      expect(points[9].totalWealth).toBeGreaterThan(points[0].totalWealth);
    });
  });

  describe('calculateEmergencyFundTarget', () => {
    it('returns 6x monthly expenses', () => {
      const target = calculateEmergencyFundTarget(toMinorUnits(50000, currency));
      expect(target).toBe(toMinorUnits(300000, currency));
    });
  });

  describe('calculateFinancialHealthScore', () => {
    it('returns score between 0 and 100', () => {
      const result = calculateFinancialHealthScore({
        savingsRate: 20,
        debtToIncomeRatio: 0.3,
        emergencyFundRatio: 4,
        goalProgressAvg: 60,
        spendingStability: 80,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.grade).toBeDefined();
    });
  });
});
