'use client';
import React from 'react';
import Ikonka from './Ikonka';
import { cn } from './cn';

const OY_NOMLARI = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export const oyMatni = (oy: string) => (oy ? `${OY_NOMLARI[Number(oy.slice(5, 7)) - 1]} ${oy.slice(0, 4)}` : '');

export function oyQoshish(oy: string, n: number) {
  const [y, m] = oy.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// Oy tanlash: ‹ Noyabr 2026 ›. Strelkalar bir oy oldinga/orqaga, o'rtasi bosilsa oy tanlash oynasi ochiladi.
export default function OyTanlash({ oy, ozgartirish, className }: { oy: string; ozgartirish: (oy: string) => void; className?: string }) {
  const strelka = 'w-10 md:w-9 h-full flex items-center justify-center text-matn-2 hover:bg-sirt-2 hover:text-matn transition-colors';
  return (
    <div className={cn('inline-flex items-stretch h-11 md:h-10 rounded-boshqaruv border border-chiziq-2 bg-sirt overflow-hidden', className)}>
      <button type="button" onClick={() => oy && ozgartirish(oyQoshish(oy, -1))} aria-label="Oldingi oy" className={strelka}>
        <Ikonka nom="chapga" className="w-4 h-4" />
      </button>
      <label className="relative flex items-center justify-center min-w-[118px] px-1 text-sm font-semibold text-matn cursor-pointer hover:bg-sirt-2 border-x border-chiziq">
        {oyMatni(oy)}
        <input
          type="month"
          value={oy}
          aria-label="Oyni tanlash"
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.();
            } catch {}
          }}
          onChange={(e) => e.target.value && ozgartirish(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <button type="button" onClick={() => oy && ozgartirish(oyQoshish(oy, 1))} aria-label="Keyingi oy" className={strelka}>
        <Ikonka nom="ongga" className="w-4 h-4" />
      </button>
    </div>
  );
}
