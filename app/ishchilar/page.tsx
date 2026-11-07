'use client';
import React, { useState, useEffect } from 'react';
import IshchilarJadvali from '@/components/IshchilarJadvali';

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
  const [operatorQoshimchaPuli, setOperatorQoshimchaPuli] = useState<number>(20000);
  
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const hozirgiOy = new Date().toISOString().slice(0, 7);
    setTanlanganOy(hozirgiOy);

    const saqlanganQoshimcha = localStorage.getItem('zavod_operator_qoshimcha');
    if (saqlanganQoshimcha !== null) setOperatorQoshimchaPuli(Number(saqlanganQoshimcha));

    const saqlanganLavozimlar = localStorage.getItem('zavod_lavozimlar_bazasi');
    if (saqlanganLavozimlar) {
      try { setLavozimlarBazasi(JSON.parse(saqlanganLavozimlar)); } catch (e) {}
    } else {
      setLavozimlarBazasi([{ id: 1, nomi: 'Operator', stavka: 175000 }, { id: 2, nomi: 'Master 1', stavka: 220000 }]);
    }

    const saqlanganDavomat = localStorage.getItem('zavod_xodim_davomati');
    if (saqlanganDavomat) {
      try { setDavomat(JSON.parse(saqlanganDavomat)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!tanlanganOy) return;
    
    const joriyKalit = `zavod_ishchilar_${tanlanganOy}`;
    const saqlanganIshchilar = localStorage.getItem(joriyKalit);

    setIsModified(false); 

    if (saqlanganIshchilar) {
      try {
        let parsed = JSON.parse(saqlanganIshchilar);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          parsed = [{ id: Date.now(), ism: '', lavozimi: '' }]; 
        }
        setIshchilar(parsed);
      } catch (e) {}
      return; 
    }

    const hammaOylar: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('zavod_ishchilar_20')) hammaOylar.push(key);
    }
    hammaOylar.sort().reverse(); 
    let topilganEskiIshchilar: any[] | null = null;

    for (const key of hammaOylar) {
      if (key === joriyKalit) continue; 
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(data) && data.some((w: any) => w.ism && w.ism.trim() !== '')) {
          topilganEskiIshchilar = data;
          break; 
        }
      } catch (e) {}
    }

    if (topilganEskiIshchilar) {
      const tozaXodimlar = topilganEskiIshchilar.filter((ishchi: any) => ishchi.ism && ishchi.ism.trim() !== '');
      const nusxa = tozaXodimlar.map((ishchi: any) => ({
        id: Date.now() + Math.random(), 
        ism: ishchi.ism.trim(),
        lavozimi: ishchi.lavozimi || ''
      }));
      nusxa.push({ id: Date.now() + Math.random(), ism: '', lavozimi: '' }); 
      setIshchilar(nusxa);
    } else {
      setIshchilar([{ id: Date.now(), ism: '', lavozimi: '' }]); 
    }
  }, [tanlanganOy, lavozimlarBazasi]);

  useEffect(() => {
    if (!tanlanganOy || !isModified) return; 
    localStorage.setItem(`zavod_ishchilar_${tanlanganOy}`, JSON.stringify(ishchilar));
  }, [ishchilar, tanlanganOy, isModified]);

  const handleInputChange = (index: number, field: string, value: any) => {
    const yangiRuyxat = [...ishchilar];
    yangiRuyxat[index][field] = value;
    setIsModified(true); 

    if (index === yangiRuyxat.length - 1 && field === 'ism' && value.trim() !== '') {
      yangiRuyxat.push({ id: Date.now(), ism: '', lavozimi: '' }); 
    }
    setIshchilar(yangiRuyxat);
  };

  const qatorniOchirish = (index: number, ism: string) => {
    const ismMatni = ism?.trim() ? `"${ism}"` : "bu bo'sh qatorni";
    if (!window.confirm(`Rostdan ham ${ismMatni} ushbu oydan o'chirmoqchimisiz?`)) return;
    
    const yangi = ishchilar.filter((_, i) => i !== index);
    if (yangi.length === 0) yangi.push({ id: Date.now(), ism: '', lavozimi: '' });
    setIsModified(true); 
    setIshchilar(yangi);
  };

  // 🚀 YANGILANGAN: Minus yo'q, faqat (+) va bo'sh katak qoldi!
  const statusniOzgartirish = (ishchiId: number, kun: number, maxsusStatus?: string) => {
    setIsModified(true); 
    const kalit = `${ishchiId}_${tanlanganOy}_${kun}`;
    const current = davomat[kalit] || { status: '', moshina: '' };
    
    let yangiStatus = '';
    if (maxsusStatus !== undefined) {
       yangiStatus = maxsusStatus; // Klaviaturadan kelsa
    } else {
       // Sichqoncha bilan bosganda + ni qo'yadi yoki o'chiradi xolos
       yangiStatus = current.status === '+' ? '' : '+'; 
    }

    const updated = { ...davomat, [kalit]: { ...current, status: yangiStatus } };
    setDavomat(updated);
    localStorage.setItem('zavod_xodim_davomati', JSON.stringify(updated));
  };

  const moshinaSoniniOzgartirish = (ishchiId: number, kun: number, val: string) => {
    setIsModified(true); 
    const kalit = `${ishchiId}_${tanlanganOy}_${kun}`;
    const current = davomat[kalit] || { status: '', moshina: '' };
    const updated = { ...davomat, [kalit]: { ...current, moshina: val.trim() === '' ? '' : Number(val.replace(/\D/g, '')) } };
    setDavomat(updated);
    localStorage.setItem('zavod_xodim_davomati', JSON.stringify(updated));
  };

  const stavkaniTopish = (lavozimNomi: string) => {
    if (!lavozimNomi) return 0; 
    const topildi = lavozimlarBazasi.find(l => l.nomi === lavozimNomi || String(l.nomi).toLowerCase() === String(lavozimNomi).toLowerCase());
    return topildi ? Number(topildi.stavka) || 0 : 0;
  };

  const getOyKunlariSoni = () => {
    if (!tanlanganOy) return 30;
    const [yil, oy] = tanlanganOy.split('-').map(Number);
    return new Date(yil, oy, 0).getDate();
  };

  const kunlarMassivi = Array.from({ length: getOyKunlariSoni() }, (_, i) => i + 1);

  const statistikaniHisoblash = (ishchiId: number) => {
    let jamiKun = 0, jamiMoshina = 0;
    kunlarMassivi.forEach(kun => {
      const data = davomat[`${ishchiId}_${tanlanganOy}_${kun}`];
      if (data) {
        if (data.status === '+') jamiKun += 1;
        if (data.moshina !== '' && !isNaN(Number(data.moshina))) jamiMoshina += Number(data.moshina);
      }
    });
    return { jamiKun, jamiMoshina };
  };

  let umumiyJamiOylik = 0;
  

    const haqiqiyIshchilar = ishchilar.filter(ishchi => ishchi.ism && String(ishchi.ism).trim() !== '');

    haqiqiyIshchilar.forEach(ishchi => {
    const { jamiKun, jamiMoshina } = statistikaniHisoblash(ishchi.id);
    const stavka = stavkaniTopish(ishchi.lavozimi);
    const lavozim = ishchi.lavozimi || '';
    const isOperator = String(lavozim).toLowerCase().includes('operator');
    
    umumiyJamiOylik += (jamiKun * stavka) + (isOperator ? jamiMoshina * operatorQoshimchaPuli : 0);
  });

  const faolIshchilarSoni = haqiqiyIshchilar.filter(ishchi => ishchi.ism && String(ishchi.ism).trim() !== '').length;

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto font-sans bg-[#F8FAFC] min-h-screen text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <span className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 text-indigo-600"><Icons.Users /></span>
            Ishchilar va Oylik
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Yangi oy tanlanganda oldingi oy xodimlari avtomatik nusxalanadi.</p>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-200 flex items-center gap-3">
          <span className="text-slate-400"><Icons.Calendar /></span>
          <input 
            type="month" value={tanlanganOy} onChange={(e) => setTanlanganOy(e.target.value)}
            className="border-none bg-transparent font-semibold text-slate-700 text-sm outline-none cursor-pointer" 
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden mb-8">
        <IshchilarJadvali 
          ishchilar={ishchilar} davomat={davomat} tanlanganOy={tanlanganOy} kunlarMassivi={kunlarMassivi}
          lavozimlarBazasi={lavozimlarBazasi} operatorQoshimchaPuli={operatorQoshimchaPuli}
          handleInputChange={handleInputChange} qatorniOchirish={qatorniOchirish}
          statusniOzgartirish={statusniOzgartirish} moshinaSoniniOzgartirish={moshinaSoniniOzgartirish}
          statistikaniHisoblash={statistikaniHisoblash} stavkaniTopish={stavkaniTopish}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center gap-5">
          <div className="bg-slate-50 text-slate-500 p-4 rounded-2xl border border-slate-100"><Icons.Users /></div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jami Ishchilar Soni</p>
            <h2 className="text-2xl font-black text-slate-800">{faolIshchilarSoni} <span className="text-sm font-semibold text-slate-400">nafar</span></h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 shadow-lg shadow-indigo-600/20 text-white flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 scale-150"><Icons.Wallet /></div>
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 relative z-10"><Icons.Wallet /></div>
          <div className="relative z-10">
            <p className="text-[11px] font-semibold text-indigo-100 uppercase tracking-widest mb-1">Umumiy Oylik Jamg'armasi</p>
            <h2 className="text-2xl font-black tracking-tight">{umumiyJamiOylik.toLocaleString()} <span className="text-sm font-medium text-indigo-200">UZS</span></h2>
          </div>
        </div>
      </div>
    </div>
  );
}