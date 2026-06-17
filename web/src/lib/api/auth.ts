import { api } from './client';
import type { AuthTokens, MfaLoginResponse } from '@/types/api';

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post<AuthTokens>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens | MfaLoginResponse>('/auth/login', data).then((r) => r.data),

  verifyMfa: (data: { code: string; tempToken: string }) =>
    api.post<AuthTokens>('/auth/mfa/verify', data).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }).then((r) => r.data),
};
