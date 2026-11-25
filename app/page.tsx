'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ishchiOyligi, faolIshchilar, KALIT, oySozlamasi, STANDART_BRAK_STAVKALARI, STANDART_LAVOZIMLAR, STANDART_OPERATOR_QOSHIMCHA } from '@/lib/hisob';
import { oqish } from '@/lib/mahalliyXotira';
import { sanagaKunQoshish, toshkentOy, toshkentSana } from '@/lib/sana';
import { SahifaSarlavhasi, OyTanlash, Ikonka, cn, oyMatni } from '@/components/ui';
import { braklarniOlish } from '@/lib/braklarMahalliy';
import { useXotiraYangilanishi } from '@/hooks/useXotiraYangilanishi';

// Grafik ostidagi oy harflari (telefonda joy tor)
const OY_HARFI = ['Y', 'F', 'M', 'A', 'M', 'I', 'I', 'A', 'S', 'O', 'N', 'D'];

// 1245.5 -> "1 245,5"
const kgFormat = (n: number) => (Number(n) || 0).toLocaleString('ru-RU', { maximumFractionDigits: 1 });

// Telefonda katta summa qisqa: 48 600 000 -> "48,6 mln"
function qisqaPul(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} mln`;
  return n.toLocaleString('ru-RU');
}

// Oy ko'rsatkichi kartasi: bosilsa o'z sahifasiga o'tadi
function Plitka({
  href,
  nomi,
  qiymat,
  birlik,
  izoh,
  qiymatKlass
}: {
  href: string;
  nomi: string;
  qiymat: React.ReactNode;
  birlik?: string;
  izoh?: string;
  qiymatKlass?: string;
}) {
  return (
    <Link href={href} className="group bg-sirt border border-chiziq rounded-karta p-3 md:p-4 min-w-0 hover:border-chiziq-2 transition-colors">
      <div className="flex items-center justify-between gap-1">
        <p className="text-xs md:text-sm font-semibold text-matn-2 truncate">{nomi}</p>
        <Ikonka nom="ongga" className="w-3.5 h-3.5 shrink-0 text-matn-3 group-hover:text-asosiy transition-colors" />
      </div>
      <p className={cn('mt-1 text-xl md:text-2xl font-bold tabular-nums leading-tight whitespace-nowrap truncate', qiymatKlass || 'text-matn')}>
        {qiymat}
        {birlik && <span className="ml-1 text-xs md:text-sm font-semibold text-matn-3">{birlik}</span>}
      </p>
      {izoh && <p className="mt-0.5 text-xs text-matn-3 truncate">{izoh}</p>}
    </Link>
  );
}

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
    bugungiSana: '',
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
      // Braklar smenalardan hisoblanadi (Braklar sahifasi bilan bir xil)
      brakJadvali: (await braklarniOlish(oy)).jadval,
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
      bugungiSana: `${bugunSanaStr.slice(8, 10)}.${bugunSanaStr.slice(5, 7)}`,
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

  // Boshqa qurilmadan yangi ma'lumot kelsa — ko'rsatkichlarni qayta hisoblaymiz
  useXotiraYangilanishi(
    (k) =>
      k.startsWith('zavod_ishchilar_') ||
      k === KALIT.davomat ||
      k === KALIT.lavozimlar ||
      k === KALIT.operatorQoshimcha ||
      k === KALIT.brakStavkalari ||
      k === KALIT.brakMeyyori ||
      k === KALIT.sozlamaTarixi,
    () => tanlanganOy && malumotlarniAnalizQilish(tanlanganOy)
  );

  const oyniOzgartirish = (oy: string) => {
    setTanlanganOy(oy);
    malumotlarniAnalizQilish(oy);
  };

  const tanlanganOyGrafik = statistika.grafikData.find((g) => g.oyKodi === tanlanganOy);
  const tanlanganOyNomi = oyMatni(tanlanganOy).split(' ')[0];

  return (
    <div>
      <SahifaSarlavhasi
        sarlavha={
          <span className="flex items-center gap-2.5">
            Asosiy panel
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yaxshi-och text-yaxshi text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-yaxshi animate-pulse" />
              Jonli
            </span>
          </span>
        }
      />

      {/* 1. BUGUN + OY KO'RSATKICHLARI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
        {/* Bugungi ishlab chiqarish (oyga bog'liq emas) */}
        <Link href="/rulonlar" className="group bg-sirt border border-chiziq rounded-karta p-4 md:p-5 hover:border-chiziq-2 transition-colors flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-matn-2">Bugun · {statistika.bugungiSana} ishlab chiqarish</p>
            <Ikonka nom="ongga" className="w-4 h-4 text-matn-3 group-hover:text-asosiy transition-colors" />
          </div>
          <p className="mt-1.5 flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl md:text-4xl font-bold text-matn tabular-nums leading-none">{kgFormat(statistika.bugungiJamiKg)}</span>
            <span className="text-sm font-semibold text-matn-3">kg</span>
            <span className="text-base text-matn-2 tabular-nums">· {statistika.bugungiJamiSoni} rulon</span>
          </p>
          <div className="mt-auto pt-3">
            <div className="grid grid-cols-2 gap-3 border-t border-chiziq pt-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs text-matn-2">
                  <span className="w-2 h-2 rounded-full bg-den" />
                  Kecha DEN <span className="text-matn-3">{statistika.kechagiSana}</span>
                </p>
                <p className="mt-0.5 text-base font-semibold text-matn tabular-nums whitespace-nowrap">
                  {kgFormat(statistika.kechagiDenKg)} kg <span className="text-xs font-normal text-matn-3">· {statistika.kechagiDenSoni}</span>
                </p>
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs text-matn-2">
                  <span className="w-2 h-2 rounded-full bg-noch" />
                  Kecha NOCH
                </p>
                <p className="mt-0.5 text-base font-semibold text-matn tabular-nums whitespace-nowrap">
                  {kgFormat(statistika.kechagiNochKg)} kg <span className="text-xs font-normal text-matn-3">· {statistika.kechagiNochSoni}</span>
                </p>
              </div>
            </div>
          </div>
        </Link>

        {/* Oy ko'rsatkichlari */}
        <div className="lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <h2 className="text-base font-semibold text-matn">Oy ko&apos;rsatkichlari</h2>
            <OyTanlash oy={tanlanganOy} ozgartirish={oyniOzgartirish} />
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 md:gap-3">
            <Plitka href="/rulonlar" nomi="Ishlab chiqarish" qiymat={kgFormat(statistika.shuOyJamiKg)} birlik="kg" izoh={`${statistika.shuOyJamiSoni} rulon`} />
            <Plitka
              href="/ishchilar"
              nomi="Oylik jamg'armasi"
              qiymat={
                <>
                  <span className="md:hidden">{qisqaPul(statistika.jamiOylik)}</span>
                  <span className="hidden md:inline">{statistika.jamiOylik.toLocaleString('ru-RU')}</span>
                </>
              }
              izoh="so'm"
            />
            <Plitka
              href="/braklar"
              nomi="Jarimalar"
              qiymat={statistika.jamiJarima.toLocaleString('ru-RU')}
              qiymatKlass="text-xato"
              izoh={`Brak: ${statistika.jamiIgnaMetr + statistika.jamiLuxMetr} m`}
            />
            <Plitka href="/ishchilar" nomi="Ishchilar" qiymat={statistika.faolIshchilarSoni} birlik="nafar" izoh="shu oyda faol" />
          </div>
        </div>
      </div>

      {/* 2. GRAFIK + SIFAT + LIDERLAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Yillik grafik: tanlangan oy qiymati tepada doim yozilib turadi */}
        <div className="lg:col-span-2 bg-sirt border border-chiziq rounded-karta p-4 md:p-5 flex flex-col">
          <p className="text-sm text-matn-2">Yillik ishlab chiqarish · {tanlanganOy.split('-')[0]}</p>
          <p className="mt-0.5 text-base md:text-lg font-semibold text-matn tabular-nums">
            {tanlanganOyNomi}: {kgFormat(tanlanganOyGrafik?.jamiKg || 0)} kg · {tanlanganOyGrafik?.jamiSoni || 0} rulon
          </p>
          <div className="mt-4 flex items-end justify-between gap-1 md:gap-3 h-[120px] md:h-[200px] flex-grow">
            {statistika.grafikData.map((oy, index) => {
              const balandlik = oy.jamiKg > 0 ? (oy.jamiKg / statistika.grafikMaxKg) * 100 : 0;
              const tanlangan = oy.oyKodi === tanlanganOy;
              return (
                <button
                  key={oy.oyKodi}
                  type="button"
                  onClick={() => oyniOzgartirish(oy.oyKodi)}
                  title={`${oy.oyNomi}: ${oy.jamiSoni} rulon • ${kgFormat(oy.jamiKg)} kg`}
                  aria-label={`${oy.oyNomi}: ${kgFormat(oy.jamiKg)} kg`}
                  className="group flex flex-col items-center justify-end flex-1 h-full gap-1.5 focus:outline-none"
                >
                  <span
                    style={{ height: `${balandlik}%`, minHeight: oy.jamiKg > 0 ? '6px' : '3px' }}
                    className={cn(
                      'w-full max-w-[16px] md:max-w-[32px] rounded-[4px] transition-colors',
                      tanlangan ? 'bg-asosiy' : oy.jamiKg > 0 ? 'bg-chiziq-2 group-hover:bg-asosiy/50 group-focus-visible:bg-asosiy/50' : 'bg-chiziq'
                    )}
                  />
                  <span className={cn('text-[11px] md:text-xs', tanlangan ? 'font-semibold text-asosiy' : 'text-matn-3')}>
                    <span className="md:hidden">{OY_HARFI[index]}</span>
                    <span className="hidden md:inline">{oy.oyNomi}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          {/* Sifat nazorati */}
          <div className="bg-sirt border border-chiziq rounded-karta px-4 divide-y divide-chiziq">
            <div className="flex items-center justify-between py-3">
              <h3 className="text-sm md:text-base font-semibold text-matn">Sifat nazorati</h3>
              <Link href="/braklar" className="text-sm font-semibold text-asosiy hover:underline">
                Batafsil
              </Link>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-matn">Igna siniq</span>
              <span className="text-base font-semibold text-xato tabular-nums">{statistika.jamiIgnaMetr} m</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-matn">Lyc xato</span>
              <span className="text-base font-semibold text-diqqat tabular-nums">{statistika.jamiLuxMetr} m</span>
            </div>
          </div>

          {/* Liderlar */}
          <div className="bg-sirt border border-chiziq rounded-karta px-4 divide-y divide-chiziq">
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-2 text-sm text-matn shrink-0">
                <span className="w-7 h-7 rounded-boshqaruv bg-yaxshi-och text-yaxshi flex items-center justify-center">
                  <Ikonka nom="tasdiq" className="w-4 h-4" />
                </span>
                Eng ko&apos;p ishlagan
              </span>
              <span className="text-sm text-right min-w-0 truncate">
                <span className="font-semibold text-matn">{statistika.qahramon.ism !== '-' ? statistika.qahramon.ism : '—'}</span>
                {statistika.qahramon.ism !== '-' && <span className="text-matn-3"> · {statistika.qahramon.kun} kun</span>}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-2 text-sm text-matn shrink-0">
                <span className="w-7 h-7 rounded-boshqaruv bg-xato-och text-xato flex items-center justify-center">
                  <Ikonka nom="ogohlantirish" className="w-4 h-4" />
                </span>
                Eng ko&apos;p brak
              </span>
              <span className="text-sm text-right min-w-0 truncate">
                <span className="font-semibold text-matn">{statistika.qoidabuzar.ism !== '-' ? statistika.qoidabuzar.ism : '—'}</span>
                {statistika.qoidabuzar.ism !== '-' && <span className="text-matn-3"> · {statistika.qoidabuzar.brakMetr} m</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
