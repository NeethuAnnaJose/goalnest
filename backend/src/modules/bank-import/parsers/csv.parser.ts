import { BadRequestException, Injectable } from '@nestjs/common';
import { ParsedTransaction } from '../types/parsed-transaction';
import { detectColumns, parseCsvLine } from '../utils/column-mapper.util';
import { parseTransactionRow } from '../utils/row-parser.util';

@Injectable()
export class CsvBankParser {
  parse(buffer: Buffer): ParsedTransaction[] {
    const text = buffer.toString('utf-8').replace(/^\uFEFF/, '').trim();
    if (!text) throw new BadRequestException('CSV file is empty');

    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have a header row and at least one transaction');
    }

    const headers = parseCsvLine(lines[0]);
    const mapping = detectColumns(headers);
    if (!mapping) {
      throw new BadRequestException(
        'Could not detect columns. Expected date, description, and amount/debit/credit columns.',
      );
    }

    const transactions: ParsedTransaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const txn = parseTransactionRow(cols, mapping);
      if (txn) transactions.push(txn);
    }

    if (transactions.length === 0) {
      throw new BadRequestException('No valid transactions found in CSV');
    }

    return transactions;
  }
}
