'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  hisoblagichBoshlari,
  jiddiyroq,
  limitHolati,
  limitlarniOqish,
  mahalliyHisob,
  MOSHINA_KALIT,
  moshinaNomi,
  moshinalarSoni,
  OGOHLANTIRISH_FOIZI,
  turKgmi,
  turKunmi,
  type HisoblagichTarixi,
  type HisoblagichYozuvi,
  type LimitHolati,
  type MoshinaHisobi,
  type MoshinaLimitlari
} from '@/lib/moshina';
import { oqish } from '@/lib/mahalliyXotira';
import { toshkentVaqtMatni } from '@/lib/sana';

type Tur = 'kg' | 'kun';

const sonFormat = (n: number) => Math.round(n).toLocaleString('ru-RU');
const sanaKorinishi = (s: string) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}` : '');
const vaqtKorinishi = (v: string) => `${sanaKorinishi(v.slice(0, 10))} ${v.slice(11, 16)}`;
const birlik = (tur: Tur) => (tur === 'kg' ? 'kg' : 'kun');

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
  yoq: { chiziq: 'bg-slate-300', matn: 'text-slate-400', karta: 'border-slate-200' },
  yaxshi: { chiziq: 'bg-emerald-500', matn: 'text-emerald-700', karta: 'border-slate-200' },
  yaqin: { chiziq: 'bg-amber-500', matn: 'text-amber-700', karta: 'border-amber-300 ring-2 ring-amber-100' },
  oshdi: { chiziq: 'bg-rose-500', matn: 'text-rose-700', karta: 'border-rose-300 ring-2 ring-rose-100' }
};

// "limitga 150 kg qoldi" / "limitdan 2 kun oshdi"
function holatMatni(h: LimitHolati, tur: Tur) {
  if (h.holat === 'oshdi') return `limitdan ${sonFormat(-h.qoldi)} ${birlik(tur)} oshdi`;
  if (h.holat === 'yaqin') return `limitga ${sonFormat(h.qoldi)} ${birlik(tur)} qoldi`;
  if (h.holat === 'yaxshi') return `${sonFormat(h.qoldi)} ${birlik(tur)} qoldi`;
  return 'limit qo\'yilmagan';
}

const ogohlantirishmi = (h: LimitHolati) => h.holat === 'yaqin' || h.holat === 'oshdi';

const turNomi = (y: HisoblagichYozuvi) =>
  !y.tur || y.tur === 'ikkalasi' ? 'Kg va kun hisoblagichi' : y.tur === 'kg' ? 'Kg hisoblagichi' : 'Kun hisoblagichi';

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
  const [tanlanganTurlar, setTanlanganTurlar] = useState<Set<Tur>>(new Set());
  const [mexanikIsmi, setMexanikIsmi] = useState('');
  const [xato, setXato] = useState('');

  // "Hammasiga bir xil limit" oynasi
  const [ommaviyOchiq, setOmmaviyOchiq] = useState(false);
  const [ommaviyKg, setOmmaviyKg] = useState('');
  const [ommaviyKun, setOmmaviyKun] = useState('');

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
    setLimitlar(limitlarniOqish(oqish<unknown>(MOSHINA_KALIT.limitlar, {})));
    setTarix(t);
    setMexanikIsmi(localStorage.getItem('_mexanik_ismi') || '');
    hisobla(t, m);
  }, [hisobla]);

  const boshlar = useMemo(() => hisoblagichBoshlari(tarix), [tarix]);

  const moshinalar = useMemo(() => {
    return Array.from({ length: maks }, (_, i) => {
      const n = i + 1;
      const h = hisoblar[n] || { n, kun: 0, kg: 0, rulon: 0, oxirgiSana: null };
      const limit = limitlar[String(n)] || {};
      const kgHolat = limitHolati(h.kg, limit.kg);
      const kunHolat = limitHolati(h.kun, limit.kun);
      return {
        ...h,
        nomi: moshinaNomi(n),
        limit,
        kgHolat,
        kunHolat,
        umumiy: jiddiyroq(kgHolat, kunHolat),
        yozuvlar: tarix[String(n)] || [],
        kgBoshi: boshlar.kg[String(n)],
        kunBoshi: boshlar.kun[String(n)]
      };
    }).sort((a, b) => {
      // Limitdan oshganlar, keyin limitga yaqinlar tepada
      const daraja = (x: typeof a) => (x.umumiy.holat === 'oshdi' ? 2 : x.umumiy.holat === 'yaqin' ? 1 : 0);
      return daraja(b) - daraja(a) || (daraja(a) > 0 ? b.umumiy.foiz - a.umumiy.foiz : a.n - b.n);
    });
  }, [maks, hisoblar, limitlar, tarix, boshlar]);

  // Ogohlantirishlar: kg va kun alohida
  const ogohlantirishlar = moshinalar.flatMap((m) =>
    [
      ogohlantirishmi(m.kgHolat) ? { n: m.n, oshdi: m.kgHolat.holat === 'oshdi', matn: `${m.nomi}: ${holatMatni(m.kgHolat, 'kg')}` } : null,
      ogohlantirishmi(m.kunHolat) ? { n: m.n, oshdi: m.kunHolat.holat === 'oshdi', matn: `${m.nomi}: ${holatMatni(m.kunHolat, 'kun')}` } : null
    ].filter((x): x is { n: number; oshdi: boolean; matn: string } => !!x)
  );
  const ogohlantirishliSoni = moshinalar.filter((m) => ogohlantirishmi(m.umumiy)).length;

  const korinadigan = moshinalar.filter((m) => {
    if (filtr === 'ogohlantirish' && !ogohlantirishmi(m.umumiy)) return false;
    const q = qidiruv.replace(/\D/g, '');
    return !q || String(m.n) === q;
  });

  const limitlarniYozish = (yangi: MoshinaLimitlari) => {
    setLimitlar(yangi);
    localStorage.setItem(MOSHINA_KALIT.limitlar, JSON.stringify(yangi));
  };

  const limitniSaqlash = (n: number, tur: Tur, qiymat: string) => {
    const son = parseInt(qiymat.replace(/\D/g, ''), 10);
    const eski = limitlar[String(n)] || {};
    const yangiLimit = { ...eski };
    if (son > 0) yangiLimit[tur] = son;
    else delete yangiLimit[tur];
    if (JSON.stringify(yangiLimit) === JSON.stringify(eski)) return;
    const yangi = { ...limitlar };
    if (yangiLimit.kg || yangiLimit.kun) yangi[String(n)] = yangiLimit;
    else delete yangi[String(n)];
    limitlarniYozish(yangi);
  };

  // Hamma moshinaga bir xil limit (bo'sh qoldirilgan maydon o'zgarmaydi)
  const ommaviyQollash = () => {
    const kg = parseInt(ommaviyKg.replace(/\D/g, ''), 10);
    const kun = parseInt(ommaviyKun.replace(/\D/g, ''), 10);
    if (!(kg > 0) && !(kun > 0)) return;
    const yangi: MoshinaLimitlari = { ...limitlar };
    for (let n = 1; n <= maks; n++) {
      yangi[String(n)] = { ...(yangi[String(n)] || {}), ...(kg > 0 ? { kg } : {}), ...(kun > 0 ? { kun } : {}) };
    }
    limitlarniYozish(yangi);
    setOmmaviyOchiq(false);
    setOmmaviyKg('');
    setOmmaviyKun('');
  };

  const turniAlmashtirish = (tur: Tur) => {
    setXato('');
    setTanlanganTurlar((eski) => {
      const yangi = new Set(eski);
      if (yangi.has(tur)) yangi.delete(tur);
      else yangi.add(tur);
      return yangi;
    });
  };

  const hisoblagichniYangilash = () => {
    if (yangilanadigan === null) return;
    if (tanlanganTurlar.size === 0) {
      setXato('Qaysi hisoblagichni yangilashni tanlang: kg yoki kun');
      return;
    }
    const ism = mexanikIsmi.trim();
    if (ism.length < 2) {
      setXato('Ismingizni yozing — tarixda kim yangilagani ko\'rinib turadi');
      return;
    }
    const n = yangilanadigan;
    const h = hisoblar[n] || { kun: 0, kg: 0, rulon: 0 };
    const limit = limitlar[String(n)] || {};
    const tur = tanlanganTurlar.size === 2 ? 'ikkalasi' : tanlanganTurlar.has('kg') ? 'kg' : 'kun';
    const yozuv: HisoblagichYozuvi = {
      vaqt: toshkentVaqtMatni(),
      tur,
      kg: Math.round(h.kg * 100) / 100,
      kun: h.kun,
      rulon: h.rulon,
      kgLimit: limit.kg ?? null,
      kunLimit: limit.kun ?? null,
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

  const limitQatori = (m: (typeof moshinalar)[number], tur: Tur) => {
    const holat = tur === 'kg' ? m.kgHolat : m.kunHolat;
    const qiymat = tur === 'kg' ? m.kg : m.kun;
    const limit = m.limit[tur];
    const rang = HOLAT_RANGI[holat.holat];
    return (
      <div className="rounded-xl bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {tur === 'kg' ? '⚖️ Mahsulot' : '📅 Ishlagan kun'}
            </p>
            <p className="text-lg font-black leading-tight text-slate-900">
              {sonFormat(qiymat)} <span className="text-xs font-bold text-slate-400">{birlik(tur)}</span>
            </p>
          </div>
          <label className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Limit</span>
            <input
              key={`${m.n}_${tur}_${limit ?? ''}`}
              inputMode="numeric"
              defaultValue={limit ? String(limit) : ''}
              placeholder="—"
              aria-label={`${m.nomi} ${birlik(tur)} limiti`}
              onBlur={(e) => limitniSaqlash(m.n, tur, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="mt-0.5 w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-base font-black text-slate-800 outline-none focus:border-indigo-500 sm:text-sm"
            />
          </label>
        </div>
        {limit ? (
          <>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${rang.chiziq}`} style={{ width: `${Math.min(100, holat.foiz)}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] font-bold">
              <span className={rang.matn}>{holatMatni(holat, tur)}</span>
              <span className="text-slate-400">{Math.round(holat.foiz)}%</span>
            </div>
          </>
        ) : (
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Limit qo&apos;yilmagan</p>
        )}
      </div>
    );
  };

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
        <div className="flex gap-2">
          <button
            onClick={() => setOmmaviyOchiq(true)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98]"
          >
            Hammasiga bir xil limit
          </button>
          <button
            onClick={() => hisobla(tarix, maks)}
            disabled={yuklanmoqda}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {yuklanmoqda ? 'Hisoblanmoqda...' : '↻ Yangilash'}
          </button>
        </div>
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
            Diqqat: {ogohlantirishliSoni} ta moshina limitga yetdi yoki yaqinlashdi
          </p>
          <ul className="flex flex-wrap gap-2">
            {ogohlantirishlar.map((o, i) => (
              <li key={i} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${o.oshdi ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-900'}`}>
                {o.oshdi ? '⛔ ' : '⚠️ '}
                {o.matn}
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
              ['ogohlantirish', `Ogohlantirish (${ogohlantirishliSoni})`]
            ] as const
          ).map(([k, nomi]) => (
            <button
              key={k}
              onClick={() => setFiltr(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${filtr === k ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
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
            aria-label="Moshina raqami bo'yicha qidirish"
            className="w-full px-1 py-2 text-base font-black text-slate-800 outline-none sm:text-sm"
          />
        </div>
        <p className="text-[11px] font-semibold text-slate-400 sm:ml-auto">
          Ogohlantirish limitning {OGOHLANTIRISH_FOIZI}% ida chiqadi · kun = moshina ishlagan kunlar
        </p>
      </div>

      {/* MOSHINA KARTALARI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {korinadigan.map((m) => (
          <div key={m.n} className={`rounded-2xl border bg-white p-4 shadow-2xs ${HOLAT_RANGI[m.umumiy.holat].karta}`}>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <p className="text-2xl font-black tracking-tight text-slate-900">{m.nomi}</p>
              <p className="text-[11px] font-bold text-slate-400">{m.rulon} rulon</p>
            </div>

            <div className="mb-3 space-y-2">
              {limitQatori(m, 'kg')}
              {limitQatori(m, 'kun')}
            </div>

            <p className="mb-3 text-[11px] font-semibold leading-relaxed text-slate-400">
              Kg hisoblagichi: {m.kgBoshi ? `${vaqtKorinishi(m.kgBoshi)} dan` : 'boshidan beri'}
              <br />
              Kun hisoblagichi: {m.kunBoshi ? `${vaqtKorinishi(m.kunBoshi)} dan` : 'boshidan beri'}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setXato('');
                  setTanlanganTurlar(new Set());
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
                        <p className="font-black text-slate-800">
                          {vaqtKorinishi(y.vaqt)} · <span className="text-indigo-600">{turNomi(y)}</span>
                        </p>
                        <p className="font-semibold text-slate-600">
                          {turKgmi(y) && `${sonFormat(y.kg)} kg (${y.rulon} rulon)`}
                          {turKgmi(y) && turKunmi(y) && ' · '}
                          {turKunmi(y) && `${y.kun} kun`}
                        </p>
                        <p className="font-semibold text-slate-400">Yangiladi: {y.kim}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {korinadigan.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-400">
          {filtr === 'ogohlantirish' ? 'Hozircha limitga yaqin moshina yo\'q ✓' : 'Bunday raqamli moshina yo\'q'}
        </div>
      )}

      {/* HISOBLAGICHNI YANGILASH OYNASI */}
      {tanlangan && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => setYangilanadigan(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="text-lg font-black text-slate-900">{tanlangan.nomi} — hisoblagichni yangilash</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Qaysi hisoblagich noldan boshlansin? Hozirgi qiymati tarixga yoziladi.</p>

            <div className="my-4 grid grid-cols-2 gap-2">
              {(['kg', 'kun'] as Tur[]).map((tur) => {
                const tanlandi = tanlanganTurlar.has(tur);
                return (
                  <button
                    key={tur}
                    type="button"
                    onClick={() => turniAlmashtirish(tur)}
                    aria-pressed={tanlandi}
                    className={`rounded-2xl border-2 p-3 text-left transition-all ${
                      tanlandi ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-500">{tur === 'kg' ? '⚖️ Kg' : '📅 Kun'}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 text-[11px] font-black ${tanlandi ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                        {tanlandi ? '✓' : ''}
                      </span>
                    </span>
                    <span className="mt-1 block text-xl font-black text-slate-900">
                      {sonFormat(tur === 'kg' ? tanlangan.kg : tanlangan.kun)} {birlik(tur)}
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400">
                      {tanlangan.limit[tur] ? `limit: ${sonFormat(tanlangan.limit[tur]!)} ${birlik(tur)}` : 'limit yo\'q'}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Mexanik ismi</label>
            <input
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
              <button onClick={() => setYangilanadigan(null)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Bekor qilish
              </button>
              <button
                onClick={hisoblagichniYangilash}
                disabled={tanlanganTurlar.size === 0}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-sm font-black text-white shadow-sm hover:bg-rose-700 active:scale-[0.98] disabled:opacity-40"
              >
                {tanlanganTurlar.size === 2 ? 'Ikkalasini noldan boshlash' : tanlanganTurlar.has('kg') ? 'Kg ni noldan boshlash' : tanlanganTurlar.has('kun') ? 'Kunni noldan boshlash' : 'Tanlang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HAMMASIGA BIR XIL LIMIT OYNASI */}
      {ommaviyOchiq && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => setOmmaviyOchiq(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="text-lg font-black text-slate-900">Hammasiga bir xil limit</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              MK-1 dan MK-{maks} gacha barcha moshinalarga qo&apos;yiladi. Bo&apos;sh qoldirilgan maydon o&apos;zgarmaydi. Keyin alohida moshinani o&apos;zgartirish mumkin.
            </p>
            <div className="my-4 grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">⚖️ Kg limiti</span>
                <input
                  inputMode="numeric"
                  value={ommaviyKg}
                  onChange={(e) => setOmmaviyKg(e.target.value.replace(/\D/g, ''))}
                  placeholder="10000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </label>
              <label>
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">📅 Kun limiti</span>
                <input
                  inputMode="numeric"
                  value={ommaviyKun}
                  onChange={(e) => setOmmaviyKun(e.target.value.replace(/\D/g, ''))}
                  placeholder="30"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base font-black text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOmmaviyOchiq(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Bekor qilish
              </button>
              <button
                onClick={ommaviyQollash}
                disabled={!ommaviyKg && !ommaviyKun}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-black text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"
              >
                {maks} ta moshinaga qo&apos;yish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
