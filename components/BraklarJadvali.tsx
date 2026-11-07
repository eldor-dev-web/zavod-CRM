import React from 'react';

export default function BraklarJadvali({
  kunlarMassivi,
  ishchilarBazasi,
  brakMaqomlari,
  operatorIsmlari,
  qiymatniOzgartirish,
  operatorIsminiOzgartirish,
  operatorBrakHisobi,
  setKunlikJadvalOchiq
}: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mb-6 animate-fadeIn">
      <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
          <span>🗓️</span> Kunlik Tafsilotli Kalendar (1 - {kunlarMassivi.length})
        </h3>
        
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> IGNA
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> LUX
            </div>
            <button 
              onClick={() => setKunlikJadvalOchiq(false)}
              className="ml-2 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg font-bold transition-colors"
            >
              Yopish ✕
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] uppercase font-black text-slate-600 tracking-wider">
              <th className="p-3 text-center w-14 border-r border-slate-200 sticky left-0 bg-slate-100 z-10">№</th>
              <th className="p-3 border-r border-slate-200 w-64 sticky left-14 bg-slate-100 z-10">Operator F.I.Sh.</th>
              
              {kunlarMassivi.map((kun: number) => (
                <th key={kun} className="p-1.5 text-center border-r border-slate-200 w-[4.5rem] text-xs font-bold text-slate-600">
                  {kun}
                </th>
              ))}

              <th className="p-3 text-center border-r border-slate-200 w-36 bg-slate-200/80">Jami Metr</th>
              <th className="p-3 text-right border-r border-slate-200 w-40 bg-red-50">Jami Jarima</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {ishchilarBazasi.map((ishchi: any, index: number) => {
              const { jamiIgna, jamiLux, summa } = operatorBrakHisobi(ishchi.id);
              const joriyIsm = operatorIsmlari[ishchi.id] !== undefined ? operatorIsmlari[ishchi.id] : ishchi.ism;

              return (
                <tr key={ishchi.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-400 border-r border-slate-200 bg-slate-50/50 sticky left-0 z-10">
                    {index + 1}
                  </td>

                  <td className="p-2 border-r border-slate-200 bg-white sticky left-14 z-10">
                    <input 
                      type="text"
                      value={joriyIsm || ''}
                      onChange={(e) => operatorIsminiOzgartirish(ishchi.id, e.target.value)}
                      placeholder="Operator ismi"
                      className="w-full px-2 py-1.5 text-xs font-bold text-slate-800 bg-transparent rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-400 outline-none transition-all"
                    />
                  </td>

                  {kunlarMassivi.map((kun: number) => {
                    const data = brakMaqomlari[`${ishchi.id}_${kun}`] || { igna: '', lux: '' };

                    return (
                      <td key={kun} className="p-1 text-center border-r border-slate-100 bg-white">
                        <div className="flex items-center justify-center gap-1">
                          <input 
                            type="text"
                            value={data.igna !== undefined ? data.igna : ''}
                            onChange={(e) => qiymatniOzgartirish(ishchi.id, kun, 'igna', e.target.value)}
                            placeholder="0"
                            className="w-9 h-7 text-center font-black text-[11px] text-red-700 bg-red-50/60 rounded border border-slate-200 outline-none focus:bg-white transition-colors"
                          />
                          <input 
                            type="text"
                            value={data.lux !== undefined ? data.lux : ''}
                            onChange={(e) => qiymatniOzgartirish(ishchi.id, kun, 'lux', e.target.value)}
                            placeholder="0"
                            className="w-9 h-7 text-center font-black text-[11px] text-blue-700 bg-blue-50/60 rounded border border-slate-200 outline-none focus:bg-white transition-colors"
                          />
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-2 text-center border-r border-slate-200 bg-slate-50 text-xs font-black">
                    <div className="text-red-600">{jamiIgna}m igna</div>
                    <div className="text-blue-600 text-[11px]">{jamiLux}m lux</div>
                  </td>

                  <td className="p-3 text-right font-black text-red-600 border-r border-slate-200 bg-red-50/30 text-xs">
                    {summa.toLocaleString()} so'm
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