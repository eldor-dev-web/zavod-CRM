'use client';
import React, { useState, useEffect } from 'react';
import BraklarJadvali from '@/components/BraklarJadvali';

export default function BraklarSahifasi() {
  const [tanlanganOy, setTanlanganOy] = useState('');
  
  const [brakStavkalari, setBrakStavkalari] = useState({
    ignaSinigi: 8000, 
    luxXatosi: 10000   
  });
  
  const [ishchilarBazasi, setIshchilarBazasi] = useState<any[]>([]);
  const [brakMaqomlari, setBrakMaqomlari] = useState<Record<string, any>>({});
  const [operatorIsmlari, setOperatorIsmlari] = useState<Record<string, string>>({});
  
  const [kunlikJadvalOchiq, setKunlikJadvalOchiq] = useState(false);
  const [yangilanmoqda, setYangilanmoqda] = useState(false);

  const filtrlashOperatorlarni = (barchaXodimlar: any[]) => {
    let aniqLavozimNomi = 'Operator';
    try {
      const lavozimlar = JSON.parse(localStorage.getItem('zavod_lavozimlar_bazasi') || '[]');
      const topilganOperator = lavozimlar.find((l: any) => String(l.nomi).toLowerCase() === 'operator');
      if (topilganOperator) aniqLavozimNomi = topilganOperator.nomi;
    } catch (e) { console.error(e); }

    return barchaXodimlar.filter((x: any) => {
      if (!x) return false;
      const lavozim = String(x.lavozim || x.mutaxassislik || x.rol || '').trim();
      const textHolati = JSON.stringify(x).toLowerCase();
      return (lavozim === aniqLavozimNomi || lavozim.toLowerCase() === 'operator' || textHolati.includes('operat') || textHolati.includes('операт'));
    });
  };

  const malumotlarniYuklash = (oy: string) => {
    const xodimlarStr = localStorage.getItem(`zavod_ishchilar_${oy}`) || localStorage.getItem('zavod_ishchilar_bazasi');
    if (xodimlarStr) {
      try {
        const barchaXodimlar = JSON.parse(xodimlarStr);
        setIshchilarBazasi(filtrlashOperatorlarni(barchaXodimlar));
      } catch (e) { setIshchilarBazasi([]); }
    } else { setIshchilarBazasi([]); }

    const saqlanganBraklar = localStorage.getItem(`zavod_brak_jadval_${oy}`);
    if (saqlanganBraklar) {
      try { setBrakMaqomlari(JSON.parse(saqlanganBraklar)); } catch (e) { setBrakMaqomlari({}); }
    } else { setBrakMaqomlari({}); }

    const saqlanganIsmlar = localStorage.getItem(`zavod_brak_ismlar_${oy}`);
    if (saqlanganIsmlar) {
      try { setOperatorIsmlari(JSON.parse(saqlanganIsmlar)); } catch (e) { setOperatorIsmlari({}); }
    } else { setOperatorIsmlari({}); }
  };

  useEffect(() => {
    const saqlanganOy = localStorage.getItem('zavod_joriy_hisobot_oyi');
    const hozirgiOy = saqlanganOy || new Date().toISOString().slice(0, 7);
    setTanlanganOy(hozirgiOy);

    const saqlanganNarxlar = localStorage.getItem('zavod_brak_stavkalari');
    if (saqlanganNarxlar) {
      try { setBrakStavkalari(JSON.parse(saqlanganNarxlar)); } catch (e) {}
    }

    malumotlarniYuklash(hozirgiOy);
  }, []);

  const oyniOzgartirish = (yangiOy: string) => {
    setTanlanganOy(yangiOy);
    localStorage.setItem('zavod_joriy_hisobot_oyi', yangiOy);
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

  const getOyKunlariSoni = () => {
    if (!tanlanganOy) return 30;
    const [yil, oy] = tanlanganOy.split('-').map(Number);
    return new Date(yil, oy, 0).getDate();
  };

  const kunlarMassivi = Array.from({ length: getOyKunlariSoni() }, (_, i) => i + 1);

  const qiymatniOzgartirish = (ishchiId: any, kun: number, field: 'igna' | 'lux', val: any) => {
    const kalit = `${ishchiId}_${kun}`;
    const current = brakMaqomlari[kalit] || { igna: '', lux: '' };
    const numVal = val === '' ? '' : Number(val.replace(/\D/g, ''));
    const updated = { ...brakMaqomlari, [kalit]: { igna: current.igna ?? '', lux: current.lux ?? '', [field]: numVal } };
    setBrakMaqomlari(updated);
    localStorage.setItem(`zavod_brak_jadval_${tanlanganOy}`, JSON.stringify(updated));
  };

  const operatorIsminiOzgartirish = (ishchiId: any, yangiIsm: string) => {
    const updated = { ...operatorIsmlari, [ishchiId]: yangiIsm };
    setOperatorIsmlari(updated);
    localStorage.setItem(`zavod_brak_ismlar_${tanlanganOy}`, JSON.stringify(updated));
  };

  const operatorBrakHisobi = (ishchiId: any) => {
    let jamiIgna = 0, jamiLux = 0;
    kunlarMassivi.forEach(kun => {
      const data = brakMaqomlari[`${ishchiId}_${kun}`];
      if (data) {
        if (data.igna !== '' && data.igna !== undefined && !isNaN(Number(data.igna))) jamiIgna += Number(data.igna);
        if (data.lux !== '' && data.lux !== undefined && !isNaN(Number(data.lux))) jamiLux += Number(data.lux);
      }
    });
    const summa = (jamiIgna * brakStavkalari.ignaSinigi) + (jamiLux * brakStavkalari.luxXatosi);
    return { jamiIgna, jamiLux, summa };
  };

  const brakBorOperatorlar = ishchilarBazasi.map(ishchi => {
    const hisob = operatorBrakHisobi(ishchi.id);
    const customIsm = operatorIsmlari[ishchi.id] !== undefined ? operatorIsmlari[ishchi.id] : ishchi.ism;
    return { ...ishchi, ...hisob, ism: customIsm };
  }).filter(item => item.jamiIgna > 0 || item.jamiLux > 0);

  const umumiyIgnaMetr = brakBorOperatorlar.reduce((sum, item) => sum + item.jamiIgna, 0);
  const umumiyLuxMetr = brakBorOperatorlar.reduce((sum, item) => sum + item.jamiLux, 0);
  const umumiyJarimaSummasi = brakBorOperatorlar.reduce((sum, item) => sum + item.summa, 0);

  return (
    <div className="p-2.5 sm:p-6 max-w-[100vw] mx-auto font-sans bg-slate-50 min-h-screen">
      
      {/* 1. TEPADAGI SARLAVHA VA FILTRLAR */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-8 md:mt-0">
        <div>
          <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">Operatorlar Brak Hisobi</h1>
        </div>
        <div className="flex items-end sm:items-center justify-between sm:justify-end gap-2 sm:gap-3">
          <button onClick={bazaniSinxronlash} disabled={yangilanmoqda} className={`px-3 py-2 sm:px-4 sm:py-2 border border-slate-300 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-2xs whitespace-nowrap ${yangilanmoqda ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 hover:bg-slate-50 hover:border-blue-400'}`}>
            {yangilanmoqda ? '⏳ Yangilanmoqda...' : '🔄 Yangilash'}
          </button>
          <div>
            <label className="block text-[9px] sm:text-xs font-bold text-slate-400 uppercase mb-1 sm:mb-1.5">Hisobot Oyi</label>
            <input type="month" value={tanlanganOy} onChange={(e) => oyniOzgartirish(e.target.value)} className="border border-slate-300 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all shadow-2xs" />
          </div>
        </div>
      </div>

      {/* 2. ASOSIY JADVAL BLOKI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mb-4 sm:mb-6">
        <div className="p-3 sm:p-5 bg-slate-100/80 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 sm:gap-4">
          <div>
            <h3 className="text-[11px] sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
              <span>📊</span> Oylik Jarima Hisoboti
            </h3>
          </div>
          <button type="button" onClick={() => setKunlikJadvalOchiq(!kunlikJadvalOchiq)} className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-2xs flex items-center justify-center gap-1.5 sm:gap-2 ${kunlikJadvalOchiq ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            <span>{kunlikJadvalOchiq ? '📂 Kunlik Jadvalni Yopish' : '🔍 Kunlik Tafsilotlar'}</span>
            <span className="text-xs sm:text-base">{kunlikJadvalOchiq ? '▲' : '▼'}</span>
          </button>
        </div>

        {brakBorOperatorlar.length === 0 ? (
          <div className="text-center py-8 sm:py-10 text-slate-400 text-xs font-semibold px-4">
            Hozircha tanlangan oyda hech qaysi operatorga brak kiritilmadi.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed sm:table-auto">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[8px] sm:text-[11px] leading-tight uppercase font-black text-slate-500">
                  <th className="p-1.5 sm:p-3.5 text-center w-[28px] sm:w-16 border-r border-slate-200">№</th>
                  <th className="p-1.5 sm:p-3.5 border-r border-slate-200 w-[24%] sm:w-auto">Operator F.I.Sh.</th>
                  <th className="p-1.5 sm:p-3.5 text-center border-r border-slate-200 w-[21%] sm:w-48">Jami Igna Sinigʻi (Metr)</th>
                  <th className="p-1.5 sm:p-3.5 text-center border-r border-slate-200 w-[21%] sm:w-48">Jami Lux Xatosi (Metr)</th>
                  <th className="p-1.5 sm:p-3.5 text-right w-[26%] sm:w-56 bg-red-50/50">Oylikdan Ushlanadi (Jarima)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[10px] sm:text-sm font-semibold text-slate-800">
                {brakBorOperatorlar.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-1.5 sm:p-3.5 text-center font-bold text-slate-400 border-r border-slate-200 bg-slate-50/30">{idx + 1}</td>
                    <td className="p-1.5 sm:p-3.5 font-bold border-r border-slate-200 text-slate-900 truncate">👤 {item.ism}</td>
                    <td className="p-1.5 sm:p-3.5 text-center border-r border-slate-200 text-red-600 font-black whitespace-nowrap">{item.jamiIgna > 0 ? `${item.jamiIgna} metr` : '-'}</td>
                    <td className="p-1.5 sm:p-3.5 text-center border-r border-slate-200 text-blue-600 font-black whitespace-nowrap">{item.jamiLux > 0 ? `${item.jamiLux} metr` : '-'}</td>
                    <td className="p-1.5 sm:p-3.5 text-right font-black text-red-600 bg-red-50/20 text-[10px] sm:text-base whitespace-nowrap">{item.summa.toLocaleString()} so'm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. 31 KUNLIK JADVAL */}
      {kunlikJadvalOchiq && (
        <BraklarJadvali 
          kunlarMassivi={kunlarMassivi}
          ishchilarBazasi={ishchilarBazasi}
          brakMaqomlari={brakMaqomlari}
          operatorIsmlari={operatorIsmlari}
          qiymatniOzgartirish={qiymatniOzgartirish}
          operatorIsminiOzgartirish={operatorIsminiOzgartirish}
          operatorBrakHisobi={operatorBrakHisobi}
          setKunlikJadvalOchiq={setKunlikJadvalOchiq}
        />
      )}

      {/* 4. PASTKI UMUMIY XULOSA (PREMIUM DARK SLATE DIZAYN) */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Jami xatolar:</p>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
            Igna: <strong className="text-red-600">{umumiyIgnaMetr} metr</strong> | Lux: <strong className="text-blue-600">{umumiyLuxMetr} metr</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs sm:text-sm font-black">
          <div className="w-full sm:w-auto text-center bg-slate-900 border border-slate-800 px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-slate-200 shadow-sm flex items-center justify-center gap-2">
            <span>💼 Jami Jarima:</span> 
            <span className="text-amber-400 font-black text-sm sm:text-base">{umumiyJarimaSummasi.toLocaleString()} so'm</span>
          </div>
        </div>
      </div>

    </div>
  );
}