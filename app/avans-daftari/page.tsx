'use client';
import React, { useEffect, useState } from 'react';
import AvansDaftari from '@/components/AvansDaftari';
import { faolIshchilar, type Ishchi } from '@/lib/hisob';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentOy, toshkentSana } from '@/lib/sana';
import { oyYopilganmi } from '@/lib/oyQulfi';

const OY_NOMLARI = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const oyMatni = (oy: string) => (oy ? `${OY_NOMLARI[Number(oy.slice(5, 7)) - 1]} ${oy.slice(0, 4)}` : '');

function oyQoshish(oy: string, n: number) {
  const [y, m] = oy.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Avans daftari — faqat admin (proxy.ts va /api/xotira ham tekshiradi)
export default function AvansDaftariSahifasi() {
  const [oy, setOy] = useState('');
  const [ishchilar, setIshchilar] = useState<Ishchi[]>([]);
  const [bugun, setBugun] = useState('');

  // Oy faqat brauzerda olinadi (cacheComponents)
  useEffect(() => {
    setOy(toshkentOy());
    setBugun(toshkentSana());
  }, []);

  useEffect(() => {
    if (!oy) return;
    setIshchilar(faolIshchilar(oyIshchilari(oy)));
  }, [oy]);

  if (!oy) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Avans daftari</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">“+ Xodim” → ism, summa, izoh → Saqlash</p>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white border border-slate-200 rounded-xl p-1">
          <button type="button" onClick={() => setOy(oyQoshish(oy, -1))} className="w-9 h-9 rounded-lg hover:bg-slate-100 font-black text-slate-600" aria-label="Oldingi oy">
            ‹
          </button>
          <span className="min-w-[120px] text-center text-sm font-black text-slate-800">{oyMatni(oy)}</span>
          <button type="button" onClick={() => setOy(oyQoshish(oy, 1))} className="w-9 h-9 rounded-lg hover:bg-slate-100 font-black text-slate-600" aria-label="Keyingi oy">
            ›
          </button>
        </div>
      </div>

      <AvansDaftari key={oy} tanlanganOy={oy} ishchilar={ishchilar} yopiq={!!bugun && oyYopilganmi(oy, bugun)} />
    </div>
  );
}
