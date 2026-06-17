import { BadRequestException, Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { ParsedTransaction } from '../types/parsed-transaction';
import { parseBankAmount } from '../utils/parse-amount.util';
import { parseBankDate } from '../utils/parse-date.util';

@Injectable()
export class PdfBankParser {
  async parse(buffer: Buffer): Promise<ParsedTransaction[]> {
    const result = await pdfParse(buffer);
    const text = result.text?.trim();
    if (!text) throw new BadRequestException('PDF contains no extractable text');

    const transactions = this.extractFromText(text);
    if (transactions.length === 0) {
      throw new BadRequestException('No valid transactions found in PDF');
    }

    return transactions;
  }

  extractFromText(text: string): ParsedTransaction[] {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const transactions: ParsedTransaction[] = [];

    const patterns = [
      /^(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})\s+(.+?)\s+([\d,]+\.\d{2})\s*(CR|DR)?$/i,
      /^(\d{2}[\/\-.]\d{2}[\/\-.]\d{4})\s+(.+?)\s+(?:INR\s*)?([\d,]+\.\d{2})\s*(CR|DR)?$/i,
      /^(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([\d,]+\.\d{2})\s*(CR|DR)?$/i,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (!match) continue;

        const date = parseBankDate(match[1]);
        const description = match[2].trim();
        const amount = parseBankAmount(match[3]);
        if (!date || !description || !amount) continue;

        const typeFlag = (match[4] ?? '').toUpperCase();
        const type: 'debit' | 'credit' =
          typeFlag === 'CR' ? 'credit' : typeFlag === 'DR' ? 'debit' : 'debit';

        transactions.push({
          date,
          description,
          amount,
          type,
          merchant: description.split(/[-/|@]/)[0]?.trim().slice(0, 100),
        });
        break;
      }
    }

    return transactions;
  }
}
