'use client';
import React, { useState, useEffect } from 'react';
import BraklarJadvali from '@/components/BraklarJadvali';
import AvansBloknot from '@/components/AvanstBloknot.';
import { brakHisobi, faolIshchilar, oyKunlariSoni, operatormi, oySozlamasi, KALIT, STANDART_BRAK_STAVKALARI, STANDART_LAVOZIMLAR, type Ishchi } from '@/lib/hisob';
import { oqish } from '@/lib/mahalliyXotira';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentOy } from '@/lib/sana';

export default function BraklarSahifasi() {
  const [tanlanganOy, setTanlanganOy] = useState('');
  
  const [brakStavkalari, setBrakStavkalari] = useState(STANDART_BRAK_STAVKALARI);

  const [ishchilarBazasi, setIshchilarBazasi] = useState<Ishchi[]>([]);
  const [barchaIshchilar, setBarchaIshchilar] = useState<Ishchi[]>([]);
  const [brakMaqomlari, setBrakMaqomlari] = useState<Record<string, any>>({});
  const [operatorIsmlari, setOperatorIsmlari] = useState<Record<string, string>>({});
  
  const [tanlanganOperatorId, setTanlanganOperatorId] = useState<any | null>(null);
  const [yangilanmoqda, setYangilanmoqda] = useState(false);

  const malumotlarniYuklash = (oy: string) => {
    const xodimlar = faolIshchilar(oyIshchilari(oy));
    setBarchaIshchilar(xodimlar);
    setIshchilarBazasi(xodimlar.filter(operatormi));

    const saqlanganBraklar = localStorage.getItem(KALIT.brakJadvali(oy));
    if (saqlanganBraklar) {
      try { setBrakMaqomlari(JSON.parse(saqlanganBraklar)); } catch (e) { setBrakMaqomlari({}); }
    } else { setBrakMaqomlari({}); }

    const saqlanganIsmlar = localStorage.getItem(`zavod_brak_ismlar_${oy}`);
    if (saqlanganIsmlar) {
      try { setOperatorIsmlari(JSON.parse(saqlanganIsmlar)); } catch (e) { setOperatorIsmlari({}); }
    } else { setOperatorIsmlari({}); }
  };

  useEffect(() => {
    const hozirgiOy = toshkentOy();
    setTanlanganOy(hozirgiOy);

    const saqlanganNarxlar = localStorage.getItem('zavod_brak_stavkalari');
    if (saqlanganNarxlar) {
      try { setBrakStavkalari(JSON.parse(saqlanganNarxlar)); } catch (e) {}
    }

    malumotlarniYuklash(hozirgiOy);
  }, []);

  const oyniOzgartirish = (yangiOy: string) => {
    setTanlanganOy(yangiOy);
    setTanlanganOperatorId(null);
    malumotlarniYuklash(yangiOy);
  };

  const bazaniSinxronlash = () => {
    setYangilanmoqda(true);
    const saqlanganNarxlar = localStorage.getItem('zavod_brak_stavkalari');
    if (saqlanganNarxlar) {
      try { setBrakStavkalari(JSON.parse(saqlanganNarxlar)); } catch (e) {}
    }

    setTimeout(() => {
      malumotlarniYuklash(tanlanganOy);
      setYangilanmoqda(false);
    }, 600);
  };

  const kunlarMassivi = Array.from({ length: tanlanganOy ? oyKunlariSoni(tanlanganOy) : 30 }, (_, i) => i + 1);

  const qiymatniOzgartirish = (ishchiId: any, kun: number, field: 'igna' | 'lux', val: any) => {
    const kalit = `${ishchiId}_${kun}`;
    const current = brakMaqomlari[kalit] || { igna: '', lux: '' };
    const numVal = val === '' ? '' : Number(String(val).replace(/\D/g, ''));
    const updated = { ...brakMaqomlari, [kalit]: { igna: current.igna ?? '', lux: current.lux ?? '', [field]: numVal } };
    setBrakMaqomlari(updated);
    localStorage.setItem(KALIT.brakJadvali(tanlanganOy), JSON.stringify(updated));
  };

  const operatorIsminiOzgartirish = (ishchiId: any, yangiIsm: string) => {
    const updated = { ...operatorIsmlari, [ishchiId]: yangiIsm };
    setOperatorIsmlari(updated);
    localStorage.setItem(`zavod_brak_ismlar_${tanlanganOy}`, JSON.stringify(updated));
  };

  // Umumiy hisob faylidan (Telegram bot ham xuddi shunday hisoblaydi)
  const operatorBrakHisobi = (ishchiId: any) => {
    // Tanlangan oyda amal qilgan narxlar (o'tgan oylar eski narx bilan)
    const oyNarxlari = oySozlamasi(
      tanlanganOy,
      { lavozimlar: STANDART_LAVOZIMLAR, operatorQoshimcha: 0, brakStavkalari },
      oqish(KALIT.sozlamaTarixi, {})
    ).brakStavkalari;
    const b = brakHisobi(ishchiId, tanlanganOy, brakMaqomlari, oyNarxlari);
    return { jamiIgna: b.igna, jamiLux: b.lux, summa: b.jarima };
  };

  const brakBorOperatorlar = ishchilarBazasi.map(ishchi => {
    const hisob = operatorBrakHisobi(ishchi.id);
    const customIsm = operatorIsmlari[ishchi.id] !== undefined ? operatorIsmlari[ishchi.id] : ishchi.ism;
    return { ...ishchi, ...hisob, ism: customIsm };
  }).filter(item => item.jamiIgna > 0 || item.jamiLux > 0);

  const umumiyIgnaMetr = brakBorOperatorlar.reduce((sum, item) => sum + item.jamiIgna, 0);
  const umumiyLuxMetr = brakBorOperatorlar.reduce((sum, item) => sum + item.jamiLux, 0);
  const umumiyJarimaSummasi = brakBorOperatorlar.reduce((sum, item) => sum + item.summa, 0);

  const tanlanganOperatorlarMassivi = brakBorOperatorlar.filter(op => op.id === tanlanganOperatorId);

  return (
    <div className="p-2.5 sm:p-6 max-w-[100vw] mx-auto font-sans bg-slate-50 min-h-screen">
      
      {/* 1. TEPADAGI PANEL (IKONKALAR BILAN) */}
      <div className="bg-white px-4 py-3 rounded-2xl shadow-2xs border border-slate-200/80 mb-4 flex justify-between items-center gap-2 mt-8 md:mt-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">Braklar</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Faqat ikonka bilan yangilash tugmasi */}
          <button 
            onClick={bazaniSinxronlash} 
            disabled={yangilanmoqda} 
            title="Yangilash"
            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-all"
          >
            <svg className={`w-4 h-4 ${yangilanmoqda ? 'animate-spin text-blue-600' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <input 
            type="month" 
            value={tanlanganOy} 
            onChange={(e) => oyniOzgartirish(e.target.value)} 
            className="h-9 border border-slate-200 rounded-xl px-2.5 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all" 
          />
        </div>
      </div>

      {/* 2. ASOSIY JADVAL (USTUNLAR IKONKA VA RANGLI INDIKATORLARDA) */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden mb-4">
        {brakBorOperatorlar.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-semibold">
            —
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed sm:table-auto">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] sm:text-[11px] uppercase font-black text-slate-500">
                  <th className="p-2.5 sm:p-3.5 text-center w-[34px] sm:w-14 border-r border-slate-200/70">#</th>
                  
                  {/* Operator ustuni ikonkasi */}
                  <th className="p-2.5 sm:p-3.5 border-r border-slate-200/70 w-[30%] sm:w-auto">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Operator</span>
                    </div>
                  </th>

                  {/* Igna ustuni (Qizil nuqta + Igna) */}
                  <th className="p-2.5 sm:p-3.5 text-center border-r border-slate-200/70 w-[18%] sm:w-40">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-red-600">Igna</span>
                    </div>
                  </th>

                  {/* Lux ustuni (Ko'k nuqta + Lux) */}
                  <th className="p-2.5 sm:p-3.5 text-center border-r border-slate-200/70 w-[18%] sm:w-40">
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-blue-600">Lux</span>
                    </div>
                  </th>

                  {/* Jarima ustuni (Hamyon/Pul ikonkasi) */}
                  <th className="p-2.5 sm:p-3.5 text-right w-[24%] sm:w-48">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Summa</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-semibold text-slate-800">
                {brakBorOperatorlar.map((item, idx) => {
                  const isTanlangan = tanlanganOperatorId === item.id;

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setTanlanganOperatorId(isTanlangan ? null : item.id)}
                      className={`cursor-pointer transition-colors ${isTanlangan ? 'bg-blue-50/70' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="p-2.5 sm:p-3.5 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                      <td className="p-2.5 sm:p-3.5 font-bold border-r border-slate-100 text-slate-900 truncate">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{item.ism}</span>
                          <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${isTanlangan ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </td>
                      <td className="p-2.5 sm:p-3.5 text-center border-r border-slate-100 text-red-600 font-black whitespace-nowrap">
                        {item.jamiIgna > 0 ? `${item.jamiIgna} m` : '—'}
                      </td>
                      <td className="p-2.5 sm:p-3.5 text-center border-r border-slate-100 text-blue-600 font-black whitespace-nowrap">
                        {item.jamiLux > 0 ? `${item.jamiLux} m` : '—'}
                      </td>
                      <td className="p-2.5 sm:p-3.5 text-right font-black text-slate-900 whitespace-nowrap">
                        {item.summa.toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. KUNLIK AQLLI JADVAL */}
      {tanlanganOperatorlarMassivi.length > 0 && (
        <BraklarJadvali 
          kunlarMassivi={kunlarMassivi}
          ishchilarBazasi={tanlanganOperatorlarMassivi}
          brakMaqomlari={brakMaqomlari}
          operatorIsmlari={operatorIsmlari}
          qiymatniOzgartirish={qiymatniOzgartirish}
          operatorIsminiOzgartirish={operatorIsminiOzgartirish}
          operatorBrakHisobi={operatorBrakHisobi}
          setKunlikJadvalOchiq={() => setTanlanganOperatorId(null)}
        />
      )}

      {/* 4. PASTKI UMUMIY PANEL (FAQAT IKONKA VA RAQAMLAR — 0% ORTIQCHA MATN!) */}
      <div className="bg-white px-4 py-3 rounded-2xl shadow-2xs border border-slate-200/80 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-100" title="Jami Igna">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>{umumiyIgnaMetr} m</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100" title="Jami Lux">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>{umumiyLuxMetr} m</span>
          </div>
        </div>

        <div className="bg-blue-600 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-white shadow-xs flex items-center gap-2" title="Jami Jarima">
          <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="font-black text-xs sm:text-base">{umumiyJarimaSummasi.toLocaleString('ru-RU')} <span className="text-[10px] font-bold text-blue-200">so'm</span></span>
        </div>
      </div>
      <AvansBloknot tanlanganOy={tanlanganOy} ishchilar={barchaIshchilar} />
    </div>
  );
}