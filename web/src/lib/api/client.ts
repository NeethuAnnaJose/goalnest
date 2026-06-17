import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Use same-origin /api/v1 in dev (proxied to the Nest backend by next.config rewrites)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        original._retry = true;
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the API. Start the backend (npm run start:dev in the backend folder) and ensure PostgreSQL is running.';
    }
    if (error.response.status === 404) {
      return 'API not found. Use the site at http://localhost:3000 (not 3001) and ensure the backend is running on port 3001.';
    }
    if (error.response.status === 500) {
      const msg = error.response?.data as { message?: string | string[] };
      if (typeof msg?.message === 'string') return msg.message;
      return 'Server error usually the database is not running. Start PostgreSQL (docker compose up -d postgres) and run: npm run prisma:migrate in the backend folder.';
    }
    const msg = error.response?.data as { message?: string | string[] };
    if (Array.isArray(msg?.message)) return msg.message.join(', ');
    if (typeof msg?.message === 'string') return msg.message;
    return error.message;
  }
  return 'Something went wrong';
}
