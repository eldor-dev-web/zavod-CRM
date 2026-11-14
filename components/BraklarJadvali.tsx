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
  const brakBorKunlar = kunlarMassivi.filter((kun: number) =>
    ishchilarBazasi.some((ishchi: any) => {
      const data = brakMaqomlari[`${ishchi.id}_${kun}`];
      const igna = data?.igna !== '' && data?.igna !== undefined ? Number(data.igna) : 0;
      const lux = data?.lux !== '' && data?.lux !== undefined ? Number(data.lux) : 0;
      return igna > 0 || lux > 0;
    })
  );

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-blue-200 overflow-hidden mb-4 animate-fadeIn">
      {/* Tepa qism: Faqat ikonkalar va rangli nuqtalar */}
      <div className="px-3.5 py-2 bg-slate-100/90 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-600">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Igna
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Lux
          </div>
        </div>

        <button 
          onClick={() => setKunlikJadvalOchiq(false)}
          className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-500">
              <th className="p-2 text-center w-10 border-r border-slate-200 sticky left-0 bg-slate-50 z-20">#</th>
              
              {/* Operator ikonkasi */}
              <th className="p-2 border-r border-slate-200 w-28 sm:w-44 sticky left-10 bg-slate-50 z-20">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </th>
              
              {brakBorKunlar.map((kun: number) => (
                <th key={kun} className="p-1.5 text-center border-r border-slate-200 min-w-[3.2rem] text-xs font-black text-slate-700">
                  {kun}
                </th>
              ))}

              {/* Metr ustuni (Chizg'ich ikonkasi) */}
              <th className="p-2 text-center border-r border-slate-200 w-20 sm:w-24 bg-slate-50" title="Jami Metr">
                <div className="inline-flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </th>

              {/* Summa ustuni (Pul ikonkasi) */}
              <th className="p-2 text-right w-28 sm:w-32 bg-slate-50" title="Jami Jarima">
                <div className="inline-flex items-center justify-end">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {ishchilarBazasi.map((ishchi: any, index: number) => {
              const { jamiIgna, jamiLux, summa } = operatorBrakHisobi(ishchi.id);
              const joriyIsm = operatorIsmlari[ishchi.id] !== undefined ? operatorIsmlari[ishchi.id] : ishchi.ism;

              return (
                <tr key={ishchi.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2 text-center font-bold text-slate-400 border-r border-slate-200 bg-slate-50 sticky left-0 z-10">
                    {index + 1}
                  </td>

                  <td className="p-1.5 border-r border-slate-200 bg-white sticky left-10 z-10">
                    <input 
                      type="text"
                      value={joriyIsm || ''}
                      onChange={(e) => operatorIsminiOzgartirish(ishchi.id, e.target.value)}
                      className="w-full px-1.5 py-1 text-xs font-bold text-slate-800 bg-transparent rounded border border-transparent hover:border-slate-200 focus:bg-white focus:border-blue-400 outline-none transition-all"
                    />
                  </td>

                  {brakBorKunlar.map((kun: number) => {
                    const data = brakMaqomlari[`${ishchi.id}_${kun}`] || { igna: '', lux: '' };
                    const ignaBor = data.igna !== '' && data.igna !== undefined && Number(data.igna) > 0;
                    const luxBor = data.lux !== '' && data.lux !== undefined && Number(data.lux) > 0;

                    return (
                      <td key={kun} className="p-1.5 text-center border-r border-slate-100 bg-white">
                        <div className="flex items-center justify-center gap-1">
                          {ignaBor && (
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={data.igna}
                              onChange={(e) => qiymatniOzgartirish(ishchi.id, kun, 'igna', e.target.value)}
                              className="w-9 h-7 text-center font-black text-[11px] text-red-600 bg-red-50/70 rounded-md border border-red-200 outline-none focus:bg-white transition-colors"
                            />
                          )}

                          {luxBor && (
                            <input 
                              type="text"
                              inputMode="numeric"
                              value={data.lux}
                              onChange={(e) => qiymatniOzgartirish(ishchi.id, kun, 'lux', e.target.value)}
                              className="w-9 h-7 text-center font-black text-[11px] text-blue-600 bg-blue-50/70 rounded-md border border-blue-200 outline-none focus:bg-white transition-colors"
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-2 text-center border-r border-slate-200 bg-slate-50/50 text-[11px] font-black">
                    {jamiIgna > 0 && <div className="text-red-600">{jamiIgna}m</div>}
                    {jamiLux > 0 && <div className="text-blue-600">{jamiLux}m</div>}
                  </td>

                  <td className="p-2 text-right font-black text-slate-900 bg-slate-50/30 text-xs">
                    {summa.toLocaleString()}
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