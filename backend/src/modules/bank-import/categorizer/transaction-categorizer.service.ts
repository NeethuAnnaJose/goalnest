import { Injectable } from '@nestjs/common';
import { ExpenseCategory, IncomeType } from '@prisma/client';
import {
  BankImportCategory,
  CategorizedTransaction,
  ParsedTransaction,
} from '../types/parsed-transaction';

const CATEGORY_KEYWORDS: Record<BankImportCategory, string[]> = {
  Food: [
    'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'swiggy', 'zomato',
    'uber eats', 'food', 'grocery', 'supermarket', 'dominos', 'pizza', 'dining',
    'bakery', 'kitchen', 'eatery', 'lunch', 'dinner', 'breakfast',
  ],
  Travel: [
    'uber', 'ola', 'lyft', 'airline', 'flight', 'hotel', 'booking.com', 'makemytrip',
    'irctc', 'railway', 'metro', 'travel', 'trip', 'airbnb', 'goibibo', 'indigo',
    'spicejet', 'fuel', 'petrol', 'diesel', 'cab', 'taxi',
  ],
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'store', 'shop', 'retail',
    'clothing', 'fashion', 'electronics', 'marketplace', 'purchase', 'ebay',
    'walmart', 'target', 'decathlon',
  ],
  Healthcare: [
    'hospital', 'pharmacy', 'medical', 'clinic', 'doctor', 'health', 'apollo',
    'medplus', 'diagnostic', 'lab', 'dental', 'medicine', 'chemist', '1mg',
    'practo', 'insurance health',
  ],
  Bills: [
    'electricity', 'water bill', 'gas bill', 'internet', 'broadband', 'mobile recharge',
    'phone bill', 'utility', 'rent', 'emi', 'insurance', 'subscription', 'netflix',
    'spotify', 'jio', 'airtel', 'vi ', 'bsnl', 'bill payment', 'municipal',
  ],
};

const EXPENSE_CATEGORY_MAP: Record<BankImportCategory, ExpenseCategory> = {
  Food: ExpenseCategory.FOOD,
  Travel: ExpenseCategory.TRAVEL,
  Shopping: ExpenseCategory.SHOPPING,
  Healthcare: ExpenseCategory.HEALTHCARE,
  Bills: ExpenseCategory.UTILITIES,
};

const INCOME_TYPE_KEYWORDS: Record<IncomeType, string[]> = {
  [IncomeType.SALARY]: ['salary', 'payroll', 'wages', 'stipend'],
  [IncomeType.FREELANCE]: ['freelance', 'consulting', 'contract', 'invoice'],
  [IncomeType.RENTAL]: ['rent received', 'rental income', 'tenant'],
  [IncomeType.BUSINESS]: ['business', 'sales', 'revenue'],
  [IncomeType.OTHER]: [],
};

@Injectable()
export class TransactionCategorizerService {
  categorize(transaction: ParsedTransaction): CategorizedTransaction {
    const text = `${transaction.description} ${transaction.merchant ?? ''}`.toLowerCase();
    let bestCategory: BankImportCategory = 'Bills';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
      BankImportCategory,
      string[],
    ][]) {
      const score = keywords.reduce(
        (sum, keyword) => sum + (text.includes(keyword) ? keyword.length : 0),
        0,
      );
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    return { ...transaction, category: bestCategory };
  }

  categorizeAll(transactions: ParsedTransaction[]): CategorizedTransaction[] {
    return transactions.map((txn) => this.categorize(txn));
  }

  toExpenseCategory(category: BankImportCategory): ExpenseCategory {
    return EXPENSE_CATEGORY_MAP[category];
  }

  detectIncomeType(description: string): IncomeType {
    const text = description.toLowerCase();
    for (const [type, keywords] of Object.entries(INCOME_TYPE_KEYWORDS) as [IncomeType, string[]][]) {
      if (type === IncomeType.OTHER) continue;
      if (keywords.some((kw) => text.includes(kw))) return type;
    }
    return IncomeType.OTHER;
  }
}
