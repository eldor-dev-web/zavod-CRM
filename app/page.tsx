'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ishchiOyligi, faolIshchilar, KALIT, oySozlamasi, STANDART_BRAK_STAVKALARI, STANDART_LAVOZIMLAR, STANDART_OPERATOR_QOSHIMCHA } from '@/lib/hisob';
import { oqish } from '@/lib/mahalliyXotira';
import { sanagaKunQoshish, toshkentOy, toshkentSana } from '@/lib/sana';

const Icons = {
  Wallet: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  ),
  Alert: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Users: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  Cube: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  Chart: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  Trophy: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    </svg>
  ),
  Cross: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Check: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  ArrowUpRight: () => (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
};

// Baza ulanmaganda: shu kompyuterda saqlangan smenalardan jami kg va rulon soni
function mahalliySmenaJamlari() {
  const xarita = new Map<string, { sana: string; smena: string; moshinalar: any[] }>();
  try {
    const arxiv = JSON.parse(localStorage.getItem('zavod_smena_arxivlari') || '[]');
    if (Array.isArray(arxiv)) {
      arxiv.forEach((s: any) => {
        if (s?.sana && s?.smena) xarita.set(`${s.sana}_${s.smena}`, { sana: s.sana, smena: s.smena, moshinalar: s.moshinaTafsilotlari });
      });
    }
  } catch {}
  for (let i = 0; i < localStorage.length; i++) {
    const kalit = localStorage.key(i);
    if (!kalit || !/^zavod_smena_\d{4}-\d{2}-\d{2}_/.test(kalit)) continue;
    try {
      const d = JSON.parse(localStorage.getItem(kalit) || '{}');
      const smena = d.smena ?? d.smenaTuri;
      if (d.sana && smena) xarita.set(`${d.sana}_${smena}`, { sana: d.sana, smena, moshinalar: d.moshinalar });
    } catch {}
  }
  return Array.from(xarita.values()).map(({ sana, smena, moshinalar }) => {
    let kg = 0;
    let rulon = 0;
    (Array.isArray(moshinalar) ? moshinalar : Object.values(moshinalar || {})).forEach((m: any) =>
      (Array.isArray(m?.rulonlar) ? m.rulonlar : []).forEach((r: any) => {
        const n = parseFloat(String(r?.kg ?? '').replace(',', '.'));
        if (!isNaN(n) && n > 0) {
          kg += n;
          rulon += 1;
        }
      })
    );
    return { sana, smena: String(smena), kg, rulon };
  });
}

export default function AsosiyPanelSahifasi() {
  const [tanlanganOy, setTanlanganOy] = useState('');

  const [statistika, setStatistika] = useState({
    jamiOylik: 0,
    jamiJarima: 0,
    jamiIgnaMetr: 0,
    jamiLuxMetr: 0,
    faolIshchilarSoni: 0,
    shuOyJamiKg: 0,
    shuOyJamiSoni: 0,
    kechagiSana: '',
    kechagiDenKg: 0,
    kechagiDenSoni: 0,
    kechagiNochKg: 0,
    kechagiNochSoni: 0,
    bugungiJamiKg: 0,
    bugungiJamiSoni: 0,
    qahramon: { ism: '-', kun: 0 },
    qoidabuzar: { ism: '-', brakMetr: 0 },
    grafikData: [] as { oyKodi: string; oyNomi: string; jamiKg: number; jamiSoni: number }[],
    grafikMaxKg: 1
  });

  const malumotlarniAnalizQilish = useCallback(async (oy: string) => {
    if (!oy) return;

    // Oylik va jarima umumiy hisob faylidan (Ishchilar sahifasi va bot bilan bir xil)
    const ishchilar = faolIshchilar(oqish(KALIT.ishchilar(oy), []));
    const saqlanganQoshimcha = localStorage.getItem(KALIT.operatorQoshimcha);
    // Tanlangan oyda amal qilgan sozlamalar (o'tgan oylar eski stavka bilan)
    const oySozlama = oySozlamasi(
      oy,
      {
        lavozimlar: oqish(KALIT.lavozimlar, STANDART_LAVOZIMLAR),
        operatorQoshimcha: saqlanganQoshimcha !== null ? Number(saqlanganQoshimcha) : STANDART_OPERATOR_QOSHIMCHA,
        brakStavkalari: { ...STANDART_BRAK_STAVKALARI, ...oqish(KALIT.brakStavkalari, {}) }
      },
      oqish(KALIT.sozlamaTarixi, {})
    );
    const manbalar = {
      davomat: oqish(KALIT.davomat, {}),
      ...oySozlama,
      brakJadvali: oqish(KALIT.brakJadvali(oy), {}),
      eslatmalar: ''
    };

    let tempOylik = 0;
    let tempJarima = 0;
    let tempIgna = 0;
    let tempLux = 0;
    let maxKun = 0;
    let bestWorker = '-';
    let maxBrak = 0;
    let worstWorker = '-';

    const noyobIshchilarMap = new Map();
    ishchilar.forEach((i) => noyobIshchilarMap.set(i.id, i));
    const noyobIshchilar = Array.from(noyobIshchilarMap.values());

    noyobIshchilar.forEach((ishchi: any) => {
      const o = ishchiOyligi(ishchi, oy, manbalar);
      tempOylik += o.hisoblangan;
      tempJarima += o.brakJarima;
      tempIgna += o.brakIgna;
      tempLux += o.brakLux;

      if (o.jamiKun > maxKun) {
        maxKun = o.jamiKun;
        bestWorker = ishchi.ism;
      }
      const ishchiJamiBrak = o.brakIgna + o.brakLux;
      if (ishchiJamiBrak > maxBrak) {
        maxBrak = ishchiJamiBrak;
        worstWorker = ishchi.ism;
      }
    });

    const bugunSanaStr = toshkentSana();
    const kechaSanaStr = sanagaKunQoshish(bugunSanaStr, -1);
    const kechaKorsatish = `${kechaSanaStr.slice(8, 10)}.${kechaSanaStr.slice(5, 7)}`;

    let y_kechaDenKg = 0, y_kechaDenSoni = 0;
    let y_kechaNochKg = 0, y_kechaNochSoni = 0;
    let y_bugunJamiKg = 0, y_bugunJamiSoni = 0;

    const yillikOylarKg: Record<string, number> = {};
    const yillikOylarSoni: Record<string, number> = {};

    // Smenalar bo'yicha jami kg va rulon: avval bazadan (barcha kompyuterlardagi ma'lumot),
    // baza ulanmagan bo'lsa shu kompyuterdagi nusxalardan
    const joriyYilBoshi = `${oy.split('-')[0]}-01-01`;
    const dan = kechaSanaStr < joriyYilBoshi ? kechaSanaStr : joriyYilBoshi;
    const gacha = `${oy.split('-')[0]}-12-31` > bugunSanaStr ? `${oy.split('-')[0]}-12-31` : bugunSanaStr;
    let smenaJamlari: { sana: string; smena: string; kg: number; rulon: number }[] | null = null;
    try {
      const res = await fetch(`/api/statistika?dan=${dan}&gacha=${gacha}`, { cache: 'no-store' });
      if (res.ok) smenaJamlari = (await res.json()).smenalar;
    } catch {}
    if (!smenaJamlari) smenaJamlari = mahalliySmenaJamlari();

    smenaJamlari.forEach(({ sana: sSana, smena: sSmena, kg: smenaKg, rulon: smenaRulonSoni }) => {
      if (sSana === kechaSanaStr) {
        if (sSmena.includes('DEN')) {
          y_kechaDenKg += smenaKg;
          y_kechaDenSoni += smenaRulonSoni;
        }
        if (sSmena.includes('NOCH')) {
          y_kechaNochKg += smenaKg;
          y_kechaNochSoni += smenaRulonSoni;
        }
      }
      if (sSana === bugunSanaStr) {
        y_bugunJamiKg += smenaKg;
        y_bugunJamiSoni += smenaRulonSoni;
      }
      if (sSana) {
        const smenaOyi = sSana.slice(0, 7);
        yillikOylarKg[smenaOyi] = (yillikOylarKg[smenaOyi] || 0) + smenaKg;
        yillikOylarSoni[smenaOyi] = (yillikOylarSoni[smenaOyi] || 0) + smenaRulonSoni;
      }
    });

    const oyNomlari = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
    const grafikDataArr: { oyKodi: string; oyNomi: string; jamiKg: number; jamiSoni: number }[] = [];
    let grafikEngKopKg = 0;
    const joriyYil = oy.split('-')[0];

    for (let i = 1; i <= 12; i++) {
      const oyKodi = `${joriyYil}-${String(i).padStart(2, '0')}`;
      const oylikHajm = yillikOylarKg[oyKodi] || 0;
      const oylikSoni = yillikOylarSoni[oyKodi] || 0;
      if (oylikHajm > grafikEngKopKg) grafikEngKopKg = oylikHajm;
      grafikDataArr.push({
        oyKodi,
        oyNomi: oyNomlari[i - 1],
        jamiKg: Number(oylikHajm.toFixed(2)),
        jamiSoni: oylikSoni
      });
    }

    setStatistika({
      jamiOylik: tempOylik,
      jamiJarima: tempJarima,
      jamiIgnaMetr: tempIgna,
      jamiLuxMetr: tempLux,
      faolIshchilarSoni: noyobIshchilar.length,
      shuOyJamiKg: Number((yillikOylarKg[oy] || 0).toFixed(1)),
      shuOyJamiSoni: yillikOylarSoni[oy] || 0,
      kechagiSana: kechaKorsatish,
      kechagiDenKg: Number(y_kechaDenKg.toFixed(2)),
      kechagiDenSoni: y_kechaDenSoni,
      kechagiNochKg: Number(y_kechaNochKg.toFixed(2)),
      kechagiNochSoni: y_kechaNochSoni,
      bugungiJamiKg: Number(y_bugunJamiKg.toFixed(2)),
      bugungiJamiSoni: y_bugunJamiSoni,
      qahramon: { ism: bestWorker, kun: maxKun },
      qoidabuzar: { ism: worstWorker, brakMetr: maxBrak },
      grafikData: grafikDataArr,
      grafikMaxKg: grafikEngKopKg || 1
    });
  }, []);

  useEffect(() => {
    const hozirgiOy = toshkentOy();
    setTanlanganOy(hozirgiOy);
    malumotlarniAnalizQilish(hozirgiOy);

    const yangilash = () => malumotlarniAnalizQilish(hozirgiOy);
    window.addEventListener('storage', yangilash);
    return () => window.removeEventListener('storage', yangilash);
  }, [malumotlarniAnalizQilish]);

  return (
    <div className="w-full font-sans bg-[#F8FAFC] min-h-screen text-slate-800 pb-10 sm:p-6 lg:p-8">
      
      {/* 1. YUQORI SARLAVHA VA OY TANLAGICH */}
      <div className="flex flex-row justify-between items-center px-4 pt-5 sm:px-0 sm:pt-0 mb-5 sm:mb-7 gap-2">
        <div className="pt-2 md:pt-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Jonli
            </span>
          </div>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-1 hidden sm:block">
            Umumiy ishlab chiqarish, rulonlar soni va moliya tahlili
          </p>
        </div>

        <div className="bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-2xs border border-slate-200/90 flex items-center hover:border-indigo-300 transition-colors">
          <input
            type="month"
            value={tanlanganOy}
            onChange={(e) => {
              setTanlanganOy(e.target.value);
              malumotlarniAnalizQilish(e.target.value);
            }}
            className="border-none bg-transparent font-bold text-slate-700 text-xs sm:text-sm outline-none cursor-pointer w-full"
          />
        </div>
      </div>

      {/* 2. 4 TA ASOSIY KPI KARTOCHKALAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 px-3 sm:px-0 mb-5 sm:mb-6">
        
        {/* Karta 1: Xarajatlar (Oylik) */}
        <Link
          href="/ishchilar"
          className="group bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xs border border-slate-200/70 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3 sm:mb-5">
            <div className="bg-indigo-50 text-indigo-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Icons.Wallet />
            </div>
            <span className="text-slate-300 group-hover:text-indigo-500 transition-colors">
              <Icons.ArrowUpRight />
            </span>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Xarajatlar</p>
            <h2 className="text-base sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {statistika.jamiOylik.toLocaleString('ru-RU')}
              <span className="text-[10px] sm:text-sm font-bold text-slate-400 ml-1">UZS</span>
            </h2>
            <p className="text-[9px] sm:text-[11px] font-semibold text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Ishchilar oylik jamgʻarmasi
            </p>
          </div>
        </Link>

        {/* Karta 2: Jarimalar */}
        <Link
          href="/braklar"
          className="group bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xs border border-slate-200/70 hover:border-rose-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3 sm:mb-5">
            <div className="bg-rose-50 text-rose-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Icons.Alert />
            </div>
            <span className="text-slate-300 group-hover:text-rose-500 transition-colors">
              <Icons.ArrowUpRight />
            </span>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Jarimalar</p>
            <h2 className="text-base sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {statistika.jamiJarima.toLocaleString('ru-RU')}
              <span className="text-[10px] sm:text-sm font-bold text-slate-400 ml-1">UZS</span>
            </h2>
            <p className="text-[9px] sm:text-[11px] font-semibold text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Jami brak: <b className="text-rose-500">{statistika.jamiIgnaMetr + statistika.jamiLuxMetr} metr</b>
            </p>
          </div>
        </Link>

        {/* Karta 3: Faol Xodimlar */}
        <Link
          href="/ishchilar"
          className="group bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xs border border-slate-200/70 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-3 sm:mb-5">
            <div className="bg-emerald-50 text-emerald-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Icons.Users />
            </div>
            <span className="text-slate-300 group-hover:text-emerald-500 transition-colors">
              <Icons.ArrowUpRight />
            </span>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Faol Xodimlar</p>
            <h2 className="text-base sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {statistika.faolIshchilarSoni}
              <span className="text-[10px] sm:text-sm font-bold text-slate-400 ml-1">nafar</span>
            </h2>
            <p className="text-[9px] sm:text-[11px] font-semibold text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Shu oyda faol ishlaganlar
            </p>
          </div>
        </Link>

        {/* Karta 4: DEN / NOCH / BUGUN — Rulonlar soni (ta) va og'irligi (kg) */}
        <Link
          href="/rulonlar"
          className="bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-md flex flex-col justify-between text-white relative overflow-hidden hover:ring-2 hover:ring-indigo-500/40 transition-all"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/15 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-center mb-2.5 sm:mb-3.5 relative z-10">
            <div className="bg-white/10 text-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl backdrop-blur-xs">
              <Icons.Cube />
            </div>
            <div className="text-right">
              <span className="text-[8px] sm:text-[10px] font-black tracking-widest text-slate-300 uppercase block">
                RULON VA KG
              </span>
              <span className="text-[8px] sm:text-[9px] font-medium text-slate-400 hidden sm:block">
                Soni (ta) • Vazni (kg)
              </span>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2.5 relative z-10 w-full">
            {/* DEN QATORI */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-1 sm:pb-1.5 gap-1">
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 shrink-0">
                DEN <span className="opacity-60 hidden xl:inline">({statistika.kechagiSana})</span>
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700/80 text-[8px] sm:text-[10px] font-extrabold whitespace-nowrap">
                  {statistika.kechagiDenSoni} ta
                </span>
                <span className="text-xs sm:text-base font-black whitespace-nowrap">
                  {statistika.kechagiDenKg.toLocaleString('ru-RU')} <span className="text-[8px] sm:text-[10px] font-normal text-slate-400">kg</span>
                </span>
              </div>
            </div>

            {/* NOCH QATORI */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-1 sm:pb-1.5 gap-1">
              <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 shrink-0">NOCH</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700/80 text-[8px] sm:text-[10px] font-extrabold whitespace-nowrap">
                  {statistika.kechagiNochSoni} ta
                </span>
                <span className="text-xs sm:text-base font-black whitespace-nowrap">
                  {statistika.kechagiNochKg.toLocaleString('ru-RU')} <span className="text-[8px] sm:text-[10px] font-normal text-slate-400">kg</span>
                </span>
              </div>
            </div>

            {/* BUGUN QATORI */}
            <div className="flex justify-between items-center pt-0.5 gap-1">
              <span className="text-[9px] sm:text-[11px] font-black text-amber-400 shrink-0">BUGUN</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[8px] sm:text-[10px] font-extrabold whitespace-nowrap">
                  {statistika.bugungiJamiSoni} ta
                </span>
                <span className="text-xs sm:text-base font-black text-amber-400 whitespace-nowrap">
                  {statistika.bugungiJamiKg.toLocaleString('ru-RU')} <span className="text-[8px] sm:text-[10px] font-normal text-amber-400/60">kg</span>
                </span>
              </div>
            </div>
          </div>
        </Link>

      </div>

      {/* 3. GRAFIK VA SIFAT NAZORATI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 px-3 sm:px-0">
        
        {/* Yillik Dinamika Grafigi */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xs border border-slate-200/70 flex flex-col overflow-x-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-4 sm:mb-8 min-w-[300px]">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Yillik Dinamika</h3>
              <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {tanlanganOy.split('-')[0]} YILGI ISHLAB CHIQARISH • SHU OYDA: <span className="text-indigo-600">{statistika.shuOyJamiSoni} TA RULON ({statistika.shuOyJamiKg.toLocaleString('ru-RU')} KG)</span>
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-slate-400 border border-slate-100"><Icons.Chart /></div>
          </div>

          <div className="flex items-end justify-between flex-grow gap-1.5 sm:gap-4 relative pt-8 h-[160px] sm:h-[220px] min-w-[300px]">
            {statistika.grafikData.map((oy, index) => {
              const heightPercent = oy.jamiKg > 0 ? (oy.jamiKg / statistika.grafikMaxKg) * 100 : 0;
              const isCurrentMonth = oy.oyKodi === tanlanganOy;

              return (
                <div
                  key={index}
                  tabIndex={0}
                  onClick={() => {
                    setTanlanganOy(oy.oyKodi);
                    malumotlarniAnalizQilish(oy.oyKodi);
                  }}
                  className="flex flex-col items-center justify-end w-full group h-full relative cursor-pointer focus:outline-none"
                >
                  {/* Tooltip: Rulonlar soni + Kg */}
                  {oy.jamiKg > 0 && (
                    <div className="absolute bottom-full mb-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100 group-hover:-translate-y-1 transition-all duration-300 flex flex-col items-center pointer-events-none z-10">
                      <div className="bg-slate-900 text-white text-[9px] sm:text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap">
                        {oy.jamiSoni} ta • {oy.jamiKg.toLocaleString('ru-RU')} kg
                      </div>
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-transparent border-t-slate-900"></div>
                    </div>
                  )}

                  <div
                    style={{ height: `${heightPercent}%`, minHeight: oy.jamiKg > 0 ? '8px' : '4px' }}
                    className={`w-full max-w-[14px] sm:max-w-[28px] rounded-full transition-all duration-500 ease-out ${
                      isCurrentMonth
                        ? 'bg-indigo-600 shadow-sm shadow-indigo-500/30'
                        : oy.jamiKg > 0
                        ? 'bg-slate-300 group-hover:bg-indigo-400 group-focus:bg-indigo-400'
                        : 'bg-slate-100'
                    }`}
                  ></div>

                  <span className={`mt-2 sm:mt-3 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isCurrentMonth ? 'text-indigo-600 font-black' : 'text-slate-400 group-hover:text-indigo-500'
                  }`}>
                    {oy.oyNomi}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sifat Nazorati va Liderlar */}
        <div className="lg:col-span-1 flex flex-col gap-3 sm:gap-5">
          
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs border border-slate-200/70">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Sifat Nazorati (Brak)</h3>
              <Link href="/braklar" className="text-[10px] sm:text-xs font-bold text-indigo-600 hover:underline">Batafsil →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/90 border border-slate-100 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl gap-1">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-rose-500 shadow-2xs border border-slate-100"><Icons.Cross /></div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wide">Igna Siniq</span>
                </div>
                <div className="text-sm sm:text-lg font-black text-slate-900">
                  {statistika.jamiIgnaMetr} <span className="text-[9px] sm:text-xs font-bold text-slate-400">m</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/90 border border-slate-100 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl gap-1">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-amber-500 shadow-2xs border border-slate-100"><Icons.Cross /></div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wide">Lyc Xato</span>
                </div>
                <div className="text-sm sm:text-lg font-black text-slate-900">
                  {statistika.jamiLuxMetr} <span className="text-[9px] sm:text-xs font-bold text-slate-400">m</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 flex-grow">
            <div className="bg-indigo-600 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 opacity-10"><Icons.Trophy /></div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 backdrop-blur-xs"><Icons.Trophy /></div>
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-0.5">Eng yaxshi</p>
              <p className="text-xs sm:text-base font-black tracking-tight mb-2 truncate max-w-full">
                {statistika.qahramon.ism !== '-' ? statistika.qahramon.ism : '---'}
              </p>
              <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg mt-auto">
                <Icons.Check /> <span className="text-[9px] sm:text-[10px] font-bold">{statistika.qahramon.kun} smena</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs border border-slate-200/70 flex flex-col justify-center items-center text-center">
              <div className="bg-rose-50 text-rose-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl mb-2 sm:mb-3"><Icons.Alert /></div>
              <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Eng koʻp xato</p>
              <p className="text-xs sm:text-base font-black tracking-tight text-slate-800 mb-2 truncate max-w-full">
                {statistika.qoidabuzar.ism !== '-' ? statistika.qoidabuzar.ism : '---'}
              </p>
              <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg mt-auto">
                {statistika.qoidabuzar.brakMetr} metr
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}