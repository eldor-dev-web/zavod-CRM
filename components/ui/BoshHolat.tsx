import React from 'react';
import Ikonka, { type IkonkaNomi } from './Ikonka';

// Ma'lumot yo'q holati: ikonka + sarlavha + izoh + (ixtiyoriy) tugma
export default function BoshHolat({ ikonka = 'hujjat', sarlavha, izoh, amal }: { ikonka?: IkonkaNomi; sarlavha: string; izoh?: string; amal?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <span className="w-12 h-12 rounded-full bg-sirt-2 text-matn-3 flex items-center justify-center">
        <Ikonka nom={ikonka} className="w-6 h-6" />
      </span>
      <p className="mt-3 text-base font-semibold text-matn">{sarlavha}</p>
      {izoh && <p className="mt-1 text-sm text-matn-2 max-w-sm">{izoh}</p>}
      {amal && <div className="mt-4">{amal}</div>}
    </div>
  );
}
