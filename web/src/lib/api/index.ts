import { api } from './client';
import type {
  DashboardData,
  Expense,
  ExpenseCreateResponse,
  Income,
  SavingsAccount,
  SavingsContribution,
  SavingsGrowth,
  Goal,
  Loan,
  EmiPayment,
  EmiTracker,
  EmiFySummary,
  HealthScore,
  AffordabilityResult,
  HousePlannerResult,
  LoanOffersResult,
  Report,
  Notification,
  UserProfile,
  CategoryBreakdown,
  AdminOverview,
  AdminUser,
  AdminSubscription,
  AdminPlan,
  AdminTicket,
  AdminNotification,
} from '@/types/api';

export { authApi } from './auth';

export const usersApi = {
  getProfile: () => api.get<UserProfile>('/users/me').then((r) => r.data),
  updateProfile: (data: Record<string, unknown>) =>
    api.put<UserProfile>('/users/me', data).then((r) => r.data),
};

export const dashboardApi = {
  get: (fy?: string) =>
    api.get<DashboardData>('/dashboard', { params: fy ? { fy } : undefined }).then((r) => r.data),
};

export const expensesApi = {
  list: (params?: { month?: string; fy?: string; category?: string; search?: string }) =>
    api.get<Expense[]>('/expenses', { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post<ExpenseCreateResponse>('/expenses', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<Expense>(`/expenses/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/expenses/${id}`).then((r) => r.data),
  breakdown: (params: { month?: string; fy?: string }) =>
    api.get<CategoryBreakdown[]>('/expenses/breakdown', { params }).then((r) => r.data),
};

export const incomeApi = {
  list: (params?: { month?: string; fy?: string }) =>
    api.get<Income[]>('/income', { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post<Income>('/income', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<Income>(`/income/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/income/${id}`).then((r) => r.data),
};

export const savingsApi = {
  list: () => api.get<SavingsAccount[]>('/savings').then((r) => r.data),
  growth: (fy?: string) =>
    api.get<SavingsGrowth>('/savings/growth', { params: fy ? { fy } : undefined }).then((r) => r.data),
  contributions: (fy?: string, accountId?: string) =>
    api
      .get<SavingsContribution[]>('/savings/contributions', {
        params: { ...(fy ? { fy } : {}), ...(accountId ? { accountId } : {}) },
      })
      .then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post<SavingsAccount>('/savings', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/savings/${id}`, data).then((r) => r.data),
  deposit: (id: string, amount: string) =>
    api.post(`/savings/${id}/deposit`, { amount }).then((r) => r.data),
  recordContribution: (id: string, month: string, amount?: string) =>
    api.post(`/savings/${id}/contributions`, { month, ...(amount ? { amount } : {}) }).then((r) => r.data),
  removeContribution: (id: string, month: string) =>
    api.delete(`/savings/${id}/contributions/${month}`).then((r) => r.data),
  delete: (id: string) => api.delete(`/savings/${id}`).then((r) => r.data),
};

export const goalsApi = {
  list: () => api.get<Goal[]>('/goals').then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post<Goal>('/goals', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/goals/${id}`, data).then((r) => r.data),
  addProgress: (id: string, amount: string) =>
    api.put(`/goals/${id}/progress`, { amount }).then((r) => r.data),
  delete: (id: string) => api.delete(`/goals/${id}`).then((r) => r.data),
};

export const loansApi = {
  list: () => api.get<Loan[]>('/loans').then((r) => r.data),
  get: (id: string) => api.get<Loan>(`/loans/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post<Loan>('/loans', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<Loan>(`/loans/${id}`, data).then((r) => r.data),
  upcomingEmis: () =>
    api.get<EmiPayment[]>('/loans/upcoming-emis').then((r) => r.data),
  delete: (id: string) => api.delete(`/loans/${id}`).then((r) => r.data),
};

export const emisApi = {
  tracker: (loanId: string) =>
    api.get<EmiTracker>(`/emis/tracker/${loanId}`).then((r) => r.data),
  summary: (fy?: string) =>
    api.get<EmiFySummary>('/emis/summary', { params: fy ? { fy } : undefined }).then((r) => r.data),
  pay: (id: string, paidDate: string, notes?: string) =>
    api.post(`/emis/${id}/pay`, { paidDate, notes }).then((r) => r.data),
  unpay: (id: string) => api.post(`/emis/${id}/unpay`).then((r) => r.data),
  markMissed: (id: string) => api.post(`/emis/${id}/missed`).then((r) => r.data),
};

export const healthScoreApi = {
  get: () => api.get<HealthScore>('/health-score').then((r) => r.data),
};

export const housePlannerApi = {
  plan: (data: {
    propertyPrice: string;
    downPaymentPercent: string;
    interestRate: string;
    monthlyPayment: string;
  }) => api.post<HousePlannerResult>('/house-planner', data).then((r) => r.data),

  loanOffers: (data: {
    loanType: 'HOUSE' | 'CAR';
    loanAmount: string;
    currentInterestRate: string;
    monthlyPayment: string;
  }) => api.post<LoanOffersResult>('/house-planner/loan-offers', data).then((r) => r.data),
};

export const affordabilityApi = {
  analyze: (data: { productName: string; productCost: string }) =>
    api.post<AffordabilityResult>('/affordability', data).then((r) => r.data),
};

export const reportsApi = {
  list: () => api.get<Report[]>('/reports').then((r) => r.data),
  generate: (data: { period: string; format: string }) =>
    api.post<Report>('/reports/generate', data).then((r) => r.data),
  exportCsv: (id: string) =>
    api.get<string>(`/reports/${id}/export/csv`).then((r) => r.data),
  exportExcel: (id: string) =>
    api.get<ArrayBuffer>(`/reports/${id}/export/excel`, { responseType: 'arraybuffer' }).then((r) => r.data),
  delete: (id: string) => api.delete(`/reports/${id}`).then((r) => r.data),
};

export const aiInsightsApi = {
  list: (params?: { period?: string; category?: string }) =>
    api.get('/ai-insights', { params }).then((r) => r.data),
  generateDaily: () => api.post('/ai-insights/daily').then((r) => r.data),
  generateWeekly: () => api.post('/ai-insights/weekly').then((r) => r.data),
  generateMonthly: () => api.post('/ai-insights/monthly').then((r) => r.data),
  detectOverspending: () => api.post('/ai-insights/overspending').then((r) => r.data),
  goalRecommendations: () => api.post('/ai-insights/goal-recommendations').then((r) => r.data),
  markRead: (id: string) => api.put(`/ai-insights/${id}/read`).then((r) => r.data),
};

export const notificationsApi = {
  list: (unreadOnly?: boolean) =>
    api.get<Notification[]>('/notifications', { params: { unreadOnly } }).then((r) => r.data),
  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.put('/notifications/read-all').then((r) => r.data),
  delete: (id: string) => api.delete(`/notifications/${id}`).then((r) => r.data),
};

export const adminApi = {
  overview: () => api.get<AdminOverview>('/admin/overview').then((r) => r.data),
  users: (params?: { search?: string; role?: string; planTier?: string; page?: number }) =>
    api.get<{ users: AdminUser[]; total: number; page: number; pages: number }>('/admin/users', { params }).then((r) => r.data),
  updateUser: (id: string, data: { role?: string; planTier?: string; suspended?: boolean }) =>
    api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  subscriptions: (page = 1) =>
    api.get<{ subscriptions: AdminSubscription[]; total: number }>('/admin/subscriptions', { params: { page } }).then((r) => r.data),
  plans: () => api.get<AdminPlan[]>('/admin/plans').then((r) => r.data),
  analytics: (days = 30) =>
    api.get('/admin/analytics', { params: { days } }).then((r) => r.data),
  reports: (page = 1) =>
    api.get('/admin/reports', { params: { page } }).then((r) => r.data),
  revenue: (period: 'month' | 'year' | 'all' = 'month') =>
    api.get('/admin/revenue', { params: { period } }).then((r) => r.data),
  tickets: (params?: { status?: string; priority?: string; page?: number }) =>
    api.get<{ tickets: AdminTicket[]; total: number }>('/admin/tickets', { params }).then((r) => r.data),
  updateTicket: (id: string, data: { status?: string; priority?: string }) =>
    api.patch(`/admin/tickets/${id}`, data).then((r) => r.data),
  replyTicket: (id: string, message: string) =>
    api.post(`/admin/tickets/${id}/reply`, { message }).then((r) => r.data),
  notifications: (page = 1, type?: string) =>
    api.get<{ notifications: AdminNotification[]; total: number }>('/admin/notifications', { params: { page, type } }).then((r) => r.data),
  broadcast: (data: { type: string; channel: string; title: string; body: string; userIds?: string[] }) =>
    api.post('/admin/notifications/broadcast', data).then((r) => r.data),
};
