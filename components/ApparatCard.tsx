'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function ApparatCard({ id, onDataChange, initialData, readOnly, joriySana, rol, isLoaded = true }: any) {
  const [rulonlar, setRulonlar] = useState(
    initialData?.rulonlar || [{ id: 1, kg: '', nuqsonlar: {} as any, vaqt: '' }]
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
  const kontrolchiHuquqi = rol === 'admin' || rol === 'kontrolchi';

  const [operatorlarList, setOperatorlarList] = useState<any[]>([]);
  const [qidiruv, setQidiruv] = useState(info.operator);
  const [dropdownOchiq, setDropdownOchiq] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onDataChange) {
      onDataChange({ ...info, rulonlar });
    }
  }, [info, rulonlar]);

  const operatorlarniYuklash = () => {
    try {
      const sanaString = joriySana || new Date().toISOString().split('T')[0];
      const joriyYilOy = sanaString.slice(0, 7); 
      
      const xodimlarStr = 
        localStorage.getItem(`zavod_ishchilar_${joriyYilOy}`) || 
        localStorage.getItem('zavod_ishchilar_bazasi') || 
        localStorage.getItem('ishchilar');

      if (xodimlarStr) {
        const xodimlar = JSON.parse(xodimlarStr);
        const faqatOperatorlar = xodimlar.filter((x: any) => {
          if (!x) return false;
          const lavozim = String(x.lavozim || x.mutaxassislik || x.rol || '').toLowerCase();
          return lavozim.includes('operat') || JSON.stringify(x).toLowerCase().includes('operat');
        });
        setOperatorlarList(faqatOperatorlar);
      } else {
        setOperatorlarList([]);
      }
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
    
    let yangiRulonlar = [...rulonlar];
    yangiRulonlar[index].kg = tozalanganQiymat;
    
    if (qiymat.trim() !== '') {
      if (!yangiRulonlar[index].vaqt) {
        const hozir = new Date();
        const soat = hozir.getHours().toString().padStart(2, '0');
        const minut = hozir.getMinutes().toString().padStart(2, '0');
        yangiRulonlar[index].vaqt = `${soat}:${minut}`;
      }
    } else {
      yangiRulonlar[index].vaqt = ''; 
    }
    
    if (index === yangiRulonlar.length - 1 && qiymat.trim() !== '') {
      yangiRulonlar.push({ id: yangiRulonlar.length + 1, kg: '', nuqsonlar: {}, vaqt: '' });
    }
    setRulonlar(yangiRulonlar);
  };

  const handleKgBlur = (index: number) => {
    if (readOnly || !kontrolchiHuquqi) return; 
    let yangiRulonlar = [...rulonlar];
    if (yangiRulonlar[index].kg.trim() === '' && index !== yangiRulonlar.length - 1) {
      yangiRulonlar.splice(index, 1);
      yangiRulonlar = yangiRulonlar.map((r, idx) => ({ ...r, id: idx + 1 }));
      setRulonlar(yangiRulonlar);
    }
  };

  const handleNuqsonChange = (index: number, nuqsonNomi: string, qiymat: string) => {
    if (readOnly || !kontrolchiHuquqi) return; 
    const yangiRulonlar = [...rulonlar];
    yangiRulonlar[index].nuqsonlar[nuqsonNomi] = qiymat;
    setRulonlar(yangiRulonlar);
  };

  const haqiqiyRulonlar = rulonlar.filter((r: any) => r.kg.trim() !== '');
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
              <td rowSpan={3} className="border-r border-b border-slate-300 bg-slate-100 p-0 w-24 sm:w-32 align-middle sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                <input 
                  type="text" disabled={readOnly || !masterHuquqi} value={info.raqam} 
                  onChange={(e) => setInfo({...info, raqam: e.target.value})} 
                  placeholder="MOSHINA" 
                  className="w-full h-full p-2 sm:p-4 outline-none text-slate-800 font-black text-xl sm:text-2xl text-center bg-transparent uppercase disabled:text-slate-400 focus:bg-slate-200 transition-colors placeholder:text-sm" 
                />
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
                      type="text" disabled={readOnly || !kontrolchiHuquqi} value={r.nuqsonlar[nuqson] || ''} 
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