import React, { useState } from 'react';

export default function IshchilarJadvali({
  ishchilar,
  davomat,
  tanlanganOy,
  kunlarMassivi,
  operatorQoshimchaPuli,
  xodimniTahrirlash,
  yangiXodimQoshish,
  statusniOzgartirish,
  moshinaSoniniOzgartirish,
  statistikaniHisoblash,
  stavkaniTopish
}: any) {
  const [fokusKun, setFokusKun] = useState<number | null>(null);

  const faolIshchilar = ishchilar.filter((i: any) => i.ism && String(i.ism).trim() !== '');

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-100 text-[11px] uppercase font-bold text-slate-600 tracking-wider border-b-2 border-slate-400">
              <th className="p-2.5 sm:p-3 text-center w-10 sm:w-12 border-r border-slate-300 sticky left-0 bg-slate-100 z-20">№</th>

              <th className="p-2.5 sm:p-3 w-32 sm:w-48 border-r border-slate-300 sticky left-10 sm:left-12 bg-slate-100 z-20">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Xodim</span>
                </div>
              </th>

              <th className="p-3 w-32 sm:w-36 border-r-2 border-slate-400">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Lavozim</span>
                </div>
              </th>

              {kunlarMassivi.map((kun: number) => {
                const isActive = fokusKun === kun;
                return (
                  <th
                    key={kun}
                    onClick={() => setFokusKun(fokusKun === kun ? null : kun)}
                    className={`p-1.5 text-center border-r border-slate-300 text-[11px] font-black cursor-pointer select-none transition-colors ${
                      isActive ? 'bg-indigo-500 text-white border-indigo-600' : 'text-slate-700 hover:bg-slate-300'
                    }`}
                    title="Shu kunni ochish uchun 1 marta bosing"
                  >
                    {kun}
                  </th>
                );
              })}

              <th className="p-3 text-center border-l-2 border-r border-slate-400 w-24 sm:w-28 bg-slate-200">
                <div className="inline-flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Kun</span>
                </div>
              </th>

              <th className="p-3 text-right w-36 bg-emerald-100 text-emerald-800">
                <div className="inline-flex items-center justify-end gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Oylik</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {faolIshchilar.map((ishchi: any, index: number) => {
              const { jamiKun, jamiMoshina } = statistikaniHisoblash(ishchi.id);
              const stavka = stavkaniTopish(ishchi.lavozimi);

              const isOperator = String(ishchi.lavozimi).toLowerCase().includes('operator');
              const asosiyOylik = jamiKun * stavka;
              const qoshimchaMoshinaOyligi = isOperator ? jamiMoshina * operatorQoshimchaPuli : 0;
              const jamiOylik = asosiyOylik + qoshimchaMoshinaOyligi;

              return (
                <tr key={ishchi.id} className="hover:bg-slate-100 transition-colors bg-white group border-b border-slate-300">
                  <td className="p-2.5 sm:p-3 text-center font-bold text-slate-500 border-r border-slate-300 bg-white group-hover:bg-slate-100 sticky left-0 z-10 transition-colors">
                    {index + 1}
                  </td>

                  <td
                    onClick={() => xodimniTahrirlash(ishchi)}
                    title="Tahrirlash uchun bosing"
                    className="px-3 py-2 border-r border-slate-300 bg-white group-hover:bg-slate-100 sticky left-10 sm:left-12 z-10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-slate-800 group-hover:text-indigo-600 truncate transition-colors">
                        {ishchi.ism}
                      </span>
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        ✎
                      </span>
                    </div>
                  </td>

                  <td
                    onClick={() => xodimniTahrirlash(ishchi)}
                    title="Tahrirlash uchun bosing"
                    className="px-3 py-2 border-r-2 border-slate-400 cursor-pointer font-semibold text-xs text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    {ishchi.lavozimi || 'Tanlanmagan'}
                  </td>

                  {kunlarMassivi.map((kun: number) => {
                    const kalit = `${ishchi.id}_${tanlanganOy}_${kun}`;
                    const data = davomat[kalit] || { status: '', moshina: '' };
                    const isActive = fokusKun === kun;
                    const isPlus = data.status === '+';

                    const statusClass = isPlus
                      ? 'bg-emerald-100 text-emerald-700 font-bold'
                      : isActive
                      ? 'bg-indigo-100/50 hover:bg-indigo-100 text-indigo-500'
                      : 'bg-transparent text-transparent';

                    const klaviaturaBosilganda = (e: React.KeyboardEvent) => {
                      if (!isActive) return;
                      if (e.key === '+' || e.key === '=') {
                        e.preventDefault();
                        statusniOzgartirish(ishchi.id, kun, '+');
                      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '-') {
                        e.preventDefault();
                        statusniOzgartirish(ishchi.id, kun, '');
                      }
                    };

                    return (
                      <td
                        key={kun}
                        className={`p-0 text-center align-middle w-10 border-r ${
                          isActive ? 'border-indigo-400 border-x-2 bg-indigo-50/40' : 'border-slate-300'
                        }`}
                      >
                        {isOperator ? (
                          <div className="flex flex-col h-[52px]">
                            <div
                              tabIndex={isActive ? 0 : -1}
                              onClick={() => {
                                if (isActive) statusniOzgartirish(ishchi.id, kun);
                              }}
                              onKeyDown={klaviaturaBosilganda}
                              className={`h-[26px] flex items-center justify-center text-xs select-none border-b border-slate-300 transition-colors outline-none rounded-t-sm ${
                                isActive ? 'cursor-pointer focus:ring-2 focus:ring-inset focus:ring-indigo-500' : 'cursor-default'
                              } ${statusClass}`}
                            >
                              {isPlus ? '+' : ''}
                            </div>

                            <input
                              type="text"
                              inputMode="numeric"
                              readOnly={!isActive}
                              tabIndex={isActive ? 0 : -1}
                              value={data.moshina ? data.moshina : ''}
                              onChange={(e) => {
                                if (isActive) moshinaSoniniOzgartirish(ishchi.id, kun, e.target.value);
                              }}
                              className={`h-[26px] w-full text-center font-bold text-indigo-700 outline-none border-none text-[10px] transition-colors rounded-b-sm bg-transparent ${
                                isActive
                                  ? 'cursor-text focus:bg-indigo-100'
                                  : 'cursor-default pointer-events-none select-none'
                              }`}
                            />
                          </div>
                        ) : (
                          <div
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => {
                              if (isActive) statusniOzgartirish(ishchi.id, kun);
                            }}
                            onKeyDown={klaviaturaBosilganda}
                            className={`h-[52px] flex items-center justify-center text-sm select-none transition-colors outline-none rounded-sm ${
                              isActive ? 'cursor-pointer focus:ring-2 focus:ring-inset focus:ring-indigo-500' : 'cursor-default'
                            } ${statusClass}`}
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

                  <td className="p-3 text-right font-black text-emerald-800 bg-emerald-50 text-sm align-middle">
                    <div className="flex flex-col items-end">
                      {jamiOylik > 0 ? (
                        <span>{jamiOylik.toLocaleString()} <span className="text-[10px] text-emerald-600 font-bold">UZS</span></span>
                      ) : (
                        <span className="text-slate-400 font-bold">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <button
          type="button"
          onClick={yangiXodimQoshish}
          className="px-4 py-2.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span className="text-base leading-none">+</span> Yangi xodim qoʻshish
        </button>
      </div>
    </div>
  );
}