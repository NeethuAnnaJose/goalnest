import { Module } from '@nestjs/common';
import { BankImportController } from './bank-import.controller';
import { BankImportService } from './bank-import.service';
import { CsvBankParser } from './parsers/csv.parser';
import { XlsxBankParser } from './parsers/xlsx.parser';
import { PdfBankParser } from './parsers/pdf.parser';
import { TransactionCategorizerService } from './categorizer/transaction-categorizer.service';
import { ExpensesModule } from '../expenses/expenses.module';
import { IncomeModule } from '../income/income.module';

@Module({
  imports: [ExpensesModule, IncomeModule],
  controllers: [BankImportController],
  providers: [
    BankImportService,
    CsvBankParser,
    XlsxBankParser,
    PdfBankParser,
    TransactionCategorizerService,
  ],
  exports: [BankImportService],
})
export class BankImportModule {}
