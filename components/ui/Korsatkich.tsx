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
  holat = 'oddiy'
}: {
  nomi: string;
  qiymat: React.ReactNode;
  birlik?: string;
  izoh?: React.ReactNode;
  ikonka?: IkonkaNomi;
  holat?: Holat;
}) {
  return (
    <div className="bg-sirt border border-chiziq rounded-karta p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-matn-2">{nomi}</p>
        {ikonka && (
          <span className={cn('w-8 h-8 rounded-boshqaruv flex items-center justify-center', HOLAT[holat])}>
            <Ikonka nom={ikonka} className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl md:text-3xl font-bold text-matn tabular-nums leading-tight">
        {qiymat}
        {birlik && <span className="ml-1 text-sm font-semibold text-matn-3">{birlik}</span>}
      </p>
      {izoh && <p className={cn('mt-1 text-sm', holat === 'oddiy' ? 'text-matn-3' : HOLAT[holat].split(' ')[0])}>{izoh}</p>}
    </div>
  );
}
