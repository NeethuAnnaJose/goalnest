'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';
import { useAuth } from '@/providers/auth-provider';

export default function MfaPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setTokens } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempToken = sessionStorage.getItem('mfaTempToken');
    if (!tempToken) {
      toast.error('MFA session expired. Please sign in again.');
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.verifyMfa({ code, tempToken });
      sessionStorage.removeItem('mfaTempToken');
      setTokens(result.accessToken, result.refreshToken);
      toast.success('Verified successfully!');
      router.push('/select-financial-year');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Two-factor authentication" subtitle="Enter the 6-digit code from your authenticator app">
      <div className="flex justify-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Shield className="h-8 w-8 text-primary" />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Authentication code</Label>
          <Input
            id="code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-2xl tracking-widest"
            maxLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </form>
    </AuthLayout>
  );
}
