'use client';
import React, { useState, useEffect, useRef } from 'react';
import { faolIshchilar, operatormi } from '@/lib/hisob';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentSana } from '@/lib/sana';
import { MOSHINA_KALIT, MOSHINA_PREFIKSI, moshinaRaqami, moshinalarSoni } from '@/lib/moshina';
import { Ikonka } from '@/components/ui';

// Rulon chiqqan vaqt: qurilma qaysi vaqt zonasida bo'lishidan qat'i nazar Toshkent soati
const toshkentSoati = () =>
  new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());

// Operator tanlash maydoni (qidiruv + ro'yxat). Kompyuter jadvalida ham, telefon kartasida ham ishlatiladi.
function OperatorMaydoni({ qiymat, ozgartirish, tanlash, royxat, ochiq, yuklash, className }: {
  qiymat: string;
  ozgartirish: (v: string) => void;
  tanlash: (op: any) => void;
  royxat: any[];
  ochiq: boolean;
  yuklash: () => void;
  className: string;
}) {
  const [korinadi, setKorinadi] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tashqari = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setKorinadi(false);
    };
    document.addEventListener('mousedown', tashqari);
    return () => document.removeEventListener('mousedown', tashqari);
  }, []);
  const mos = royxat.filter((op) => (op.ism || '').toLowerCase().includes(qiymat.toLowerCase()));
  return (
    <div className="relative w-full" ref={ref}>
      <input
        type="text"
        disabled={!ochiq}
        value={qiymat}
        autoComplete="off"
        onChange={(e) => {
          ozgartirish(e.target.value);
          setKorinadi(true);
        }}
        onFocus={() => {
          if (!ochiq) return;
          yuklash();
          setKorinadi(true);
        }}
        placeholder="Operator"
        className={className}
      />
      {korinadi && ochiq && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-sirt border border-chiziq rounded-boshqaruv shadow-xl max-h-56 overflow-y-auto text-left min-w-[180px] py-1">
          {mos.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-matn-3">Operator topilmadi</p>
          ) : (
            mos.map((op) => (
              <button
                key={op.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  tanlash(op);
                  setKorinadi(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-matn hover:bg-sirt-2"
              >
                <Ikonka nom="ishchilar" className="w-4 h-4 text-matn-3" />
                {op.ism}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ApparatCard({ id, onDataChange, initialData, readOnly, joriySana, rol, isLoaded = true, raqamTakror = false, onOchirish }: any) {
  const [rulonlar, setRulonlar] = useState(
    initialData?.rulonlar?.length > 0 
      ? initialData.rulonlar 
      : [{ id: 1, kg: '', nuqsonlar: {} as any, vaqt: '' }]
  );
  
  const [info, setInfo] = useState({
    raqam: initialData?.raqam || '',
    talimoti: initialData?.talimoti || '',
    ip: initialData?.ip || '', 
    lot: initialData?.lot || '',
    brend: initialData?.brend || '',
    operator: initialData?.operator || '',
    operatorId: initialData?.operatorId || null
  });

  const masterHuquqi = rol === 'admin' || rol === 'master';

  // Moshina raqami: "MK-" oldindan turadi, faqat raqam yoziladi (1 dan moshinalar sonigacha)
  const [moshinaSoni, setMoshinaSoni] = useState(35);
  useEffect(() => {
    setMoshinaSoni(moshinalarSoni(localStorage.getItem(MOSHINA_KALIT.soni)));
  }, []);
  const raqamSoni = moshinaRaqami(info.raqam);
  const raqamXato = !!info.raqam && (!raqamSoni || raqamSoni > moshinaSoni);
  const kontrolchiHuquqi = rol === 'admin' || rol === 'kontrolchi';

  const [operatorlarList, setOperatorlarList] = useState<any[]>([]);
  const [qidiruv, setQidiruv] = useState(info.operator || '');
  const [ochiqRulon, setOchiqRulon] = useState<number | null>(null); // telefonda nuqsonlari ochilgan rulon
  const [menyuOchiq, setMenyuOchiq] = useState(false);
  const menyuRef = useRef<HTMLDivElement>(null);

  // Bazadan yoki localStorage'dan ma'lumot kelganda kartani yangilash
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setInfo({
        raqam: initialData.raqam || '',
        talimoti: initialData.talimoti || '',
        ip: initialData.ip || '', 
        lot: initialData.lot || '',
        brend: initialData.brend || '',
        operator: initialData.operator || '',
        operatorId: initialData.operatorId || null
      });
      setQidiruv(initialData.operator || '');

      if (initialData.rulonlar && initialData.rulonlar.length > 0) {
        const oxirgi = initialData.rulonlar[initialData.rulonlar.length - 1];
        const yangiRulonlar = oxirgi && String(oxirgi.kg).trim() !== ''
          ? [...initialData.rulonlar, { id: initialData.rulonlar.length + 1, kg: '', nuqsonlar: {}, vaqt: '' }]
          : initialData.rulonlar;
        setRulonlar(yangiRulonlar);
      }
    }
  }, [initialData?.id]);

  // Ma'lumot o'zgarganda tepaga (useRulonlar ga) uzatish
  useEffect(() => {
    if (onDataChange) {
      onDataChange({ id, ...info, rulonlar });
    }
  }, [info, rulonlar]);

  const operatorlarniYuklash = () => {
    try {
      const joriyYilOy = (joriySana || toshkentSana()).slice(0, 7);
      // Yangi oy boshlanganda ham ro'yxat bo'sh qolmaydi (oldingi oydan ko'chiriladi)
      setOperatorlarList(faolIshchilar(oyIshchilari(joriyYilOy)).filter(operatormi));
    } catch (e) {
      console.error("Operatorlarni yuklashda xatolik:", e);
    }
  };

  useEffect(() => {
    operatorlarniYuklash();
  }, [joriySana]);

  useEffect(() => {
    if (!menyuOchiq) return;
    const tashqari = (e: MouseEvent) => {
      if (menyuRef.current && !menyuRef.current.contains(e.target as Node)) setMenyuOchiq(false);
    };
    document.addEventListener('mousedown', tashqari);
    return () => document.removeEventListener('mousedown', tashqari);
  }, [menyuOchiq]);

  const nuqsonTurlari = ["Patlak", "Lyc xato", "Igna siniq", "Yog izi", "Kumas"];

  const handleKgChange = (index: number, qiymat: string) => {
    if (readOnly || !kontrolchiHuquqi) return; 
    const tozalanganQiymat = qiymat.replace(',', '.');

    // Nusxa ustida ishlaymiz (asl ma'lumotni to'g'ridan-to'g'ri o'zgartirmaymiz)
    const yangiRulonlar = rulonlar.map((r: any) => ({ ...r }));
    const joriy = yangiRulonlar[index];
    joriy.kg = tozalanganQiymat;
    if (qiymat.trim() !== '') {
      if (!joriy.vaqt) joriy.vaqt = toshkentSoati();
    } else {
      joriy.vaqt = '';
    }

    if (index === yangiRulonlar.length - 1 && qiymat.trim() !== '') {
      yangiRulonlar.push({ id: yangiRulonlar.length + 1, kg: '', nuqsonlar: {}, vaqt: '' });
    }
    setRulonlar(yangiRulonlar);
  };

  const handleKgBlur = (index: number) => {
    if (readOnly || !kontrolchiHuquqi) return; 
    let yangiRulonlar = [...rulonlar];
    if (String(yangiRulonlar[index].kg ?? '').trim() === '' && index !== yangiRulonlar.length - 1) {
      yangiRulonlar.splice(index, 1);
      yangiRulonlar = yangiRulonlar.map((r, idx) => ({ ...r, id: idx + 1 }));
      setRulonlar(yangiRulonlar);
    }
  };

  const handleNuqsonChange = (index: number, nuqsonNomi: string, qiymat: string) => {
    if (readOnly || !kontrolchiHuquqi) return; 
    const yangiRulonlar = rulonlar.map((r: any, i: number) =>
      i === index ? { ...r, nuqsonlar: { ...(r.nuqsonlar || {}), [nuqsonNomi]: qiymat } } : r
    );
    setRulonlar(yangiRulonlar);
  };

  const haqiqiyRulonlar = rulonlar.filter((r: any) => String(r.kg || '').trim() !== '');
  const jamiKg = haqiqiyRulonlar.reduce((sum: number, r: any) => sum + (parseFloat(r.kg) || 0), 0);

  const infoOchiq = !readOnly && masterHuquqi;
  const kgOchiq = !readOnly && kontrolchiHuquqi;
  const raqamQizil = raqamXato || raqamTakror;
  const operatorniOzgartirish = (v: string) => {
    setQidiruv(v);
    setInfo({ ...info, operator: v, operatorId: null });
  };
  const operatorniTanlash = (op: any) => {
    setQidiruv(op.ism);
    setInfo({ ...info, operator: op.ism, operatorId: op.id });
  };
  const nuqsonSoni = (r: any) => nuqsonTurlari.filter((n) => String(r.nuqsonlar?.[n] ?? '').trim() !== '').length;
  const kgFormat = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

  // Moshina raqami maydoni (MK- oldindan turadi, faqat raqam yoziladi)
  const raqamMaydoni = (katta: boolean) => (
    <label className="flex items-baseline cursor-text">
      <span className={`font-bold text-matn-3 ${katta ? 'text-lg' : 'text-base'}`}>{MOSHINA_PREFIKSI}</span>
      <input
        type="text"
        inputMode="numeric"
        disabled={!infoOchiq}
        value={raqamSoni ? String(raqamSoni) : ''}
        onChange={(e) => {
          const raqam = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3);
          setInfo({ ...info, raqam: raqam ? `${MOSHINA_PREFIKSI}${raqam}` : '' });
        }}
        placeholder="?"
        aria-label="Moshina raqami"
        className={`w-12 bg-transparent p-0 outline-none font-bold placeholder:text-matn-3 disabled:text-matn ${katta ? 'text-2xl' : 'text-xl'} ${raqamQizil ? 'text-xato' : 'text-matn'}`}
      />
    </label>
  );
  const raqamIzohi = raqamXato ? `1–${moshinaSoni} oralig'ida` : raqamTakror ? 'Takrorlandi' : '';

  // ⋯ menyusi (o'chirish)
  const menyu = onOchirish && infoOchiq && (
    <div className="relative" ref={menyuRef}>
      <button
        type="button"
        onClick={() => setMenyuOchiq(!menyuOchiq)}
        aria-label="Moshina amallari"
        className="w-9 h-9 rounded-boshqaruv text-matn-3 hover:bg-sirt-2 hover:text-matn flex items-center justify-center"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {menyuOchiq && (
        <div className="absolute right-0 top-full mt-1 z-40 min-w-[180px] bg-sirt border border-chiziq rounded-boshqaruv shadow-xl py-1">
          <button
            type="button"
            onClick={() => {
              setMenyuOchiq(false);
              onOchirish();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-xato hover:bg-xato-och"
          >
            <Ikonka nom="ochirish" className="w-4 h-4" />
            Moshinani o&apos;chirish
          </button>
        </div>
      )}
    </div>
  );

  if (!isLoaded) {
    return (
      <div className="w-full flex items-center justify-center gap-2 p-10 text-sm font-semibold text-matn-3">
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
        Bazadan yuklanmoqda...
      </div>
    );
  }

  const kichikMaydon =
    'w-full h-10 px-2 outline-none bg-transparent text-center text-sm font-medium text-matn placeholder:text-matn-3 disabled:text-matn-2 focus:bg-asosiy-och transition-colors';

  return (
    <div className="w-full">
      {/* ================= KOMPYUTER: JADVAL ================= */}
      <div className="hidden md:block">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm border-collapse text-center text-matn min-w-max">
            <thead>
              <tr>
                <td rowSpan={3} className={`border-r border-b border-chiziq p-0 w-36 align-middle sticky left-0 z-20 ${raqamQizil ? 'bg-xato-och' : 'bg-sirt-2'}`}>
                  <div className="flex flex-col items-center justify-center px-2 py-3">
                    {raqamMaydoni(true)}
                    {raqamIzohi && <span className="mt-1 text-[11px] font-semibold text-xato">{raqamIzohi}</span>}
                  </div>
                </td>
                <td colSpan={rulonlar.length} className="border-b border-chiziq p-0 min-w-[240px]">
                  <div className="flex w-full divide-x divide-chiziq">
                    <input type="text" disabled={!infoOchiq} value={info.talimoti} onChange={(e) => setInfo({ ...info, talimoti: e.target.value })} placeholder="Talimoti" className={`flex-[2] ${kichikMaydon}`} />
                    <input type="text" disabled={!infoOchiq} value={info.brend} onChange={(e) => setInfo({ ...info, brend: e.target.value })} placeholder="Brend" className={`flex-1 ${kichikMaydon}`} />
                    <div className="flex items-center px-1">{menyu}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={rulonlar.length} className="border-b border-chiziq p-0 min-w-[240px]">
                  <div className="flex w-full divide-x divide-chiziq">
                    <input type="text" disabled={!infoOchiq} value={info.ip} onChange={(e) => setInfo({ ...info, ip: e.target.value })} placeholder="Ip" className={`flex-1 ${kichikMaydon}`} />
                    <input type="text" disabled={!infoOchiq} value={info.lot} onChange={(e) => setInfo({ ...info, lot: e.target.value })} placeholder="Lot" className={`flex-1 ${kichikMaydon}`} />
                    <div className="flex-[2]">
                      <OperatorMaydoni
                        qiymat={qidiruv}
                        ozgartirish={operatorniOzgartirish}
                        tanlash={operatorniTanlash}
                        royxat={operatorlarList}
                        ochiq={infoOchiq}
                        yuklash={operatorlarniYuklash}
                        className={`${kichikMaydon} font-semibold text-asosiy placeholder:text-indigo-300`}
                      />
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="bg-sirt-2 border-b border-chiziq">
                {rulonlar.map((r: any, idx: number) => (
                  <td key={`header-${idx}`} className="border-r border-chiziq px-2 py-1.5 text-xs font-semibold text-matn-3 w-24">
                    {r.id || idx + 1}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-chiziq">
                <td className="border-r border-chiziq px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-matn-3 bg-sirt-2 sticky left-0 z-10">Vaqti</td>
                {rulonlar.map((r: any, idx: number) => (
                  <td key={`vaqt-${idx}`} className="border-r border-chiziq px-2 py-2 text-sm font-medium text-matn-2 tabular-nums min-w-[80px]">
                    {r.vaqt || '—'}
                  </td>
                ))}
              </tr>
              {nuqsonTurlari.map((nuqson, nIdx) => (
                <tr key={`nuqson-row-${nIdx}`} className="border-b border-chiziq hover:bg-sirt-2/50">
                  <td className="border-r border-chiziq px-4 py-2 text-left text-sm font-medium text-matn-2 bg-sirt-2 sticky left-0 z-10 whitespace-nowrap">{nuqson}</td>
                  {rulonlar.map((r: any, idx: number) => (
                    <td key={`nuqson-${nIdx}-${idx}`} className="border-r border-chiziq p-0 min-w-[80px]">
                      <input
                        type="text"
                        disabled={!kgOchiq}
                        value={r.nuqsonlar?.[nuqson] || ''}
                        onChange={(e) => handleNuqsonChange(idx, nuqson, e.target.value)}
                        className="w-full h-9 px-2 text-center text-sm font-medium text-matn outline-none bg-transparent disabled:text-matn-2 focus:bg-diqqat-och"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-yaxshi-och/60">
                <td className="border-r border-chiziq px-4 py-2 text-left text-sm font-semibold text-yaxshi bg-yaxshi-och sticky left-0 z-10 whitespace-nowrap">Rulon kg</td>
                {rulonlar.map((r: any, idx: number) => (
                  <td key={`kg-${idx}`} className="border-r border-chiziq p-0 min-w-[80px]">
                    <input
                      type="text"
                      inputMode="decimal"
                      disabled={!kgOchiq}
                      value={r.kg}
                      onChange={(e) => handleKgChange(idx, e.target.value.replace(/[^\d.,]/g, ''))}
                      onBlur={() => handleKgBlur(idx)}
                      placeholder={idx === rulonlar.length - 1 ? '0,0' : ''}
                      className="w-full h-12 px-2 text-center text-lg font-bold tabular-nums bg-transparent outline-none text-yaxshi disabled:text-yaxshi/60 focus:bg-emerald-100 placeholder:text-emerald-300"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TELEFON: KARTA ================= */}
      <div className="md:hidden">
        <div className={`flex items-start gap-2 p-3 border-b border-chiziq ${raqamQizil ? 'bg-xato-och' : ''}`}>
          <div className="shrink-0">
            {raqamMaydoni(false)}
            {raqamIzohi && <p className="text-[11px] font-semibold text-xato">{raqamIzohi}</p>}
          </div>
          <div className="flex-1 min-w-0">
            <OperatorMaydoni
              qiymat={qidiruv}
              ozgartirish={operatorniOzgartirish}
              tanlash={operatorniTanlash}
              royxat={operatorlarList}
              ochiq={infoOchiq}
              yuklash={operatorlarniYuklash}
              className="w-full h-11 px-3 rounded-boshqaruv border border-chiziq-2 bg-sirt text-base font-semibold text-asosiy placeholder:text-matn-3 outline-none focus:border-asosiy disabled:bg-sirt-2 disabled:text-matn-2"
            />
          </div>
          {menyu}
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 border-b border-chiziq">
          {(
            [
              ['talimoti', 'Talimoti'],
              ['brend', 'Brend'],
              ['ip', 'Ip'],
              ['lot', 'Lot']
            ] as const
          ).map(([k, nom]) => (
            <label key={k} className="block">
              <span className="block text-xs font-semibold text-matn-3 mb-1">{nom}</span>
              <input
                type="text"
                disabled={!infoOchiq}
                value={(info as any)[k]}
                onChange={(e) => setInfo({ ...info, [k]: e.target.value })}
                className="w-full h-11 px-3 rounded-boshqaruv border border-chiziq-2 bg-sirt text-base text-matn outline-none focus:border-asosiy disabled:bg-sirt-2 disabled:text-matn-2"
              />
            </label>
          ))}
        </div>

        <ul className="divide-y divide-chiziq">
          {rulonlar.map((r: any, idx: number) => {
            const oxirgi = idx === rulonlar.length - 1;
            const ns = nuqsonSoni(r);
            const ochiq = ochiqRulon === idx;
            return (
              <li key={`m-${idx}`} className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-sirt-2 text-xs font-semibold text-matn-2 flex items-center justify-center">{r.id || idx + 1}</span>
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      disabled={!kgOchiq}
                      value={r.kg}
                      onChange={(e) => handleKgChange(idx, e.target.value.replace(/[^\d.,]/g, ''))}
                      onBlur={() => handleKgBlur(idx)}
                      placeholder={oxirgi ? 'Yangi rulon kg' : ''}
                      className="w-full h-11 pl-3 pr-9 rounded-boshqaruv border border-chiziq-2 bg-sirt text-lg font-bold tabular-nums text-yaxshi placeholder:text-sm placeholder:font-medium placeholder:text-matn-3 outline-none focus:border-yaxshi focus:ring-2 focus:ring-emerald-500/20 disabled:bg-sirt-2"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-matn-3">kg</span>
                  </div>
                  <span className="w-11 shrink-0 text-xs font-medium text-matn-3 tabular-nums text-center">{r.vaqt || ''}</span>
                  {!(oxirgi && String(r.kg ?? '').trim() === '') && (
                    <button
                      type="button"
                      onClick={() => setOchiqRulon(ochiq ? null : idx)}
                      aria-expanded={ochiq}
                      className={`shrink-0 h-11 px-2.5 rounded-boshqaruv border text-xs font-semibold flex items-center gap-1 ${
                        ns > 0 ? 'border-amber-200 bg-diqqat-och text-diqqat' : 'border-chiziq text-matn-2'
                      }`}
                    >
                      Nuqson{ns > 0 ? ` (${ns})` : ''}
                      <Ikonka nom="pastga" className={`w-3.5 h-3.5 transition-transform ${ochiq ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {ochiq && (
                  <div className="mt-2 grid grid-cols-2 gap-2 pl-9">
                    {nuqsonTurlari.map((n) => (
                      <label key={n} className="block">
                        <span className="block text-xs font-semibold text-matn-3 mb-1">{n}</span>
                        <input
                          type="text"
                          disabled={!kgOchiq}
                          value={r.nuqsonlar?.[n] || ''}
                          onChange={(e) => handleNuqsonChange(idx, n, e.target.value)}
                          className="w-full h-11 px-3 rounded-boshqaruv border border-chiziq-2 bg-sirt text-base text-matn outline-none focus:border-diqqat disabled:bg-sirt-2"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* JAMI */}
      <div className="flex items-center justify-between gap-3 px-3 md:px-4 py-2.5 border-t border-chiziq bg-sirt-2/60">
        <span className="text-xs font-semibold text-matn-3">{haqiqiyRulonlar.length} rulon</span>
        <span className="text-sm font-semibold text-matn-2">
          Jami: <span className="text-lg font-bold text-yaxshi tabular-nums">{kgFormat(jamiKg)}</span> kg
        </span>
      </div>
    </div>
  );
}
