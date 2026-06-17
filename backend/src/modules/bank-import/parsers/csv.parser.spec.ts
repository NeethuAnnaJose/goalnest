import { BadRequestException } from '@nestjs/common';
import { CsvBankParser } from './csv.parser';

describe('CsvBankParser', () => {
  const parser = new CsvBankParser();

  it('parses CSV with debit/credit columns', () => {
    const csv = [
      'Date,Description,Debit,Credit',
      '01/06/2026,SWIGGY FOOD,450.00,',
      '02/06/2026,SALARY CREDIT,,50000.00',
    ].join('\n');

    const result = parser.parse(Buffer.from(csv));
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      date: '2026-06-01',
      description: 'SWIGGY FOOD',
      amount: '450.00',
      type: 'debit',
    });
    expect(result[1]).toMatchObject({
      type: 'credit',
      amount: '50000.00',
    });
  });

  it('parses CSV with amount column', () => {
    const csv = [
      'Transaction Date,Narration,Amount,Type',
      '2026-06-01,AMAZON PURCHASE,-1299.00,DR',
      '2026-06-02,SALARY,50000.00,CR',
    ].join('\n');

    const result = parser.parse(Buffer.from(csv));
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('debit');
    expect(result[1].type).toBe('credit');
  });

  it('rejects empty CSV', () => {
    expect(() => parser.parse(Buffer.from(''))).toThrow(BadRequestException);
  });

  it('rejects CSV without detectable columns', () => {
    expect(() => parser.parse(Buffer.from('foo,bar\n1,2'))).toThrow(BadRequestException);
  });
});
