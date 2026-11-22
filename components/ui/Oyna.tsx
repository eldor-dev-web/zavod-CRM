'use client';
import React, { useEffect } from 'react';
import Ikonka from './Ikonka';
import { cn } from './cn';

// Oyna (modal): telefonda pastdan chiqadi, kompyuterda o'rtada. Esc va tashqariga bosish yopadi.
export default function Oyna({
  ochiq,
  yopish,
  sarlavha,
  children,
  amallar,
  kenglik = 'max-w-md',
  yopibBolmaydi = false
}: {
  ochiq: boolean;
  yopish: () => void;
  sarlavha?: React.ReactNode;
  children?: React.ReactNode;
  amallar?: React.ReactNode;
  kenglik?: string;
  yopibBolmaydi?: boolean; // masalan, saqlanayotganda
}) {
  useEffect(() => {
    if (!ochiq) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !yopibBolmaydi && yopish();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [ochiq, yopish, yopibBolmaydi]);

  if (!ochiq) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/50 sm:p-4" onClick={() => !yopibBolmaydi && yopish()}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn('zavod-paydo w-full bg-sirt rounded-t-oyna sm:rounded-oyna border border-chiziq shadow-2xl max-h-[90dvh] overflow-auto', kenglik)}
      >
        {sarlavha && (
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <h2 className="text-lg font-semibold text-matn">{sarlavha}</h2>
            {!yopibBolmaydi && (
              <button type="button" onClick={yopish} aria-label="Yopish" className="-mr-1 w-9 h-9 rounded-boshqaruv text-matn-3 hover:bg-sirt-2 hover:text-matn flex items-center justify-center">
                <Ikonka nom="yopish" className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-4 text-sm text-matn-2">{children}</div>
        {amallar && <div className="px-5 pb-5 grid grid-cols-2 gap-2">{amallar}</div>}
      </div>
    </div>
  );
}
