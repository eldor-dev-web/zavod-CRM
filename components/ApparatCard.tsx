'use client';
import React, { useState, useEffect, useRef } from 'react';
import { faolIshchilar, operatormi } from '@/lib/hisob';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentSana } from '@/lib/sana';
import { MOSHINA_KALIT, MOSHINA_PREFIKSI, moshinaRaqami, moshinalarSoni } from '@/lib/moshina';

// Rulon chiqqan vaqt: qurilma qaysi vaqt zonasida bo'lishidan qat'i nazar Toshkent soati
const toshkentSoati = () =>
  new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());

export default function ApparatCard({ id, onDataChange, initialData, readOnly, joriySana, rol, isLoaded = true, raqamTakror = false }: any) {
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
  const [dropdownOchiq, setDropdownOchiq] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const handleClickTashqari = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOchiq(false);
      }
    };
    document.addEventListener("mousedown", handleClickTashqari);
    return () => document.removeEventListener("mousedown", handleClickTashqari);
  }, []);

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

  if (!isLoaded) {
    return (
      <div className="w-full flex items-center justify-center p-10 bg-slate-50/50 rounded-xl border border-slate-200">
         <div className="text-slate-400 font-bold flex items-center gap-2">
            <span className="animate-spin text-xl">⏳</span> Bazadan yuklanmoqda...
         </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white relative">
      <div className="overflow-x-auto custom-scrollbar w-full relative">
        <table className="w-full text-xs sm:text-sm border-collapse text-center text-slate-800 min-w-max">
          <thead>
            <tr>
              <td rowSpan={3} className={`border-r border-b border-slate-300 p-0 w-28 sm:w-36 align-middle sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)] ${raqamXato || raqamTakror ? 'bg-rose-50' : 'bg-slate-100'}`}>
                <label className="flex h-full flex-col items-center justify-center px-1 py-2 sm:py-4 cursor-text">
                  <span className="flex items-baseline justify-center">
                    <span className="font-black text-base sm:text-lg text-slate-400">{MOSHINA_PREFIKSI}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={readOnly || !masterHuquqi}
                      value={raqamSoni ? String(raqamSoni) : ''}
                      onChange={(e) => {
                        const raqam = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3);
                        setInfo({ ...info, raqam: raqam ? `${MOSHINA_PREFIKSI}${raqam}` : '' });
                      }}
                      placeholder="?"
                      aria-label="Moshina raqami"
                      className={`w-12 sm:w-14 bg-transparent p-0 outline-none font-black text-xl sm:text-2xl text-left disabled:text-slate-400 placeholder:text-slate-300 ${raqamXato || raqamTakror ? 'text-rose-600' : 'text-slate-800'}`}
                    />
                  </span>
                  {raqamXato && <span className="mt-1 text-[9px] font-bold leading-tight text-rose-600">1–{moshinaSoni} oralig&apos;ida</span>}
                  {!raqamXato && raqamTakror && <span className="mt-1 text-[9px] font-bold leading-tight text-rose-600">Takrorlandi</span>}
                </label>
              </td>
              <td colSpan={rulonlar.length} className="border-b border-slate-300 p-0 min-w-[200px]">
                <div className="flex w-full bg-slate-50 divide-x divide-slate-200">
                  <input 
                    type="text" disabled={readOnly || !masterHuquqi} value={info.talimoti} 
                    onChange={(e) => setInfo({...info, talimoti: e.target.value})} 
                    placeholder="Talimoti *" 
                    className="flex-[2] p-1.5 sm:p-2.5 outline-none text-slate-700 bg-transparent text-center font-bold disabled:text-slate-400 focus:bg-indigo-50 transition-colors w-full" 
                  />
                  <input 
                    type="text" disabled={readOnly || !masterHuquqi} value={info.brend} 
                    onChange={(e) => setInfo({...info, brend: e.target.value})} 
                    placeholder="Brend *" 
                    className="flex-1 p-1.5 sm:p-2.5 outline-none text-slate-700 bg-transparent text-center font-bold disabled:text-slate-400 focus:bg-indigo-50 transition-colors w-full" 
                  />
                </div>
              </td>
            </tr>
            
            <tr>
              <td colSpan={rulonlar.length} className="border-b border-slate-300 p-0 min-w-[200px]">
                <div className="flex w-full bg-slate-50/70 divide-x divide-slate-200 relative">
                  <input 
                    type="text" disabled={readOnly || !masterHuquqi} value={info.ip} 
                    onChange={(e) => setInfo({...info, ip: e.target.value})} 
                    placeholder="Ip *" 
                    className="flex-1 p-1.5 sm:p-2 outline-none text-slate-700 bg-transparent text-center font-bold disabled:text-slate-400 focus:bg-indigo-50 transition-colors w-full" 
                  />
                  <input 
                    type="text" disabled={readOnly || !masterHuquqi} value={info.lot} 
                    onChange={(e) => setInfo({...info, lot: e.target.value})} 
                    placeholder="Lot *" 
                    className="flex-1 p-1.5 sm:p-2 outline-none text-slate-700 bg-transparent text-center font-bold disabled:text-slate-400 focus:bg-indigo-50 transition-colors w-full" 
                  />
                  
                  <div className="flex-[2] relative" ref={dropdownRef}>
                    <input 
                      type="text" disabled={readOnly || !masterHuquqi} value={qidiruv} 
                      onChange={(e) => {
                        setQidiruv(e.target.value);
                        setDropdownOchiq(true);
                        setInfo({...info, operator: e.target.value, operatorId: null});
                      }} 
                      onClick={() => { if (!readOnly && masterHuquqi) { operatorlarniYuklash(); setDropdownOchiq(true); } }}
                      placeholder="Operator *" 
                      className="w-full p-1.5 sm:p-2 outline-none text-indigo-700 bg-transparent text-center font-black disabled:text-slate-400 cursor-pointer placeholder:text-indigo-300 focus:bg-indigo-50 transition-colors" 
                    />
                    
                    {dropdownOchiq && (!readOnly && masterHuquqi) && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto text-left min-w-[150px]">
                        {operatorlarList.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center font-bold">Bazada operator topilmadi...</div>
                        ) : (
                          operatorlarList
                            .filter(op => (op.ism || '').toLowerCase().includes(qidiruv.toLowerCase()))
                            .map(op => (
                              <div 
                                key={op.id}
                                onClick={() => {
                                  setQidiruv(op.ism);
                                  setInfo({...info, operator: op.ism, operatorId: op.id});
                                  setDropdownOchiq(false);
                                }}
                                className="p-2 sm:p-3 text-xs sm:text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0 font-bold text-slate-700 transition-colors flex items-center gap-2"
                              >
                                <span className="bg-indigo-100 text-indigo-600 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs">👤</span> 
                                {op.ism}
                              </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>

            <tr className="bg-slate-100 border-b border-slate-300">
              {rulonlar.map((r: any, idx: number) => (
                <td key={`header-${idx}`} className="border-r border-slate-200 p-1.5 sm:p-2 font-black text-[10px] sm:text-xs text-slate-500 w-16 sm:w-24">
                  {r.id || idx + 1}
                </td>
              ))}
            </tr>
          </thead>
          
          <tbody>
            <tr className="border-b border-slate-200 bg-white">
              <td className="border-r border-slate-300 p-1.5 sm:p-2 pl-2 sm:pl-4 text-left font-black text-slate-600 text-[9px] sm:text-xs uppercase tracking-wider bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Vaqti</td>
              {rulonlar.map((r: any, idx: number) => (
                <td key={`vaqt-${idx}`} className="border-r border-slate-200 p-1 sm:p-1.5 text-center font-bold text-indigo-500 bg-indigo-50/20 text-[10px] sm:text-sm min-w-[60px] sm:min-w-[80px]">
                  {r.vaqt || '-'}
                </td>
              ))}
            </tr>

            {nuqsonTurlari.map((nuqson, nIdx) => (
              <tr key={`nuqson-row-${nIdx}`} className="border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                <td className="border-r border-slate-300 p-1.5 sm:p-2 pl-2 sm:pl-4 text-left font-bold text-slate-500 text-[10px] sm:text-xs bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] whitespace-nowrap">{nuqson}</td>
                {rulonlar.map((r: any, idx: number) => (
                  <td key={`nuqson-${nIdx}-${idx}`} className="border-r border-slate-200 p-0 min-w-[60px] sm:min-w-[80px]">
                    <input 
                      type="text" disabled={readOnly || !kontrolchiHuquqi} value={r.nuqsonlar?.[nuqson] || ''} 
                      onChange={(e) => handleNuqsonChange(idx, nuqson, e.target.value)} 
                      className="w-full h-full min-h-[30px] sm:min-w-[40px] p-1 sm:p-2 text-center font-bold text-slate-700 outline-none bg-transparent disabled:text-slate-400 disabled:cursor-not-allowed focus:bg-amber-50 focus:text-amber-900 transition-colors text-[10px] sm:text-sm" 
                    />
                  </td>
                ))}
              </tr>
            ))}

            <tr className="border-b border-slate-300 bg-emerald-50/10">
              <td className="border-r border-slate-300 p-2 sm:p-3 pl-2 sm:pl-4 text-left font-black text-emerald-800 text-[10px] sm:text-sm bg-emerald-50/40 uppercase sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Rulon kg</td>
              {rulonlar.map((r: any, idx: number) => (
                <td key={`kg-${idx}`} className="border-r border-slate-200 p-0 min-w-[60px] sm:min-w-[80px]">
                  <input 
                    type="number" step="0.01" disabled={readOnly || !kontrolchiHuquqi} value={r.kg} 
                    onChange={(e) => handleKgChange(idx, e.target.value)} 
                    onBlur={() => handleKgBlur(idx)} 
                    placeholder={idx === rulonlar.length - 1 ? "0.0" : ""}
                    className="w-full h-full min-h-[40px] sm:min-h-[50px] p-1 sm:p-2 text-center font-black text-base sm:text-xl bg-transparent outline-none text-emerald-600 disabled:text-emerald-300 disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] focus:bg-emerald-100 transition-colors placeholder:text-emerald-200" 
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-2 sm:p-3 flex justify-end items-center rounded-b-xl border-t-0">
        <div className="bg-emerald-100 text-emerald-800 px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl border border-emerald-200 text-xs sm:text-sm font-black shadow-sm flex items-center gap-1.5 sm:gap-2">
          <span>Jami:</span> 
          <span className="text-base sm:text-lg">{jamiKg.toFixed(2)}</span>
          <span className="text-emerald-600 text-[10px] sm:text-xs">kg</span>
        </div>
      </div>
    </div>
  );
}