'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { affordabilityApi } from '@/lib/api';
import type { AffordabilityResult } from '@/types/api';

const VERDICT_CONFIG = {
  AFFORDABLE: { icon: CheckCircle, variant: 'success' as const, label: 'Affordable' },
  NOT_RECOMMENDED: { icon: XCircle, variant: 'destructive' as const, label: 'Not Recommended' },
  RECOMMENDED_AFTER: { icon: Clock, variant: 'warning' as const, label: 'Recommended After Saving' },
};

export default function AffordabilityPage() {
  const [productName, setProductName] = useState('');
  const [productCost, setProductCost] = useState('');
  const [result, setResult] = useState<AffordabilityResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => affordabilityApi.analyze({ productName, productCost }),
    onSuccess: setResult,
  });

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null;
  const VerdictIcon = verdict?.icon;

  return (
    <>
      <Header title="Affordability" description="See if a purchase fits your budget right now" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input placeholder="Laptop, bike, furniture…" value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Product Cost (₹)</Label>
                <Input type="number" placeholder="150000" value={productCost} onChange={(e) => setProductCost(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => mutation.mutate()} disabled={!productName || !productCost || mutation.isPending}>
                {mutation.isPending ? 'Checking...' : 'Check'}
              </Button>
            </CardContent>
          </Card>

          {result && verdict && VerdictIcon && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <VerdictIcon className={`h-8 w-8 ${result.verdict === 'AFFORDABLE' ? 'text-emerald-500' : result.verdict === 'NOT_RECOMMENDED' ? 'text-red-500' : 'text-amber-500'}`} />
                  <div>
                    <Badge variant={verdict.variant}>{verdict.label}</Badge>
                    <p className="mt-1 font-semibold">{result.productName}: ₹{result.productCostMajor}</p>
                  </div>
                </div>

                {result.monthsUntilRecommended && (
                  <p className="mt-4 text-sm">Recommended after <strong>{result.monthsUntilRecommended} month(s)</strong> of saving.</p>
                )}

                <p className="mt-3 text-sm text-muted-foreground">{result.impactOnGoals}</p>

                {(result.currentSavingsMajor || result.safeToSpendMajor) && (
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs sm:grid-cols-4">
                    {result.currentSavingsMajor && (
                      <div>
                        <p className="text-muted-foreground">Savings</p>
                        <p className="font-semibold">₹{Number(result.currentSavingsMajor).toLocaleString()}</p>
                      </div>
                    )}
                    {result.monthlyIncomeMajor && (
                      <div>
                        <p className="text-muted-foreground">Avg income/mo</p>
                        <p className="font-semibold">₹{Number(result.monthlyIncomeMajor).toLocaleString()}</p>
                      </div>
                    )}
                    {result.monthlyExpensesMajor && (
                      <div>
                        <p className="text-muted-foreground">Avg expenses/mo</p>
                        <p className="font-semibold">₹{Number(result.monthlyExpensesMajor).toLocaleString()}</p>
                      </div>
                    )}
                    {result.safeToSpendMajor && (
                      <div>
                        <p className="text-muted-foreground">Left after bills</p>
                        <p className="font-semibold">₹{Number(result.safeToSpendMajor).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}

                <ul className="mt-4 space-y-2">
                  {result.reasoning.map((r, i) => (
                    <li key={i} className="text-sm">• {r}</li>
                  ))}
                </ul>

                {(result.goalImpacts ?? []).length > 0 && (
                  <div className="mt-4 rounded-lg bg-muted p-4">
                    <p className="mb-2 text-sm font-medium">Impact on Goals</p>
                    {result.goalImpacts!.map((g, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {g.goalName}: {g.currentProgress}% complete
                        {g.estimatedDelayMonths > 0 && ` · +${g.estimatedDelayMonths}mo delay`}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
