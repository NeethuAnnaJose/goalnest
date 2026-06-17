'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usersApi } from '@/lib/api';
import type { UserProfile } from '@/types/api';
import { FY_STORAGE_KEY } from '@/lib/financial-year';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/mfa', '/select-financial-year'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/auth'));
    if (!user && !isPublic) router.push('/login');
  }, [user, isLoading, pathname, router]);

  const setTokens = (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    refreshUser();
  };

  const logout = () => {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
      import('@/lib/api/auth').then(({ authApi }) => authApi.logout(refresh).catch(() => {}));
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(FY_STORAGE_KEY);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setTokens,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
