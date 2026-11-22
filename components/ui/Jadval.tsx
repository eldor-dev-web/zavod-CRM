import React from 'react';
import { cn } from './cn';

// Jadval: bir xil sarlavha, qatorlar, raqamlar o'ngga tekis (tabular). Telefonda gorizontal aylanadi.
export function Jadval({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

export const jadvalSarlavha = 'bg-sirt-2 text-left text-xs font-semibold uppercase tracking-wide text-matn-2 px-4 py-2.5 border-b border-chiziq whitespace-nowrap';
export const jadvalKatak = 'px-4 py-3 border-b border-chiziq text-matn';
export const jadvalRaqam = 'text-right tabular-nums whitespace-nowrap';
export const jadvalQator = 'hover:bg-sirt-2/60 transition-colors';
