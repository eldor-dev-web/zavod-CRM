'use client';
import React, { useState, useEffect } from 'react';
import BraklarJadvali from '@/components/BraklarJadvali';
import { brakHisobi, faolIshchilar, oyKunlariSoni, operatormi, oySozlamasi, KALIT, STANDART_BRAK_STAVKALARI, STANDART_LAVOZIMLAR, type Ishchi } from '@/lib/hisob';
import { oqish } from '@/lib/mahalliyXotira';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentOy, toshkentSana } from '@/lib/sana';
import { oyYopilganmi } from '@/lib/oyQulfi';
import { SahifaSarlavhasi, OyTanlash, Korsatkich, BoshHolat, Tugma, Ikonka } from '@/components/ui';

export default function BraklarSahifasi() {
  const [tanlanganOy, setTanlanganOy] = useState('');
  
  const [brakStavkalari, setBrakStavkalari] = useState(STANDART_BRAK_STAVKALARI);

  const [ishchilarBazasi, setIshchilarBazasi] = useState<Ishchi[]>([]);
  const [brakMaqomlari, setBrakMaqomlari] = useState<Record<string, any>>({});
  const [operatorIsmlari, setOperatorIsmlari] = useState<Record<string, string>>({});
  
  const [tanlanganOperatorId, setTanlanganOperatorId] = useState<any | null>(null);
  const [yangilanmoqda, setYangilanmoqda] = useState(false);
  const [bugun, setBugun] = useState('');
  // Oy yopilgan (6-sanadan keyin o'tgan oy): braklarni hech kim o'zgartira olmaydi
  const yopiq = !!tanlanganOy && !!bugun && oyYopilganmi(tanlanganOy, bugun);

  const malumotlarniYuklash = (oy: string) => {
    const xodimlar = faolIshchilar(oyIshchilari(oy));
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
    setBugun(toshkentSana());

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
    if (yopiq) return;
    const kalit = `${ishchiId}_${kun}`;
    const current = brakMaqomlari[kalit] || { igna: '', lux: '' };
    const numVal = val === '' ? '' : Number(String(val).replace(/\D/g, ''));
    const updated = { ...brakMaqomlari, [kalit]: { igna: current.igna ?? '', lux: current.lux ?? '', [field]: numVal } };
    setBrakMaqomlari(updated);
    localStorage.setItem(KALIT.brakJadvali(tanlanganOy), JSON.stringify(updated));
  };

  const operatorIsminiOzgartirish = (ishchiId: any, yangiIsm: string) => {
    if (yopiq) return;
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
    <div>
      <SahifaSarlavhasi
        sarlavha="Braklar"
        amallar={
          <>
            <Tugma
              ikonka="yangilash"
              onClick={bazaniSinxronlash}
              disabled={yangilanmoqda}
              aria-label="Yangilash"
              title="Yangilash"
              className={`px-0! w-11 md:w-10 ${yangilanmoqda ? '[&_svg]:animate-spin' : ''}`}
            />
            <OyTanlash oy={tanlanganOy} ozgartirish={oyniOzgartirish} />
          </>
        }
      />


      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2 md:gap-3 mb-4">
        <Korsatkich ixcham nomi="Igna" qiymat={<span className="text-xato">{umumiyIgnaMetr}</span>} birlik="m" />
        <Korsatkich ixcham nomi="Lux" qiymat={<span className="text-diqqat">{umumiyLuxMetr}</span>} birlik="m" />
        <Korsatkich ixcham nomi="Jarima" qiymat={umumiyJarimaSummasi.toLocaleString('ru-RU')} birlik="so'm" />
      </div>

      <div className="bg-sirt border border-chiziq rounded-karta overflow-hidden">
        {brakBorOperatorlar.length === 0 ? (
          <BoshHolat ikonka="tasdiq" sarlavha="Bu oyda brak yo'q" />
        ) : (
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-8 md:w-12" />
              <col />
              <col className="w-[52px] md:w-32" />
              <col className="w-[52px] md:w-32" />
              <col className="w-[88px] md:w-44" />
            </colgroup>
            <thead>
              <tr className="bg-sirt-2 border-b border-chiziq text-xs font-semibold text-matn-2">
                <th className="h-9 text-center font-semibold">№</th>
                <th className="h-9 px-2 md:px-3 text-left font-semibold">Operator</th>
                <th className="h-9 text-center font-semibold">Igna</th>
                <th className="h-9 text-center font-semibold">Lux</th>
                <th className="h-9 pr-3 text-right font-semibold">Summa</th>
              </tr>
            </thead>
            <tbody>
              {brakBorOperatorlar.map((item, idx) => {
                const isTanlangan = tanlanganOperatorId === item.id;

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => setTanlanganOperatorId(isTanlangan ? null : item.id)}
                      className={`h-11 border-b border-chiziq cursor-pointer transition-colors ${isTanlangan ? 'bg-asosiy-och' : 'hover:bg-sirt-2'}`}
                    >
                      <td className="text-center text-xs text-matn-3 tabular-nums">{idx + 1}</td>
                      <td className="px-2 md:px-3">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={`truncate font-semibold ${isTanlangan ? 'text-asosiy' : 'text-matn'}`}>{item.ism}</span>
                          <Ikonka nom="pastga" className={`w-3.5 h-3.5 shrink-0 transition-transform ${isTanlangan ? 'rotate-180 text-asosiy' : 'text-matn-3'}`} />
                        </div>
                      </td>
                      <td className={`text-center tabular-nums whitespace-nowrap ${item.jamiIgna > 0 ? 'font-semibold text-xato' : 'text-matn-3'}`}>
                        {item.jamiIgna > 0 ? `${item.jamiIgna} m` : '—'}
                      </td>
                      <td className={`text-center tabular-nums whitespace-nowrap ${item.jamiLux > 0 ? 'font-semibold text-diqqat' : 'text-matn-3'}`}>
                        {item.jamiLux > 0 ? `${item.jamiLux} m` : '—'}
                      </td>
                      <td className="pr-3 text-right font-semibold text-matn tabular-nums whitespace-nowrap">{item.summa.toLocaleString('ru-RU')}</td>
                    </tr>
                    {isTanlangan && (
                      <tr className="border-b border-chiziq">
                        <td colSpan={5} className="bg-sirt-2/60 py-2 pr-2 pl-8 md:pl-12">
                          <BraklarJadvali kunlarMassivi={kunlarMassivi} ishchilarBazasi={tanlanganOperatorlarMassivi} brakMaqomlari={brakMaqomlari} tanlanganOy={tanlanganOy} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
