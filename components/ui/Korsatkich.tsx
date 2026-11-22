import React from 'react';
import Ikonka, { type IkonkaNomi } from './Ikonka';
import { cn } from './cn';

type Holat = 'oddiy' | 'yaxshi' | 'diqqat' | 'xato';
const HOLAT: Record<Holat, string> = {
  oddiy: 'text-matn-2 bg-sirt-2',
  yaxshi: 'text-yaxshi bg-yaxshi-och',
  diqqat: 'text-diqqat bg-diqqat-och',
  xato: 'text-xato bg-xato-och'
};

// Ko'rsatkich kartasi: yirik raqam (uzoqdan o'qiladi) + nomi + izoh
export default function Korsatkich({
  nomi,
  qiymat,
  birlik,
  izoh,
  ikonka,
  holat = 'oddiy',
  ixcham = false
}: {
  nomi: string;
  qiymat: React.ReactNode;
  birlik?: string;
  izoh?: React.ReactNode;
  ikonka?: IkonkaNomi;
  holat?: Holat;
  ixcham?: boolean; // telefonda 3 tasi bir qatorga sig'ishi uchun
}) {
  return (
    <div className={cn('bg-sirt border border-chiziq rounded-karta min-w-0', ixcham ? 'p-3 md:p-4' : 'p-4 md:p-5')}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn('font-semibold text-matn-2 truncate', ixcham ? 'text-xs md:text-sm' : 'text-sm')}>{nomi}</p>
        {ikonka && (
          <span className={cn('w-8 h-8 rounded-boshqaruv flex items-center justify-center', HOLAT[holat])}>
            <Ikonka nom={ikonka} className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className={cn('font-bold text-matn tabular-nums leading-tight', ixcham ? 'mt-1 text-lg md:text-2xl' : 'mt-2 text-2xl md:text-3xl')}>
        {qiymat}
        {birlik && <span className={cn('ml-1 font-semibold text-matn-3', ixcham ? 'text-xs md:text-sm' : 'text-sm')}>{birlik}</span>}
      </p>
      {izoh && <p className={cn('mt-1 text-sm', holat === 'oddiy' ? 'text-matn-3' : HOLAT[holat].split(' ')[0])}>{izoh}</p>}
    </div>
  );
}
