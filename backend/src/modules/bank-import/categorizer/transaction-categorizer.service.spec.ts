import { TransactionCategorizerService } from './transaction-categorizer.service';
import { ExpenseCategory, IncomeType } from '@prisma/client';

describe('TransactionCategorizerService', () => {
  let service: TransactionCategorizerService;

  beforeEach(() => {
    service = new TransactionCategorizerService();
  });

  it('categorizes food transactions', () => {
    const result = service.categorize({
      date: '2026-06-01',
      description: 'SWIGGY FOOD DELIVERY BANGALORE',
      amount: '450.00',
      type: 'debit',
    });
    expect(result.category).toBe('Food');
  });

  it('categorizes travel transactions', () => {
    const result = service.categorize({
      date: '2026-06-02',
      description: 'UBER TRIP MUMBAI',
      amount: '320.00',
      type: 'debit',
    });
    expect(result.category).toBe('Travel');
  });

  it('categorizes shopping transactions', () => {
    const result = service.categorize({
      date: '2026-06-03',
      description: 'AMAZON PAY INDIA',
      amount: '1299.00',
      type: 'debit',
    });
    expect(result.category).toBe('Shopping');
  });

  it('categorizes healthcare transactions', () => {
    const result = service.categorize({
      date: '2026-06-04',
      description: 'APOLLO PHARMACY',
      amount: '850.00',
      type: 'debit',
    });
    expect(result.category).toBe('Healthcare');
  });

  it('categorizes bills transactions', () => {
    const result = service.categorize({
      date: '2026-06-05',
      description: 'ELECTRICITY BILL PAYMENT',
      amount: '2100.00',
      type: 'debit',
    });
    expect(result.category).toBe('Bills');
  });

  it('maps to expense categories', () => {
    expect(service.toExpenseCategory('Food')).toBe(ExpenseCategory.FOOD);
    expect(service.toExpenseCategory('Bills')).toBe(ExpenseCategory.UTILITIES);
  });

  it('detects salary income type', () => {
    expect(service.detectIncomeType('MONTHLY SALARY CREDIT')).toBe(IncomeType.SALARY);
    expect(service.detectIncomeType('RANDOM TRANSFER')).toBe(IncomeType.OTHER);
  });
});
