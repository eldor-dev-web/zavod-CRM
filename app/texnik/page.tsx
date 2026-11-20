'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  hisoblagichBoshlari,
  limitHolati,
  mahalliyHisob,
  MOSHINA_KALIT,
  moshinaNomi,
  moshinalarSoni,
  OGOHLANTIRISH_FOIZI,
  type HisoblagichTarixi,
  type HisoblagichYozuvi,
  type LimitHolati,
  type MoshinaHisobi,
  type MoshinaLimitlari
} from '@/lib/moshina';
import { oqish } from '@/lib/mahalliyXotira';
import { toshkentSana, toshkentVaqtMatni } from '@/lib/sana';

const kgFormat = (n: number) => Math.round(n).toLocaleString('ru-RU');
const sanaKorinishi = (s: string) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : '');
const vaqtKorinishi = (v: string) => `${sanaKorinishi(v.slice(0, 10))} ${v.slice(11, 16)}`;

// Ikki sana orasidagi kalendar kunlari (ikkala kun ham sanaladi)
function kunlarFarqi(dan: string, gacha: string) {
  const a = Date.UTC(+dan.slice(0, 4), +dan.slice(5, 7) - 1, +dan.slice(8, 10));
  const b = Date.UTC(+gacha.slice(0, 4), +gacha.slice(5, 7) - 1, +gacha.slice(8, 10));
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

// Baza ulanmaganda: shu kompyuterdagi smena nusxalari
function mahalliySmenalar() {
  const royxat: { sana: string; smena: string; moshinalar: any[] }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !/^zavod_smena_\d{4}-\d{2}-\d{2}_/.test(k)) continue;
    try {
      const d = JSON.parse(localStorage.getItem(k) || '{}');
      const smena = d.smena ?? d.smenaTuri;
      const moshinalar = Array.isArray(d.moshinalar) ? d.moshinalar : Object.values(d.moshinalar || {});
      if (d.sana && smena) royxat.push({ sana: d.sana, smena: String(smena), moshinalar });
    } catch {}
  }
  return royxat;
}

const HOLAT_RANGI: Record<LimitHolati['holat'], { chiziq: string; matn: string; karta: string }> = {
  yoq: { chiziq: 'bg-slate-300', matn: 'text-slate-500', karta: 'border-slate-200' },
  yaxshi: { chiziq: 'bg-emerald-500', matn: 'text-emerald-700', karta: 'border-slate-200' },
  yaqin: { chiziq: 'bg-amber-500', matn: 'text-amber-700', karta: 'border-amber-300 ring-2 ring-amber-100' },
  oshdi: { chiziq: 'bg-rose-500', matn: 'text-rose-700', karta: 'border-rose-300 ring-2 ring-rose-100' }
};

function ogohlantirishMatni(nomi: string, h: LimitHolati) {
  if (h.holat === 'oshdi') return `${nomi}: limitdan ${kgFormat(-h.qoldi)} kg oshdi`;
  if (h.holat === 'yaqin') return `${nomi}: limitga ${kgFormat(h.qoldi)} kg qoldi`;
  return '';
}

export default function TexnikXizmatSahifasi() {
  const [maks, setMaks] = useState(35);
  const [limitlar, setLimitlar] = useState<MoshinaLimitlari>({});
  const [tarix, setTarix] = useState<HisoblagichTarixi>({});
  const [hisoblar, setHisoblar] = useState<Record<number, MoshinaHisobi>>({});
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [manba, setManba] = useState<'baza' | 'mahalliy'>('baza');
  const [filtr, setFiltr] = useState<'hammasi' | 'ogohlantirish'>('hammasi');
  const [qidiruv, setQidiruv] = useState('');
  const [tarixOchiq, setTarixOchiq] = useState<number | null>(null);

  // Hisoblagichni yangilash oynasi
  const [yangilanadigan, setYangilanadigan] = useState<number | null>(null);
  const [mexanikIsmi, setMexanikIsmi] = useState('');
  const [xato, setXato] = useState('');

  const hisobla = useCallback(async (tarixHozir: HisoblagichTarixi, maksHozir: number) => {
    setYuklanmoqda(true);
    const boshlar = hisoblagichBoshlari(tarixHozir);
    let royxat: MoshinaHisobi[] | null = null;
    try {
      const res = await fetch('/api/texnik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boshlar, maks: maksHozir }),
        cache: 'no-store'
      });
      if (res.ok) royxat = (await res.json()).moshinalar;
    } catch {}
    if (royxat) setManba('baza');
    else {
      royxat = mahalliyHisob(mahalliySmenalar(), boshlar, maksHozir);
      setManba('mahalliy');
    }
    const xarita: Record<number, MoshinaHisobi> = {};
    royxat.forEach((h) => (xarita[h.n] = h));
    setHisoblar(xarita);
    setYuklanmoqda(false);
  }, []);

  useEffect(() => {
    const m = moshinalarSoni(localStorage.getItem(MOSHINA_KALIT.soni));
    const t = oqish<HisoblagichTarixi>(MOSHINA_KALIT.hisoblagich, {});
    setMaks(m);
    setLimitlar(oqish<MoshinaLimitlari>(MOSHINA_KALIT.limitlar, {}));
    setTarix(t);
    setMexanikIsmi(localStorage.getItem('_mexanik_ismi') || '');
    hisobla(t, m);
  }, [hisobla]);

  const bugun = toshkentSana();

  const moshinalar = useMemo(() => {
    return Array.from({ length: maks }, (_, i) => {
      const n = i + 1;
      const h = hisoblar[n] || { n, kun: 0, kg: 0, rulon: 0, oxirgiSana: null };
      const limit = limitlar[String(n)] ?? null;
      const yozuvlar = tarix[String(n)] || [];
      const oxirgiYangilanish = yozuvlar[yozuvlar.length - 1];
      return { ...h, nomi: moshinaNomi(n), limit, holat: limitHolati(h.kg, limit), yozuvlar, oxirgiYangilanish };
    }).sort((a, b) => {
      // Limitdan oshganlar, keyin limitga yaqinlar tepada
      const daraja = (x: typeof a) => (x.holat.holat === 'oshdi' ? 2 : x.holat.holat === 'yaqin' ? 1 : 0);
      return daraja(b) - daraja(a) || (daraja(a) > 0 ? b.holat.foiz - a.holat.foiz : a.n - b.n);
    });
  }, [maks, hisoblar, limitlar, tarix]);

  const ogohlantirishlar = moshinalar.filter((m) => m.holat.holat === 'oshdi' || m.holat.holat === 'yaqin');
  const korinadigan = moshinalar.filter((m) => {
    if (filtr === 'ogohlantirish' && !(m.holat.holat === 'oshdi' || m.holat.holat === 'yaqin')) return false;
    const q = qidiruv.replace(/\D/g, '');
    return !q || String(m.n) === q;
  });

  const limitniSaqlash = (n: number, qiymat: string) => {
    const son = parseInt(qiymat.replace(/\D/g, ''), 10);
    const yangi = { ...limitlar };
    if (son > 0) yangi[String(n)] = son;
    else delete yangi[String(n)];
    if (JSON.stringify(yangi) === JSON.stringify(limitlar)) return;
    setLimitlar(yangi);
    localStorage.setItem(MOSHINA_KALIT.limitlar, JSON.stringify(yangi));
  };

  const hisoblagichniYangilash = () => {
    if (yangilanadigan === null) return;
    const ism = mexanikIsmi.trim();
    if (ism.length < 2) {
      setXato('Ismingizni yozing — tarixda kim yangilagani ko\'rinib turadi');
      return;
    }
    const n = yangilanadigan;
    const h = hisoblar[n] || { kun: 0, kg: 0, rulon: 0 };
    const yozuv: HisoblagichYozuvi = {
      vaqt: toshkentVaqtMatni(),
      kg: Math.round(h.kg * 100) / 100,
      kun: h.kun,
      rulon: h.rulon,
      limit: limitlar[String(n)] ?? null,
      kim: ism
    };
    // Eng so'nggi tarixni o'qib, ustiga qo'shamiz (boshqa kompyuterdagi yozuvlar yo'qolmasin)
    const joriyTarix = oqish<HisoblagichTarixi>(MOSHINA_KALIT.hisoblagich, {});
    const yangiTarix = { ...joriyTarix, [String(n)]: [...(joriyTarix[String(n)] || []), yozuv] };
    localStorage.setItem(MOSHINA_KALIT.hisoblagich, JSON.stringify(yangiTarix));
    localStorage.setItem('_mexanik_ismi', ism);
    setTarix(yangiTarix);
    setYangilanadigan(null);
    setXato('');
    hisobla(yangiTarix, maks);
  };

  const tanlangan = yangilanadigan !== null ? moshinalar.find((m) => m.n === yangilanadigan) : null;

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-3 pt-16 sm:p-6 md:pt-6">
      {/* SARLAVHA */}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 sm:text-3xl">
            <span aria-hidden>🔧</span> Texnik xizmat
          </h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
            Har bir moshina hisoblagich yangilangandan beri necha kun ishlagani va necha kg mahsulot chiqargani
          </p>
        </div>
        <button
          onClick={() => hisobla(tarix, maks)}
          disabled={yuklanmoqda}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          {yuklanmoqda ? 'Hisoblanmoqda...' : '↻ Yangilash'}
        </button>
      </div>

      {manba === 'mahalliy' && !yuklanmoqda && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
          ⚠️ Baza ulanmagan. Hisob faqat shu kompyuterdagi oxirgi smenalardan chiqarildi — to&apos;liq hisob baza ulanganda chiqadi.
        </div>
      )}

      {/* OGOHLANTIRISHLAR */}
      {ogohlantirishlar.length > 0 && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-rose-700">
            Diqqat: {ogohlantirishlar.length} ta moshina limitga yetdi yoki yaqinlashdi
          </p>
          <ul className="flex flex-wrap gap-2">
            {ogohlantirishlar.map((m) => (
              <li
                key={m.n}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  m.holat.holat === 'oshdi' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {m.holat.holat === 'oshdi' ? '⛔ ' : '⚠️ '}
                {ogohlantirishMatni(m.nomi, m.holat)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FILTR */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {(
            [
              ['hammasi', `Hammasi (${maks})`],
              ['ogohlantirish', `Ogohlantirish (${ogohlantirishlar.length})`]
            ] as const
          ).map(([k, nomi]) => (
            <button
              key={k}
              onClick={() => setFiltr(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                filtr === k ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {nomi}
            </button>
          ))}
        </div>
        <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-48">
          <span className="pl-3 text-sm font-black text-slate-400">MK-</span>
          <input
            inputMode="numeric"
            value={qidiruv}
            onChange={(e) => setQidiruv(e.target.value.replace(/\D/g, ''))}
            placeholder="raqam"
            className="w-full px-1 py-2 text-base font-black text-slate-800 outline-none sm:text-sm"
          />
        </div>
        <p className="text-[11px] font-semibold text-slate-400 sm:ml-auto">
          Ogohlantirish limitning {OGOHLANTIRISH_FOIZI}% ida chiqadi
        </p>
      </div>

      {/* MOSHINA KARTALARI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {korinadigan.map((m) => {
          const rang = HOLAT_RANGI[m.holat.holat];
          const boshlangan = m.oxirgiYangilanish?.vaqt.slice(0, 10);
          return (
            <div key={m.n} className={`rounded-2xl border bg-white p-4 shadow-2xs ${rang.karta}`}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-2xl font-black tracking-tight text-slate-900">{m.nomi}</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {boshlangan
                      ? `Hisoblagich: ${sanaKorinishi(boshlangan)} dan (${kunlarFarqi(boshlangan, bugun)} kalendar kun)`
                      : 'Hisoblagich hali yangilanmagan — boshidan beri'}
                  </p>
                </div>
                <label className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Limit, kg</span>
                  <input
                    key={`${m.n}_${m.limit ?? ''}`}
                    inputMode="numeric"
                    defaultValue={m.limit ? String(m.limit) : ''}
                    placeholder="—"
                    onBlur={(e) => limitniSaqlash(m.n, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className="mt-0.5 w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right text-base font-black text-slate-800 outline-none focus:border-indigo-500 focus:bg-white sm:text-sm"
                  />
                </label>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-black text-slate-900">{m.kun}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">kun ishladi</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-black text-slate-900">{kgFormat(m.kg)}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">kg</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-black text-slate-900">{m.rulon}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">rulon</p>
                </div>
              </div>

              {m.limit ? (
                <div className="mb-3">
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${rang.chiziq}`} style={{ width: `${Math.min(100, m.holat.foiz)}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] font-bold">
                    <span className={rang.matn}>
                      {m.holat.holat === 'oshdi' || m.holat.holat === 'yaqin'
                        ? ogohlantirishMatni(m.nomi, m.holat).split(': ')[1]
                        : `${kgFormat(m.holat.qoldi)} kg qoldi`}
                    </span>
                    <span className="text-slate-400">{Math.round(m.holat.foiz)}%</span>
                  </div>
                </div>
              ) : (
                <p className="mb-3 text-[11px] font-semibold text-slate-400">Limit qo&apos;yilmagan</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setXato('');
                    setYangilanadigan(m.n);
                  }}
                  className="flex-1 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-black text-white transition-all hover:bg-slate-700 active:scale-[0.98]"
                >
                  🔧 Hisoblagichni yangilash
                </button>
                <button
                  onClick={() => setTarixOchiq(tarixOchiq === m.n ? null : m.n)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Tarix ({m.yozuvlar.length})
                </button>
              </div>

              {tarixOchiq === m.n && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {m.yozuvlar.length === 0 ? (
                    <p className="text-xs font-semibold text-slate-400">Hali yangilanmagan</p>
                  ) : (
                    <ul className="space-y-2">
                      {[...m.yozuvlar].reverse().map((y, i) => (
                        <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                          <p className="font-black text-slate-800">{vaqtKorinishi(y.vaqt)}</p>
                          <p className="font-semibold text-slate-600">
                            {kgFormat(y.kg)} kg · {y.kun} kun · {y.rulon} rulon
                            {y.limit ? ` · limit ${kgFormat(y.limit)} kg` : ''}
                          </p>
                          <p className="font-semibold text-slate-400">Yangiladi: {y.kim}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {korinadigan.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">
          {filtr === 'ogohlantirish' ? 'Hozircha limitga yaqin moshina yo\'q ✓' : 'Bunday raqamli moshina yo\'q'}
        </div>
      )}

      {/* HISOBLAGICHNI YANGILASH OYNASI */}
      {tanlangan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={() => setYangilanadigan(null)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-black text-slate-900">{tanlangan.nomi} — hisoblagichni yangilash</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Hozirgi hisob tarixga yoziladi va noldan boshlanadi. Bu amalni qaytarib bo&apos;lmaydi.
            </p>

            <div className="my-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 py-2">
                <p className="text-lg font-black">{tanlangan.kun}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">kun</p>
              </div>
              <div className="rounded-xl bg-slate-50 py-2">
                <p className="text-lg font-black">{kgFormat(tanlangan.kg)}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">kg</p>
              </div>
              <div className="rounded-xl bg-slate-50 py-2">
                <p className="text-lg font-black">{tanlangan.rulon}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">rulon</p>
              </div>
            </div>

            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Mexanik ismi</label>
            <input
              autoFocus
              value={mexanikIsmi}
              onChange={(e) => {
                setMexanikIsmi(e.target.value);
                setXato('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && hisoblagichniYangilash()}
              placeholder="Masalan: Akmal"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
            />
            {xato && <p className="mt-2 text-xs font-bold text-rose-600">{xato}</p>}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setYangilanadigan(null)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={hisoblagichniYangilash}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-black text-white shadow-sm hover:bg-rose-700 active:scale-[0.98]"
              >
                Ha, noldan boshlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
