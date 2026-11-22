import React from 'react';
import { cn } from './cn';

// Maydon va tanlash ro'yxati. Telefonda yozuv 16 px (iPhone kattalashtirmaydi), kompyuterda 14 px.
const ASOS =
  'w-full h-11 md:h-10 px-3 rounded-boshqaruv bg-sirt border border-chiziq-2 text-base md:text-sm text-matn placeholder:text-matn-3 outline-none transition-colors focus:border-asosiy focus:ring-2 focus:ring-asosiy/20 disabled:bg-sirt-2 disabled:text-matn-3';

function Qobiq({ yorliq, izoh, xato, children }: { yorliq?: string; izoh?: string; xato?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      {yorliq && <span className="block mb-1.5 text-sm font-semibold text-matn-2">{yorliq}</span>}
      {children}
      {xato ? <span className="block mt-1 text-xs font-semibold text-xato">{xato}</span> : izoh && <span className="block mt-1 text-xs text-matn-3">{izoh}</span>}
    </label>
  );
}

export function Maydon({
  yorliq,
  izoh,
  xato,
  className,
  ...qolgan
}: React.InputHTMLAttributes<HTMLInputElement> & { yorliq?: string; izoh?: string; xato?: string }) {
  return (
    <Qobiq yorliq={yorliq} izoh={izoh} xato={xato}>
      <input className={cn(ASOS, xato && 'border-xato focus:border-xato focus:ring-xato/20', className)} {...qolgan} />
    </Qobiq>
  );
}

export function Tanlash({
  yorliq,
  izoh,
  xato,
  className,
  children,
  ...qolgan
}: React.SelectHTMLAttributes<HTMLSelectElement> & { yorliq?: string; izoh?: string; xato?: string }) {
  return (
    <Qobiq yorliq={yorliq} izoh={izoh} xato={xato}>
      <select className={cn(ASOS, 'pr-8 cursor-pointer', xato && 'border-xato', className)} {...qolgan}>
        {children}
      </select>
    </Qobiq>
  );
}
