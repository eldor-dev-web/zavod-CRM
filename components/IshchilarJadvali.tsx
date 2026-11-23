import React, { useState } from 'react';
import { Tugma, cn } from '@/components/ui';

// Davomat jadvali: № va Ism chapda qotib turadi, kunlar o'ngga suriladi.
// Faqat bitta rang: yashil "+" = keldi. Bo'sh katak = kelmagan.
// Belgilash uchun kun raqami bosiladi — faqat shu ustun ochiladi.
export default function IshchilarJadvali({
  ishchilar,
  davomat,
  tanlanganOy,
  kunlarMassivi,
  xodimniTahrirlash,
  yangiXodimQoshish,
  statusniOzgartirish,
  moshinaSoniniOzgartirish,
  oylikniHisoblash,
  yopiq = false
}: any) {
  const [fokusKun, setFokusKun] = useState<number | null>(null);

  const faolIshchilar = ishchilar.filter((i: any) => i.ism && String(i.ism).trim() !== '');

  // Ochiq ustun: ikki yonida binafsha chiziq
  const ochiqUstun = 'shadow-[inset_2px_0_0_var(--color-asosiy),inset_-2px_0_0_var(--color-asosiy)]';

  return (
    <div className="bg-sirt border border-chiziq rounded-karta overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 md:px-4 py-2.5 border-b border-chiziq">
        <p className="text-xs md:text-sm text-matn-3 min-w-0">
          {yopiq ? 'Oy yopilgan' : fokusKun ? `${fokusKun}-kun ochiq — kataklarni bosing` : 'Belgilash uchun kun raqamini bosing'}
        </p>
        {!yopiq && (
          <Tugma kichik ikonka="qoshish" onClick={yangiXodimQoshish} className="shrink-0">
            Xodim
          </Tugma>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-sirt-2 text-xs font-semibold text-matn-2 border-b border-chiziq">
              <th className="h-9 w-8 md:w-11 text-center border-r border-chiziq sticky left-0 bg-sirt-2 z-20">№</th>
              <th className="h-9 px-2 md:px-3 w-28 md:w-48 border-r border-chiziq-2 sticky left-8 md:left-11 bg-sirt-2 z-20">Ism</th>

              {kunlarMassivi.map((kun: number) => {
                const isActive = fokusKun === kun;
                return (
                  <th
                    key={kun}
                    onClick={() => !yopiq && setFokusKun(fokusKun === kun ? null : kun)}
                    className={cn(
                      'h-9 min-w-10 text-center border-r border-chiziq tabular-nums select-none transition-colors',
                      yopiq ? 'cursor-default' : 'cursor-pointer',
                      isActive ? 'bg-asosiy text-white' : !yopiq && 'hover:bg-chiziq'
                    )}
                    title={yopiq ? undefined : 'Shu kunni ochish uchun bosing'}
                  >
                    {kun}
                  </th>
                );
              })}

              <th className="h-9 px-2 w-20 md:w-24 text-center border-l border-chiziq-2 border-r border-chiziq">Kun</th>
              <th className="h-9 px-3 w-32 md:w-36 text-right">Oylik</th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {faolIshchilar.map((ishchi: any, index: number) => {
              const oylik = oylikniHisoblash(ishchi);
              const { jamiKun, jamiMoshina } = oylik;
              const isOperator = oylik.operator;
              const jamiOylik = oylik.hisoblangan;

              return (
                <tr key={ishchi.id} className="group border-b border-chiziq last:border-b-0 bg-sirt hover:bg-sirt-2/60 transition-colors">
                  <td className="text-center text-xs text-matn-3 tabular-nums border-r border-chiziq bg-sirt group-hover:bg-sirt-2 sticky left-0 z-10 transition-colors">
                    {index + 1}
                  </td>

                  <td
                    onClick={() => xodimniTahrirlash(ishchi)}
                    title={yopiq ? undefined : 'Tahrirlash uchun bosing'}
                    className={cn(
                      'px-2 md:px-3 py-1.5 border-r border-chiziq-2 bg-sirt group-hover:bg-sirt-2 sticky left-8 md:left-11 z-10 transition-colors max-w-28 md:max-w-48',
                      !yopiq && 'cursor-pointer'
                    )}
                  >
                    <div className="font-semibold text-matn truncate group-hover:text-asosiy transition-colors">{ishchi.ism}</div>
                    <div className="text-[11px] md:text-xs text-matn-3 truncate">{ishchi.lavozimi || 'Lavozim tanlanmagan'}</div>
                  </td>

                  {kunlarMassivi.map((kun: number) => {
                    const kalit = `${ishchi.id}_${tanlanganOy}_${kun}`;
                    const data = davomat[kalit] || { status: '', moshina: '' };
                    const isActive = fokusKun === kun;
                    const isPlus = data.status === '+';

                    const statusClass = isPlus
                      ? 'bg-yaxshi-och text-yaxshi font-bold'
                      : isActive
                      ? 'hover:bg-asosiy-och text-asosiy'
                      : 'text-transparent';

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
                      <td key={kun} className={cn('p-0 text-center align-middle w-10 border-r border-chiziq', isActive && ochiqUstun)}>
                        {isOperator ? (
                          <div className="flex flex-col h-[52px]">
                            <div
                              tabIndex={isActive ? 0 : -1}
                              onClick={() => {
                                if (isActive) statusniOzgartirish(ishchi.id, kun);
                              }}
                              onKeyDown={klaviaturaBosilganda}
                              className={cn(
                                'h-[26px] flex items-center justify-center text-sm select-none border-b border-chiziq transition-colors outline-none',
                                isActive ? 'cursor-pointer focus:ring-2 focus:ring-inset focus:ring-asosiy' : 'cursor-default',
                                statusClass
                              )}
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
                              className={cn(
                                'h-[26px] w-full text-center font-semibold text-matn-2 tabular-nums outline-none border-none text-xs transition-colors bg-transparent',
                                isActive ? 'cursor-text focus:bg-asosiy-och' : 'cursor-default pointer-events-none select-none'
                              )}
                            />
                          </div>
                        ) : (
                          <div
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => {
                              if (isActive) statusniOzgartirish(ishchi.id, kun);
                            }}
                            onKeyDown={klaviaturaBosilganda}
                            className={cn(
                              'h-[52px] flex items-center justify-center text-sm select-none transition-colors outline-none',
                              isActive ? 'cursor-pointer focus:ring-2 focus:ring-inset focus:ring-asosiy' : 'cursor-default',
                              statusClass
                            )}
                          >
                            {isPlus ? '+' : ''}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-2 text-center border-l border-chiziq-2 border-r border-chiziq align-middle">
                    <div className="flex flex-col items-center justify-center leading-tight">
                      {jamiKun > 0 ? (
                        <span className="text-sm font-semibold text-matn tabular-nums">{jamiKun} kun</span>
                      ) : (
                        <span className="text-matn-3">—</span>
                      )}
                      {isOperator && jamiMoshina > 0 && (
                        <span className="mt-0.5 text-xs text-matn-2 tabular-nums">+{jamiMoshina} ta</span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 text-right align-middle">
                    {jamiOylik > 0 ? (
                      <span className="text-sm font-bold text-yaxshi tabular-nums">
                        {jamiOylik.toLocaleString('ru-RU')} <span className="text-[11px] font-semibold text-matn-3">UZS</span>
                      </span>
                    ) : (
                      <span className="text-matn-3">—</span>
                    )}
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
