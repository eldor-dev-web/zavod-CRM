import React from 'react';
import Ikonka, { type IkonkaNomi } from './Ikonka';
import { cn } from './cn';

type Tur = 'diqqat' | 'malumot' | 'xato' | 'oddiy' | 'yaxshi';
const TURLAR: Record<Tur, { klass: string; ikonka: IkonkaNomi }> = {
  diqqat: { klass: 'bg-diqqat-och border-amber-200 text-diqqat', ikonka: 'soat' },
  malumot: { klass: 'bg-asosiy-och border-indigo-200 text-asosiy', ikonka: 'malumot' },
  xato: { klass: 'bg-xato-och border-rose-200 text-xato', ikonka: 'ogohlantirish' },
  oddiy: { klass: 'bg-sirt-2 border-chiziq text-matn-2', ikonka: 'qulf' },
  yaxshi: { klass: 'bg-yaxshi-och border-emerald-200 text-yaxshi', ikonka: 'tasdiq' }
};

// Sahifa ichidagi ogohlantirish qatori: ikonka + matn + (ixtiyoriy) amallar. Hamma joyda bir xil ko'rinish.
export default function Ogohlantirish({
  tur = 'malumot',
  ikonka,
  amallar,
  className,
  children
}: {
  tur?: Tur;
  ikonka?: IkonkaNomi;
  amallar?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const t = TURLAR[tur];
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-karta border px-4 py-3', t.klass, className)} role={tur === 'xato' ? 'alert' : 'status'}>
      <Ikonka nom={ikonka || t.ikonka} className="w-5 h-5" />
      <div className="flex-1 min-w-[180px] text-sm font-semibold">{children}</div>
      {amallar && <div className="flex items-center gap-2">{amallar}</div>}
    </div>
  );
}
