'use client';
import React, { useState, useEffect } from 'react';

const Icons = {
  Wallet: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>,
  Alert: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Users: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Cube: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>,
  Chart: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  Trophy: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>,
  Cross: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-7 sm:h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Check: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
};

export default function AsosiyPanelSahifasi() {
  const [tanlanganOy, setTanlanganOy] = useState('');
  
  const [statistika, setStatistika] = useState({
    jamiOylik: 0, jamiJarima: 0, jamiIgnaMetr: 0, jamiLuxMetr: 0, faolIshchilarSoni: 0,
    kechagiSana: '', kechagiDenKg: 0, kechagiNochKg: 0, bugungiJamiKg: 0, 
    qahramon: { ism: '-', kun: 0 }, qoidabuzar: { ism: '-', brakMetr: 0 },
    grafikData: [] as { oyKodi: string, oyNomi: string, jamiKg: number }[],
    grafikMaxKg: 0
  });

  useEffect(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hozirgiOy = `${yyyy}-${mm}`;
    setTanlanganOy(hozirgiOy); 
    malumotlarniAnalizQilish(hozirgiOy);
  }, []);

  const malumotlarniAnalizQilish = (oy: string) => {
    const ishchilar = JSON.parse(localStorage.getItem(`zavod_ishchilar_${oy}`) || '[]');
    const davomat = JSON.parse(localStorage.getItem('zavod_xodim_davomati') || '{}');
    const lavozimlar = JSON.parse(localStorage.getItem('zavod_lavozimlar_bazasi') || '[]');
    const saqlanganQoshimcha = localStorage.getItem('zavod_operator_qoshimcha');
    const opQoshimcha = saqlanganQoshimcha !== null ? Number(saqlanganQoshimcha) : 20000;
    const brakStavkalari = JSON.parse(localStorage.getItem('zavod_brak_stavkalari') || '{"ignaSinigi":8000,"luxXatosi":10000}');
    const brakJadvali = JSON.parse(localStorage.getItem(`zavod_brak_jadval_${oy}`) || '{}');

    let tempOylik = 0, tempIgna = 0, tempLux = 0, maxKun = 0, bestWorker = '-', maxBrak = 0, worstWorker = '-';
    
    const tozaIshchilar = Array.isArray(ishchilar) ? ishchilar.filter((i: any) => i.ism && i.ism.trim() !== '') : [];
    const noyobIshchilarMap = new Map();
    tozaIshchilar.forEach((i: any) => noyobIshchilarMap.set(i.id, i));
    const noyobIshchilar = Array.from(noyobIshchilarMap.values());

    noyobIshchilar.forEach((ishchi: any) => {
      let jamiKun = 0, jamiMoshina = 0, ishchiIgna = 0, ishchiLux = 0;
      for (let i = 1; i <= 31; i++) {
        const d = davomat[`${ishchi.id}_${oy}_${i}`];
        if (d && (d.status === '+' || d.holat === '+' || d === '+')) jamiKun += 1;
        if (d && d.moshina !== '' && d.moshina != null && !isNaN(Number(d.moshina))) jamiMoshina += Number(d.moshina);
        const b = brakJadvali[`${ishchi.id}_${i}`];
        if (b) { ishchiIgna += Number(b.igna || 0); ishchiLux += Number(b.lux || 0); }
      }

      const lavozimNomi = String(ishchi.lavozim || ishchi.mutaxassislik || ishchi.rol || ishchi.lavozimi || '').trim();
      const topildi = lavozimlar.find((l: any) => l.nomi && String(l.nomi).toLowerCase().trim() === lavozimNomi.toLowerCase());
      const stavka = Number(ishchi.stavka || (topildi ? topildi.stavka : 0)) || 0;
      const isOperator = lavozimNomi.toLowerCase().includes('operator');
      
      tempOylik += ((jamiKun * stavka) + (isOperator ? (jamiMoshina * opQoshimcha) : 0));
      tempIgna += ishchiIgna; tempLux += ishchiLux;

      if (jamiKun > maxKun) { maxKun = jamiKun; bestWorker = ishchi.ism; }
      const ishchiJamiBrak = ishchiIgna + ishchiLux;
      if (ishchiJamiBrak > maxBrak) { maxBrak = ishchiJamiBrak; worstWorker = ishchi.ism; }
    });

    const tempJarima = (tempIgna * brakStavkalari.ignaSinigi) + (tempLux * brakStavkalari.luxXatosi);
    
    // TIMEZONE TO'G'RILANDI: Mahalliy vaqt bilan olinadi!
    const hozir = new Date();
    const bugunSanaStr = `${hozir.getFullYear()}-${String(hozir.getMonth() + 1).padStart(2, '0')}-${String(hozir.getDate()).padStart(2, '0')}`;
    
    const kechaDate = new Date();
    kechaDate.setDate(kechaDate.getDate() - 1);
    const kechaSanaStr = `${kechaDate.getFullYear()}-${String(kechaDate.getMonth() + 1).padStart(2, '0')}-${String(kechaDate.getDate()).padStart(2, '0')}`;
    const kechaKorsatish = `${String(kechaDate.getDate()).padStart(2, '0')}.${String(kechaDate.getMonth() + 1).padStart(2, '0')}`;

    let y_kechaDenKg = 0, y_kechaNochKg = 0, y_bugunJamiKg = 0;
    const yillikOylar: Record<string, number> = {};

    // 🚀 Yangi toza mantiq: BARCHA (ham arxiv, ham ochiq) smenalarni yig'ish!
    const barchaSmenalarMap = new Map();

    // 1. Arxiv (yopilgan) jadvallar
    const arxivSmenalar = JSON.parse(localStorage.getItem('zavod_smena_arxivlari') || '[]');
    arxivSmenalar.forEach((s: any) => {
      if (s.sana && s.smena) {
        barchaSmenalarMap.set(`${s.sana}_${s.smena}`, {
           sana: s.sana,
           smena: s.smena,
           moshinaTafsilotlari: s.moshinaTafsilotlari
        });
      }
    });

    // 2. Aktiv (yopilmagan) jadvallar 
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Xato bergan Regex shartlari butunlay olib tashlanib, toza JSON usuliga o'tildi:
      if (key && key.startsWith('zavod_smena_') && !key.includes('arxiv')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.sana && data.smena && Array.isArray(data.moshinalar)) {
            barchaSmenalarMap.set(`${data.sana}_${data.smena}`, {
              sana: data.sana,
              smena: data.smena,
              moshinaTafsilotlari: data.moshinalar
            });
          }
        } catch (e) {
          console.error("Aktiv smenani o'qishda xatolik:", e);
        }
      }
    }

    // 🚀 Hamma to'plangan ma'lumotlarni hisoblash:
    barchaSmenalarMap.forEach((smena: any) => {
      let smenaKg = 0;
      
      const moshinalarList = Array.isArray(smena.moshinaTafsilotlari)
        ? smena.moshinaTafsilotlari
        : Object.values(smena.moshinaTafsilotlari || {});

      moshinalarList.forEach((moshina: any) => {
        if (moshina.rulonlar && Array.isArray(moshina.rulonlar)) {
          moshina.rulonlar.forEach((rulon: any) => {
            const kgNum = parseFloat(String(rulon.kg || 0).replace(',', '.'));
            if (!isNaN(kgNum)) smenaKg += kgNum;
          });
        }
      });

      const sSana = smena.sana || '';
      const sSmena = String(smena.smena || '');
      
      // DEN, NOCH, BUGUN taqsimoti
      if (sSana === kechaSanaStr) {
        if (sSmena.includes('DEN')) y_kechaDenKg += smenaKg;
        if (sSmena.includes('NOCH')) y_kechaNochKg += smenaKg;
      }
      if (sSana === bugunSanaStr) {
        y_bugunJamiKg += smenaKg;
      }
      
      // Yillik dinamika taqsimoti
      if (sSana) {
        const smenaOyi = sSana.slice(0, 7);
        yillikOylar[smenaOyi] = (yillikOylar[smenaOyi] || 0) + smenaKg;
      }
    });

    const oyNomlari = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
    const grafikDataArr: { oyKodi: string, oyNomi: string, jamiKg: number }[] = [];
    let grafikEngKopKg = 0;
    const joriyYil = oy.split('-')[0];
    
    for (let i = 1; i <= 12; i++) {
      const oyKodi = `${joriyYil}-${String(i).padStart(2, '0')}`;
      const oylikHajm = yillikOylar[oyKodi] || 0;
      if (oylikHajm > grafikEngKopKg) grafikEngKopKg = oylikHajm;
      grafikDataArr.push({ oyKodi: oyKodi, oyNomi: oyNomlari[i - 1], jamiKg: Number(oylikHajm.toFixed(2)) });
    }

    setStatistika({
      jamiOylik: tempOylik, jamiJarima: tempJarima, jamiIgnaMetr: tempIgna, jamiLuxMetr: tempLux,
      faolIshchilarSoni: noyobIshchilar.length, kechagiSana: kechaKorsatish, 
      kechagiDenKg: Number(y_kechaDenKg.toFixed(2)), kechagiNochKg: Number(y_kechaNochKg.toFixed(2)), bugungiJamiKg: Number(y_bugunJamiKg.toFixed(2)),
      qahramon: { ism: bestWorker, kun: maxKun }, qoidabuzar: { ism: worstWorker, brakMetr: maxBrak },
      grafikData: grafikDataArr, grafikMaxKg: grafikEngKopKg || 1
    });
  };

  return (
    <div className="w-full font-sans bg-[#F8FAFC] min-h-screen text-slate-800 pb-10 sm:p-8">
      <div className="flex flex-row justify-between items-center px-4 pt-5 sm:px-0 sm:pt-0 mb-4 sm:mb-6 gap-2">
        <div className="pt-2 md:pt-0">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">Dashboard</h1>
          <p className="text-[10px] sm:text-sm text-slate-500 mt-1 hidden sm:block">Umumiy ishlab chiqarish va moliya tahlili</p>
        </div>
        <div className="bg-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-sm border border-slate-200 flex items-center">
          <input 
            type="month" value={tanlanganOy} onChange={(e) => { setTanlanganOy(e.target.value); malumotlarniAnalizQilish(e.target.value); }}
            className="border-none bg-transparent font-semibold text-slate-700 text-xs sm:text-sm outline-none cursor-pointer w-full" 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 px-3 sm:px-0 mb-4 sm:mb-6">
        
        <div className="bg-white rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3 sm:mb-6">
            <div className="bg-indigo-50 text-indigo-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl"><Icons.Wallet /></div>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Xarajatlar</p>
            <h2 className="text-base sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {statistika.jamiOylik.toLocaleString('ru-RU')} 
              <span className="text-[10px] sm:text-base font-semibold text-slate-400 ml-1">UZS</span>
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3 sm:mb-6">
            <div className="bg-rose-50 text-rose-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl"><Icons.Alert /></div>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Jarimalar</p>
            <h2 className="text-base sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {statistika.jamiJarima.toLocaleString('ru-RU')} 
              <span className="text-[10px] sm:text-base font-semibold text-slate-400 ml-1">UZS</span>
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3 sm:mb-6">
            <div className="bg-emerald-50 text-emerald-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl"><Icons.Users /></div>
          </div>
          <div>
            <p className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Faol Xodimlar</p>
            <h2 className="text-base sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {statistika.faolIshchilarSoni} <span className="text-[10px] sm:text-base font-semibold text-slate-400">nafar</span>
            </h2>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl sm:rounded-3xl p-3 sm:p-6 shadow-md flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center mb-3 sm:mb-4 relative z-10">
            <div className="bg-white/10 text-white p-2 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-sm"><Icons.Cube /></div>
            <span className="text-[8px] sm:text-[10px] font-bold tracking-widest text-slate-400 uppercase">Hajm/Kg</span>
          </div>
          <div className="space-y-1.5 sm:space-y-3 relative z-10 w-full">
            <div className="flex justify-between items-end border-b border-slate-700/50 pb-1 sm:pb-2">
              <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400">DEN <span className="opacity-60 hidden sm:inline">({statistika.kechagiSana})</span></span>
              <span className="text-sm sm:text-lg font-bold">{statistika.kechagiDenKg.toLocaleString('ru-RU')} <span className="text-[8px] sm:text-[10px] font-normal text-slate-500">kg</span></span>
            </div>
            <div className="flex justify-between items-end border-b border-slate-700/50 pb-1 sm:pb-2">
              <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400">NOCH</span>
              <span className="text-sm sm:text-lg font-bold">{statistika.kechagiNochKg.toLocaleString('ru-RU')} <span className="text-[8px] sm:text-[10px] font-normal text-slate-500">kg</span></span>
            </div>
            <div className="flex justify-between items-end pt-0.5 sm:pt-1">
              <span className="text-[9px] sm:text-[11px] font-semibold text-amber-400/80">BUGUN</span>
              <span className="text-sm sm:text-lg font-bold text-amber-400">{statistika.bugungiJamiKg.toLocaleString('ru-RU')} <span className="text-[8px] sm:text-[10px] font-normal text-amber-400/50">kg</span></span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-6 px-3 sm:px-0">
        
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 flex flex-col overflow-x-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-4 sm:mb-8 min-w-[300px]">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Yillik Dinamika</h3>
              <p className="text-[9px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 sm:mt-1">{tanlanganOy.split('-')[0]} YILGI ISHLAB CHIQARISH</p>
            </div>
            <div className="bg-slate-50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400"><Icons.Chart /></div>
          </div>

          {/* 🚀 O'ZGARTIRILGAN GRAFIK QISMI (Hover va bosish bilan) */}
          <div className="flex items-end justify-between flex-grow gap-1 sm:gap-4 relative pt-8 h-[140px] sm:h-auto min-w-[300px]">
            {statistika.grafikData.map((oy, index) => {
              const heightPercent = oy.jamiKg > 0 ? (oy.jamiKg / statistika.grafikMaxKg) * 100 : 0;
              const isCurrentMonth = oy.oyKodi === tanlanganOy;

              return (
                <div key={index} className="flex flex-col items-center justify-end w-full group h-full relative cursor-pointer">
                  
                  {/* Tooltip - Faqat bosganda yoki sichqoncha olib borganda ko'rinadigan oyna */}
                  {oy.jamiKg > 0 && (
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 flex flex-col items-center pointer-events-none z-10">
                      <div className="bg-slate-800 text-white text-[9px] sm:text-[11px] font-bold py-1 px-2 rounded-md shadow-lg whitespace-nowrap">
                        {oy.jamiKg.toLocaleString('ru-RU')} kg
                      </div>
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-transparent border-t-slate-800"></div>
                    </div>
                  )}

                  {/* Grafik ustuni */}
                  <div 
                    style={{ height: `${heightPercent}%`, minHeight: oy.jamiKg > 0 ? '6px' : '3px' }} 
                    className={`w-full max-w-[12px] sm:max-w-[28px] rounded-full transition-all duration-500 ease-out 
                      ${isCurrentMonth ? 'bg-indigo-500 shadow-sm' : oy.jamiKg > 0 ? 'bg-slate-300 group-hover:bg-indigo-400' : 'bg-slate-100'}`}
                  ></div>
                  
                  <span className={`mt-2 sm:mt-4 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors ${isCurrentMonth ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`}>
                    {oy.oyNomi}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-2 sm:gap-6">
          
          <div className="bg-white rounded-xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
            <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 sm:mb-6">Sifat Nazorati (Brak)</h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-2 sm:p-4 rounded-xl sm:rounded-2xl gap-1">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <div className="bg-white p-1 sm:p-2 rounded-md sm:rounded-xl text-slate-600 shadow-sm border border-slate-100"><Icons.Cross /></div>
                  <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">Igna Siniq</span>
                </div>
                <div className="text-sm sm:text-lg font-black text-slate-800">{statistika.jamiIgnaMetr} <span className="text-[8px] sm:text-[10px] font-semibold text-slate-400">m</span></div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-2 sm:p-4 rounded-xl sm:rounded-2xl gap-1">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <div className="bg-white p-1 sm:p-2 rounded-md sm:rounded-xl text-slate-600 shadow-sm border border-slate-100"><Icons.Cross /></div>
                  <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">Lyc Xato</span>
                </div>
                <div className="text-sm sm:text-lg font-black text-slate-800">{statistika.jamiLuxMetr} <span className="text-[8px] sm:text-[10px] font-semibold text-slate-400">m</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-grow">
            <div className="bg-indigo-600 rounded-xl sm:rounded-3xl p-3 sm:p-5 shadow-sm text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 opacity-10"><Icons.Trophy /></div>
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl mb-2 sm:mb-3 backdrop-blur-sm"><Icons.Trophy /></div>
              <p className="text-[8px] sm:text-[10px] font-medium uppercase tracking-widest text-indigo-200 mb-0.5 sm:mb-1">Eng yaxshi</p>
              <p className="text-xs sm:text-base font-bold tracking-tight mb-2 sm:mb-1">{statistika.qahramon.ism !== '-' ? statistika.qahramon.ism : '---'}</p>
              <div className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md mt-auto">
                <Icons.Check /> <span className="text-[8px] sm:text-[10px] font-bold">{statistika.qahramon.kun} smena</span>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-3xl p-3 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
              <div className="bg-rose-50 text-rose-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl mb-2 sm:mb-3"><Icons.Alert /></div>
              <p className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5 sm:mb-1">Eng ko'p xato</p>
              <p className="text-xs sm:text-base font-bold tracking-tight text-slate-800 mb-2 sm:mb-1">{statistika.qoidabuzar.ism !== '-' ? statistika.qoidabuzar.ism : '---'}</p>
              <span className="text-[8px] sm:text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md mt-auto">{statistika.qoidabuzar.brakMetr} metr</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}