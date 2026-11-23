import React from 'react';

const OY_NOMLARI = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

// Operator qatori ostida ochiladigan kunlik braklar: tik jadval (Sana · Igna · Lux), faqat brak bo'lgan kunlar.
// Faqat ko'rish uchun — hisob-kitob o'zgarmaydi.
export default function BraklarJadvali({ kunlarMassivi, ishchilarBazasi, brakMaqomlari, tanlanganOy }: any) {
  const ishchi = ishchilarBazasi[0];
  if (!ishchi) return null;

  const oyNomi = tanlanganOy ? OY_NOMLARI[Number(String(tanlanganOy).slice(5, 7)) - 1] : '';
  const son = (v: any) => (v !== '' && v !== undefined && v !== null ? Number(v) : 0);

  // Faqat shu operator brak qilgan sanalar
  const brakBorKunlar = kunlarMassivi.filter((kun: number) => {
    const data = brakMaqomlari[`${ishchi.id}_${kun}`];
    return son(data?.igna) > 0 || son(data?.lux) > 0;
  });

  if (brakBorKunlar.length === 0) return null;

  return (
    <table className="w-full table-fixed border-collapse text-sm bg-sirt border border-chiziq rounded-boshqaruv overflow-hidden">
      <colgroup>
        <col />
        <col className="w-20 md:w-32" />
        <col className="w-20 md:w-32" />
      </colgroup>
      <thead>
        <tr className="bg-sirt-2 text-xs font-semibold text-matn-2">
          <th className="h-8 pl-3 text-left font-semibold">Sana</th>
          <th className="h-8 text-center font-semibold">Igna</th>
          <th className="h-8 text-center font-semibold">Lux</th>
        </tr>
      </thead>
      <tbody>
        {brakBorKunlar.map((kun: number) => {
          const data = brakMaqomlari[`${ishchi.id}_${kun}`] || {};
          const igna = son(data.igna);
          const lux = son(data.lux);
          return (
            <tr key={kun} className="h-9 border-t border-chiziq">
              <td className="pl-3 text-matn tabular-nums">
                {kun}-{oyNomi}
              </td>
              <td className={`text-center tabular-nums ${igna > 0 ? 'font-semibold text-xato' : 'text-matn-3'}`}>{igna > 0 ? `${igna} m` : '—'}</td>
              <td className={`text-center tabular-nums ${lux > 0 ? 'font-semibold text-diqqat' : 'text-matn-3'}`}>{lux > 0 ? `${lux} m` : '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
