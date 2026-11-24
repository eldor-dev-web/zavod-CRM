'use client';
import React from 'react';
import Ikonka from './Ikonka';
import { cn } from './cn';

const OY_NOMLARI = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const HAFTA_KUNLARI = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];

// "2026-11-22" -> "22-noyabr 2026, yakshanba"
export function sanaMatni(sana: string) {
  if (!sana) return '';
  const [y, m, d] = sana.split('-').map(Number);
  const kun = HAFTA_KUNLARI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${d}-${OY_NOMLARI[m - 1]} ${y}, ${kun}`;
}

// Sana tanlash: ‹ 22-noyabr 2026, yakshanba ›. Strelkalar kunma-kun yuradi, o'rtasi bosilsa kalendar ochiladi.
export default function SanaTanlash({
  sana,
  ozgartirish,
  oldingi,
  keyingi,
  className
}: {
  sana: string;
  ozgartirish: (sana: string) => void;
  oldingi: () => void;
  keyingi: () => void;
  className?: string;
}) {
  const strelka = 'w-11 shrink-0 h-full flex items-center justify-center text-matn-2 hover:bg-sirt-2 hover:text-matn transition-colors';
  return (
    <div className={cn('flex items-stretch h-11 md:h-10 rounded-boshqaruv border border-chiziq-2 bg-sirt overflow-hidden', className)}>
      <button type="button" onClick={oldingi} aria-label="Oldingi kun" className={strelka}>
        <Ikonka nom="chapga" className="w-4 h-4" />
      </button>
      <label className="relative flex-1 min-w-0 flex items-center justify-center px-2 text-sm font-semibold text-matn cursor-pointer hover:bg-sirt-2 border-x border-chiziq">
        <span className="truncate">{sanaMatni(sana)}</span>
        <input
          type="date"
          value={sana}
          aria-label="Sanani tanlash"
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.();
            } catch {}
          }}
          onChange={(e) => e.target.value && ozgartirish(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <button type="button" onClick={keyingi} aria-label="Keyingi kun" className={strelka}>
        <Ikonka nom="ongga" className="w-4 h-4" />
      </button>
    </div>
  );
}
