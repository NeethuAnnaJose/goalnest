export type LoanOfferCategory = 'HOME' | 'VEHICLE';

export interface BankLoanOffer {
  bankName: string;
  interestRate: number;
  loanTypes: LoanOfferCategory[];
  processingFee: string;
  highlights: string[];
}

export const BANK_LOAN_OFFERS: BankLoanOffer[] = [
  {
    bankName: 'Punjab National Bank',
    interestRate: 8.3,
    loanTypes: ['HOME'],
    processingFee: '0.35% of loan amount',
    highlights: ['Lowest home loan rates', 'Up to 30-year tenure'],
  },
  {
    bankName: 'Bank of Baroda',
    interestRate: 8.35,
    loanTypes: ['HOME', 'VEHICLE'],
    processingFee: '0.25% of loan amount',
    highlights: ['Quick approval', 'Flexible repayment'],
  },
  {
    bankName: 'State Bank of India',
    interestRate: 8.4,
    loanTypes: ['HOME', 'VEHICLE'],
    processingFee: '0.35% of loan amount',
    highlights: ['Largest lender network', 'Women borrower concession'],
  },
  {
    bankName: 'LIC Housing Finance',
    interestRate: 8.45,
    loanTypes: ['HOME'],
    processingFee: '0.5% of loan amount',
    highlights: ['Specialized housing finance', 'Competitive rates for salaried'],
  },
  {
    bankName: 'HDFC Bank',
    interestRate: 8.5,
    loanTypes: ['HOME', 'VEHICLE'],
    processingFee: '0.5% of loan amount',
    highlights: ['Fast digital processing', 'Balance transfer offers'],
  },
  {
    bankName: 'ICICI Bank',
    interestRate: 8.55,
    loanTypes: ['HOME', 'VEHICLE'],
    processingFee: '0.5% of loan amount',
    highlights: ['Instant eligibility check', 'Top-up loan available'],
  },
  {
    bankName: 'Axis Bank',
    interestRate: 8.6,
    loanTypes: ['HOME', 'VEHICLE'],
    processingFee: '0.5% of loan amount',
    highlights: ['Doorstep service', 'Flexible EMI options'],
  },
  {
    bankName: 'Kotak Mahindra Bank',
    interestRate: 8.65,
    loanTypes: ['HOME', 'VEHICLE'],
    processingFee: '0.5% of loan amount',
    highlights: ['Minimal documentation', 'Quick disbursal'],
  },
  {
    bankName: 'Canara Bank',
    interestRate: 8.7,
    loanTypes: ['HOME', 'VEHICLE'],
    processingFee: '0.25% of loan amount',
    highlights: ['Government-backed security', 'Rural housing schemes'],
  },
  {
    bankName: 'Union Bank of India',
    interestRate: 8.75,
    loanTypes: ['HOME', 'VEHICLE'],
    processingFee: '0.35% of loan amount',
    highlights: ['Affordable vehicle loans', 'Pre-approved offers'],
  },
];
