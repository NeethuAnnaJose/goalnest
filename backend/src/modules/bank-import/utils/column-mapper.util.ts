export interface ColumnMapping {
  date: number;
  description: number;
  debit?: number;
  credit?: number;
  amount?: number;
  type?: number;
}

const HEADER_ALIASES: Record<keyof ColumnMapping, string[]> = {
  date: ['date', 'transaction date', 'txn date', 'value date', 'posting date'],
  description: ['description', 'narration', 'particulars', 'remarks', 'details', 'transaction details'],
  debit: ['debit', 'withdrawal', 'withdrawals', 'dr', 'debit amount'],
  credit: ['credit', 'deposit', 'deposits', 'cr', 'credit amount'],
  amount: ['amount', 'transaction amount', 'txn amount', 'value'],
  type: ['type', 'transaction type', 'dr/cr', 'drcr'],
};

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx >= 0) return idx;
  }
  for (let i = 0; i < normalized.length; i++) {
    if (aliases.some((alias) => normalized[i].includes(alias))) return i;
  }
  return -1;
}

export function detectColumns(headers: string[]): ColumnMapping | null {
  const date = findColumnIndex(headers, HEADER_ALIASES.date);
  const description = findColumnIndex(headers, HEADER_ALIASES.description);
  if (date === -1 || description === -1) return null;

  const debit = findColumnIndex(headers, HEADER_ALIASES.debit);
  const credit = findColumnIndex(headers, HEADER_ALIASES.credit);
  const amount = findColumnIndex(headers, HEADER_ALIASES.amount);
  const type = findColumnIndex(headers, HEADER_ALIASES.type);

  if (debit === -1 && credit === -1 && amount === -1) return null;

  return {
    date,
    description,
    debit: debit >= 0 ? debit : undefined,
    credit: credit >= 0 ? credit : undefined,
    amount: amount >= 0 ? amount : undefined,
    type: type >= 0 ? type : undefined,
  };
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}
