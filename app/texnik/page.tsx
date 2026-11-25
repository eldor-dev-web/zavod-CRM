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
import { SahifaSarlavhasi, Ogohlantirish, BoshHolat, Oyna, Maydon, Tugma, Ikonka, cn } from '@/components/ui';
import { useXotiraYangilanishi } from '@/hooks/useXotiraYangilanishi';

type Tur = 'kg' | 'kun';
type Holat = LimitHolati['holat'];

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

// Holat ranglari: faqat ma'no uchun (qizil — oshdi, sariq — yaqin, yashil — joyida, kulrang — limit yo'q)
const HOLAT: Record<Holat, { nomi: string; nuqta: string; chiziq: string; matn: string; fon: string; belgi: string }> = {
  oshdi: { nomi: 'Limitdan oshgan', nuqta: 'bg-xato-fon', chiziq: 'bg-xato-fon', matn: 'text-xato', fon: 'bg-xato-och', belgi: 'bg-xato-och text-xato' },
  yaqin: { nomi: 'Yaqinlashgan', nuqta: 'bg-den', chiziq: 'bg-den', matn: 'text-diqqat', fon: 'bg-diqqat-och', belgi: 'bg-diqqat-och text-diqqat' },
  yaxshi: { nomi: 'Joyida', nuqta: 'bg-yaxshi', chiziq: 'bg-yaxshi', matn: 'text-yaxshi', fon: 'bg-yaxshi-och', belgi: 'bg-yaxshi-och text-yaxshi' },
  yoq: { nomi: 'Limitsiz', nuqta: 'bg-chiziq-2', chiziq: 'bg-chiziq-2', matn: 'text-matn-3', fon: 'bg-sirt', belgi: 'bg-sirt-2 text-matn-2' }
};
const HOLAT_TARTIBI: Holat[] = ['oshdi', 'yaqin', 'yaxshi', 'yoq'];

// "limitga 150 kg qoldi" / "limitdan 2 kun oshdi"
function holatMatni(h: LimitHolati, tur: Tur) {
  if (h.holat === 'oshdi') return `limitdan ${sonFormat(-h.qoldi)} ${birlik(tur)} oshdi`;
  if (h.holat === 'yaqin') return `limitga ${sonFormat(h.qoldi)} ${birlik(tur)} qoldi`;
  if (h.holat === 'yaxshi') return `${sonFormat(h.qoldi)} ${birlik(tur)} qoldi`;
  return 'limit qo\'yilmagan';
}

const ogohlantirishmi = (h: LimitHolati) => h.holat === 'yaqin' || h.holat === 'oshdi';

const turNomi = (y: HisoblagichYozuvi) => (!y.tur || y.tur === 'ikkalasi' ? 'Kg va kun' : y.tur === 'kg' ? 'Kg' : 'Kun');

// Ro'yxatdagi ingichka chiziq (kg yoki kun)
function Chiziq({ yorliq, h }: { yorliq: string; h: LimitHolati }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0 text-[11px] text-matn-3">{yorliq}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sirt-2">
        {h.holat !== 'yoq' && <div className={cn('h-full rounded-full', HOLAT[h.holat].chiziq)} style={{ width: `${Math.min(100, h.foiz)}%` }} />}
      </div>
    </div>
  );
}

export default function TexnikXizmatSahifasi() {
  const [maks, setMaks] = useState(35);
  const [limitlar, setLimitlar] = useState<MoshinaLimitlari>({});
  const [tarix, setTarix] = useState<HisoblagichTarixi>({});
  const [hisoblar, setHisoblar] = useState<Record<number, MoshinaHisobi>>({});
  const [yuklanmoqda, setYuklanmoqda] = useState(true);
  const [manba, setManba] = useState<'baza' | 'mahalliy'>('baza');
  const [holatFiltr, setHolatFiltr] = useState<Holat | null>(null);
  const [qidiruv, setQidiruv] = useState('');
  const [ochiqMoshina, setOchiqMoshina] = useState<number | null>(null);

  // Hisoblagichni yangilash (moshina oynasi ichida)
  const [yangilanadigan, setYangilanadigan] = useState<number | null>(null);
  const [tanlanganTurlar, setTanlanganTurlar] = useState<Set<Tur>>(new Set());
  const [mexanikIsmi, setMexanikIsmi] = useState('');
  const [xato, setXato] = useState('');

  // "Umumiy limit" oynasi
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

  // Boshqa qurilmada limit yoki hisoblagich o'zgarsa — ekranni yangilaymiz
  useXotiraYangilanishi(
    (k) => k === MOSHINA_KALIT.limitlar || k === MOSHINA_KALIT.hisoblagich || k === MOSHINA_KALIT.soni,
    () => {
      const m = moshinalarSoni(localStorage.getItem(MOSHINA_KALIT.soni));
      const t = oqish<HisoblagichTarixi>(MOSHINA_KALIT.hisoblagich, {});
      const qaytaHisob = m !== maks || JSON.stringify(t) !== JSON.stringify(tarix);
      setMaks(m);
      setLimitlar(limitlarniOqish(oqish<unknown>(MOSHINA_KALIT.limitlar, {})));
      setTarix(t);
      if (qaytaHisob) hisobla(t, m);
    }
  );

  const boshlar = useMemo(() => hisoblagichBoshlari(tarix), [tarix]);

  const moshinalar = useMemo(() => {
    return Array.from({ length: maks }, (_, i) => {
      const n = i + 1;
      const h = hisoblar[n] || { n, kun: 0, kg: 0, rulon: 0, oxirgiSana: null };
      const limit = limitlar[String(n)] || {};
      const kgHolat = limitHolati(h.kg, limit.kg);
      const kunHolat = limitHolati(h.kun, limit.kun);
      const umumiy = jiddiyroq(kgHolat, kunHolat);
      return {
        ...h,
        nomi: moshinaNomi(n),
        limit,
        kgHolat,
        kunHolat,
        umumiy,
        // Qaysi ko'rsatkich jiddiyroq — ro'yxatda o'shaning "qoldi/oshdi" matni chiqadi
        asosiyTur: (umumiy === kunHolat && umumiy !== kgHolat ? 'kun' : 'kg') as Tur,
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

  const holatSoni = useMemo(() => {
    const s: Record<Holat, number> = { oshdi: 0, yaqin: 0, yaxshi: 0, yoq: 0 };
    moshinalar.forEach((m) => (s[m.umumiy.holat] += 1));
    return s;
  }, [moshinalar]);

  const korinadigan = moshinalar.filter((m) => {
    if (holatFiltr && m.umumiy.holat !== holatFiltr) return false;
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

  const ochiq = ochiqMoshina !== null ? moshinalar.find((m) => m.n === ochiqMoshina) : null;
  const moshinaniYopish = () => {
    setOchiqMoshina(null);
    setYangilanadigan(null);
    setXato('');
  };

  // Moshina oynasidagi kg / kun bloki: qiymat + limit maydoni + chiziq
  const limitBloki = (m: (typeof moshinalar)[number], tur: Tur) => {
    const holat = tur === 'kg' ? m.kgHolat : m.kunHolat;
    const qiymat = tur === 'kg' ? m.kg : m.kun;
    const limit = m.limit[tur];
    const r = HOLAT[holat.holat];
    return (
      <div className="rounded-boshqaruv border border-chiziq bg-sirt p-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-matn-2">{tur === 'kg' ? 'Mahsulot' : 'Ishlagan kun'}</p>
            <p className="text-xl font-bold leading-tight text-matn tabular-nums">
              {sonFormat(qiymat)} <span className="text-sm font-semibold text-matn-3">{birlik(tur)}</span>
            </p>
          </div>
          <label className="text-right">
            <span className="block text-xs text-matn-2">Limit</span>
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
              className="mt-0.5 h-9 w-24 rounded-boshqaruv border border-chiziq-2 bg-sirt px-2 text-right text-base md:text-sm font-semibold text-matn tabular-nums outline-none focus:border-asosiy focus:ring-2 focus:ring-asosiy/20"
            />
          </label>
        </div>
        {limit ? (
          <>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-sirt-2">
              <div className={cn('h-full rounded-full', r.chiziq)} style={{ width: `${Math.min(100, holat.foiz)}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span className={cn('font-semibold', r.matn)}>{holatMatni(holat, tur)}</span>
              <span className="text-matn-3 tabular-nums">{Math.round(holat.foiz)}%</span>
            </div>
          </>
        ) : (
          <p className="mt-1.5 text-xs text-matn-3">Limit qo&apos;yilmagan</p>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <SahifaSarlavhasi
        sarlavha="Texnik xizmat"
        amallar={
          <>
            <Tugma kichik onClick={() => setOmmaviyOchiq(true)}>
              Umumiy limit
            </Tugma>
            <Tugma
              kichik
              ikonka="yangilash"
              onClick={() => hisobla(tarix, maks)}
              disabled={yuklanmoqda}
              aria-label="Yangilash"
              title="Yangilash"
              className={cn('px-0! w-9 md:w-8', yuklanmoqda && '[&_svg]:animate-spin')}
            />
          </>
        }
      />

      {manba === 'mahalliy' && !yuklanmoqda && (
        <Ogohlantirish tur="diqqat" ikonka="ogohlantirish" className="mb-4">
          Baza ulanmagan. Hisob faqat shu kompyuterdagi oxirgi smenalardan chiqarildi — to&apos;liq hisob baza ulanganda chiqadi.
        </Ogohlantirish>
      )}

      {/* HOLAT XULOSASI — bosilsa filtr */}
      <div className="mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {HOLAT_TARTIBI.map((h) => {
          const tanlangan = holatFiltr === h;
          const r = HOLAT[h];
          return (
            <button
              key={h}
              type="button"
              onClick={() => setHolatFiltr(tanlangan ? null : h)}
              aria-pressed={tanlangan}
              className={cn(
                'rounded-karta border p-3 text-left transition-all',
                h === 'yoq' ? 'bg-sirt border-chiziq' : cn(r.fon, 'border-transparent'),
                tanlangan ? 'ring-2 ring-asosiy' : 'hover:brightness-[0.98]'
              )}
            >
              <p className={cn('text-xs md:text-sm font-semibold', h === 'yoq' ? 'text-matn-2' : r.matn)}>{r.nomi}</p>
              <p className={cn('mt-0.5 text-2xl font-bold tabular-nums leading-tight', h === 'yoq' ? 'text-matn' : r.matn)}>{holatSoni[h]}</p>
            </button>
          );
        })}
      </div>

      {/* QIDIRUV */}
      <div className="mb-3 flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
        <label className="flex h-11 md:h-10 items-center gap-1.5 rounded-boshqaruv border border-chiziq-2 bg-sirt px-3 md:w-56 focus-within:border-asosiy focus-within:ring-2 focus-within:ring-asosiy/20">
          <Ikonka nom="qidirish" className="w-4 h-4 text-matn-3" />
          <span className="text-sm font-semibold text-matn-3">MK-</span>
          <input
            inputMode="numeric"
            value={qidiruv}
            onChange={(e) => setQidiruv(e.target.value.replace(/\D/g, ''))}
            placeholder="raqam"
            aria-label="Moshina raqami bo'yicha qidirish"
            className="w-full bg-transparent text-base md:text-sm font-semibold text-matn outline-none placeholder:font-normal placeholder:text-matn-3"
          />
        </label>
        
          {holatFiltr && (
              <button type="button" onClick={() => setHolatFiltr(null)} className="font-semibold text-asosiy hover:underline">
                Hammasini ko&apos;rsatish
              </button>
          )}
      </div>

      {/* MOSHINALAR RO'YXATI */}
      {korinadigan.length === 0 ? (
        <div className="rounded-karta border border-chiziq bg-sirt">
          <BoshHolat
            ikonka={holatFiltr ? 'tasdiq' : 'qidirish'}
            sarlavha={holatFiltr ? `"${HOLAT[holatFiltr].nomi}" holatida moshina yo'q` : 'Bunday raqamli moshina yo\'q'}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-karta border border-chiziq bg-sirt">
          <div className="grid lg:grid-cols-2">
            {korinadigan.map((m) => {
              const h = m.umumiy;
              const r = HOLAT[h.holat];
              return (
                <button
                  key={m.n}
                  type="button"
                  onClick={() => setOchiqMoshina(m.n)}
                  className={cn(
                    'flex items-center gap-3 border-b border-chiziq px-3 md:px-4 py-3 text-left transition-colors lg:[&:nth-child(odd)]:border-r',
                    h.holat === 'oshdi' ? 'bg-xato-och hover:brightness-[0.98]' : 'hover:bg-sirt-2'
                  )}
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', r.nuqta)} />
                  <span className="w-14 shrink-0 font-bold text-matn">{m.nomi}</span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Chiziq yorliq="kg" h={m.kgHolat} />
                    <Chiziq yorliq="kun" h={m.kunHolat} />
                  </div>
                  <div className="w-[76px] shrink-0 text-right">
                    {h.holat === 'yoq' ? (
                      <p className="text-xs text-matn-3">Limit yo&apos;q</p>
                    ) : (
                      <>
                        <p className={cn('text-sm font-semibold tabular-nums whitespace-nowrap', h.holat === 'yaxshi' ? 'text-matn' : r.matn)}>
                          {h.holat === 'oshdi' ? '+' : ''}
                          {sonFormat(Math.abs(h.qoldi))} {birlik(m.asosiyTur)}
                        </p>
                        <p className="text-[11px] text-matn-3">{h.holat === 'oshdi' ? 'oshdi' : 'qoldi'}</p>
                      </>
                    )}
                  </div>
                  <Ikonka nom="ongga" className="hidden md:block w-4 h-4 shrink-0 text-matn-3" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MOSHINA OYNASI: limitlar, hisoblagich, tarix */}
      <Oyna
        ochiq={!!ochiq}
        yopish={moshinaniYopish}
        sarlavha={
          ochiq ? (
            <span className="flex items-center gap-2">
              {ochiq.nomi}
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', HOLAT[ochiq.umumiy.holat].belgi)}>{HOLAT[ochiq.umumiy.holat].nomi}</span>
            </span>
          ) : null
        }
      >
        {ochiq && (
          <div className="space-y-3">
            {limitBloki(ochiq, 'kg')}
            {limitBloki(ochiq, 'kun')}

            <p className="text-xs leading-relaxed text-matn-2">
              Kg hisoblagichi: {ochiq.kgBoshi ? `${vaqtKorinishi(ochiq.kgBoshi)} dan` : 'boshidan beri'}
              <br />
              Kun hisoblagichi: {ochiq.kunBoshi ? `${vaqtKorinishi(ochiq.kunBoshi)} dan` : 'boshidan beri'} · {ochiq.rulon} rulon
            </p>

            {yangilanadigan === ochiq.n ? (
              <div className="space-y-3 rounded-boshqaruv border border-chiziq-2 bg-sirt-2 p-3">
                <div>
                  <p className="text-sm font-semibold text-matn">Qaysi hisoblagich noldan boshlansin?</p>
                  <p className="text-xs text-matn-2">Hozirgi qiymati tarixga yoziladi.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['kg', 'kun'] as Tur[]).map((tur) => {
                    const tanlandi = tanlanganTurlar.has(tur);
                    return (
                      <button
                        key={tur}
                        type="button"
                        onClick={() => turniAlmashtirish(tur)}
                        aria-pressed={tanlandi}
                        className={cn(
                          'rounded-boshqaruv border-2 bg-sirt p-2.5 text-left transition-colors',
                          tanlandi ? 'border-asosiy bg-asosiy-och' : 'border-chiziq hover:border-chiziq-2'
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-matn-2">{tur === 'kg' ? 'Kg' : 'Kun'}</span>
                          <span
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-[5px] border-2',
                              tanlandi ? 'border-asosiy bg-asosiy text-white' : 'border-chiziq-2'
                            )}
                          >
                            {tanlandi && <Ikonka nom="tasdiq" className="w-3 h-3" />}
                          </span>
                        </span>
                        <span className="mt-1 block text-lg font-bold text-matn tabular-nums">
                          {sonFormat(tur === 'kg' ? ochiq.kg : ochiq.kun)} {birlik(tur)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Maydon
                  yorliq="Mexanik ismi"
                  value={mexanikIsmi}
                  onChange={(e) => {
                    setMexanikIsmi(e.target.value);
                    setXato('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && hisoblagichniYangilash()}
                  placeholder="Masalan: Akmal"
                  xato={xato || undefined}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Tugma onClick={() => setYangilanadigan(null)}>Bekor qilish</Tugma>
                  <Tugma tur="xavfli" onClick={hisoblagichniYangilash} disabled={tanlanganTurlar.size === 0}>
                    {tanlanganTurlar.size === 2 ? 'Ikkalasini nolga' : tanlanganTurlar.has('kg') ? 'Kg ni nolga' : tanlanganTurlar.has('kun') ? 'Kunni nolga' : 'Tanlang'}
                  </Tugma>
                </div>
              </div>
            ) : (
              <Tugma
                toliq
                ikonka="yangilash"
                className="bg-matn! text-sirt! border-0! hover:opacity-90"
                onClick={() => {
                  setXato('');
                  setTanlanganTurlar(new Set());
                  setYangilanadigan(ochiq.n);
                }}
              >
                Hisoblagichni yangilash
              </Tugma>
            )}

            <div className="pt-1">
              <p className="mb-2 text-sm font-semibold text-matn">Xizmat tarixi</p>
              {ochiq.yozuvlar.length === 0 ? (
                <p className="text-sm text-matn-3">Hali yangilanmagan</p>
              ) : (
                <ol className="ml-1 space-y-3 border-l-2 border-chiziq-2 pl-3">
                  {[...ochiq.yozuvlar].reverse().map((y, i) => (
                    <li key={i}>
                      <p className="text-sm font-semibold text-matn">
                        {vaqtKorinishi(y.vaqt)} · {turNomi(y)}
                      </p>
                      <p className="text-xs text-matn-2">
                        {turKgmi(y) && `${sonFormat(y.kg)} kg (${y.rulon} rulon)`}
                        {turKgmi(y) && turKunmi(y) && ' · '}
                        {turKunmi(y) && `${y.kun} kun`} · {y.kim}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </Oyna>

      {/* UMUMIY LIMIT OYNASI */}
      <Oyna
        ochiq={ommaviyOchiq}
        yopish={() => setOmmaviyOchiq(false)}
        sarlavha="Umumiy limit"
        amallar={
          <>
            <Tugma onClick={() => setOmmaviyOchiq(false)}>Bekor qilish</Tugma>
            <Tugma tur="asosiy" onClick={ommaviyQollash} disabled={!ommaviyKg && !ommaviyKun}>
              {maks} ta moshinaga qo&apos;yish
            </Tugma>
          </>
        }
      >
        <p className="mb-4">
          MK-1 dan MK-{maks} gacha barcha moshinalarga qo&apos;yiladi. Bo&apos;sh qoldirilgan maydon o&apos;zgarmaydi. Keyin alohida moshinani o&apos;zgartirish mumkin.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Maydon yorliq="Kg limiti" inputMode="numeric" value={ommaviyKg} onChange={(e) => setOmmaviyKg(e.target.value.replace(/\D/g, ''))} placeholder="10000" />
          <Maydon yorliq="Kun limiti" inputMode="numeric" value={ommaviyKun} onChange={(e) => setOmmaviyKun(e.target.value.replace(/\D/g, ''))} placeholder="30" />
        </div>
      </Oyna>
    </div>
  );
}
