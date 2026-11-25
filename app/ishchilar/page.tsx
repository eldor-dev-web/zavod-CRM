'use client';
import React, { useState, useEffect } from 'react';
import IshchilarJadvali from '@/components/IshchilarJadvali';
import XodimModal from '@/components/XodimModal';
import { ishchiOyligi, oyKunlariSoni, faolIshchilar, KALIT, oySozlamasi, STANDART_BRAK_STAVKALARI, STANDART_LAVOZIMLAR, STANDART_OPERATOR_QOSHIMCHA, type Ishchi, type SozlamaTarixi } from '@/lib/hisob';
import { oqish } from '@/lib/mahalliyXotira';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentOy, toshkentSana } from '@/lib/sana';
import { oyYopilganmi } from '@/lib/oyQulfi';
import { DAVOMAT_KALITI, davomatKatakYozish, davomatKutayotganlar } from '@/lib/sinxron';
import { SahifaSarlavhasi, OyTanlash, Korsatkich, tasdiqla } from '@/components/ui';
import ZiddiyatOgohlantirish from '@/components/ZiddiyatOgohlantirish';
import { useXotiraYangilanishi } from '@/hooks/useXotiraYangilanishi';

export default function IshchilarSahifasi() {
  const [tanlanganOy, setTanlanganOy] = useState('');
  const [ishchilar, setIshchilar] = useState<any[]>([]);
  const [lavozimlarBazasi, setLavozimlarBazasi] = useState<any[]>([]);
  const [davomat, setDavomat] = useState<Record<string, any>>({});
  const [operatorQoshimchaPuli, setOperatorQoshimchaPuli] = useState<number>(STANDART_OPERATOR_QOSHIMCHA);
  const [sozlamaTarixi, setSozlamaTarixi] = useState<SozlamaTarixi>({});

  const [modalOchiq, setModalOchiq] = useState(false);
  const [tanlanganXodim, setTanlanganXodim] = useState<any | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [bugun, setBugun] = useState('');
  // Oy yopilgan (6-sanadan keyin o'tgan oy): davomat va ishchilar ro'yxatini hech kim o'zgartira olmaydi
  const yopiq = !!tanlanganOy && !!bugun && oyYopilganmi(tanlanganOy, bugun);

  useEffect(() => {
    setTanlanganOy(toshkentOy());
    setBugun(toshkentSana());

    setSozlamaTarixi(oqish(KALIT.sozlamaTarixi, {}));
    const saqlanganQoshimcha = localStorage.getItem('zavod_operator_qoshimcha');
    if (saqlanganQoshimcha !== null) setOperatorQoshimchaPuli(Number(saqlanganQoshimcha));

    const saqlanganLavozimlar = localStorage.getItem('zavod_lavozimlar_bazasi');
    if (saqlanganLavozimlar) {
      try { setLavozimlarBazasi(JSON.parse(saqlanganLavozimlar)); } catch {}
    } else {
      setLavozimlarBazasi(STANDART_LAVOZIMLAR);
    }

    const saqlanganDavomat = localStorage.getItem('zavod_xodim_davomati');
    if (saqlanganDavomat) {
      try { setDavomat(JSON.parse(saqlanganDavomat)); } catch {}
    }
  }, []);

  // Boshqa qurilmada qo'yilgan davomat belgilarini har 15 soniyada olib kelamiz
  // (bu qurilmadagi hali yuborilmagan kataklar ustidan yozilmaydi)
  useEffect(() => {
    const yangilash = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`/api/davomat?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const bazadagi = (await res.json())?.davomat;
        if (!bazadagi || typeof bazadagi !== 'object') return;
        const birlashgan = { ...bazadagi, ...davomatKutayotganlar() };
        const matn = JSON.stringify(birlashgan);
        if (localStorage.getItem(DAVOMAT_KALITI) !== matn) {
          Storage.prototype.setItem.call(window.localStorage, DAVOMAT_KALITI, matn);
          setDavomat(birlashgan);
        }
      } catch {}
    };
    const t = setInterval(yangilash, 15 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!tanlanganOy) return;
    setIsModified(false);
    // Bu oy ro'yxati bo'lmasa, oldingi oydagi xodimlar (o'sha ID bilan) ko'chiriladi
    setIshchilar(oyIshchilari(tanlanganOy));
  }, [tanlanganOy]);

  useEffect(() => {
    if (!tanlanganOy || !isModified) return;
    localStorage.setItem(KALIT.ishchilar(tanlanganOy), JSON.stringify(ishchilar));
  }, [ishchilar, tanlanganOy, isModified]);

  const xodimniSaqlash = (xodimData: { id?: Ishchi['id']; ism: string; lavozimi: string; telefon: string }) => {
    if (yopiq) return;
    setIsModified(true);
    if (xodimData.id) {
      setIshchilar((prev) =>
        prev.map((item) => (item.id === xodimData.id ? { ...item, ...xodimData } : item))
      );
    } else {
      const yangi = {
        id: Date.now(),
        ism: xodimData.ism,
        lavozimi: xodimData.lavozimi,
        telefon: xodimData.telefon
      };
      setIshchilar((prev) => [...prev.filter((i) => i.ism && i.ism.trim() !== ''), yangi]);
    }
  };

  const xodimniOchirish = async (id: Ishchi['id'], ism: string) => {
    if (yopiq) return;
    const ha = await tasdiqla({
      sarlavha: `${ism}ni o'chirasizmi?`,
      matn: "Xodim faqat shu oy ro'yxatidan o'chiriladi.",
      tasdiqMatni: "O'chirish",
      xavfli: true
    });
    if (!ha) return;
    setIsModified(true);
    setIshchilar((prev) => prev.filter((item) => item.id !== id));
  };

  // Davomat: faqat o'zgargan katak bazaga yuboriladi (ikki kishi bir vaqtda belgilasa ham ikkalasi saqlanadi)
  const statusniOzgartirish = (ishchiId: Ishchi['id'], kun: number, maxsusStatus?: string) => {
    if (yopiq) return;
    const kalit = `${ishchiId}_${tanlanganOy}_${kun}`;
    const current = davomat[kalit] || { status: '', moshina: '' };

    const yangiStatus = maxsusStatus !== undefined ? maxsusStatus : current.status === '+' ? '' : '+';

    const katak = { ...current, status: yangiStatus };
    setDavomat((d) => ({ ...d, [kalit]: katak }));
    davomatKatakYozish(kalit, katak);
  };

  const moshinaSoniniOzgartirish = (ishchiId: Ishchi['id'], kun: number, val: string) => {
    if (yopiq) return;
    const kalit = `${ishchiId}_${tanlanganOy}_${kun}`;
    const current = davomat[kalit] || { status: '', moshina: '' };
    const katak = { ...current, moshina: val.trim() === '' ? '' : Number(val.replace(/\D/g, '')) };
    setDavomat((d) => ({ ...d, [kalit]: katak }));
    davomatKatakYozish(kalit, katak);
  };

  const kunlarMassivi = Array.from({ length: tanlanganOy ? oyKunlariSoni(tanlanganOy) : 30 }, (_, i) => i + 1);

  // Bu sahifada hisoblangan oylik ko'rsatiladi (brak va avans ushlanmasi faqat Telegram botda chiqadi)
  // Tanlangan oyda amal qilgan stavkalar (o'tgan oylar eski sozlama bilan hisoblanadi)
  const oySozlama = oySozlamasi(
    tanlanganOy,
    { lavozimlar: lavozimlarBazasi, operatorQoshimcha: operatorQoshimchaPuli, brakStavkalari: STANDART_BRAK_STAVKALARI },
    sozlamaTarixi
  );
  const oylikniHisoblash = (ishchi: Ishchi) =>
    ishchiOyligi(ishchi, tanlanganOy, {
      davomat,
      lavozimlar: oySozlama.lavozimlar,
      operatorQoshimcha: oySozlama.operatorQoshimcha,
      brakJadvali: {},
      brakStavkalari: { ignaSinigi: 0, luxXatosi: 0 },
      eslatmalar: ''
    });

  // Boshqa qurilmadan yangi ma'lumot kelsa — ekranni yangilaymiz (sahifa qayta yuklanmaydi)
  useXotiraYangilanishi(
    (k) =>
      k === KALIT.ishchilar(tanlanganOy) ||
      k === DAVOMAT_KALITI ||
      k === KALIT.lavozimlar ||
      k === KALIT.operatorQoshimcha ||
      k === KALIT.sozlamaTarixi,
    () => {
      if (!tanlanganOy) return;
      setIsModified(false);
      setIshchilar(oyIshchilari(tanlanganOy));
      setDavomat(oqish(DAVOMAT_KALITI, {}));
      const lavozimlar = oqish<unknown>(KALIT.lavozimlar, null);
      if (Array.isArray(lavozimlar)) setLavozimlarBazasi(lavozimlar);
      const qoshimcha = localStorage.getItem(KALIT.operatorQoshimcha);
      if (qoshimcha !== null) setOperatorQoshimchaPuli(Number(qoshimcha));
      setSozlamaTarixi(oqish(KALIT.sozlamaTarixi, {}));
    }
  );

  const haqiqiyIshchilar = faolIshchilar(ishchilar);
  const umumiyJamiOylik = haqiqiyIshchilar.reduce((jami, ishchi) => jami + oylikniHisoblash(ishchi).hisoblangan, 0);

  return (
    <div>
      <SahifaSarlavhasi sarlavha="Ishchilar" amallar={<OyTanlash oy={tanlanganOy} ozgartirish={setTanlanganOy} />} />


      <ZiddiyatOgohlantirish tur="xodim" kalit={KALIT.ishchilar(tanlanganOy)} />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Korsatkich ixcham nomi="Ishchilar" qiymat={haqiqiyIshchilar.length} birlik="nafar" />
        <Korsatkich ixcham nomi="Oylik jamg'armasi" qiymat={umumiyJamiOylik.toLocaleString('ru-RU')} birlik="UZS" />
      </div>

      <IshchilarJadvali
        yopiq={yopiq}
        ishchilar={ishchilar}
        davomat={davomat}
        tanlanganOy={tanlanganOy}
        kunlarMassivi={kunlarMassivi}
        xodimniTahrirlash={(xodim: any) => {
          if (yopiq) return;
          setTanlanganXodim(xodim);
          setModalOchiq(true);
        }}
        yangiXodimQoshish={() => {
          if (yopiq) return;
          setTanlanganXodim(null);
          setModalOchiq(true);
        }}
        statusniOzgartirish={statusniOzgartirish}
        moshinaSoniniOzgartirish={moshinaSoniniOzgartirish}
        oylikniHisoblash={oylikniHisoblash}
      />

      <XodimModal
        ochiq={modalOchiq}
        yopish={() => setModalOchiq(false)}
        tanlanganXodim={tanlanganXodim}
        lavozimlarBazasi={lavozimlarBazasi}
        saqlash={xodimniSaqlash}
        ochirish={xodimniOchirish}
      />
    </div>
  );
}