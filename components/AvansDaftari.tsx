'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { avansJami, noaniqQatorlarSoni, pulFormat, type Ishchi } from '@/lib/hisob';
import { toshkentSana } from '@/lib/sana';

// AVANS DAFTARI (faqat admin) — sodda versiya.
// Bitta Notes: ism yozilgan qatordagi summa shu ishchining avansi (oylik ham, bot ham shundan hisoblaydi).
// "+ Xodim" -> oyna: Ism (yozganda ro'yxat chiqadi), Summa, Izoh (ixtiyoriy) -> Saqlash -> Notes'ga qator tushadi.
export default function AvansDaftari({ tanlanganOy, ishchilar = [], yopiq = false }: { tanlanganOy: string; ishchilar?: Ishchi[]; yopiq?: boolean }) {
  const [matn, setMatn] = useState('');
  const [qulflangan, setQulflangan] = useState(true);
  const [bugunSana, setBugunSana] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Oyna
  const [oynaOchiq, setOynaOchiq] = useState(false);
  const [ism, setIsm] = useState('');
  const [royxatOchiq, setRoyxatOchiq] = useState(false);
  const [belgilangan, setBelgilangan] = useState(0);
  const [summa, setSumma] = useState('');
  const [izoh, setIzoh] = useState('');
  const [xato, setXato] = useState('');
  const summaRef = useRef<HTMLInputElement>(null);

  const xotiraKaliti = `zavod_eslatmalar_${tanlanganOy}`;

  useEffect(() => {
    setBugunSana(toshkentSana());
    setMatn(localStorage.getItem(xotiraKaliti) || '');
  }, [xotiraKaliti]);

  // Matn ko'paygan sari oynani cho'zish (skrollsiz hamma yozuv ko'rinadi)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(150, textareaRef.current.scrollHeight)}px`;
    }
  }, [matn]);

  const matnniSaqlash = (yangi: string) => {
    setMatn(yangi);
    localStorage.setItem(xotiraKaliti, yangi);
  };

  // Enter bosilganda katta sonlarni 200,000 ko'rinishiga keltirish
  const klaviaturaBosilganda = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const f = matn.replace(/\b(\d{4,9})\b/g, (r) => Number(r).toLocaleString('en-US'));
      if (f !== matn) matnniSaqlash(f);
    }
  };

  // Tanlangan oy joriy oy bo'lmasa, sana o'sha oyning 1-kuni qo'yiladi
  const yozuvSanasi = bugunSana.startsWith(tanlanganOy)
    ? `${bugunSana.slice(8, 10)}.${bugunSana.slice(5, 7)}`
    : `01.${tanlanganOy.slice(5, 7)}`;

  const ismlar = useMemo(
    () => Array.from(new Set(ishchilar.map((i) => String(i.ism ?? '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [ishchilar]
  );

  // Har bir harf terilganda mos ishchilar (avval ism bilan boshlanadiganlar)
  const mosIsmlar = useMemo(() => {
    const q = ism.trim().toLowerCase();
    if (!q) return ismlar.slice(0, 8);
    const boshi = ismlar.filter((i) => i.toLowerCase().startsWith(q));
    const ichida = ismlar.filter((i) => !i.toLowerCase().startsWith(q) && i.toLowerCase().includes(q));
    return [...boshi, ...ichida].slice(0, 8);
  }, [ism, ismlar]);

  const oynaniOchish = () => {
    setIsm('');
    setSumma('');
    setIzoh('');
    setXato('');
    setBelgilangan(0);
    setRoyxatOchiq(true);
    setOynaOchiq(true);
  };

  const oynaniYopish = () => setOynaOchiq(false);

  useEffect(() => {
    if (!oynaOchiq) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOynaOchiq(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [oynaOchiq]);

  const ismTanlash = (tanlangan: string) => {
    setIsm(tanlangan);
    setRoyxatOchiq(false);
    setXato('');
    setTimeout(() => summaRef.current?.focus(), 30);
  };

  const ismKlaviatura = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!royxatOchiq || mosIsmlar.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setBelgilangan((b) => Math.min(b + 1, mosIsmlar.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setBelgilangan((b) => Math.max(b - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      ismTanlash(mosIsmlar[belgilangan] || mosIsmlar[0]);
    }
  };

  const saqlash = (e: React.FormEvent) => {
    e.preventDefault();
    const tanlanganIsm = ismlar.find((i) => i.toLowerCase() === ism.trim().toLowerCase());
    if (!tanlanganIsm) return setXato('Ishchini ro‘yxatdan tanlang');
    const s = Number(summa.replace(/\D/g, ''));
    if (!s || s < 1000) return setXato('Summani yozing (masalan 200 000)');

    const qator = `[${yozuvSanasi}] ${tanlanganIsm} — ${s.toLocaleString('en-US')}${izoh.trim() ? ` — ${izoh.trim()}` : ''}`;
    matnniSaqlash(matn.trim().length > 0 ? `${matn.trimEnd()}\n${qator}` : qator);
    setOynaOchiq(false);
  };

  const oyJami = avansJami(matn, ismlar);
  const noaniqSoni = noaniqQatorlarSoni(matn, ismlar);
  const maydon =
    'w-full h-11 px-3 rounded-xl border border-slate-200 text-base sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400';

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
      {/* TEPA: Notes + Oy jami + "+ Xodim" + Qulf */}
      <div className="p-3 sm:px-4 sm:py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-800 font-black text-sm mr-auto">
          <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Notes</span>
          {oyJami > 0 && <span className="ml-1 text-xs font-bold text-slate-400">· Oy jami: <span className="text-rose-600">{pulFormat(oyJami)}</span></span>}
        </div>

        {yopiq ? (
          <span className="h-9 px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-600 inline-flex items-center">🔒 Oy yopilgan</span>
        ) : (
        <>
        <button
          type="button"
          onClick={oynaniOchish}
          className="h-9 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-black transition"
        >
          + Xodim
        </button>

        <button
          type="button"
          onClick={() => setQulflangan(!qulflangan)}
          className={`h-9 px-3 rounded-xl border text-xs font-bold transition ${
            qulflangan ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-slate-800 text-white border-slate-800'
          }`}
        >
          {qulflangan ? '🔒 Tahrirlash' : '✓ Tayyor'}
        </button>
        </>
        )}
      </div>

      {noaniqSoni > 0 && (
        <p className="mx-3 mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          ⚠️ {noaniqSoni} ta qatorda bir nechta ishchi yozilgan — bu summalar hech kimga hisoblanmadi. Qatorda bitta ishchi qoldiring.
        </p>
      )}

      {/* NOTES */}
      <div className="p-2.5 sm:p-3">
        <textarea
          ref={textareaRef}
          readOnly={qulflangan || yopiq}
          value={matn}
          onChange={(e) => matnniSaqlash(e.target.value)}
          onKeyDown={klaviaturaBosilganda}
          onDoubleClick={() => qulflangan && !yopiq && setQulflangan(false)}
          placeholder="Hali yozuv yo‘q. “+ Xodim” tugmasini bosing."
          className={`w-full overflow-hidden resize-none min-h-[150px] text-base sm:text-sm leading-7 font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none rounded-xl p-3 transition-colors ${
            qulflangan ? 'bg-slate-50/70 cursor-default' : 'bg-white ring-2 ring-indigo-500/25 focus:ring-indigo-500/50'
          }`}
        />
      </div>

      {/* OYNA: Ism + Summa + Izoh */}
      {oynaOchiq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 sm:p-4" onClick={oynaniYopish}>
          <form
            onSubmit={saqlash}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-black text-slate-900">Avans qo‘shish</p>
              <span className="text-xs font-bold text-slate-400">{yozuvSanasi}</span>
            </div>

            {/* Ism: yozganda pastda ishchilar chiqadi */}
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Ism"
                value={ism}
                onChange={(e) => {
                  setIsm(e.target.value);
                  setRoyxatOchiq(true);
                  setBelgilangan(0);
                  setXato('');
                }}
                onFocus={() => setRoyxatOchiq(true)}
                onKeyDown={ismKlaviatura}
                className={maydon}
                autoComplete="off"
              />
              {royxatOchiq && mosIsmlar.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                  {mosIsmlar.map((i, idx) => (
                    <li key={i}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => ismTanlash(i)}
                        className={`w-full text-left px-3 py-2 text-sm font-semibold ${
                          idx === belgilangan ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {i}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {royxatOchiq && ism.trim() && mosIsmlar.length === 0 && (
                <p className="mt-1 text-xs font-semibold text-slate-400">Bunday ishchi topilmadi</p>
              )}
            </div>

            <input
              ref={summaRef}
              type="text"
              inputMode="numeric"
              placeholder="Summa"
              value={summa}
              onFocus={() => setRoyxatOchiq(false)}
              onChange={(e) => {
                const r = e.target.value.replace(/\D/g, '').slice(0, 10);
                setSumma(r ? pulFormat(Number(r)) : '');
                setXato('');
              }}
              className={maydon}
            />

            <input
              type="text"
              placeholder="Izoh (ixtiyoriy)"
              value={izoh}
              maxLength={120}
              onFocus={() => setRoyxatOchiq(false)}
              onChange={(e) => setIzoh(e.target.value)}
              className={maydon}
            />

            {xato && <p className="text-xs font-bold text-rose-600">{xato}</p>}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={oynaniYopish} className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold">
                Bekor qilish
              </button>
              <button type="submit" className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-black">
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
