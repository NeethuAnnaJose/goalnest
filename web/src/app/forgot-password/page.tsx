'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success('If the email exists, a reset link has been sent.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll send you a link to reset your password">
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">Check your inbox for reset instructions.</p>
          <Link href="/login"><Button variant="outline" className="w-full">Back to sign in</Button></Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
          <Link href="/login" className="block text-center text-sm text-primary hover:underline">Back to sign in</Link>
        </form>
      )}
    </AuthLayout>
  );
}
