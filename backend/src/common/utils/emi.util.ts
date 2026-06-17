import Decimal from 'decimal.js';
import { MoneyMinor, divideMoney, multiplyMoney, toMinorUnits, fromMinorUnits } from './money.util';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface EmiInput {
  principal: MoneyMinor;
  annualInterestRate: string | number;
  tenureMonths: number;
  currency: string;
}

export interface EmiResult {
  emiAmount: MoneyMinor;
  totalPayment: MoneyMinor;
  totalInterest: MoneyMinor;
  emiAmountMajor: string;
  totalPaymentMajor: string;
  totalInterestMajor: string;
}

/**
 * Standard reducing-balance EMI formula:
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * where r = monthly interest rate, n = tenure in months
 */
export function calculateEmi(input: EmiInput): EmiResult {
  const { principal, annualInterestRate, tenureMonths, currency } = input;

  if (tenureMonths <= 0) throw new Error('Tenure must be positive');
  if (Number(principal) <= 0) throw new Error('Principal must be positive');

  const annualRate = new Decimal(annualInterestRate);
  if (annualRate.isNegative()) throw new Error('Interest rate cannot be negative');

  if (annualRate.isZero()) {
    const emi = divideMoney(principal, tenureMonths);
    const total = principal;
    return {
      emiAmount: emi,
      totalPayment: total,
      totalInterest: 0n,
      emiAmountMajor: fromMinorUnits(emi, currency),
      totalPaymentMajor: fromMinorUnits(total, currency),
      totalInterestMajor: '0.00',
    };
  }

  const monthlyRate = annualRate.div(100).div(12);
  const onePlusR = monthlyRate.plus(1);
  const powerN = onePlusR.pow(tenureMonths);
  const numerator = new Decimal(principal.toString()).mul(monthlyRate).mul(powerN);
  const denominator = powerN.minus(1);
  const emiDecimal = numerator.div(denominator).round();
  const emiAmount = BigInt(emiDecimal.toFixed(0));
  const totalPayment = emiAmount * BigInt(tenureMonths);
  const totalInterest = totalPayment - principal;

  return {
    emiAmount,
    totalPayment,
    totalInterest,
    emiAmountMajor: fromMinorUnits(emiAmount, currency),
    totalPaymentMajor: fromMinorUnits(totalPayment, currency),
    totalInterestMajor: fromMinorUnits(totalInterest, currency),
  };
}

export interface LoanCompletionInput {
  remainingBalance: MoneyMinor;
  emiAmount: MoneyMinor;
  annualInterestRate: string | number;
}

export function calculateRemainingMonths(input: LoanCompletionInput): number {
  const { remainingBalance, emiAmount, annualInterestRate } = input;
  if (Number(remainingBalance) <= 0) return 0;
  if (Number(emiAmount) <= 0) throw new Error('EMI amount must be positive');

  const monthlyRate = new Decimal(annualInterestRate).div(100).div(12);
  if (monthlyRate.isZero()) {
    return Math.ceil(Number(remainingBalance) / Number(emiAmount));
  }

  const r = monthlyRate;
  const P = new Decimal(remainingBalance.toString());
  const EMI = new Decimal(emiAmount.toString());

  // n = -log(1 - P*r/EMI) / log(1+r)
  const ratio = P.mul(r).div(EMI);
  if (ratio.gte(1)) throw new Error('EMI too low to cover interest');

  const n = ratio.minus(1).neg().ln().div(r.plus(1).ln().neg());
  return Math.ceil(n.toNumber());
}

export interface HousePlannerInput {
  propertyPrice: MoneyMinor;
  downPaymentPercent: string | number;
  annualInterestRate: string | number;
  monthlyPayment: MoneyMinor;
  currentSavings: MoneyMinor;
  monthlyIncome: MoneyMinor;
  currency: string;
}

export interface HousePlannerResult {
  requiredDownPayment: MoneyMinor;
  loanAmount: MoneyMinor;
  monthlyEmi: MoneyMinor;
  totalInterest: MoneyMinor;
  tenureMonths: number;
  monthlySavingsNeeded: MoneyMinor;
  estimatedPurchaseDate: Date | null;
  requiredDownPaymentMajor: string;
  monthlyEmiMajor: string;
  loanAmountMajor: string;
  totalInterestMajor: string;
}

export function calculateHousePlanner(input: HousePlannerInput): HousePlannerResult {
  const {
    propertyPrice,
    downPaymentPercent,
    annualInterestRate,
    monthlyPayment,
    currentSavings,
    monthlyIncome,
    currency,
  } = input;

  if (Number(monthlyPayment) <= 0) throw new Error('Monthly payment must be positive');

  const requiredDownPayment = multiplyMoney(
    propertyPrice,
    new Decimal(downPaymentPercent).div(100).toString(),
  );
  const loanAmount = propertyPrice - requiredDownPayment;

  if (loanAmount <= 0n) throw new Error('Loan amount must be positive');

  let tenureMonths: number;
  try {
    tenureMonths = calculateRemainingMonths({
      remainingBalance: loanAmount,
      emiAmount: monthlyPayment,
      annualInterestRate,
    });
  } catch {
    throw new Error('Monthly payment is too low to cover loan interest');
  }

  if (tenureMonths > 360) {
    throw new Error('Monthly payment is too low loan would take more than 30 years');
  }

  const totalPayment = monthlyPayment * BigInt(tenureMonths);
  const totalInterest = totalPayment - loanAmount;

  const savingsGap = requiredDownPayment - currentSavings;
  let monthlySavingsNeeded = 0n;
  let estimatedPurchaseDate: Date | null = null;

  if (savingsGap > 0n) {
    monthlySavingsNeeded = divideMoney(savingsGap, 12);
    const monthsToSave = Math.ceil(Number(savingsGap) / Number(monthlySavingsNeeded || 1n));
    estimatedPurchaseDate = new Date();
    estimatedPurchaseDate.setMonth(estimatedPurchaseDate.getMonth() + monthsToSave);
  } else {
    estimatedPurchaseDate = new Date();
  }

  const maxAffordableEmi = multiplyMoney(monthlyIncome, '0.4');
  if (monthlyPayment > maxAffordableEmi && maxAffordableEmi > 0n) {
    monthlySavingsNeeded = monthlyPayment - maxAffordableEmi + monthlySavingsNeeded;
  }

  return {
    requiredDownPayment,
    loanAmount,
    monthlyEmi: monthlyPayment,
    totalInterest,
    tenureMonths,
    monthlySavingsNeeded,
    estimatedPurchaseDate,
    requiredDownPaymentMajor: fromMinorUnits(requiredDownPayment, currency),
    monthlyEmiMajor: fromMinorUnits(monthlyPayment, currency),
    loanAmountMajor: fromMinorUnits(loanAmount, currency),
    totalInterestMajor: fromMinorUnits(totalInterest, currency),
  };
}

export interface AffordabilityInput {
  productCost: MoneyMinor;
  currentSavings: MoneyMinor;
  monthlyIncome: MoneyMinor;
  monthlyExpenses: MoneyMinor;
  totalEmiObligations: MoneyMinor;
  currency: string;
}

export type AffordabilityVerdict = 'AFFORDABLE' | 'NOT_RECOMMENDED' | 'RECOMMENDED_AFTER';

export interface AffordabilityResult {
  verdict: AffordabilityVerdict;
  monthsUntilRecommended: number | null;
  safeToSpend: MoneyMinor;
  impactOnGoals: string;
  reasoning: string[];
}

/** Max share of liquid savings a purchase can use and still be "affordable" outright */
const SMALL_PURCHASE_SAVINGS_RATIO = 0.15;

export function analyzeAffordability(input: AffordabilityInput): AffordabilityResult {
  const { productCost, currentSavings, monthlyIncome, monthlyExpenses, totalEmiObligations } =
    input;

  const safeToSpend = monthlyIncome - monthlyExpenses - totalEmiObligations;
  const monthlyDisposable = safeToSpend > 0n ? safeToSpend : 0n;
  const reasoning: string[] = [];

  const effectiveMonthlyExpenses =
    monthlyExpenses > 0n
      ? monthlyExpenses
      : monthlyIncome > 0n
        ? multiplyMoney(monthlyIncome, '0.5')
        : 0n;
  const emergencyMinimum = effectiveMonthlyExpenses * 3n;

  const affordableResult = (): AffordabilityResult => ({
    verdict: 'AFFORDABLE',
    monthsUntilRecommended: null,
    safeToSpend,
    impactOnGoals: 'Minimal impact on existing goals',
    reasoning,
  });

  if (productCost <= currentSavings) {
    const remainingSavings = currentSavings - productCost;
    const savingsShare =
      currentSavings > 0n ? Number(productCost) / Number(currentSavings) : 1;

    if (savingsShare <= SMALL_PURCHASE_SAVINGS_RATIO) {
      reasoning.push('Purchase is a small share of your available savings');
      return affordableResult();
    }

    if (remainingSavings >= emergencyMinimum) {
      reasoning.push('Purchase would leave a 3+ month emergency buffer');
      return affordableResult();
    }

    if (
      monthlyDisposable > 0n &&
      productCost <= monthlyDisposable &&
      remainingSavings >= effectiveMonthlyExpenses
    ) {
      reasoning.push('Purchase fits within this month’s disposable income');
      return affordableResult();
    }

    if (monthlyDisposable > 0n && productCost <= monthlyDisposable) {
      reasoning.push('Affordable from cash flow, but savings buffer would be tight');
      return {
        verdict: 'RECOMMENDED_AFTER',
        monthsUntilRecommended: 1,
        safeToSpend,
        impactOnGoals: 'Consider waiting one month to rebuild your buffer',
        reasoning,
      };
    }

    reasoning.push('Purchase would reduce savings below a 3-month expense buffer');
    return {
      verdict: 'NOT_RECOMMENDED',
      monthsUntilRecommended: null,
      safeToSpend,
      impactOnGoals: 'Would significantly impact your emergency fund',
      reasoning,
    };
  }

  const shortfall = productCost - currentSavings;

  if (monthlyDisposable <= 0n) {
    reasoning.push('No disposable income available after monthly obligations');
    return {
      verdict: 'NOT_RECOMMENDED',
      monthsUntilRecommended: null,
      safeToSpend,
      impactOnGoals: 'Cannot afford without compromising financial stability',
      reasoning,
    };
  }

  const monthsNeeded = Math.max(1, Math.ceil(Number(shortfall) / Number(monthlyDisposable)));

  if (monthsNeeded <= 3) {
    reasoning.push(`You can save the remaining amount in about ${monthsNeeded} month(s)`);
    return {
      verdict: 'RECOMMENDED_AFTER',
      monthsUntilRecommended: monthsNeeded,
      safeToSpend,
      impactOnGoals: `Delay purchase by ${monthsNeeded} month(s) to avoid dipping into savings`,
      reasoning,
    };
  }

  reasoning.push(`Saving for this would take about ${monthsNeeded} months`);
  return {
    verdict: 'NOT_RECOMMENDED',
    monthsUntilRecommended: monthsNeeded,
    safeToSpend,
    impactOnGoals: 'Would delay other financial goals significantly',
    reasoning,
  };
}

export interface WealthProjectionInput {
  monthlySavings: MoneyMinor;
  annualIncreasePercent: string | number;
  annualReturnPercent: string | number;
  years: number;
  currency: string;
}

export interface WealthProjectionPoint {
  year: number;
  totalWealth: MoneyMinor;
  totalContributions: MoneyMinor;
  totalReturns: MoneyMinor;
  totalWealthMajor: string;
}

export function projectWealth(input: WealthProjectionInput): WealthProjectionPoint[] {
  const { monthlySavings, annualIncreasePercent, annualReturnPercent, years, currency } = input;
  const points: WealthProjectionPoint[] = [];

  let balance = 0n;
  let monthlyContribution = monthlySavings;
  let totalContributions = 0n;
  const monthlyReturn = new Decimal(annualReturnPercent).div(100).div(12);
  const annualIncrease = new Decimal(annualIncreasePercent).div(100);

  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      totalContributions += monthlyContribution;
      balance += monthlyContribution;
      const returnAmount = BigInt(
        new Decimal(balance.toString()).mul(monthlyReturn).round().toFixed(0),
      );
      balance += returnAmount;
    }
    monthlyContribution = BigInt(
      new Decimal(monthlyContribution.toString()).mul(annualIncrease.plus(1)).round().toFixed(0),
    );
    points.push({
      year,
      totalWealth: balance,
      totalContributions,
      totalReturns: balance - totalContributions,
      totalWealthMajor: fromMinorUnits(balance, currency),
    });
  }

  return points;
}

export function calculateEmergencyFundTarget(averageMonthlyExpenses: MoneyMinor): MoneyMinor {
  return averageMonthlyExpenses * 6n;
}

export interface HealthScoreInput {
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundRatio: number;
  goalProgressAvg: number;
  spendingStability: number;
}

export interface HealthScoreResult {
  score: number;
  grade: string;
  recommendations: string[];
}

export function calculateFinancialHealthScore(input: HealthScoreInput): HealthScoreResult {
  const weights = {
    savingsRate: 0.25,
    debtToIncomeRatio: 0.25,
    emergencyFundRatio: 0.2,
    goalProgressAvg: 0.15,
    spendingStability: 0.15,
  };

  const savingsScore = Math.min(100, Math.max(0, input.savingsRate * 5));
  const debtScore = Math.min(100, Math.max(0, 100 - input.debtToIncomeRatio * 200));
  const emergencyScore = Math.min(100, Math.max(0, input.emergencyFundRatio * 100 / 6));
  const goalScore = Math.min(100, Math.max(0, input.goalProgressAvg));
  const spendingScore = Math.min(100, Math.max(0, input.spendingStability));

  const score = Math.round(
    savingsScore * weights.savingsRate +
      debtScore * weights.debtToIncomeRatio +
      emergencyScore * weights.emergencyFundRatio +
      goalScore * weights.goalProgressAvg +
      spendingScore * weights.spendingStability,
  );

  const recommendations: string[] = [];
  if (savingsScore < 50) recommendations.push('Increase your savings rate to at least 20% of income');
  if (debtScore < 50) recommendations.push('Reduce debt-to-income ratio below 40%');
  if (emergencyScore < 50) recommendations.push('Build emergency fund to cover 6 months of expenses');
  if (goalScore < 50) recommendations.push('Review and prioritize your financial goals');
  if (spendingScore < 50) recommendations.push('Stabilize spending patterns to reduce volatility');

  let grade = 'F';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 50) grade = 'D';

  return { score, grade, recommendations };
}
