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

  // Nuqson ustunlari: telefonda qisqa nom (ekranga sig'ishi uchun), kompyuterda to'liq
  const QISQA: Record<string, string> = { Patlak: 'Pat.', 'Lyc xato': 'Lyc', 'Igna siniq': 'Igna', 'Yog izi': "Yog'", Kumas: 'Kum.' };
  const TOLIQ: Record<string, string> = { 'Yog izi': "Yog' izi" };

  const sarlavhaMaydon =
    'w-full h-10 px-2 rounded-boshqaruv bg-transparent text-base md:text-sm font-semibold text-matn outline-none placeholder:text-matn-3 placeholder:font-normal focus:bg-sirt focus:ring-2 focus:ring-asosiy/20 disabled:text-matn';

  return (
    <div className="w-full">
      {/* SARLAVHA: MK raqami + Talimoti (keng joyda) + jami */}
      <div className={`flex items-center gap-2 px-3 md:px-4 pt-3 ${raqamQizil ? 'bg-xato-och' : ''}`}>
        <div className="shrink-0">
          {raqamMaydoni(true)}
          {raqamIzohi && <p className="text-[11px] font-semibold text-xato leading-tight">{raqamIzohi}</p>}
        </div>
        <label className="flex-1 min-w-0 flex items-center">
          <span className="sr-only">Talimoti</span>
          <input
            type="text"
            disabled={!infoOchiq}
            value={info.talimoti}
            onChange={(e) => setInfo({ ...info, talimoti: e.target.value })}
            placeholder="Talimoti"
            className={`${sarlavhaMaydon} min-w-0`}
          />
        </label>
        <span className="shrink-0 text-sm font-bold text-yaxshi tabular-nums">{kgFormat(jamiKg)} kg</span>
        {menyu}
      </div>

      {/* Operator (keng) + Brend + IP + Lot */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-1.5 px-3 md:px-4 pt-2 pb-3">
        <label className="block min-w-0 rounded-boshqaruv bg-asosiy-och px-2 pt-1">
          <span className="block text-[11px] font-semibold text-asosiy">Operator</span>
          <OperatorMaydoni
            qiymat={qidiruv}
            ozgartirish={operatorniOzgartirish}
            tanlash={operatorniTanlash}
            royxat={operatorlarList}
            ochiq={infoOchiq}
            yuklash={operatorlarniYuklash}
            className="w-full h-8 bg-transparent text-base md:text-sm font-semibold text-asosiy outline-none placeholder:text-indigo-300 placeholder:font-normal disabled:text-asosiy truncate"
          />
        </label>
        {(
          [
            ['brend', 'Brend'],
            ['ip', 'IP'],
            ['lot', 'Lot']
          ] as const
        ).map(([k, nom]) => (
          <label key={k} className="block min-w-0 rounded-boshqaruv bg-sirt-2 px-2 pt-1">
            <span className="block text-[11px] font-semibold text-matn-3">{nom}</span>
            <input
              type="text"
              disabled={!infoOchiq}
              value={(info as any)[k]}
              onChange={(e) => setInfo({ ...info, [k]: e.target.value })}
              className="w-full h-8 bg-transparent text-base md:text-sm font-semibold text-matn outline-none disabled:text-matn"
            />
          </label>
        ))}
      </div>

      {/* TIK JADVAL: har rulon bitta qator. Telefonda ham ekranga to'liq sig'adi (surilmaydi). */}
      <table className="w-full table-fixed border-collapse text-center">
        <colgroup>
          <col className="w-7 md:w-12" />
          <col className="w-[58px] md:w-28" />
          {nuqsonTurlari.map((n) => (
            <col key={n} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-sirt-2 border-y border-chiziq text-[11px] md:text-xs font-semibold text-matn-2">
            <th className="py-2 font-semibold">№</th>
            <th className="py-2 font-semibold text-yaxshi border-l border-chiziq">KG</th>
            {nuqsonTurlari.map((n) => (
              <th key={n} className="py-2 font-semibold truncate px-0.5">
                <span className="md:hidden">{QISQA[n] || n}</span>
                <span className="hidden md:inline">{TOLIQ[n] || n}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rulonlar.map((r: any, idx: number) => {
            const yangi = idx === rulonlar.length - 1 && String(r.kg ?? '').trim() === '';
            return (
              <tr key={`r-${idx}`} className={`border-b border-chiziq ${yangi ? 'bg-yaxshi-och' : ''}`}>
                <td className="text-xs md:text-sm font-medium text-matn-3 tabular-nums">{r.id || idx + 1}</td>
                <td className="p-0 border-l border-chiziq">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={!kgOchiq}
                    value={r.kg}
                    onChange={(e) => handleKgChange(idx, e.target.value.replace(/[^\d.,]/g, ''))}
                    onBlur={() => handleKgBlur(idx)}
                    placeholder={yangi ? '+ kg' : ''}
                    aria-label={`${idx + 1}-rulon kg`}
                    className="w-full h-11 px-0.5 text-center text-base font-bold tabular-nums text-yaxshi bg-transparent outline-none placeholder:font-semibold placeholder:text-yaxshi/70 focus:bg-emerald-100 disabled:text-yaxshi"
                  />
                </td>
                {nuqsonTurlari.map((n) => {
                  const q = String(r.nuqsonlar?.[n] ?? '');
                  const bor = q.trim() !== '';
                  return (
                    <td key={n} className={`p-0 border-l border-chiziq ${bor ? 'bg-xato-och' : ''}`}>
                      {yangi ? null : (
                        <input
                          type="text"
                          inputMode="text"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck={false}
                          disabled={!kgOchiq}
                          value={q}
                          onChange={(e) => handleNuqsonChange(idx, n, e.target.value)}
                          placeholder="·"
                          aria-label={`${idx + 1}-rulon ${n}`}
                          className={`w-full h-11 px-0.5 text-center text-base bg-transparent outline-none placeholder:text-matn-3 focus:bg-diqqat-och ${
                            bor ? 'font-bold text-xato disabled:text-xato' : 'text-matn disabled:text-matn-2'
                          }`}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* JAMI */}
      <div className="flex items-center justify-between gap-3 px-3 md:px-4 py-2.5 bg-sirt-2/60">
        <span className="text-xs font-semibold text-matn-3">{haqiqiyRulonlar.length} rulon</span>
        <span className="text-sm font-semibold text-matn-2">
          Jami: <span className="text-base font-bold text-yaxshi tabular-nums">{kgFormat(jamiKg)}</span> kg
        </span>
      </div>
    </div>
  );
}
