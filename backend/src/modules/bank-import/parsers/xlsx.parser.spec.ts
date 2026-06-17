import * as XLSX from 'xlsx';
import { XlsxBankParser } from './xlsx.parser';

describe('XlsxBankParser', () => {
  const parser = new XlsxBankParser();

  function buildXlsxBuffer(rows: (string | number)[][]): Buffer {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Statement');
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  it('parses XLSX bank statement rows', () => {
    const buffer = buildXlsxBuffer([
      ['Date', 'Description', 'Debit', 'Credit'],
      ['01/06/2026', 'UBER TRIP', '250.00', ''],
      ['02/06/2026', 'SALARY', '', '75000.00'],
    ]);

    const result = parser.parse(buffer);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      date: '2026-06-01',
      type: 'debit',
      amount: '250.00',
    });
    expect(result[1].type).toBe('credit');
  });
});
