import React, { useState } from 'react';

export default function IshchilarJadvali({
  ishchilar, davomat, tanlanganOy, kunlarMassivi, lavozimlarBazasi, operatorQoshimchaPuli,
  handleInputChange, qatorniOchirish, statusniOzgartirish, moshinaSoniniOzgartirish,
  statistikaniHisoblash, stavkaniTopish
}: any) {
  
  const [fokusKun, setFokusKun] = useState<number | null>(null);

  return (
    // 1. TASHQI RAMKA: border-2 va slate-300 (aniq ko'rinadi)
    <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden mb-8">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          
          {/* TEPADAGI QATOR */}
          <thead>
            {/* Tag chizig'i qalinroq va to'qroq (border-slate-400) */}
            <tr className="bg-slate-100 text-[11px] uppercase font-bold text-slate-600 tracking-wider border-b-2 border-slate-400">
              <th className="p-3 text-center w-12 border-r border-slate-300 sticky left-0 bg-slate-100 z-20">№</th>
              <th className="p-3 w-52 border-r border-slate-300 sticky left-12 bg-slate-100 z-20">Xodim F.I.Sh.</th>
              
              {/* Asosiy bo'linish chizig'i (Lavozim va Kunlar orasi) - (border-r-2 border-slate-400) */}
              <th className="p-3 w-36 border-r-2 border-slate-400">Lavozimi</th>
              
              {kunlarMassivi.map((kun: number) => {
                const isActive = fokusKun === kun;
                return (
                  <th 
                    key={kun} 
                    onDoubleClick={() => setFokusKun(fokusKun === kun ? null : kun)} 
                    // Kataklar o'rtasidagi chiziq aniqroq (border-slate-300)
                    className={`p-1.5 text-center border-r border-slate-300 text-[11px] font-black cursor-pointer select-none transition-colors ${
                      isActive 
                        ? 'bg-indigo-500 text-white border-indigo-600'
                        : 'text-slate-700 hover:bg-slate-300'
                    }`}
                    title="Shu kunni ajratib ko'rsatish uchun 2 marta bosing"
                  >
                    {kun}
                  </th>
                )
              })}

              {/* Asosiy bo'linish chizig'i (Kunlar va Pullar orasi) */}
              <th className="p-3 text-center border-l-2 border-r border-slate-400 w-28 bg-slate-200">Jami Kun</th>
              <th className="p-3 text-right border-r border-slate-300 w-36 bg-emerald-100 text-emerald-800">Jami Oylik</th>
              <th className="p-3 text-center w-12 bg-slate-100">Amal</th>
            </tr>
          </thead>
          
          <tbody className="text-sm">
            {ishchilar.map((ishchi: any, index: number) => {
              const { jamiKun, jamiMoshina } = statistikaniHisoblash(ishchi.id);
              const stavka = stavkaniTopish(ishchi.lavozimi);
              
              const isOperator = String(ishchi.lavozimi).toLowerCase().includes('operator');
              const asosiyOylik = jamiKun * stavka;
              const qoshimchaMoshinaOyligi = isOperator ? (jamiMoshina * operatorQoshimchaPuli) : 0;
              const jamiOylik = asosiyOylik + qoshimchaMoshinaOyligi;

              return (
                <tr key={ishchi.id} className="hover:bg-slate-100 transition-colors bg-white group border-b border-slate-300">
                  
                  <td className="p-3 text-center font-bold text-slate-500 border-r border-slate-300 bg-white group-hover:bg-slate-100 sticky left-0 z-10 transition-colors">
                    {index + 1}
                  </td>

                  <td className="p-1 border-r border-slate-300 bg-white group-hover:bg-slate-100 sticky left-12 z-10 transition-colors">
                    <input 
                      type="text" value={ishchi.ism}
                      onChange={(e) => handleInputChange(index, 'ism', e.target.value)}
                      placeholder="Ismni kiriting..."
                      className="w-full h-full min-h-[46px] px-3 border-none bg-transparent font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 rounded-md text-sm transition-all"
                    />
                  </td>

                  <td className="p-1 border-r-2 border-slate-400">
                    <select 
                      value={ishchi.lavozimi || ""}
                      onChange={(e) => handleInputChange(index, 'lavozimi', e.target.value)}
                      className="w-full h-full min-h-[46px] px-2 border-none bg-transparent font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 rounded-md text-xs cursor-pointer transition-all"
                    >
                      <option value="" disabled>Tanlang...</option>
                      {lavozimlarBazasi.map((l: any) => (
                        <option key={l.id} value={l.nomi}>{l.nomi}</option>
                      ))}
                    </select>
                  </td>

                  {/* KUNLIK DAVOMAT KATAKLARI */}
                  {kunlarMassivi.map((kun: number) => {
                    const kalit = `${ishchi.id}_${tanlanganOy}_${kun}`;
                    const data = davomat[kalit] || { status: '', moshina: '' };
                    const isActive = fokusKun === kun;

                    const isPlus = data.status === '+';

                    let statusClass = '';
                    if (isPlus) {
                      statusClass = 'bg-emerald-100 text-emerald-700 font-bold'; 
                    } else {
                      statusClass = isActive 
                        ? 'bg-indigo-100/50 hover:bg-indigo-100 text-indigo-500'
                        : 'bg-transparent text-transparent hover:bg-slate-200';
                    }

                    const klaviaturaBosilganda = (e: React.KeyboardEvent) => {
                      if (e.key === '+' || e.key === '=') { 
                        e.preventDefault(); statusniOzgartirish(ishchi.id, kun, '+'); 
                      }
                      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '-') { 
                        e.preventDefault(); statusniOzgartirish(ishchi.id, kun, ''); 
                      }
                    };

                    return (
                      <td key={kun} className={`p-0 text-center align-middle w-10 border-r ${isActive ? 'border-indigo-400 border-x-2 bg-indigo-50/40' : 'border-slate-300'}`}>
                        {isOperator ? (
                          <div className="flex flex-col h-[52px]">
                            
                            {/* Operator ikkiga bo'lingan joyidagi chiziq (border-slate-300) */}
                            <div 
                              tabIndex={0}
                              onClick={() => statusniOzgartirish(ishchi.id, kun)}
                              onKeyDown={klaviaturaBosilganda}
                              className={`h-[26px] flex items-center justify-center text-xs cursor-pointer select-none border-b border-slate-300 transition-colors outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-t-sm ${statusClass}`}
                            >
                              {isPlus ? '+' : ''}
                            </div>
                            
                            <input 
                              type="text" 
                              value={data.moshina ? data.moshina : ''} 
                              onChange={(e) => moshinaSoniniOzgartirish(ishchi.id, kun, e.target.value)}
                              className={`h-[26px] w-full text-center font-bold text-indigo-700 outline-none border-none text-[10px] focus:bg-indigo-100 transition-colors rounded-b-sm ${isActive && !data.moshina ? 'bg-transparent' : 'bg-transparent'}`}
                            />
                          </div>
                        ) : (
                          <div 
                            tabIndex={0}
                            onClick={() => statusniOzgartirish(ishchi.id, kun)}
                            onKeyDown={klaviaturaBosilganda}
                            className={`h-[52px] flex items-center justify-center text-sm cursor-pointer select-none transition-colors outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-sm ${statusClass}`}
                          >
                            {isPlus ? '+' : ''}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  <td className="p-2 text-center border-l-2 border-r border-slate-400 bg-slate-100 text-xs font-bold align-middle">
                    <div className="flex flex-col items-center justify-center">
                      {jamiKun > 0 ? (
                        <span className="text-slate-800 text-sm font-black">{jamiKun} kun</span>
                      ) : (
                        <span className="text-slate-400 font-bold">—</span>
                      )}
                      
                      {isOperator && jamiMoshina > 0 && (
                        <span className="text-slate-800 text-xs font-black mt-1">+{jamiMoshina} ta</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-3 text-right font-black text-emerald-800 border-r border-slate-300 bg-emerald-50 text-sm align-middle">
                    <div className="flex flex-col items-end">
                      {jamiOylik > 0 ? (
                        <>
                          <span>{jamiOylik.toLocaleString()} <span className="text-[10px] text-emerald-600 font-bold">UZS</span></span>
                        </>
                      ) : (
                        <span className="text-slate-400 font-bold">—</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-0 text-center align-middle bg-slate-50">
                    <button 
                      onClick={() => qatorniOchirish(index, ishchi.ism)} 
                      className="w-full h-[52px] text-slate-400 hover:text-rose-600 font-black hover:bg-rose-100 transition-all text-xs flex items-center justify-center"
                      title="Qatorni o'chirish"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}