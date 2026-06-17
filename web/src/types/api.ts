export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

export interface MfaLoginResponse {
  mfaRequired: true;
  tempToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  currency: string;
  planTier: string;
  role?: string;
  mfaEnabled: boolean;
  monthlySalary?: string | number;
  financialPreferences?: {
    categoryBudgets?: Record<string, string>;
    hiddenTrackerCategories?: string[];
    customTrackerCategories?: string[];
  };
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  openTickets: number;
  activeSubscriptions: number;
  totalRevenue: string;
  revenueThisMonth: string;
  mrr: string;
  planBreakdown: { tier: string; count: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  planTier: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  deletedAt?: string;
  createdAt: string;
  _count?: { expenses: number; goals: number; supportTickets: number };
}

export interface AdminSubscription {
  id: string;
  name: string;
  provider: string;
  amountMajor: string;
  currency: string;
  billingCycle: string;
  renewalDate: string;
  isActive: boolean;
  user: { id: string; email: string; name?: string };
}

export interface AdminPlan {
  id: string;
  tier: string;
  name: string;
  description?: string;
  priceMonthly: string | number;
  priceYearly: string | number;
  isActive: boolean;
}

export interface AdminTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt: string;
  user: { id: string; email: string; name?: string };
  messages?: { id: string; message: string; isStaff: boolean; createdAt: string }[];
}

export interface AdminNotification {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  user: { id: string; email: string; name?: string };
}

export interface DashboardData {
  financialYear?: string;
  financialYearLabel?: string;
  fyStartDate?: string;
  fyEndDate?: string;
  activeMonth?: string;
  previousMonth?: string;
  monthlyIncome: string | number;
  monthlyExpenses: string | number;
  fyIncome?: string | number;
  fyExpenses?: string | number;
  currentSavings: string | number;
  outstandingLoans: string | number;
  safeToSpend: string | number;
  currency: string;
  formatted: {
    monthlyIncome: string;
    monthlyExpenses: string;
    fyIncome?: string;
    fyExpenses?: string;
    currentSavings: string;
    safeToSpend: string;
  };
  financialHealthScore: {
    score: number;
    grade: string;
    recommendations: string[];
  };
  emergencyFund: {
    current: string | number;
    target: string | number;
    progressPercent: number;
  };
  activeGoals: Goal[];
  upcomingEmis: EmiPayment[];
}

export interface Expense {
  id: string;
  category: string;
  amount: string | number;
  currency: string;
  date: string;
  description?: string;
  merchant?: string;
  isRecurring: boolean;
}

export interface ExpenseCreateResponse {
  expense: Expense;
  budgetAlert?: {
    title: string;
    body: string;
  } | null;
}

export interface Income {
  id: string;
  type: string;
  amount: string | number;
  currency: string;
  date: string;
  notes?: string;
  category?: string;
  isRecurring: boolean;
  frequency?: string;
}

export interface SavingsAccount {
  id: string;
  type: string;
  name: string;
  balance: string | number;
  currency: string;
  monthlyDebitAmount?: string | number | null;
  debitDayOfMonth?: number | null;
  institution?: string;
  interestRate?: string;
}

export interface SavingsContribution {
  id: string;
  savingsAccountId: string;
  month: string;
  amount: string | number;
  currency: string;
}

export interface SavingsGrowth {
  totalBalance: string | number;
  monthlyIncome?: string | number;
  monthlyExpenses?: string | number;
  monthlyNetSavings?: string | number;
  yearlyNetSavings?: string | number;
  monthlyContributions?: string | number;
  yearlyContributions?: string | number;
  savedMonthsCount?: number;
  monthlySavingsGrowth: string | number;
  yearlySavingsGrowth: string | number;
  formatted: {
    totalBalance: string;
    monthlyIncome?: string;
    monthlyExpenses?: string;
    monthlyNetSavings?: string;
    yearlyNetSavings?: string;
    monthlyContributions?: string;
    yearlyContributions?: string;
    monthlySavingsGrowth: string;
    yearlySavingsGrowth: string;
  };
}

export interface Goal {
  id: string;
  type: string;
  name: string;
  targetAmount: string | number;
  currentSavings: string | number;
  currency: string;
  targetDate?: string;
  isCompleted: boolean;
  notes?: string;
  completionPercent?: number;
  requiredMonthlySaving?: string | number;
  remainingAmount?: string | number;
  targetAmountMajor?: string;
  currentSavingsMajor?: string;
}

export interface Loan {
  id: string;
  type: string;
  name: string;
  principal: string | number;
  interestRate: string;
  tenureMonths: number;
  startDate?: string;
  emiAmount: string | number;
  remainingBalance: string | number;
  currency: string;
  lender?: string;
  notes?: string;
  emiAmountMajor?: string;
  remainingMonths?: number;
}

export interface EmiPayment {
  id: string;
  loanId?: string;
  dueDate: string;
  amount: string | number;
  status: string;
  paidDate?: string | null;
  loan?: { name: string; type: string };
  amountMajor?: string;
  daysUntilDue?: number;
}

export interface EmiTracker {
  loanId: string;
  loanName: string;
  totalEmis: number;
  paid: number;
  missed: number;
  pending: number;
  completionPercent: number;
  emis: EmiPayment[];
}

export interface EmiFySummary {
  financialYear: string;
  monthlyPaidTotal: string | number;
  yearlyPaidTotal: string | number;
  paidMonthsCount: number;
  emisDueInFy: number;
  formatted: {
    monthlyPaidTotal: string;
    yearlyPaidTotal: string;
  };
}

export interface HealthScore {
  score: number;
  grade: string;
  recommendations: string[];
  factors: Record<string, { value?: number; weight?: string; status?: string; monthsCovered?: number; target?: number; average?: number; score?: number }>;
}

export interface AffordabilityResult {
  productName: string;
  productCostMajor: string;
  verdict: 'AFFORDABLE' | 'NOT_RECOMMENDED' | 'RECOMMENDED_AFTER';
  monthsUntilRecommended: number | null;
  reasoning: string[];
  impactOnGoals: string;
  safeToSpendMajor?: string;
  currentSavingsMajor?: string;
  monthlyIncomeMajor?: string;
  monthlyExpensesMajor?: string;
  goalImpacts?: { goalName: string; currentProgress: number; estimatedDelayMonths: number }[];
}

export interface HousePlannerResult {
  requiredDownPaymentMajor: string;
  monthlyEmiMajor: string;
  loanAmountMajor: string;
  totalInterestMajor: string;
  tenureMonths: number;
  monthlySavingsNeeded: string | number;
  estimatedPurchaseDate: string | null;
  formatted: {
    requiredDownPayment: string;
    monthlyEmi: string;
    loanAmount: string;
    totalInterest: string;
    monthlySavingsNeeded: string;
    tenureMonths: number;
    tenureYears: number;
  };
}

export interface LoanOfferItem {
  bankName: string;
  interestRate: number;
  processingFee: string;
  highlights: string[];
  tenureMonths: number;
  tenureYears: number;
  formatted: {
    totalInterest: string;
    interestSavings: string;
    monthlyPayment: string;
  };
}

export interface LoanOffersResult {
  loanType: string;
  currentRate: number;
  offers: LoanOfferItem[];
  allBanks: { bankName: string; interestRate: number; isLowerThanCurrent: boolean }[];
}

export interface ReportIncomeItem {
  type: string;
  amount: string;
  date: string;
  category?: string | null;
  notes?: string | null;
  isRecurring?: boolean;
}

export interface ReportExpenseItem {
  date: string;
  description: string;
  merchant: string;
  amount: string;
}

export interface ReportExpenseCategory {
  total: string;
  items: ReportExpenseItem[];
}

export interface ReportGoalItem {
  name: string;
  type: string;
  targetAmount: string;
  currentSavings: string;
  progressPercent: number;
  targetDate?: string | null;
  isCompleted: boolean;
  priority?: number;
}

export interface ReportLoanItem {
  name: string;
  type: string;
  principal: string;
  emiAmount: string;
  remainingBalance: string;
  interestRate?: string;
  tenureMonths?: number;
  lender?: string | null;
}

export interface ReportSavingsItem {
  name: string;
  type: string;
  balance: string;
  institution?: string | null;
  interestRate?: string | null;
}

export interface ReportMetadata {
  name?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  summary?: {
    totalIncome: string;
    totalExpenses: string;
    netSavings: string;
    savingsRate?: number;
  };
  expenseByCategory?: Record<string, string>;
  incomes?: ReportIncomeItem[];
  expenses?: Record<string, ReportExpenseCategory>;
  goals?: ReportGoalItem[];
  loans?: ReportLoanItem[];
  savingsAccounts?: ReportSavingsItem[];
  activeLoans?: number;
  activeGoals?: number;
  totalSavingsBalance?: string;
  transactionCount?: { income: number; expenses: number };
}

export interface Report {
  id: string;
  name?: string;
  period: string;
  format: string;
  fileUrl?: string;
  metadata?: ReportMetadata;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface CategoryBreakdown {
  category: string;
  amount: string | number;
}
