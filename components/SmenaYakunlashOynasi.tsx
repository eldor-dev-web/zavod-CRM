'use client';
import React, { useEffect, useState } from 'react';
import { tungimi, type SmenaNuqtasi } from '@/lib/smena';

export type SmenaXulosasi = { moshina: number; rulon: number; kg: number };

const sanaQisqa = (s: string) => s.split('-').reverse().slice(0, 2).join('.');
const belgi = (smena: string) => (tungimi(smena) ? '🌙 ' : '☀️ ');
const qisqa = (smena: string) => (tungimi(smena) ? 'NOCH' : 'DEN');
const kgFormat = (n: number) => {
  const [b, k] = (Math.round(n * 10) / 10).toFixed(1).split('.');
  return `${b.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${k === '0' ? '' : '.' + k}`;
};

// "Smenani yakunlaysizmi?" oynasi (sahifaning o'z dizaynida, brauzer oynasi emas)
export default function SmenaYakunlashOynasi({
  joriy,
  keyingi,
  xulosa,
  tasdiqlash,
  yopish
}: {
  joriy: SmenaNuqtasi;
  keyingi: SmenaNuqtasi;
  xulosa: SmenaXulosasi;
  tasdiqlash: () => Promise<string | null>;
  yopish: () => void;
}) {
  const [bajarilmoqda, setBajarilmoqda] = useState(false);
  const [xato, setXato] = useState('');

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !bajarilmoqda && yopish();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [bajarilmoqda, yopish]);

  const ha = async () => {
    if (bajarilmoqda) return;
    setBajarilmoqda(true);
    setXato('');
    const x = await tasdiqlash();
    setBajarilmoqda(false);
    if (x) setXato(x);
    else yopish();
  };

  const bosh = xulosa.rulon === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 sm:p-4" onClick={() => !bajarilmoqda && yopish()}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl p-5 sm:p-6 space-y-4">
        <p className="text-lg sm:text-xl font-black text-slate-900">
          {belgi(joriy.smena)}
          {sanaQisqa(joriy.sana)} {qisqa(joriy.smena)} smenasini yakunlaysizmi?
        </p>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:p-4 space-y-1.5">
          {bosh ? (
            <p className="text-sm font-bold text-slate-500">Bu smenada ma&apos;lumot kiritilmagan</p>
          ) : (
            <>
              <p className="text-sm sm:text-base font-black text-slate-800">
                {xulosa.moshina} moshina · {xulosa.rulon} rulon · {kgFormat(xulosa.kg)} kg
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">📄 Hisobot Telegram kanalga yuboriladi</p>
            </>
          )}
        </div>

        <p className="text-sm font-bold text-slate-600">
          Keyingi smena:{' '}
          <span className="font-black text-slate-900">
            {belgi(keyingi.smena)}
            {sanaQisqa(keyingi.sana)} {qisqa(keyingi.smena)}
          </span>
        </p>

        {xato && <p className="text-xs sm:text-sm font-bold text-rose-600">⚠️ {xato}</p>}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={bajarilmoqda}
            onClick={yopish}
            className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50"
          >
            Bekor
          </button>
          <button
            type="button"
            disabled={bajarilmoqda}
            onClick={ha}
            className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-black disabled:opacity-70"
          >
            {bajarilmoqda ? 'Bajarilmoqda...' : 'Ha, yakunlash'}
          </button>
        </div>
      </div>
    </div>
  );
}
