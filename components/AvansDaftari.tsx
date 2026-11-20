'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { avansQatorlari, avansYigindisi, ismlarRegexi, ismQatordaBormi, pulFormat, qatorSummasi, type Ishchi } from '@/lib/hisob';
import { toshkentSana } from '@/lib/sana';

const SANASIZ = (q: string) => q.replace(/\[\d{1,2}\.\d{1,2}\]/g, '');

// AVANS DAFTARI (faqat admin).
// Notes o'zi avvalgidek: ism yozilgan qatordagi summa shu ishchining avansi.
// Qo'shimcha: ism bosilganda yoki "+ Xodim" tanlanganda kichik oyna (summa + izoh + sana -> Saqlash),
// ishchilar bo'yicha jami tugmalari va xato qatorlarni belgilash.
export default function AvansDaftari({ tanlanganOy, ishchilar = [] }: { tanlanganOy: string; ishchilar?: Ishchi[] }) {
  const [matn, setMatn] = useState('');
  const [qulflangan, setQulflangan] = useState(true);
  const [bugunSana, setBugunSana] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Kichik oyna
  const [oynaIsm, setOynaIsm] = useState<string | null>(null);
  const [summa, setSumma] = useState('');
  const [izoh, setIzoh] = useState('');
  const [sana, setSana] = useState('');
  const [xato, setXato] = useState('');

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
  }, [matn, qulflangan]);

  const matnniOzgartirish = (yangi: string) => {
    setMatn(yangi);
    localStorage.setItem(xotiraKaliti, yangi);
  };

  // Enter bosilganda katta sonlarni 200,000 ko'rinishiga keltirish
  const klaviaturaBosilganda = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const f = matn.replace(/\b(\d{4,9})\b/g, (r) => Number(r).toLocaleString('en-US'));
      if (f !== matn) matnniOzgartirish(f);
    }
  };

  const bugunQisqa = bugunSana ? `${bugunSana.slice(8, 10)}.${bugunSana.slice(5, 7)}` : '';
  const standartSana = bugunSana.startsWith(tanlanganOy) ? bugunSana : `${tanlanganOy}-01`;
  const oyOxiri = (() => {
    const [y, m] = tanlanganOy.split('-').map(Number);
    return `${tanlanganOy}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
  })();

  // "[20.11] — " shabloni (sana tugmasi, avvalgidek)
  const sanaShabloni = () => {
    if (qulflangan) setQulflangan(false);
    const yozuv = `[${bugunQisqa || '01.01'}] — `;
    matnniOzgartirish(matn.trim().length > 0 ? `${matn.trimEnd()}\n${yozuv}` : yozuv);
    setTimeout(() => {
      const t = textareaRef.current;
      if (t) {
        t.focus();
        t.selectionStart = t.selectionEnd = t.value.length;
      }
    }, 50);
  };

  // --- Hisob-kitoblar ---
  const ismlar = useMemo(
    () => Array.from(new Set(ishchilar.map((i) => String(i.ism ?? '').trim()).filter(Boolean))),
    [ishchilar]
  );
  const ismRegexi = useMemo(() => ismlarRegexi(ismlar), [ismlar]);

  const qatorlar = useMemo(
    () =>
      matn.split('\n').map((q) => {
        const s = qatorSummasi(q);
        const mos = s > 0 ? ismlar.filter((ism) => ismQatordaBormi(SANASIZ(q), ism)) : [];
        const holat: 'oddiy' | 'qizil' | 'sariq' = s > 0 && mos.length === 0 ? 'qizil' : mos.length > 1 ? 'sariq' : 'oddiy';
        return { matn: q, holat };
      }),
    [matn, ismlar]
  );
  const qizilSoni = qatorlar.filter((q) => q.holat === 'qizil').length;
  const sariqSoni = qatorlar.filter((q) => q.holat === 'sariq').length;

  const jamilar = useMemo(
    () =>
      ismlar
        .map((ism) => ({ ism, jami: avansYigindisi(matn, ism) }))
        .filter((x) => x.jami > 0)
        .sort((a, b) => b.jami - a.jami),
    [matn, ismlar]
  );
  const oyJami = avansYigindisi(matn);

  // --- Kichik oyna ---
  const oynaniOchish = (ism: string) => {
    const toza = ismlar.find((i) => i.toLowerCase() === ism.trim().toLowerCase()) || ism.trim();
    setOynaIsm(toza);
    setSumma('');
    setIzoh('');
    setSana(standartSana);
    setXato('');
  };

  const oynaniYopish = () => setOynaIsm(null);

  useEffect(() => {
    if (!oynaIsm) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOynaIsm(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [oynaIsm]);

  const oynadaSaqlash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oynaIsm) return;
    const s = Number(summa.replace(/\D/g, ''));
    if (!s || s < 1000) return setXato("Summani kiriting (kamida 1 000)");
    if (!sana.startsWith(tanlanganOy)) return setXato('Sana tanlangan oy ichida bo‘lishi kerak');

    const qator = `[${sana.slice(8, 10)}.${sana.slice(5, 7)}] ${oynaIsm} — ${s.toLocaleString('en-US')}${izoh.trim() ? ` — ${izoh.trim()}` : ''}`;
    matnniOzgartirish(matn.trim().length > 0 ? `${matn.trimEnd()}\n${qator}` : qator);
    setOynaIsm(null);
  };

  // Qulflangan holatda bitta qatorni chizish: ismlar bosiladigan
  const qatorniChizish = (q: string) => {
    if (!ismRegexi || !q) return q || ' ';
    const bolaklar: React.ReactNode[] = [];
    let oxirgi = 0;
    q.replace(ismRegexi, (topilgan, _g, joy: number) => {
      if (joy > oxirgi) bolaklar.push(q.slice(oxirgi, joy));
      bolaklar.push(
        <button
          key={joy}
          type="button"
          onClick={() => oynaniOchish(topilgan)}
          className="text-indigo-600 font-black underline decoration-indigo-300 underline-offset-2 hover:text-indigo-800"
        >
          {topilgan}
        </button>
      );
      oxirgi = joy + topilgan.length;
      return topilgan;
    });
    if (oxirgi < q.length) bolaklar.push(q.slice(oxirgi));
    return bolaklar;
  };

  const oynaQatorlari = oynaIsm ? avansQatorlari(matn, oynaIsm) : [];
  const oynaJami = oynaQatorlari.reduce((j, a) => j + a.summa, 0);

  const qulfTugmasi = (
    <button
      type="button"
      onClick={() => setQulflangan(!qulflangan)}
      className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
        qulflangan ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200' : 'bg-indigo-600 text-white border-indigo-600'
      }`}
      title={qulflangan ? 'Tahrirlash uchun ochish' : 'Qulflash'}
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
      <span>{qulflangan ? 'Tahrirlash' : 'Tayyor'}</span>
    </button>
  );

  return (
    <div className="space-y-3">
      {/* JAMI + ISHCHILAR BO'YICHA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Oy jami avans</p>
            <p className="text-xl sm:text-2xl font-black text-rose-600">
              {pulFormat(oyJami)} <span className="text-xs text-slate-400 font-bold">so‘m</span>
            </p>
          </div>
          <p className="text-xs font-bold text-slate-400">{jamilar.length} ta ishchi</p>
        </div>
        {jamilar.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {jamilar.map((x) => (
              <button
                key={x.ism}
                type="button"
                onClick={() => oynaniOchish(x.ism)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-bold text-slate-700 transition"
              >
                {x.ism} · <span className="text-rose-600">{pulFormat(x.jami)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* OGOHLANTIRISHLAR */}
      {qizilSoni > 0 && (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          ⚠️ {qizilSoni} ta qator hech bir ishchiga tegishli emas — bu summa oylikdan ayrilmaydi. Ismni tekshiring.
        </p>
      )}
      {sariqSoni > 0 && (
        <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          ⚠️ {sariqSoni} ta qator bir nechta ishchiga mos keladi — summa ularning har biridan ayriladi. Qaysi ishchi ekanini aniqlang.
        </p>
      )}

      {/* DAFTAR */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
        <div className="p-3 sm:px-4 sm:py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-800 font-black text-sm mr-auto">
            <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Notes</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" title="Avto-saqlash faol"></span>
          </div>

          <button
            type="button"
            onClick={sanaShabloni}
            className="h-9 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span className="text-blue-600 font-black">+</span>
            <span>{bugunQisqa || '...'}</span>
          </button>

          {ismlar.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && oynaniOchish(e.target.value)}
              className="h-9 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-base sm:text-xs font-bold outline-none cursor-pointer"
            >
              <option value="" disabled>
                + Xodim...
              </option>
              {ismlar.map((ism) => (
                <option key={ism} value={ism}>
                  {ism}
                </option>
              ))}
            </select>
          )}

          {qulfTugmasi}
        </div>

        <div className="p-2.5 sm:p-3 bg-white">
          {qulflangan ? (
            // QULFLANGAN: qatorma-qator, ismlar bosiladigan, xato qatorlar rangli
            <div
              onDoubleClick={(e) => {
                if (!(e.target as HTMLElement).closest('button')) setQulflangan(false);
              }}
              className="min-h-[150px] rounded-xl p-3 bg-slate-50/70 text-base sm:text-sm leading-7 font-semibold text-slate-800 select-text"
            >
              {matn.trim() === '' ? (
                <p className="text-slate-400 font-normal">Hali yozuv yo‘q. “+ Xodim” orqali avans qo‘shing.</p>
              ) : (
                qatorlar.map((q, i) => (
                  <div
                    key={i}
                    className={`whitespace-pre-wrap break-words rounded-md px-1 -mx-1 ${
                      q.holat === 'qizil' ? 'bg-rose-100 text-rose-800' : q.holat === 'sariq' ? 'bg-amber-100 text-amber-900' : ''
                    }`}
                  >
                    {qatorniChizish(q.matn)}
                  </div>
                ))
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={matn}
              autoFocus
              onChange={(e) => matnniOzgartirish(e.target.value)}
              onKeyDown={klaviaturaBosilganda}
              placeholder="Avans va eslatmalar..."
              className="w-full overflow-hidden resize-none min-h-[150px] text-base sm:text-sm leading-7 font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none rounded-xl p-3 bg-white ring-2 ring-indigo-500/25 focus:ring-indigo-500/50"
            />
          )}
        </div>
      </div>

      {/* KICHIK OYNA */}
      {oynaIsm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4" onClick={oynaniYopish}>
          <form
            onSubmit={oynadaSaqlash}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl p-4 sm:p-5 space-y-3 max-h-[90vh] overflow-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-slate-900">{oynaIsm}</p>
                <p className="text-xs font-semibold text-slate-400">
                  Shu oydagi avans: <span className="text-rose-600 font-black">{pulFormat(oynaJami)}</span>
                </p>
              </div>
              <button type="button" onClick={oynaniYopish} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-black" aria-label="Yopish">
                ✕
              </button>
            </div>

            {oynaQatorlari.length > 0 && (
              <ul className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
                {oynaQatorlari.map((a, i) => (
                  <li key={i} className="flex gap-2 px-3 py-2">
                    <span className="shrink-0 w-11 text-xs font-black text-slate-400 pt-0.5">{a.sana || '—'}</span>
                    <span className="font-black text-rose-600">{pulFormat(a.summa)}</span>
                    {a.izoh && <span className="text-slate-500 truncate">— {a.izoh}</span>}
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="Summa"
                value={summa}
                onChange={(e) => {
                  const r = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setSumma(r ? pulFormat(Number(r)) : '');
                }}
                className="h-11 px-3 rounded-xl border border-slate-200 text-base sm:text-sm font-semibold text-right outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <input
                type="date"
                value={sana}
                min={`${tanlanganOy}-01`}
                max={oyOxiri}
                onChange={(e) => setSana(e.target.value)}
                className="h-11 px-3 rounded-xl border border-slate-200 text-base sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <input
                type="text"
                placeholder="Izoh (ixtiyoriy, botda ko‘rinadi)"
                value={izoh}
                maxLength={120}
                onChange={(e) => setIzoh(e.target.value)}
                className="col-span-2 h-11 px-3 rounded-xl border border-slate-200 text-base sm:text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
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
