'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function AvansBloknot({
  tanlanganOy,
  ishchilar = []
}: {
  tanlanganOy: string;
  ishchilar?: any[];
}) {
  const [matn, setMatn] = useState('');
  const [qulflangan, setQulflangan] = useState(true);
  const [bugun, setBugun] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const xotiraKaliti = `zavod_eslatmalar_${tanlanganOy}`;

  // Sanani va saqlangan matnni xatosiz yuklash
  useEffect(() => {
    const d = new Date();
    const kun = String(d.getDate()).padStart(2, '0');
    const oy = String(d.getMonth() + 1).padStart(2, '0');
    setBugun(`${kun}.${oy}`);

    const saqlangan = localStorage.getItem(xotiraKaliti);
    setMatn(saqlangan || '');
  }, [xotiraKaliti]);

  const matnniOzgartirish = (yangiMatn: string) => {
    setMatn(yangiMatn);
    localStorage.setItem(xotiraKaliti, yangiMatn);
  };

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

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden mt-6">
      
      {/* Tepadagi panel */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-700 font-black text-xs mr-1">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Notes</span>
          </div>

          <button
            type="button"
            onClick={() => shablonQoshish()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
            title="Bugungi sana bilan yangi qator ochish"
          >
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
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
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold outline-none cursor-pointer transition-colors"
            >
              <option value="" disabled>+ Xodim...</option>
              {ishchilar.map((ishchi: any) => (
                ishchi.ism ? (
                  <option key={ishchi.id} value={ishchi.ism}>
                    {ishchi.ism}
                  </option>
                ) : null
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Auto
          </span>

          <button
            type="button"
            onClick={() => setQulflangan(!qulflangan)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              qulflangan
                ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
            }`}
            title={qulflangan ? "Yozish uchun qulfni oching" : "Qulflash"}
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

      {/* Yozuv maydoni */}
      <div className="p-3 bg-white">
        <textarea
          ref={textareaRef}
          rows={6}
          readOnly={qulflangan}
          value={matn}
          onChange={(e) => matnniOzgartirish(e.target.value)}
          onDoubleClick={() => {
            if (qulflangan) setQulflangan(false);
          }}
          placeholder="Bu yerga avans va eslatmalarni yozing... (Yozish uchun qulfni oching yoki 2 marta bosing)"
          className={`w-full resize-y min-h-[130px] text-xs sm:text-sm leading-relaxed font-medium text-slate-800 placeholder:text-slate-400 outline-none rounded-xl p-2.5 transition-colors ${
            qulflangan 
              ? 'bg-slate-50/60 cursor-default select-text' 
              : 'bg-white ring-2 ring-indigo-500/20 focus:ring-indigo-500/40'
          }`}
        />
      </div>
    </div>
  );
}