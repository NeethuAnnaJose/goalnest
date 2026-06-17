import { ParsedTransaction } from '../types/parsed-transaction';
import { ColumnMapping } from './column-mapper.util';
import { parseBankAmount, isDebitAmount } from './parse-amount.util';
import { parseBankDate } from './parse-date.util';

export function parseTransactionRow(cols: string[], mapping: ColumnMapping): ParsedTransaction | null {
  const date = parseBankDate(cols[mapping.date] ?? '');
  const description = (cols[mapping.description] ?? '').trim();
  if (!date || !description) return null;

  let amount: string | null = null;
  let type: 'debit' | 'credit' = 'debit';

  if (mapping.debit !== undefined || mapping.credit !== undefined) {
    const debitRaw = mapping.debit !== undefined ? cols[mapping.debit] : '';
    const creditRaw = mapping.credit !== undefined ? cols[mapping.credit] : '';
    const debitAmount = parseBankAmount(debitRaw ?? '');
    const creditAmount = parseBankAmount(creditRaw ?? '');

    if (debitAmount) {
      amount = debitAmount;
      type = 'debit';
    } else if (creditAmount) {
      amount = creditAmount;
      type = 'credit';
    }
  } else if (mapping.amount !== undefined) {
    const rawAmount = cols[mapping.amount] ?? '';
    amount = parseBankAmount(rawAmount);
    if (!amount) return null;

    if (mapping.type !== undefined) {
      const typeRaw = (cols[mapping.type] ?? '').toLowerCase();
      type = typeRaw.includes('cr') || typeRaw.includes('credit') ? 'credit' : 'debit';
    } else {
      type = isDebitAmount(rawAmount) ? 'debit' : 'credit';
    }
  }

  if (!amount) return null;

  const merchant = description.split(/[-/|@]/)[0]?.trim().slice(0, 100) || undefined;

  return { date, description, amount, type, merchant };
}
