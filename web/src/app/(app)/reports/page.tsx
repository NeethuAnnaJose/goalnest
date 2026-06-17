'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, Download, FileText, Landmark, PiggyBank,
  Target, Trash2, TrendingDown, TrendingUp, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { reportsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { BulkSelectToolbar } from '@/components/ui/bulk-select-toolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { useBulkDelete } from '@/hooks/use-bulk-delete';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { useMemo, useState } from 'react';
import type { Report } from '@/types/api';

function reportDisplayName(report: Report): string {
  if (report.name) return report.name;
  if (report.metadata?.name) return report.metadata.name;
  return `${report.period} report, ${formatDate(report.startDate)}`;
}

function formatCategoryLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

type SectionTheme = {
  border: string;
  bg: string;
  header: string;
  icon: string;
  tableHead: string;
  card: string;
};

const SECTION_THEMES: Record<string, SectionTheme> = {
  summary: {
    border: 'border-l-slate-500',
    bg: 'bg-slate-50/80 dark:bg-slate-900/40',
    header: 'text-slate-700 dark:text-slate-200',
    icon: 'text-slate-600 dark:text-slate-300',
    tableHead: 'bg-slate-100/80 dark:bg-slate-800/60',
    card: 'bg-white/70 dark:bg-slate-950/30 border-slate-200 dark:border-slate-700',
  },
  income: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/25',
    header: 'text-emerald-800 dark:text-emerald-200',
    icon: 'text-emerald-600 dark:text-emerald-400',
    tableHead: 'bg-emerald-100/70 dark:bg-emerald-900/40',
    card: 'bg-white/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
  },
  expenses: {
    border: 'border-l-rose-500',
    bg: 'bg-rose-50/70 dark:bg-rose-950/25',
    header: 'text-rose-800 dark:text-rose-200',
    icon: 'text-rose-600 dark:text-rose-400',
    tableHead: 'bg-rose-100/70 dark:bg-rose-900/40',
    card: 'bg-white/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
  },
  savings: {
    border: 'border-l-sky-500',
    bg: 'bg-sky-50/70 dark:bg-sky-950/25',
    header: 'text-sky-800 dark:text-sky-200',
    icon: 'text-sky-600 dark:text-sky-400',
    tableHead: 'bg-sky-100/70 dark:bg-sky-900/40',
    card: 'bg-white/70 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800',
  },
  goals: {
    border: 'border-l-violet-500',
    bg: 'bg-violet-50/70 dark:bg-violet-950/25',
    header: 'text-violet-800 dark:text-violet-200',
    icon: 'text-violet-600 dark:text-violet-400',
    tableHead: 'bg-violet-100/70 dark:bg-violet-900/40',
    card: 'bg-white/70 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800',
  },
  loans: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50/70 dark:bg-amber-950/25',
    header: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
    tableHead: 'bg-amber-100/70 dark:bg-amber-900/40',
    card: 'bg-white/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  },
};

function ReportSection({
  theme,
  title,
  icon: Icon,
  children,
}: {
  theme: SectionTheme;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-l-4 p-5 shadow-sm ${theme.border} ${theme.bg}`}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <div className={`rounded-lg bg-white/80 p-2 shadow-sm dark:bg-black/20 ${theme.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className={`text-sm font-semibold tracking-wide ${theme.header}`}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DetailTable({
  headers,
  rows,
  emptyMessage,
  theme,
}: {
  headers: string[];
  rows: (string | number)[][];
  emptyMessage?: string;
  theme: SectionTheme;
}) {
  if (rows.length === 0) {
    return emptyMessage ? (
      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    ) : null;
  }
  return (
    <div className={`rounded-lg border overflow-x-auto ${theme.card}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${theme.tableHead}`}>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide opacity-80">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 tabular-nums">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportViewer({ report, onClose }: { report: Report; onClose: () => void }) {
  const meta = report.metadata;
  const summary = meta?.summary;
  const expenseCategories = meta?.expenses ? Object.entries(meta.expenses) : [];

  const safeFilename = reportDisplayName(report).replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  const downloadExcel = async () => {
    try {
      const data = await reportsApi.exportExcel(report.id);
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFilename}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const downloadCsv = async () => {
    try {
      const csv = await reportsApi.exportCsv(report.id);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFilename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 py-4 px-4">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold leading-snug">{reportDisplayName(report)}</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{report.period}</Badge>
            <Badge variant="outline">{report.format}</Badge>
            <span className="text-xs text-muted-foreground">
              Generated {formatDate(report.createdAt)}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-6 pt-0">
        <p className="mb-8 rounded-lg bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
          {formatDate(report.startDate)} to {formatDate(report.endDate)}
        </p>

        <div className="space-y-8">
          {summary && (
            <ReportSection theme={SECTION_THEMES.summary} title="Summary" icon={BarChart3}>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: 'Total Income', value: `₹${summary.totalIncome}`, tint: 'text-emerald-700 dark:text-emerald-300' },
                  { label: 'Total Expenses', value: `₹${summary.totalExpenses}`, tint: 'text-rose-700 dark:text-rose-300' },
                  { label: 'Net Savings', value: `₹${summary.netSavings}`, tint: 'text-sky-700 dark:text-sky-300' },
                  { label: 'Savings Rate', value: summary.savingsRate != null ? `${summary.savingsRate}%` : '-', tint: 'text-violet-700 dark:text-violet-300' },
                ].map(({ label, value, tint }) => (
                  <div key={label} className={`rounded-lg border p-4 ${SECTION_THEMES.summary.card}`}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className={`mt-1.5 text-lg font-bold tabular-nums ${tint}`}>{value}</p>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}

          <ReportSection theme={SECTION_THEMES.income} title="Income" icon={TrendingUp}>
            <DetailTable
              theme={SECTION_THEMES.income}
              headers={['Date', 'Type', 'Amount', 'Notes']}
              rows={(meta?.incomes ?? []).map((i) => [
                formatDate(i.date),
                formatCategoryLabel(i.type),
                `₹${i.amount}`,
                [i.category, i.notes].filter(Boolean).join(', ') || '-',
              ])}
              emptyMessage="No income recorded in this period."
            />
          </ReportSection>

          <ReportSection theme={SECTION_THEMES.expenses} title="Expenses" icon={TrendingDown}>
            <div className="space-y-4">
              {expenseCategories.length === 0 ? (
                <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  No expenses recorded in this period.
                </p>
              ) : (
                expenseCategories.map(([category, group]) => (
                  <div key={category} className={`rounded-lg border overflow-hidden ${SECTION_THEMES.expenses.card}`}>
                    <div className={`flex items-center justify-between px-4 py-3 ${SECTION_THEMES.expenses.tableHead}`}>
                      <span className="text-sm font-semibold">{formatCategoryLabel(category)}</span>
                      <span className="text-sm font-bold tabular-nums text-rose-700 dark:text-rose-300">
                        ₹{group.total}
                      </span>
                    </div>
                    {group.items.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">No items</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-rose-100 dark:border-rose-900/50">
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide opacity-70">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide opacity-70">Description</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide opacity-70">Merchant</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide opacity-70">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100/80 dark:divide-rose-900/40">
                          {group.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                              <td className="px-3 py-2.5">{formatDate(item.date)}</td>
                              <td className="px-3 py-2.5">{item.description}</td>
                              <td className="px-3 py-2.5 text-muted-foreground">{item.merchant || '-'}</td>
                              <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                                ₹{item.amount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))
              )}
            </div>
          </ReportSection>

          <ReportSection theme={SECTION_THEMES.savings} title="Savings Accounts" icon={PiggyBank}>
            <DetailTable
              theme={SECTION_THEMES.savings}
              headers={['Account', 'Type', 'Institution', 'Balance']}
              rows={(meta?.savingsAccounts ?? []).map((a) => [
                a.name,
                formatCategoryLabel(a.type),
                a.institution || '-',
                `₹${a.balance}`,
              ])}
              emptyMessage="No savings accounts."
            />
            {meta?.totalSavingsBalance != null && (meta.savingsAccounts ?? []).length > 0 && (
              <p className="mt-4 rounded-lg border border-sky-200 bg-sky-100/50 px-4 py-2.5 text-right text-sm font-bold tabular-nums text-sky-800 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
                Total savings: ₹{meta.totalSavingsBalance}
              </p>
            )}
          </ReportSection>

          <ReportSection theme={SECTION_THEMES.goals} title="Goals" icon={Target}>
            <DetailTable
              theme={SECTION_THEMES.goals}
              headers={['Goal', 'Type', 'Progress', 'Saved', 'Target', 'Target Date']}
              rows={(meta?.goals ?? []).map((g) => [
                g.name,
                formatCategoryLabel(g.type),
                `${g.progressPercent}%${g.isCompleted ? ' ✓' : ''}`,
                `₹${g.currentSavings}`,
                `₹${g.targetAmount}`,
                g.targetDate ? formatDate(g.targetDate) : '-',
              ])}
              emptyMessage="No goals."
            />
          </ReportSection>

          <ReportSection theme={SECTION_THEMES.loans} title="Loans" icon={Landmark}>
            <DetailTable
              theme={SECTION_THEMES.loans}
              headers={['Loan', 'Type', 'EMI', 'Remaining', 'Lender']}
              rows={(meta?.loans ?? []).map((l) => [
                l.name,
                formatCategoryLabel(l.type),
                `₹${l.emiAmount}/mo`,
                `₹${l.remainingBalance}`,
                l.lender || '-',
              ])}
              emptyMessage="No loans."
            />
          </ReportSection>
        </div>

        {meta?.transactionCount && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            {meta.transactionCount.income} income · {meta.transactionCount.expenses} expense transactions in period
          </p>
        )}

        {!meta?.expenses && !meta?.incomes && (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            This is an older report with limited detail. Generate a new report to see full breakdowns.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-2 border-t pt-6">
          <Button size="sm" onClick={downloadExcel}>
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCsv}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('MONTHLY');
  const [format, setFormat] = useState('PDF');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const queryClient = useQueryClient();
  const { confirmDelete } = useConfirmDelete();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list(),
  });

  const reportIds = useMemo(() => (reports ?? []).map((r) => r.id), [reports]);
  const reportSelection = useBulkSelection(reportIds);
  const { deleteSelected: deleteSelectedReports, deleting: bulkDeleting } = useBulkDelete({
    deleteFn: (id) => reportsApi.delete(id),
    itemLabel: 'reports',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      if (selectedReport && reportSelection.selectedIds.includes(selectedReport.id)) {
        setSelectedReport(null);
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => reportsApi.generate({ period, format }),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSelectedReport(report);
      toast.success('Report generated');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      if (selectedReport?.id === id) setSelectedReport(null);
      toast.success('Report deleted');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await confirmDelete('this report')) deleteMutation.mutate(id);
  };

  return (
    <>
      <Header title="Reports" description="Generate and download financial reports" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Generate Report</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['PDF', 'EXCEL', 'CSV'].map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                <FileText className="mr-2 h-4 w-4" />
                {generateMutation.isPending ? 'Generating...' : 'Generate'}
              </Button>
            </CardContent>
          </Card>

          {selectedReport && (
            <ReportViewer report={selectedReport} onClose={() => setSelectedReport(null)} />
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Your Reports</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (reports ?? []).length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No reports yet. Generate your first report above.
                </p>
              ) : (
                <>
                  <BulkSelectToolbar
                    totalCount={reportSelection.totalCount}
                    selectedCount={reportSelection.selectedCount}
                    allSelected={reportSelection.allSelected}
                    onToggleAll={reportSelection.toggleAll}
                    onDeleteSelected={() =>
                      deleteSelectedReports(reportSelection.selectedIds, reportSelection.clear)
                    }
                    deleting={bulkDeleting || deleteMutation.isPending}
                    itemLabel="reports"
                  />
                  <div className="space-y-2">
                  {(reports ?? []).map((report) => (
                    <div
                      key={report.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30 ${
                        selectedReport?.id === report.id ? 'border-primary/50 bg-muted/40' : ''
                      } ${reportSelection.isSelected(report.id) ? 'border-primary/40 bg-primary/5' : ''}`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <Checkbox
                          checked={reportSelection.isSelected(report.id)}
                          onCheckedChange={() => reportSelection.toggle(report.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{reportDisplayName(report)}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">{report.period}</Badge>
                            <Badge variant="outline" className="text-[10px]">{report.format}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(report.startDate)} to {formatDate(report.endDate)}
                            {' · '}Created {formatDate(report.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        title="Delete report"
                        onClick={(e) => handleDelete(report.id, e)}
                        disabled={deleteMutation.isPending || bulkDeleting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
