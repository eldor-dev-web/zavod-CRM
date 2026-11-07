'use client';
import React, { useState, useEffect } from 'react';

export default function SozlamalarSahifasi() {
  const [operatorQoshimcha, setOperatorQoshimcha] = useState<number>(20000);
  const [lavozimlar, setLavozimlar] = useState<any[]>([]);
  const [yangiLavozimNomi, setYangiLavozimNomi] = useState('');
  const [yangiStavka, setYangiStavka] = useState('');
  const [brakMeyyori, setBrakMeyyori] = useState({ igna: 0, lux: 0 });
  
  // 🚀 YANGI: Jarima narxlarini boshqarish state'i
  const [brakStavkalari, setBrakStavkalari] = useState({ ignaSinigi: 8000, luxXatosi: 10000 });

  useEffect(() => {
    const saqlanganQoshimcha = localStorage.getItem('zavod_operator_qoshimcha');
    if (saqlanganQoshimcha !== null) setOperatorQoshimcha(Number(saqlanganQoshimcha));

    const saqlanganLavozimlar = localStorage.getItem('zavod_lavozimlar_bazasi');
    let boshlangichLavozimlar = [
      { id: 1, nomi: 'Operator', stavka: 175000 },
      { id: 2, nomi: 'Nachalnik mexanik', stavka: 500000 },
      { id: 3, nomi: 'mexaynik', stavka: 300000 },
    ];

    if (saqlanganLavozimlar) {
      try { 
        const parsed = JSON.parse(saqlanganLavozimlar);
        const hasOperator = parsed.some((l: any) => l.nomi.toLowerCase() === 'operator');
        if (!hasOperator) parsed.unshift({ id: 0, nomi: 'Operator', stavka: 175000 });
        boshlangichLavozimlar = parsed;
      } catch (e) { console.error(e); }
    }
    setLavozimlar(boshlangichLavozimlar);

    const saqlanganMeyyor = localStorage.getItem('zavod_brak_meyyori');
    if (saqlanganMeyyor) {
      try { setBrakMeyyori(JSON.parse(saqlanganMeyyor)); } catch (e) { console.error(e); }
    }

    // 🚀 YANGI: Jarima narxlarini o'qib olish
    const saqlanganNarxlar = localStorage.getItem('zavod_brak_stavkalari');
    if (saqlanganNarxlar) {
      try { setBrakStavkalari(JSON.parse(saqlanganNarxlar)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleOperatorQoshimchaChange = (val: number) => {
    setOperatorQoshimcha(val);
    localStorage.setItem('zavod_operator_qoshimcha', val.toString());
  };

  const lavozimniSaqlash = (yangiRoyxat: any[]) => {
    setLavozimlar(yangiRoyxat);
    localStorage.setItem('zavod_lavozimlar_bazasi', JSON.stringify(yangiRoyxat));
  };

  const handleOperatorStavkaChange = (yangiStavka: number) => {
    const yangi = lavozimlar.map(l => l.nomi.toLowerCase() === 'operator' ? { ...l, stavka: yangiStavka } : l);
    lavozimniSaqlash(yangi);
  };

  const yangiLavozimQoshish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yangiLavozimNomi.trim() || !yangiStavka) return;
    if (yangiLavozimNomi.trim().toLowerCase() === 'operator') {
      alert("⚠️ 'Operator' lavozimi tizimda qat'iy belgilangan. Uni qayta qo'sha olmaysiz!");
      setYangiLavozimNomi(''); return;
    }
    const yangi = { id: Date.now(), nomi: yangiLavozimNomi.trim(), stavka: Number(yangiStavka) };
    lavozimniSaqlash([...lavozimlar, yangi]);
    setYangiLavozimNomi(''); setYangiStavka('');
  };

  const lavozimniOchirish = (id: number, nomi: string) => {
    if (!window.confirm(`Rostdan ham "${nomi}" lavozimini o'chirib tashlamoqchimisiz?`)) return;
    lavozimniSaqlash(lavozimlar.filter(l => l.id !== id));
  };

  const meyyorniOzgartirish = (tur: string, qiymat: string) => {
    const num = Number(qiymat.replace(/\D/g, '')) || 0;
    const yangi = { ...brakMeyyori, [tur]: num };
    setBrakMeyyori(yangi);
    localStorage.setItem('zavod_brak_meyyori', JSON.stringify(yangi));
  };

  // 🚀 YANGI: Jarima narxlarini saqlash funksiyasi
  const narxniOzgartirish = (tur: string, qiymat: string) => {
    const num = Number(qiymat.replace(/\D/g, '')) || 0;
    const yangi = { ...brakStavkalari, [tur]: num };
    setBrakStavkalari(yangi);
    localStorage.setItem('zavod_brak_stavkalari', JSON.stringify(yangi));
  };

  const operatorLavozim = lavozimlar.find(l => l.nomi.toLowerCase() === 'operator') || { id: 0, nomi: 'Operator', stavka: 175000 };
  const qolganLavozimlar = lavozimlar.filter(l => l.nomi.toLowerCase() !== 'operator');

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Zavod Sozlamalari (Nastroyka)</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHAP TOMON: LAVOZIMLAR VA STAVKALAR */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-base font-black text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
            <span>👔</span> Lavozimlar va Stavkalarni Boshqarish
          </h2>
          <form onSubmit={yangiLavozimQoshish} className="flex flex-col sm:flex-row gap-2 mb-6">
            <input type="text" placeholder="Yangi lavozim nomi (masalan: Slesar)..." value={yangiLavozimNomi} onChange={(e) => setYangiLavozimNomi(e.target.value)} className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:bg-white focus:border-blue-500 font-semibold" />
            <input type="number" placeholder="1 Smena puli (so'm)" value={yangiStavka} onChange={(e) => setYangiStavka(e.target.value)} className="w-full sm:w-44 p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:bg-white focus:border-blue-500 font-semibold" />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-all active:scale-95 whitespace-nowrap">+</button>
          </form>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-xs uppercase font-black text-gray-700">
                  <th className="p-3 border-r border-gray-200">Nomi / Lavozimi</th>
                  <th className="p-3 border-r border-gray-200 text-right w-48">Summa / Smena Stavkasi</th>
                  <th className="p-3 text-center w-20">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-blue-50/50 hover:bg-blue-50">
                  <td className="p-3 font-semibold text-gray-800 border-r border-gray-200 flex items-center gap-2"><span className="text-blue-600 font-bold">⭐</span> Qo'shimcha moshina</td>
                  <td className="p-2 text-right border-r border-gray-200"><input type="number" value={operatorQoshimcha} onChange={(e) => handleOperatorQoshimchaChange(Number(e.target.value))} className="w-full p-1.5 border border-gray-300 rounded text-right font-black text-blue-700 bg-white outline-none focus:border-blue-500" /></td>
                  <td className="p-3 text-center text-xs text-gray-400 font-semibold">Asosiy</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/70">
                  <td className="p-3 font-black text-gray-900 border-r border-gray-200">Operator</td>
                  <td className="p-2 text-right border-r border-gray-200"><input type="number" value={operatorLavozim.stavka} onChange={(e) => handleOperatorStavkaChange(Number(e.target.value))} className="w-full p-1.5 border border-gray-300 rounded text-right font-black text-emerald-700 bg-white focus:bg-white focus:border-emerald-500 outline-none" /></td>
                  <td className="p-3 text-center text-xs text-gray-400 font-semibold">Asosiy</td>
                </tr>
                {qolganLavozimlar.map((lavozim) => (
                  <tr key={lavozim.id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-800 border-r border-gray-200">{lavozim.nomi}</td>
                    <td className="p-2 text-right border-r border-gray-200"><input type="number" value={lavozim.stavka} onChange={(e) => { const val = Number(e.target.value); lavozimniSaqlash(lavozimlar.map(l => l.id === lavozim.id ? { ...l, stavka: val } : l)); }} className="w-full p-1.5 border border-gray-300 rounded text-right font-black text-gray-700 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none" /></td>
                    <td className="p-3 text-center"><button onClick={() => lavozimniOchirish(lavozim.id, lavozim.nomi)} className="text-red-500 hover:text-red-700 font-bold p-1 rounded hover:bg-red-50 transition-all" title="O'chirish">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* O'NG TOMON: SIFAT NAZORATI SOZLAMALARI */}
        <div className="flex flex-col gap-6">
          
          {/* 1. BRAK JARIMA NARXLARI (YANGI KO'CHIRILDI) */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-base font-black text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>💰</span> Brak Jarima Narxlari
            </h2>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-xl bg-red-50/50">
                <label className="block text-xs font-bold text-red-600 uppercase mb-2">Igna sinig'i narxi (so'm)</label>
                <input type="text" value={brakStavkalari.ignaSinigi} onChange={(e) => narxniOzgartirish('ignaSinigi', e.target.value)} className="w-full p-2.5 border border-red-200 rounded-lg font-black text-red-700 outline-none focus:border-red-500 focus:bg-white transition-all text-right text-lg shadow-sm" placeholder="0" />
              </div>
              <div className="p-4 border border-gray-200 rounded-xl bg-blue-50/50">
                <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Lux xatosi narxi (so'm)</label>
                <input type="text" value={brakStavkalari.luxXatosi} onChange={(e) => narxniOzgartirish('luxXatosi', e.target.value)} className="w-full p-2.5 border border-blue-200 rounded-lg font-black text-blue-700 outline-none focus:border-blue-500 focus:bg-white transition-all text-right text-lg shadow-sm" placeholder="0" />
              </div>
            </div>
          </div>

          {/* 2. KECHIRIM ME'YORI */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-base font-black text-gray-800 mb-2 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>🛡️</span> Brak Kechirim Me'yori
            </h2>
            <div className="space-y-4">
              <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 uppercase">Igna me'yori (m)</span>
                <input type="text" value={brakMeyyori.igna} onChange={(e) => meyyorniOzgartirish('igna', e.target.value)} className="w-20 p-2 border border-gray-300 rounded-lg font-black text-red-600 outline-none focus:border-red-500 text-center" placeholder="0" />
              </div>
              <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 uppercase">Lux me'yori (m)</span>
                <input type="text" value={brakMeyyori.lux} onChange={(e) => meyyorniOzgartirish('lux', e.target.value)} className="w-20 p-2 border border-gray-300 rounded-lg font-black text-blue-600 outline-none focus:border-blue-500 text-center" placeholder="0" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}