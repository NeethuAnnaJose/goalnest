import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { FinancialYearProvider } from '@/providers/financial-year-provider';
import { ConfirmProvider } from '@/providers/confirm-provider';
import { PromptProvider } from '@/providers/prompt-provider';
import { ThemeProvider } from '@/providers/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'GoalNest',
  description: 'Track salary, spending, savings, loans, and goals. Built for personal finance in India.',
  keywords: ['personal finance', 'budgeting', 'savings', 'financial planning'],
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ConfirmProvider>
                <PromptProvider>
                  <FinancialYearProvider>
                    {children}
                    <Toaster richColors position="top-right" />
                  </FinancialYearProvider>
                </PromptProvider>
              </ConfirmProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
