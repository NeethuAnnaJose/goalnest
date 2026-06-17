import { BadRequestException, Injectable } from '@nestjs/common';
import { ExpensesService } from '../expenses/expenses.service';
import { IncomeService } from '../income/income.service';
import { CsvBankParser } from './parsers/csv.parser';
import { XlsxBankParser } from './parsers/xlsx.parser';
import { PdfBankParser } from './parsers/pdf.parser';
import { TransactionCategorizerService } from './categorizer/transaction-categorizer.service';
import { ParsedTransaction } from './types/parsed-transaction';
import { BankImportResultDto } from './dto/bank-import.dto';

const MAX_TRANSACTIONS = 500;
const ALLOWED_MIME_TYPES: Record<string, 'csv' | 'xlsx' | 'pdf'> = {
  'text/csv': 'csv',
  'application/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xlsx',
  'application/pdf': 'pdf',
};

@Injectable()
export class BankImportService {
  constructor(
    private csvParser: CsvBankParser,
    private xlsxParser: XlsxBankParser,
    private pdfParser: PdfBankParser,
    private categorizer: TransactionCategorizerService,
    private expensesService: ExpensesService,
    private incomeService: IncomeService,
  ) {}

  detectFileType(filename: string, mimetype: string): 'csv' | 'xlsx' | 'pdf' {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'csv') return 'csv';
    if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
    if (ext === 'pdf') return 'pdf';

    const fromMime = ALLOWED_MIME_TYPES[mimetype];
    if (fromMime) return fromMime;

    throw new BadRequestException('Unsupported file type. Use PDF, CSV, or XLSX.');
  }

  async parseFile(
    buffer: Buffer,
    fileType: 'csv' | 'xlsx' | 'pdf',
  ): Promise<ParsedTransaction[]> {
    switch (fileType) {
      case 'csv':
        return this.csvParser.parse(buffer);
      case 'xlsx':
        return this.xlsxParser.parse(buffer);
      case 'pdf':
        return this.pdfParser.parse(buffer);
      default:
        throw new BadRequestException('Unsupported file type');
    }
  }

  async importStatement(
    userId: string,
    buffer: Buffer,
    filename: string,
    mimetype: string,
    preview = false,
  ): Promise<BankImportResultDto & { transactions?: ReturnType<TransactionCategorizerService['categorizeAll']> }> {
    const fileType = this.detectFileType(filename, mimetype);
    const parsed = await this.parseFile(buffer, fileType);

    if (parsed.length > MAX_TRANSACTIONS) {
      throw new BadRequestException(`Maximum ${MAX_TRANSACTIONS} transactions per import`);
    }

    const categorized = this.categorizer.categorizeAll(parsed);
    const categoryBreakdown: Record<string, number> = {};

    for (const txn of categorized) {
      categoryBreakdown[txn.category] = (categoryBreakdown[txn.category] ?? 0) + 1;
    }

    if (preview) {
      return {
        fileType,
        totalParsed: categorized.length,
        expensesImported: 0,
        incomeImported: 0,
        skipped: 0,
        categoryBreakdown,
        transactions: categorized,
      };
    }

    let expensesImported = 0;
    let incomeImported = 0;
    let skipped = 0;

    for (const txn of categorized) {
      try {
        if (txn.type === 'debit') {
          await this.expensesService.create(userId, {
            category: this.categorizer.toExpenseCategory(txn.category),
            amount: txn.amount,
            date: txn.date,
            description: txn.description,
            merchant: txn.merchant,
            tags: ['bank-import', txn.category],
          });
          expensesImported++;
        } else {
          await this.incomeService.create(userId, {
            type: this.categorizer.detectIncomeType(txn.description),
            amount: txn.amount,
            date: txn.date,
            category: txn.category,
            notes: txn.description,
          });
          incomeImported++;
        }
      } catch {
        skipped++;
      }
    }

    return {
      fileType,
      totalParsed: categorized.length,
      expensesImported,
      incomeImported,
      skipped,
      categoryBreakdown,
    };
  }
}
