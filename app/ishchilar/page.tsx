'use client';
import React, { useState, useEffect } from 'react';
import IshchilarJadvali from '@/components/IshchilarJadvali';
import XodimModal from '@/components/XodimModal';
import { ishchiOyligi, oyKunlariSoni, faolIshchilar, KALIT, oySozlamasi, STANDART_BRAK_STAVKALARI, STANDART_LAVOZIMLAR, STANDART_OPERATOR_QOSHIMCHA, type Ishchi, type SozlamaTarixi } from '@/lib/hisob';
import { oqish } from '@/lib/mahalliyXotira';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentOy } from '@/lib/sana';

const Icons = {
  Users: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Calendar: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  Wallet: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
};

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

  useEffect(() => {
    setTanlanganOy(toshkentOy());

    setSozlamaTarixi(oqish(KALIT.sozlamaTarixi, {}));
    const saqlanganQoshimcha = localStorage.getItem('zavod_operator_qoshimcha');
    if (saqlanganQoshimcha !== null) setOperatorQoshimchaPuli(Number(saqlanganQoshimcha));

    const saqlanganLavozimlar = localStorage.getItem('zavod_lavozimlar_bazasi');
    if (saqlanganLavozimlar) {
      try { setLavozimlarBazasi(JSON.parse(saqlanganLavozimlar)); } catch (e) {}
    } else {
      setLavozimlarBazasi(STANDART_LAVOZIMLAR);
    }

    const saqlanganDavomat = localStorage.getItem('zavod_xodim_davomati');
    if (saqlanganDavomat) {
      try { setDavomat(JSON.parse(saqlanganDavomat)); } catch (e) {}
    }
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

  const xodimniOchirish = (id: Ishchi['id'], ism: string) => {
    if (!window.confirm(`Rostdan ham "${ism}"ni ushbu oydan oʻchirmoqchimisiz?`)) return;
    setIsModified(true);
    setIshchilar((prev) => prev.filter((item) => item.id !== id));
  };

  const statusniOzgartirish = (ishchiId: Ishchi['id'], kun: number, maxsusStatus?: string) => {
    setIsModified(true);
    const kalit = `${ishchiId}_${tanlanganOy}_${kun}`;
    const current = davomat[kalit] || { status: '', moshina: '' };

    const yangiStatus = maxsusStatus !== undefined ? maxsusStatus : current.status === '+' ? '' : '+';

    const updated = { ...davomat, [kalit]: { ...current, status: yangiStatus } };
    setDavomat(updated);
    localStorage.setItem('zavod_xodim_davomati', JSON.stringify(updated));
  };

  const moshinaSoniniOzgartirish = (ishchiId: Ishchi['id'], kun: number, val: string) => {
    setIsModified(true);
    const kalit = `${ishchiId}_${tanlanganOy}_${kun}`;
    const current = davomat[kalit] || { status: '', moshina: '' };
    const updated = {
      ...davomat,
      [kalit]: { ...current, moshina: val.trim() === '' ? '' : Number(val.replace(/\D/g, '')) }
    };
    setDavomat(updated);
    localStorage.setItem('zavod_xodim_davomati', JSON.stringify(updated));
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

  const haqiqiyIshchilar = faolIshchilar(ishchilar);
  const umumiyJamiOylik = haqiqiyIshchilar.reduce((jami, ishchi) => jami + oylikniHisoblash(ishchi).hisoblangan, 0);

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto font-sans bg-[#F8FAFC] min-h-screen text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <span className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 text-indigo-600"><Icons.Users /></span>
            Ishchilar va Oylik
          </h1>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-200 flex items-center gap-3">
          <span className="text-slate-400"><Icons.Calendar /></span>
          <input
            type="month"
            value={tanlanganOy}
            onChange={(e) => setTanlanganOy(e.target.value)}
            className="border-none bg-transparent font-semibold text-slate-700 text-sm outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="mb-8">
        <IshchilarJadvali
          ishchilar={ishchilar}
          davomat={davomat}
          tanlanganOy={tanlanganOy}
          kunlarMassivi={kunlarMassivi}
          xodimniTahrirlash={(xodim: any) => {
            setTanlanganXodim(xodim);
            setModalOchiq(true);
          }}
          yangiXodimQoshish={() => {
            setTanlanganXodim(null);
            setModalOchiq(true);
          }}
          statusniOzgartirish={statusniOzgartirish}
          moshinaSoniniOzgartirish={moshinaSoniniOzgartirish}
          oylikniHisoblash={oylikniHisoblash}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center gap-5">
          <div className="bg-slate-50 text-slate-500 p-4 rounded-2xl border border-slate-100"><Icons.Users /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jami Ishchilar Soni</p>
            <h2 className="text-2xl font-black text-slate-800">{haqiqiyIshchilar.length} <span className="text-sm font-semibold text-slate-400">nafar</span></h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 shadow-lg shadow-indigo-600/20 text-white flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 scale-150"><Icons.Wallet /></div>
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 relative z-10"><Icons.Wallet /></div>
          <div className="relative z-10">
            <p className="text-[11px] font-semibold text-indigo-100 uppercase tracking-widest mb-1">Umumiy Oylik Jamgʻarmasi</p>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight">{umumiyJamiOylik.toLocaleString('ru-RU')} <span className="text-sm font-medium text-indigo-200">UZS</span></h2>
          </div>
        </div>
      </div>

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