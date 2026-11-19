'use client';
import React, { useState, useEffect } from 'react';

interface XodimModalProps {
  ochiq: boolean;
  yopish: () => void;
  tanlanganXodim: any | null;
  lavozimlarBazasi: any[];
  saqlash: (xodimData: { id?: number | string; ism: string; lavozimi: string; telefon: string }) => void;
  ochirish?: (id: number | string, ism: string) => void;
}

const Icons = {
  User: () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Phone: () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Close: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
};

export default function XodimModal({
  ochiq,
  yopish,
  tanlanganXodim,
  lavozimlarBazasi,
  saqlash,
  ochirish
}: XodimModalProps) {
  const [ism, setIsm] = useState('');
  const [lavozimi, setLavozimi] = useState('');
  const [telefon, setTelefon] = useState('');
  const [xatolik, setXatolik] = useState('');

  useEffect(() => {
    if (tanlanganXodim) {
      setIsm(tanlanganXodim.ism || '');
      setLavozimi(tanlanganXodim.lavozimi || '');
      setTelefon(tanlanganXodim.telefon || '+998 ');
    } else {
      setIsm('');
      setLavozimi(lavozimlarBazasi[0]?.nomi || '');
      setTelefon('+998 ');
    }
    setXatolik('');
  }, [tanlanganXodim, ochiq, lavozimlarBazasi]);

  if (!ochiq) return null;

  const formaniSaqlash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ism.trim()) {
      setXatolik('Xodim ismini kiriting');
      return;
    }
    if (!lavozimi) {
      setXatolik('Lavozimni tanlang');
      return;
    }

    saqlash({
      id: tanlanganXodim?.id,
      ism: ism.trim(),
      lavozimi,
      telefon: telefon.trim()
    });
    yopish();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200/80 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-slate-100">
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {tanlanganXodim ? 'Xodimni tahrirlash' : 'Yangi xodim'}
          </h3>
          <button
            type="button"
            onClick={yopish}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <Icons.Close />
          </button>
        </div>

        <form onSubmit={formaniSaqlash} className="space-y-3.5">
          {xatolik && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-bold">
              {xatolik}
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Ism-familiya
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5"><Icons.User /></span>
              <input
                type="text"
                autoFocus
                value={ism}
                onChange={(e) => setIsm(e.target.value)}
                placeholder="Ismni kiriting"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-200 font-bold text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Lavozim
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5"><Icons.Briefcase /></span>
              <select
                value={lavozimi}
                onChange={(e) => setLavozimi(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-200 font-bold text-sm text-slate-900 appearance-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none cursor-pointer transition-all"
              >
                <option value="" disabled>Tanlang...</option>
                {lavozimlarBazasi.map((l: any) => (
                  <option key={l.id} value={l.nomi}>
                    {l.nomi} — {Number(l.stavka).toLocaleString()} UZS
                  </option>
                ))}
              </select>
              <span className="absolute right-3.5"><Icons.ChevronDown /></span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Telefon raqam
            </label>
            <p className="text-[10px] text-slate-400 font-semibold -mt-1 mb-1.5">Telegram botdagi raqami bilan bir xil bo'lsin</p>
            <div className="relative flex items-center">
              <span className="absolute left-3.5"><Icons.Phone /></span>
              <input
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="+998 90 123 45 67"
                inputMode="tel"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50/70 focus:bg-white border border-slate-200 font-semibold text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100">
            {tanlanganXodim && ochirish && (
              <button
                type="button"
                onClick={() => {
                  ochirish(tanlanganXodim.id, tanlanganXodim.ism);
                  yopish();
                }}
                title="Xodimni oʻchirish"
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200/60 transition-all flex items-center justify-center"
              >
                <Icons.Trash />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Icons.Check />
              <span>Saqlash</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}