'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type ConfirmOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setOpen(true);
    });
  }, []);

  const finish = (result: boolean) => {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) finish(false);
        }}
      >
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-start gap-3 pr-6">
              {options?.variant === 'destructive' && (
                <div className="rounded-full bg-destructive/10 p-2.5 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              )}
              <div className="space-y-2 text-left">
                <DialogTitle>{options?.title ?? 'Are you sure?'}</DialogTitle>
                <DialogDescription>{options?.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => finish(false)}>
              {options?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              type="button"
              variant={options?.variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => finish(true)}
            >
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
