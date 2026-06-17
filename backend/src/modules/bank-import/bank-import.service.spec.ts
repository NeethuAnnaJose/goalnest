import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BankImportService } from './bank-import.service';
import { CsvBankParser } from './parsers/csv.parser';
import { XlsxBankParser } from './parsers/xlsx.parser';
import { PdfBankParser } from './parsers/pdf.parser';
import { TransactionCategorizerService } from './categorizer/transaction-categorizer.service';
import { ExpensesService } from '../expenses/expenses.service';
import { IncomeService } from '../income/income.service';

describe('BankImportService', () => {
  let service: BankImportService;

  const expensesService = {
    create: jest.fn().mockResolvedValue({ id: 'e1' }),
  };
  const incomeService = {
    create: jest.fn().mockResolvedValue({ id: 'i1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankImportService,
        CsvBankParser,
        XlsxBankParser,
        PdfBankParser,
        TransactionCategorizerService,
        { provide: ExpensesService, useValue: expensesService },
        { provide: IncomeService, useValue: incomeService },
      ],
    }).compile();

    service = module.get(BankImportService);
    jest.clearAllMocks();
  });

  it('detects file type from extension', () => {
    expect(service.detectFileType('statement.csv', 'text/plain')).toBe('csv');
    expect(service.detectFileType('statement.xlsx', 'application/octet-stream')).toBe('xlsx');
    expect(service.detectFileType('statement.pdf', 'application/pdf')).toBe('pdf');
  });

  it('rejects unsupported file types', () => {
    expect(() => service.detectFileType('file.txt', 'text/plain')).toThrow(BadRequestException);
  });

  it('imports CSV transactions into expenses and income', async () => {
    const csv = [
      'Date,Description,Debit,Credit',
      '01/06/2026,SWIGGY FOOD,450.00,',
      '02/06/2026,SALARY CREDIT,,50000.00',
    ].join('\n');

    const result = await service.importStatement(
      'u1',
      Buffer.from(csv),
      'statement.csv',
      'text/csv',
    );

    expect(result.totalParsed).toBe(2);
    expect(result.expensesImported).toBe(1);
    expect(result.incomeImported).toBe(1);
    expect(result.fileType).toBe('csv');
    expect(expensesService.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ category: 'FOOD', tags: expect.arrayContaining(['bank-import', 'Food']) }),
    );
    expect(incomeService.create).toHaveBeenCalled();
  });

  it('returns preview without saving', async () => {
    const csv = 'Date,Description,Debit,Credit\n01/06/2026,UBER TRIP,200.00,';
    const result = await service.importStatement(
      'u1',
      Buffer.from(csv),
      'statement.csv',
      'text/csv',
      true,
    );

    expect(result.expensesImported).toBe(0);
    expect(result.incomeImported).toBe(0);
    expect(result.transactions).toHaveLength(1);
    expect(expensesService.create).not.toHaveBeenCalled();
  });
});
