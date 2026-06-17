import { PdfBankParser } from './pdf.parser';

describe('PdfBankParser', () => {
  const parser = new PdfBankParser();

  it('extracts transactions from statement text', () => {
    const text = [
      'Account Statement',
      '01/06/2026 SWIGGY FOOD DELIVERY 450.00 DR',
      '02/06/2026 SALARY CREDIT 50000.00 CR',
      '03/06/2026 APOLLO PHARMACY 850.00 DR',
    ].join('\n');

    const result = parser.extractFromText(text);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      date: '2026-06-01',
      description: 'SWIGGY FOOD DELIVERY',
      amount: '450.00',
      type: 'debit',
    });
    expect(result[1].type).toBe('credit');
  });

  it('returns empty array for unparseable text', () => {
    expect(parser.extractFromText('No transactions here')).toEqual([]);
  });
});
