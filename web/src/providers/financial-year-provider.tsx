'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  FY_STORAGE_KEY,
  effectiveMonthInFY,
  formatFinancialYearLabel,
  formatFinancialYearRange,
  getCurrentFinancialYear,
  isDateInFinancialYear,
  listFinancialYears,
  monthsInFinancialYear,
  parseFinancialYear,
} from '@/lib/financial-year';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

interface FinancialYearContextType {
  financialYear: string | null;
  financialYearLabel: string;
  financialYearRange: string;
  fyMonths: string[];
  activeMonth: string;
  availableYears: ReturnType<typeof listFinancialYears>;
  isReady: boolean;
  setFinancialYear: (fy: string, options?: { skipRedirect?: boolean }) => Promise<void>;
}

const FinancialYearContext = createContext<FinancialYearContextType | null>(null);

const FY_SETUP_PATH = '/select-financial-year';
const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/mfa'];

export function FinancialYearProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [financialYear, setFinancialYearState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setFinancialYearState(null);
      setIsReady(true);
      return;
    }

    const stored = localStorage.getItem(FY_STORAGE_KEY);
    const prefs = user?.financialPreferences as { selectedFinancialYear?: string } | null;
    const currentFY = getCurrentFinancialYear().label;
    let resolved = stored || prefs?.selectedFinancialYear || currentFY;
    // Stale FY (e.g. still on 2025-26 in Jun 2026)  use the FY that contains today
    if (!isDateInFinancialYear(new Date(), resolved)) {
      resolved = currentFY;
    }
    setFinancialYearState(resolved);
    if (localStorage.getItem(FY_STORAGE_KEY) !== resolved) {
      localStorage.setItem(FY_STORAGE_KEY, resolved);
    }
    setIsReady(true);
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!isReady || authLoading || !isAuthenticated) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/auth'));
    if (isPublic) return;
    if (!financialYear && pathname !== FY_SETUP_PATH) {
      router.push(FY_SETUP_PATH);
    }
  }, [isReady, authLoading, isAuthenticated, financialYear, pathname, router]);

  const setFinancialYear = useCallback(
    async (fy: string, options?: { skipRedirect?: boolean }) => {
      parseFinancialYear(fy);
      localStorage.setItem(FY_STORAGE_KEY, fy);
      setFinancialYearState(fy);

      const prefs = (user?.financialPreferences as Record<string, unknown>) ?? {};
      try {
        await usersApi.updateProfile({
          financialPreferences: { ...prefs, selectedFinancialYear: fy },
        });
      } catch {
        // Preference sync is best-effort; local selection still applies
      }

      await queryClient.invalidateQueries();
      if (!options?.skipRedirect && pathname === FY_SETUP_PATH) {
        router.push('/dashboard');
      }
    },
    [user?.financialPreferences, queryClient, pathname, router],
  );

  const value = useMemo(() => {
    const fy = financialYear ?? getCurrentFinancialYear().label;
    return {
      financialYear,
      financialYearLabel: formatFinancialYearLabel(fy),
      financialYearRange: formatFinancialYearRange(fy),
      fyMonths: monthsInFinancialYear(fy),
      activeMonth: effectiveMonthInFY(fy),
      availableYears: listFinancialYears(6),
      isReady,
      setFinancialYear,
    };
  }, [financialYear, isReady, setFinancialYear]);

  return (
    <FinancialYearContext.Provider value={value}>
      {children}
    </FinancialYearContext.Provider>
  );
}

export function useFinancialYear() {
  const ctx = useContext(FinancialYearContext);
  if (!ctx) throw new Error('useFinancialYear must be used within FinancialYearProvider');
  return ctx;
}
