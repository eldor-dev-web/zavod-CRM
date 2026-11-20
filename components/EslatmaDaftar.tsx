'use client';
import React, { useState, useEffect, useRef } from 'react';
import { avansYigindisi } from '@/lib/hisob';
import { toshkentSana } from '@/lib/sana';

// Avanslar sahifasi pastidagi erkin daftar (faqat admin).
// Shu oyda Avanslar jadvalida yozuv bo'lsa, bu yerdagi summalar oylikka QO'SHILMAYDI.
// Jadval bo'sh bo'lsa (eski oylar), avvalgidek ism yozilgan qatorlardagi summalar avans hisoblanadi.
export default function EslatmaDaftar({
  tanlanganOy,
  ishchilar = [],
  hisobgaOlinadi = false
}: {
  tanlanganOy: string;
  ishchilar?: any[];
  hisobgaOlinadi?: boolean;
}) {
  const [matn, setMatn] = useState('');
  const [qulflangan, setQulflangan] = useState(true);
  const [bugun, setBugun] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const xotiraKaliti = `zavod_eslatmalar_${tanlanganOy}`;

  useEffect(() => {
    const [, oy, kun] = toshkentSana().split('-');
    setBugun(`${kun}.${oy}`);

    const saqlangan = localStorage.getItem(xotiraKaliti);
    setMatn(saqlangan || '');
  }, [xotiraKaliti]);

  // Matn ko'paygan sari oynani to'liq cho'zish (skrollsiz hamma yozuv ko'rinadi)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(150, textareaRef.current.scrollHeight)}px`;
    }
  }, [matn]);

  const matnniOzgartirish = (yangiMatn: string) => {
    setMatn(yangiMatn);
    localStorage.setItem(xotiraKaliti, yangiMatn);
  };

  // Enter bosilganda katta sonlarni avtomatik 200,000 ko'rinishida formatlash
  const klaviaturaBosilganda = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const formatlangan = matn.replace(/\b(\d{4,9})\b/g, (raqam) => {
        return Number(raqam).toLocaleString('en-US');
      });
      if (formatlangan !== matn) {
        matnniOzgartirish(formatlangan);
      }
    }
  };

  // 1-Click bilan "[15.11] Ism — " tushirish
  const shablonQoshish = (ism?: string) => {
    if (qulflangan) setQulflangan(false);

    const sana = bugun || '01.01';
    const qoshiladiganYozuv = ism 
      ? `[${sana}] ${ism} — ` 
      : `[${sana}] — `;

    const yangiMatn = matn.trim().length > 0 
      ? `${matn.trimEnd()}\n${qoshiladiganYozuv}` 
      : qoshiladiganYozuv;

    matnniOzgartirish(yangiMatn);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 50);
  };

  // Matn ichidagi summalar (Telegram bot ham xuddi shunday hisoblaydi)
  const jamiSumma = hisobgaOlinadi ? avansYigindisi(matn) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
      
      {/* TEPADAGI PANEL (TELEFON VA KOMPYUTERGA MOSLASHGAN) */}
      <div className="p-3 sm:px-4 sm:py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        
        {/* 1-qator (Telefonda tepada): Notes nomi + Jami summa + Qulf */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-1.5 text-slate-800 font-black text-xs sm:text-sm">
            <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Eslatmalar</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" title="Avto-saqlash faol"></span>
          </div>

          {/* Telefonda Jami va Qulf o'ng burchakda turadi */}
          <div className="flex items-center gap-2 sm:hidden">
            {jamiSumma > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200/70">
                <span className="text-[11px] font-black text-rose-700">{jamiSumma.toLocaleString('ru-RU')}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setQulflangan(!qulflangan)}
              className={`h-8 px-2.5 rounded-lg border flex items-center gap-1 text-xs font-bold transition-all ${
                qulflangan
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-indigo-600 text-white border-indigo-600'
              }`}
            >
              {qulflangan ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 2-qism: Tezkor Sana va Xodim tanlash tugmalari (Telefonda to'liq kenglikda qulay joylashadi) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => shablonQoshish()}
            className="h-9 sm:h-8 px-3 rounded-xl sm:rounded-lg bg-white active:bg-slate-100 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>{bugun || '...'}</span>
          </button>

          {ishchilar.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) shablonQoshish(e.target.value);
              }}
              className="flex-1 sm:flex-initial h-9 sm:h-8 px-3 rounded-xl sm:rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold outline-none cursor-pointer transition-colors"
            >
              <option value="" disabled>+ Xodim...</option>
              {ishchilar.map((ishchi: any) =>
                ishchi.ism ? (
                  <option key={ishchi.id} value={ishchi.ism}>
                    {ishchi.ism}
                  </option>
                ) : null
              )}
            </select>
          )}
        </div>

        {/* Kompyuterda o'ng taraf: Jami summa + Qulf */}
        <div className="hidden sm:flex items-center gap-2.5">
          {jamiSumma > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/70">
              <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-black text-rose-700">{jamiSumma.toLocaleString('ru-RU')}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setQulflangan(!qulflangan)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              qulflangan
                ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
            }`}
            title={qulflangan ? "Qulfni ochish" : "Qulflash"}
          >
            {qulflangan ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <p className="px-4 pt-2.5 text-[11px] font-semibold text-slate-400">
        {hisobgaOlinadi
          ? "Bu oyda jadvalda avans yo'q: bu yerdagi ism yozilgan qatorlardagi summalar avans deb hisoblanadi (eski usul)."
          : "Bu daftar oylikka ta'sir qilmaydi. Avanslarni yuqoridagi jadvalga kiriting."}
      </p>

      {/* YOZUV MAYDONI (text-base telefonda zoom bo'lib ketishini to'xtatadi!) */}
      <div className="p-2.5 sm:p-3 bg-white">
        <textarea
          ref={textareaRef}
          readOnly={qulflangan}
          value={matn}
          onChange={(e) => matnniOzgartirish(e.target.value)}
          onKeyDown={klaviaturaBosilganda}
          onDoubleClick={() => {
            if (qulflangan) setQulflangan(false);
          }}
          placeholder="Erkin eslatmalar..."
          className={`w-full overflow-hidden resize-none min-h-[150px] text-base sm:text-sm leading-7 font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none rounded-xl p-3 transition-colors ${
            qulflangan 
              ? 'bg-slate-50/70 cursor-default select-text' 
              : 'bg-white ring-2 ring-indigo-500/25 focus:ring-indigo-500/50'
          }`}
        />
      </div>
    </div>
  );
}