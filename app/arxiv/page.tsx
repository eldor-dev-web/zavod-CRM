'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { arxivCsv, mahalliySmenaniOgirish, NUQSON_TURLARI, smenaJamisi, type ArxivSmena } from '@/lib/arxiv';
import { sanagaKunQoshish, toshkentSana } from '@/lib/sana';
import { tungimi } from '@/lib/smena';

const sanaKorinishi = (s: string) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : '');
const kgFormat = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

// Baza ulanmaganda: shu brauzerda saqlangan smenalardan qidirish
function mahalliyArxiv(sana: string, smena: string): ArxivSmena[] {
  const xarita = new Map<string, ArxivSmena>();
  const qosh = (s: ArxivSmena | null) => {
    if (s && s.sana) xarita.set(`${s.sana}_${s.smena}`, s);
  };

  try {
    const eskiArxiv = JSON.parse(localStorage.getItem('zavod_smena_arxivlari') || '[]');
    if (Array.isArray(eskiArxiv)) eskiArxiv.forEach((s: any) => qosh(mahalliySmenaniOgirish({ ...s, moshinalar: s.moshinaTafsilotlari })));
  } catch {}

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !/^zavod_smena_\d{4}-\d{2}-\d{2}_/.test(k)) continue;
    try {
      qosh(mahalliySmenaniOgirish(JSON.parse(localStorage.getItem(k) || 'null')));
    } catch {}
  }

  return Array.from(xarita.values())
    .filter((s) => s.sana === sana && (!smena || s.smena.includes(smena)))
    .sort((a, b) => Number(tungimi(a.smena)) - Number(tungimi(b.smena)));
}

const Ikon = {
  Yuklash: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Printer: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
};

export default function ArxivSahifasi() {
  // Bugungi sana faqat brauzerda olinadi (sahifa yig'ilayotganda vaqtni o'qish taqiqlangan — cacheComponents)
  const [sana, setSana] = useState('');
  useEffect(() => {
    setSana(toshkentSana());
  }, []);
  const [smena, setSmena] = useState<'' | 'DEN' | 'NOCH'>('');

  const [smenalar, setSmenalar] = useState<ArxivSmena[]>([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [manba, setManba] = useState<'baza' | 'mahalliy'>('baza');

  const yuklash = useCallback(async (kun: string, sm: string) => {
    if (!kun) return;
    setYuklanmoqda(true);
    try {
      const params = new URLSearchParams({ dan: kun, gacha: kun, smena: sm });
      const res = await fetch(`/api/arxiv?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const royxat: ArxivSmena[] = data.smenalar || [];
      setSmenalar(royxat.sort((a, b) => Number(tungimi(a.smena)) - Number(tungimi(b.smena))));
      setManba('baza');
    } catch {
      setSmenalar(mahalliyArxiv(kun, sm));
      setManba('mahalliy');
    } finally {
      setYuklanmoqda(false);
    }
  }, []);

  // Sana yoki smena o'zgarishi bilan darhol qidiradi
  useEffect(() => {
    yuklash(sana, smena);
  }, [sana, smena, yuklash]);

  const jami = useMemo(
    () =>
      smenalar.reduce(
        (acc, s) => {
          const j = smenaJamisi(s);
          return { kg: acc.kg + j.kg, rulon: acc.rulon + j.rulon };
        },
        { kg: 0, rulon: 0 }
      ),
    [smenalar]
  );

  const excelgaYuklash = () => {
    const blob = new Blob([arxivCsv(smenalar)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arxiv_${sana}${smena ? `_${smena}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const smenaTugmasi = (qiymat: '' | 'DEN' | 'NOCH', nomi: string, vaqt?: string) => {
    const tanlangan = smena === qiymat;
    const rang = qiymat === 'NOCH' ? 'bg-slate-800 text-white' : qiymat === 'DEN' ? 'bg-amber-400 text-amber-950' : 'bg-indigo-600 text-white';
    return (
      <button
        type="button"
        onClick={() => setSmena(qiymat)}
        className={`flex-1 rounded-xl px-3 py-2 text-left transition-all ${tanlangan ? `${rang} shadow-sm` : 'text-slate-500 hover:bg-slate-100'}`}
      >
        <span className="block text-sm font-black leading-tight">{nomi}</span>
        {vaqt && <span className="block text-[10px] font-bold opacity-70">{vaqt}</span>}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* SARLAVHA */}
      <div className="mb-5">
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-3xl">Smenalar arxivi</h1>
        <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm print:hidden">
          Sanani va smenani tanlang — o&apos;sha smenaning barcha moshina va rulonlari chiqadi
        </p>
      </div>

      {/* TANLASH: SANA + SMENA */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:flex-row sm:items-center print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSana(sanagaKunQoshish(sana, -1))}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-black text-slate-600 transition-colors hover:bg-slate-100"
            title="Oldingi kun"
          >
            ‹
          </button>
          <input
            type="date"
            value={sana}
            onChange={(e) => e.target.value && setSana(e.target.value)}
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-black text-slate-800 outline-none focus:border-indigo-500 focus:bg-white sm:w-48 sm:flex-none"
          />
          <button
            type="button"
            onClick={() => setSana(sanagaKunQoshish(sana, 1))}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-black text-slate-600 transition-colors hover:bg-slate-100"
            title="Keyingi kun"
          >
            ›
          </button>
        </div>

        <div className="flex flex-1 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {smenaTugmasi('', 'Ikkalasi')}
          {smenaTugmasi('DEN', '☀️ DEN')}
          {smenaTugmasi('NOCH', '🌙 NOCH')}
        </div>
      </div>

      {manba === 'mahalliy' && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 print:hidden">
          ⚠️ Baza ulanmagan. Faqat shu kompyuterda saqlangan smenalar ko&apos;rsatilmoqda — to&apos;liq arxiv baza ulanganda chiqadi.
        </div>
      )}

      {/* JAMI VA AMALLAR */}
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black sm:text-sm">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700">{sanaKorinishi(sana)}</span>
          <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-indigo-700">{jami.rulon} rulon</span>
          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700">{kgFormat(jami.kg)} kg</span>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={excelgaYuklash}
            disabled={smenalar.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Ikon.Yuklash /> Excel
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={smenalar.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Ikon.Printer /> Chop etish
          </button>
        </div>
      </div>

      {/* NATIJA */}
      {yuklanmoqda ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-sm font-bold text-slate-400">Yuklanmoqda...</div>
      ) : smenalar.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center">
          <p className="text-sm font-bold text-slate-500">Bu sanada {smena ? `${smena} smenasi` : 'smena'} topilmadi</p>
          <p className="mt-1 text-xs text-slate-400">‹ › tugmalari bilan boshqa kunni tanlab ko&apos;ring</p>
        </div>
      ) : (
        <div className="space-y-5">
          {smenalar.map((s) => {
            const j = smenaJamisi(s);
            const tungi = tungimi(s.smena);
            return (
              <section key={`${s.sana}_${s.smena}`} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${tungi ? 'bg-slate-800 text-white' : 'bg-amber-400 text-amber-950'}`}>
                      {tungi ? '🌙 NOCH' : '☀️ DEN'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Master: <b className="text-slate-700">{s.master || '—'}</b> · Kontrolchi: <b className="text-slate-700">{s.kontrolchi || '—'}</b>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black text-slate-600">
                    <span>{s.moshinalar.length} moshina</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-indigo-600">{j.rulon} rulon</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-600">{kgFormat(j.kg)} kg</span>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50/50 p-3 sm:p-4">
                  {s.moshinalar.length === 0 && <p className="text-xs font-semibold text-slate-400">Bu smenada moshina ma&apos;lumoti yo&apos;q</p>}
                {s.moshinalar.map((m, mi) => {
                  const mKg = m.rulonlar.reduce((a, r) => a + (r.kg ?? 0), 0);
                  return (
                    <div
                      key={mi}
                      className={`overflow-hidden rounded-xl border bg-white print:break-inside-avoid border-slate-200`}
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 px-3 py-2.5 text-xs">
                        <span className="text-lg font-black uppercase text-slate-900">{m.raqam || '—'}</span>
                        {(
                          [
                            ['Operator', m.operator],
                            ['Talimoti', m.talimoti],
                            ['Brend', m.brend],
                            ['IP', m.ip],
                            ['Lot', m.lot]
                          ] as const
                        ).map(([nomi, qiymat]) => (
                          <span key={nomi} className="font-semibold text-slate-500">
                            {nomi}: <b className="text-slate-800">{qiymat || '—'}</b>
                          </span>
                        ))}
                        <span className="ml-auto font-black text-emerald-700">
                          {m.rulonlar.filter((r) => r.kg !== null).length} rulon · {kgFormat(mKg)} kg
                        </span>
                      </div>

                      {m.rulonlar.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-max border-collapse text-center text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                <th className="border-r border-slate-100 px-2 py-2">№</th>
                                <th className="border-r border-slate-100 px-2 py-2">Vaqt</th>
                                <th className="border-r border-slate-100 px-2 py-2">Kg</th>
                                {NUQSON_TURLARI.map((n) => (
                                  <th key={n} className="border-r border-slate-100 px-2 py-2 last:border-r-0">
                                    {n}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {m.rulonlar.map((r) => (
                                <tr key={r.tartib} className="border-t border-slate-100">
                                  <td className="border-r border-slate-100 px-2 py-1.5 font-bold text-slate-400">{r.tartib}</td>
                                  <td className="border-r border-slate-100 px-2 py-1.5 font-bold text-indigo-500">{r.vaqt || '—'}</td>
                                  <td className="border-r border-slate-100 px-2 py-1.5 font-black text-emerald-700">{r.kg ?? '—'}</td>
                                  {NUQSON_TURLARI.map((n) => (
                                    <td
                                      key={n}
                                      className={`border-r border-slate-100 px-2 py-1.5 font-bold last:border-r-0 ${
                                        r.nuqsonlar[n] ? 'bg-rose-50 text-rose-700' : 'text-slate-300'
                                      }`}
                                    >
                                      {r.nuqsonlar[n] || '·'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="px-3 py-2 text-xs font-semibold text-slate-400">Rulon kiritilmagan</p>
                      )}
                    </div>
                  );
                })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
