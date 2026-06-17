'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { PencilLine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type PromptOptions = {
  title?: string;
  description?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  inputType?: 'text' | 'number';
  validate?: (value: string) => string | null;
};

type PromptContextType = {
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const PromptContext = createContext<PromptContextType | null>(null);

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<PromptOptions | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const resolveRef = useRef<((value: string | null) => void) | null>(null);

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setValue(opts.defaultValue ?? '');
      setError(null);
      setOpen(true);
    });
  }, []);

  const finish = (result: string | null) => {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
    setError(null);
  };

  const handleConfirm = () => {
    if (options?.validate) {
      const validationError = options.validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    finish(value.trim() || null);
  };

  return (
    <PromptContext.Provider value={{ prompt }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) finish(null);
        }}
      >
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-start gap-3 pr-6">
              <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                <PencilLine className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-2 text-left">
                <DialogTitle>{options?.title ?? 'Enter value'}</DialogTitle>
                {options?.description && (
                  <DialogDescription>{options.description}</DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2">
            {options?.label && <Label className="text-xs">{options.label}</Label>}
            <Input
              type={options?.inputType ?? 'text'}
              value={value}
              placeholder={options?.placeholder}
              className={error ? 'border-destructive focus-visible:ring-destructive' : undefined}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              autoFocus
            />
            {error && <p className="text-[11px] text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => finish(null)}>
              {options?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button type="button" onClick={handleConfirm}>
              {options?.confirmLabel ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) throw new Error('usePrompt must be used within PromptProvider');
  return ctx;
}
