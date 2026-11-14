import React from 'react';

export default function BraklarJadvali({
  kunlarMassivi,
  ishchilarBazasi,
  brakMaqomlari,
  operatorIsmlari,
  qiymatniOzgartirish,
  setKunlikJadvalOchiq
}: any) {
  const ishchi = ishchilarBazasi[0];
  if (!ishchi) return null;

  const joriyIsm = operatorIsmlari[ishchi.id] !== undefined ? operatorIsmlari[ishchi.id] : ishchi.ism;

  // Faqat shu operator brak qilgan sanalarni olamiz
  const brakBorKunlar = kunlarMassivi.filter((kun: number) => {
    const data = brakMaqomlari[`${ishchi.id}_${kun}`];
    const igna = data?.igna !== '' && data?.igna !== undefined ? Number(data.igna) : 0;
    const lux = data?.lux !== '' && data?.lux !== undefined ? Number(data.lux) : 0;
    return igna > 0 || lux > 0;
  });

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-blue-200 overflow-hidden mb-4 animate-fadeIn">
      {/* Tepa panel: Operator ismi + Igna/Lux indikatorlari */}
      <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-800 font-black text-xs sm:text-sm">
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{joriyIsm}</span>
          </div>

          <div className="h-3.5 w-[1px] bg-slate-300"></div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Igna
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Lux
            </div>
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

      {/* Sanalar va katakchalar jadvali (ustma-ust tushib qolmaydi!) */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-600">
              {brakBorKunlar.map((kun: number) => (
                <th key={kun} className="p-2 text-center border-r border-slate-200 last:border-r-0 min-w-[3.5rem]">
                  {kun}-sana
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {brakBorKunlar.map((kun: number) => {
                const data = brakMaqomlari[`${ishchi.id}_${kun}`] || { igna: '', lux: '' };
                const ignaBor = data.igna !== '' && data.igna !== undefined && Number(data.igna) > 0;
                const luxBor = data.lux !== '' && data.lux !== undefined && Number(data.lux) > 0;

                return (
                  <td key={kun} className="p-2 text-center border-r border-slate-100 last:border-r-0 bg-white">
                    <div className="flex items-center justify-center gap-1.5">
                      {ignaBor && (
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={data.igna}
                          onChange={(e) => qiymatniOzgartirish(ishchi.id, kun, 'igna', e.target.value)}
                          className="w-10 h-8 text-center font-black text-xs text-red-600 bg-red-50/70 rounded-lg border border-red-200 outline-none focus:bg-white transition-colors"
                        />
                      )}

                      {luxBor && (
                        <input 
                          type="text"
                          inputMode="numeric"
                          value={data.lux}
                          onChange={(e) => qiymatniOzgartirish(ishchi.id, kun, 'lux', e.target.value)}
                          className="w-10 h-8 text-center font-black text-xs text-blue-600 bg-blue-50/70 rounded-lg border border-blue-200 outline-none focus:bg-white transition-colors"
                        />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}