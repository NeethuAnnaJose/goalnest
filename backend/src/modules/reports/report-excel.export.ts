import ExcelJS from 'exceljs';

type ReportMeta = Record<string, unknown>;

const SECTION_STYLES = {
  summary: { fill: 'FFE2E8F0', font: 'FF334155', accent: 'FF64748B' },
  income: { fill: 'FFD1FAE5', font: 'FF047857', accent: 'FF10B981' },
  expenses: { fill: 'FFFFE4E6', font: 'FFBE123C', accent: 'FFF43F5E' },
  savings: { fill: 'FFE0F2FE', font: 'FF0369A1', accent: 'FF0EA5E9' },
  goals: { fill: 'FFEDE9FE', font: 'FF6D28D9', accent: 'FF8B5CF6' },
  loans: { fill: 'FFFEF3C7', font: 'FFB45309', accent: 'FFF59E0B' },
} as const;

function formatCategoryLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function styleSectionHeader(row: ExcelJS.Row, style: (typeof SECTION_STYLES)[keyof typeof SECTION_STYLES], cols = 6) {
  row.height = 24;
  for (let c = 1; c <= cols; c++) {
    const cell = row.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
    cell.font = { bold: true, size: 12, color: { argb: style.font } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      left: { style: 'medium', color: { argb: style.accent } },
      top: { style: 'thin', color: { argb: style.accent } },
      bottom: { style: 'thin', color: { argb: style.accent } },
      right: { style: 'thin', color: { argb: style.accent } },
    };
  }
  if (cols > 1) {
    row.worksheet.mergeCells(row.number, 1, row.number, cols);
  }
}

function styleTableHeader(row: ExcelJS.Row, style: (typeof SECTION_STYLES)[keyof typeof SECTION_STYLES]) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
    cell.font = { bold: true, size: 10, color: { argb: style.font } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: style.accent } },
    };
  });
}

function styleDataRow(row: ExcelJS.Row, zebra: boolean) {
  row.eachCell((cell) => {
    if (zebra) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
    cell.border = {
      bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
    };
    cell.alignment = { vertical: 'middle' };
  });
}

function addGap(sheet: ExcelJS.Worksheet, rows = 1) {
  for (let i = 0; i < rows; i++) sheet.addRow([]);
}

export async function buildReportExcel(
  reportName: string,
  startDate: Date,
  endDate: Date,
  meta: ReportMeta,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GoalNest';
  const sheet = workbook.addWorksheet('Financial Report', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { width: 14 },
    { width: 22 },
    { width: 28 },
    { width: 18 },
    { width: 16 },
    { width: 24 },
  ];

  const titleRow = sheet.addRow([reportName]);
  titleRow.font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };
  sheet.mergeCells(1, 1, 1, 6);

  const periodRow = sheet.addRow([
    `${formatDisplayDate(startDate.toISOString())}  ${formatDisplayDate(endDate.toISOString())}`,
  ]);
  periodRow.font = { size: 11, color: { argb: 'FF64748B' } };
  sheet.mergeCells(2, 1, 2, 6);

  addGap(sheet, 2);

  const summary = meta.summary as Record<string, string | number> | undefined;
  if (summary) {
    const style = SECTION_STYLES.summary;
    const header = sheet.addRow(['Summary']);
    styleSectionHeader(header, style);

    const summaryRows = [
      ['Total Income', `₹${summary.totalIncome}`, 'Total Expenses', `₹${summary.totalExpenses}`],
      ['Net Savings', `₹${summary.netSavings}`, 'Savings Rate', summary.savingsRate != null ? `${summary.savingsRate}%` : '-'],
    ];
    for (const [i, rowData] of summaryRows.entries()) {
      const row = sheet.addRow(rowData);
      row.eachCell((cell, col) => {
        if (col % 2 === 1) {
          cell.font = { bold: true, color: { argb: style.font } };
        } else {
          cell.font = { bold: true, size: 11 };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' } };
      });
    }
    addGap(sheet);
  }

  const incomes = (meta.incomes ?? []) as {
    type: string;
    amount: string;
    date: string;
    category: string | null;
    notes: string | null;
  }[];
  {
    const style = SECTION_STYLES.income;
    const header = sheet.addRow(['Income']);
    styleSectionHeader(header, style);
    const tableHeader = sheet.addRow(['Date', 'Type', 'Amount', 'Notes', '', '']);
    styleTableHeader(tableHeader, style);
    if (incomes.length === 0) {
      sheet.addRow(['No income recorded in this period.', '', '', '', '', '']);
    } else {
      incomes.forEach((item, i) => {
        const row = sheet.addRow([
          formatDisplayDate(item.date),
          formatCategoryLabel(item.type),
          `₹${item.amount}`,
          [item.category, item.notes].filter(Boolean).join(', ') || '-',
        ]);
        styleDataRow(row, i % 2 === 0);
      });
    }
    addGap(sheet);
  }

  const expenses = meta.expenses as Record<
    string,
    { total: string; items: { date: string; description: string; merchant: string; amount: string }[] }
  >;
  {
    const style = SECTION_STYLES.expenses;
    const header = sheet.addRow(['Expenses']);
    styleSectionHeader(header, style);

    const entries = expenses ? Object.entries(expenses) : [];
    if (entries.length === 0) {
      sheet.addRow(['No expenses recorded in this period.', '', '', '', '', '']);
    } else {
      for (const [category, group] of entries) {
        const catRow = sheet.addRow([formatCategoryLabel(category), '', '', '', 'Total', `₹${group.total}`]);
        catRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
          cell.font = { bold: true, color: { argb: style.font } };
        });
        const tableHeader = sheet.addRow(['Date', 'Description', 'Merchant', 'Amount', '', '']);
        styleTableHeader(tableHeader, style);
        group.items.forEach((item, i) => {
          const row = sheet.addRow([
            formatDisplayDate(item.date),
            item.description,
            item.merchant || '-',
            `₹${item.amount}`,
          ]);
          styleDataRow(row, i % 2 === 0);
        });
        addGap(sheet, 1);
      }
    }
    addGap(sheet);
  }

  const savingsAccounts = (meta.savingsAccounts ?? []) as {
    name: string;
    type: string;
    balance: string;
    institution: string | null;
  }[];
  {
    const style = SECTION_STYLES.savings;
    const header = sheet.addRow(['Savings Accounts']);
    styleSectionHeader(header, style);
    const tableHeader = sheet.addRow(['Account', 'Type', 'Institution', 'Balance', '', '']);
    styleTableHeader(tableHeader, style);
    if (savingsAccounts.length === 0) {
      sheet.addRow(['No savings accounts.', '', '', '', '', '']);
    } else {
      savingsAccounts.forEach((a, i) => {
        const row = sheet.addRow([
          a.name,
          formatCategoryLabel(a.type),
          a.institution || '-',
          `₹${a.balance}`,
        ]);
        styleDataRow(row, i % 2 === 0);
      });
      if (meta.totalSavingsBalance) {
        const totalRow = sheet.addRow(['', '', 'Total savings', `₹${meta.totalSavingsBalance}`]);
        totalRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: style.font } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: style.fill } };
        });
      }
    }
    addGap(sheet);
  }

  const goals = (meta.goals ?? []) as {
    name: string;
    type: string;
    targetAmount: string;
    currentSavings: string;
    progressPercent: number;
    targetDate: string | null;
    isCompleted: boolean;
  }[];
  {
    const style = SECTION_STYLES.goals;
    const header = sheet.addRow(['Goals']);
    styleSectionHeader(header, style);
    const tableHeader = sheet.addRow(['Goal', 'Type', 'Progress', 'Saved', 'Target', 'Target Date']);
    styleTableHeader(tableHeader, style);
    if (goals.length === 0) {
      sheet.addRow(['No goals.', '', '', '', '', '']);
    } else {
      goals.forEach((g, i) => {
        const row = sheet.addRow([
          g.name,
          formatCategoryLabel(g.type),
          `${g.progressPercent}%${g.isCompleted ? ' ✓' : ''}`,
          `₹${g.currentSavings}`,
          `₹${g.targetAmount}`,
          g.targetDate ? formatDisplayDate(g.targetDate) : '-',
        ]);
        styleDataRow(row, i % 2 === 0);
      });
    }
    addGap(sheet);
  }

  const loans = (meta.loans ?? []) as {
    name: string;
    type: string;
    emiAmount: string;
    remainingBalance: string;
    lender: string | null;
  }[];
  {
    const style = SECTION_STYLES.loans;
    const header = sheet.addRow(['Loans']);
    styleSectionHeader(header, style);
    const tableHeader = sheet.addRow(['Loan', 'Type', 'EMI', 'Remaining', 'Lender', '']);
    styleTableHeader(tableHeader, style);
    if (loans.length === 0) {
      sheet.addRow(['No loans.', '', '', '', '', '']);
    } else {
      loans.forEach((l, i) => {
        const row = sheet.addRow([
          l.name,
          formatCategoryLabel(l.type),
          `₹${l.emiAmount}/mo`,
          `₹${l.remainingBalance}`,
          l.lender || '-',
        ]);
        styleDataRow(row, i % 2 === 0);
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
