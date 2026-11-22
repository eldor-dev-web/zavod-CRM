import React from 'react';
import Ikonka from './Ikonka';
import { cn } from './cn';

type Tur = 'oddiy' | 'asosiy' | 'yaxshi' | 'diqqat' | 'xato' | 'den' | 'noch';
const TURLAR: Record<Tur, string> = {
  oddiy: 'bg-sirt-2 text-matn-2',
  asosiy: 'bg-asosiy-och text-asosiy',
  yaxshi: 'bg-yaxshi-och text-yaxshi',
  diqqat: 'bg-diqqat-och text-diqqat',
  xato: 'bg-xato-och text-xato',
  den: 'bg-den-och text-diqqat',
  noch: 'bg-noch text-white'
};

// Kichik yorliq: holat, son, DEN/NOCH
export default function Belgi({ tur = 'oddiy', className, children }: { tur?: Tur; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-semibold whitespace-nowrap', TURLAR[tur], className)}>
      {tur === 'den' && <Ikonka nom="quyosh" className="w-3.5 h-3.5" />}
      {tur === 'noch' && <Ikonka nom="oy" className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}
