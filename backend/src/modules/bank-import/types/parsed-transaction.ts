export type TransactionType = 'debit' | 'credit';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: string;
  type: TransactionType;
  merchant?: string;
}

export type BankImportCategory = 'Food' | 'Travel' | 'Shopping' | 'Healthcare' | 'Bills';

export interface CategorizedTransaction extends ParsedTransaction {
  category: BankImportCategory;
}
