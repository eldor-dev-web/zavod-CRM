'use client';
import React, { useEffect, useState } from 'react';
import Ikonka from './Ikonka';
import Oyna from './Oyna';
import Tugma from './Tugma';
import { cn } from './cn';
import type { TasdiqSorovi, XabarTuri } from './xabar';

type Xabar = { id: number; matn: string; tur: XabarTuri };
type Tasdiq = TasdiqSorovi & { javob: (ha: boolean) => void };

// Layout'ga bir marta qo'yiladi: xabarlar (pastda, 3 soniyada yo'qoladi) va tasdiqlash oynasi
export default function UiQatlami() {
  const [xabarlar, setXabarlar] = useState<Xabar[]>([]);
  const [tasdiq, setTasdiq] = useState<Tasdiq | null>(null);

  useEffect(() => {
    let raqam = 0;
    const xabar = (e: Event) => {
      const d = (e as CustomEvent<{ matn: string; tur: XabarTuri }>).detail;
      const id = ++raqam;
      setXabarlar((x) => [...x.slice(-2), { id, ...d }]);
      setTimeout(() => setXabarlar((x) => x.filter((y) => y.id !== id)), 3200);
    };
    const sorov = (e: Event) => setTasdiq((e as CustomEvent<Tasdiq>).detail);
    window.addEventListener('zavod_xabar', xabar);
    window.addEventListener('zavod_tasdiq', sorov);
    return () => {
      window.removeEventListener('zavod_xabar', xabar);
      window.removeEventListener('zavod_tasdiq', sorov);
    };
  }, []);

  const javobBer = (ha: boolean) => {
    tasdiq?.javob(ha);
    setTasdiq(null);
  };

  return (
    <>
      <div className="fixed z-[70] bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm space-y-2 pointer-events-none print:hidden" aria-live="polite">
        {xabarlar.map((x) => (
          <div
            key={x.id}
            className={cn(
              'zavod-paydo flex items-center gap-2.5 px-4 py-3 rounded-karta shadow-lg text-sm font-semibold text-white',
              x.tur === 'xato' ? 'bg-xato-fon' : x.tur === 'malumot' ? 'bg-slate-800' : 'bg-emerald-600'
            )}
          >
            <Ikonka nom={x.tur === 'xato' ? 'ogohlantirish' : x.tur === 'malumot' ? 'malumot' : 'tasdiq'} className="w-4 h-4" />
            {x.matn}
          </div>
        ))}
      </div>

      <Oyna
        ochiq={!!tasdiq}
        yopish={() => javobBer(false)}
        sarlavha={tasdiq?.sarlavha}
        amallar={
          <>
            <Tugma onClick={() => javobBer(false)}>{tasdiq?.bekorMatni || 'Bekor'}</Tugma>
            <Tugma tur={tasdiq?.xavfli ? 'xavfli' : 'asosiy'} onClick={() => javobBer(true)} autoFocus>
              {tasdiq?.tasdiqMatni || 'Ha'}
            </Tugma>
          </>
        }
      >
        {tasdiq?.matn}
      </Oyna>
    </>
  );
}
