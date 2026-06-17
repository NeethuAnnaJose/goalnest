import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ParsedTransaction } from '../types/parsed-transaction';
import { detectColumns } from '../utils/column-mapper.util';
import { parseTransactionRow } from '../utils/row-parser.util';

@Injectable()
export class XlsxBankParser {
  parse(buffer: Buffer): ParsedTransaction[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new BadRequestException('XLSX file has no sheets');

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
      header: 1,
      raw: false,
      defval: '',
    });

    if (rows.length < 2) {
      throw new BadRequestException('XLSX must have a header row and at least one transaction');
    }

    let headerRowIndex = -1;
    let mapping = null as ReturnType<typeof detectColumns>;

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const headers = rows[i].map((cell) => String(cell ?? '').trim());
      const detected = detectColumns(headers);
      if (detected) {
        headerRowIndex = i;
        mapping = detected;
        break;
      }
    }

    if (headerRowIndex === -1 || !mapping) {
      throw new BadRequestException(
        'Could not detect columns in XLSX. Expected date, description, and amount/debit/credit columns.',
      );
    }

    const transactions: ParsedTransaction[] = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const cols = rows[i].map((cell) => {
        if (cell instanceof Date) return cell.toISOString().slice(0, 10);
        return String(cell ?? '').trim();
      });
      if (cols.every((c) => !c)) continue;

      const txn = parseTransactionRow(cols, mapping);
      if (txn) transactions.push(txn);
    }

    if (transactions.length === 0) {
      throw new BadRequestException('No valid transactions found in XLSX');
    }

    return transactions;
  }
}
