'use client';
import React, { useState, useEffect } from 'react';
import ApparatCard from '@/components/ApparatCard';
import SmenaFormasi from '@/components/SmenaFormasi'; 
import { useRulonlar } from '@/hooks/useRulonlar';
import { almashuvEslatmasi, oldingiSmena, smenaQisqa, tungimi } from '@/lib/smena';
import { moshinaRaqami } from '@/lib/moshina';

export default function RulonlarSahifasi() {
  const {
    moshinalar, sana, smenaTuri, kontrolchi, setKontrolchi, master, setMaster,
    moshinaMaqotlari, moshinaQoshish, jadvalniOchirish, handleMoshinaDataChange, oldingiSmenadanKochirish,
    joriy, rejim, smenaTanlash, smenagaOtish, tugaganniOchish, joriygaQaytish
  } = useRulonlar();

  // Smena almashtirishda xato bo'lsa (internet yo'q, boshqa qurilma allaqachon almashtirgan)
  const [smenaXato, setSmenaXato] = useState('');
  const smenaAlmashuvi = async (amal: () => Promise<string | null>) => {
    setSmenaXato('');
    const xato = await amal();
    if (xato) {
      setSmenaXato(xato);
      setTimeout(() => setSmenaXato(''), 7000);
    }
  };
  const qisqaNom = (s: { sana: string; smena: string }) =>
    `${s.sana.split('-').reverse().slice(0, 2).join('.')} ${tungimi(s.smena) ? '🌙 NOCH' : '☀️ DEN'}`;

  // "Oldingi smenadan ko'chirish" holati
  const [kochirilmoqda, setKochirilmoqda] = useState(false);
  const [kochirishXabari, setKochirishXabari] = useState<{ turi: 'ok' | 'xato'; matn: string } | null>(null);

  const kochirish = async () => {
    setKochirilmoqda(true);
    setKochirishXabari(null);
    const natija = await oldingiSmenadanKochirish();
    setKochirilmoqda(false);
    setKochirishXabari(
      natija.xato
        ? { turi: 'xato', matn: natija.xato }
        : { turi: 'ok', matn: `${natija.qoshildi} ta moshina ko'chirildi. Endi operatorlarni tanlang.` }
    );
    setTimeout(() => setKochirishXabari(null), 6000);
  };

  // 1. ROLNI ANIQLASH (HUQUQLAR UCHUN)
  const [rol, setRol] = useState('');
  useEffect(() => {
    const saqlanganUser = localStorage.getItem('zavod_foydalanuvchi');
    if (saqlanganUser) {
      setRol(JSON.parse(saqlanganUser).rol);
    }
  }, []);

  // UNUTILGAN ALMASHUV ESLATMASI: soat 08:30 / 20:30 dan keyin ekranda hali oldingi smena tursa.
  // Hech narsa avtomatik almashmaydi — faqat eslatadi. Har daqiqada tekshiriladi (vaqt faqat brauzerda olinadi).
  const [eslatma, setEslatma] = useState<{ sana: string; smena: string } | null>(null);
  const [yopilganEslatma, setYopilganEslatma] = useState('');
  useEffect(() => {
    try {
      setYopilganEslatma(localStorage.getItem('_zavod_eslatma_yopilgan') || '');
    } catch {}
  }, []);
  // Eslatma joriy smenaga (bazadagi) qarab hisoblanadi
  useEffect(() => {
    if (!joriy) return;
    const tekshir = () => setEslatma(almashuvEslatmasi(joriy.sana, joriy.smena));
    tekshir();
    const t = setInterval(tekshir, 60 * 1000);
    return () => clearInterval(t);
  }, [joriy]);
  const eslatmaKaliti = eslatma ? `${eslatma.sana}_${smenaQisqa(eslatma.smena)}` : '';
  const eslatmaniYopish = () => {
    setYopilganEslatma(eslatmaKaliti);
    try {
      localStorage.setItem('_zavod_eslatma_yopilgan', eslatmaKaliti);
    } catch {}
  };

  // Arxiv smenasini hech kim o'zgartira olmaydi (server ham tekshiradi). Odatda Rulonlar'da arxiv ochilmaydi.
  const faqatKorish = rejim === 'arxiv';
  const smenaBoshqaruvchi = rol === 'admin' || rol === 'master';

  // Bir smenada bir moshina raqami ikki marta yozilsa, ikkalasi qizil bo'ladi
  const raqamlarSoni: Record<number, number> = {};
  moshinalar.forEach((m: any) => {
    const n = moshinaRaqami(moshinaMaqotlari[m.id]?.raqam);
    if (n) raqamlarSoni[n] = (raqamlarSoni[n] || 0) + 1;
  });
  const takrorlanadimi = (id: any) => {
    const n = moshinaRaqami(moshinaMaqotlari[id]?.raqam);
    return !!n && raqamlarSoni[n] > 1;
  };
  const oldingi = sana && smenaTuri ? oldingiSmena(sana, smenaTuri) : null;
  const oldingiNomi = oldingi ? `${oldingi.sana.split('-').reverse().slice(0, 2).join('.')} ${smenaQisqa(oldingi.smena)}` : '';
  const masterHuquqi = (rol === 'admin' || rol === 'master') && !faqatKorish;
  // (Kontrolchi huquqi asosan ApparatCard ichida ishlatiladi, u yog'ini komponenting ichiga uzatamiz)

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto font-sans min-h-screen">
      
      {/* 🚀TEPADAGI STATUS BLOKI - MU'JAZ VA TOZA */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">Rulonlar va Sifat Nazorati</h1>
        
        {faqatKorish ? (
          <div className="bg-amber-50 text-amber-800 text-[10px] sm:text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-amber-200">
            🔒 ARXIV — O&apos;ZGARTIRIB BO&apos;LMAYDI
          </div>
        ) : (
        <div className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-emerald-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          AVTOMAT SAQLANMOQDA
        </div>
        )}
      </div>

      {/* ⏰ UNUTILGAN ALMASHUV ESLATMASI (faqat smenani almashtira oladiganlarga) */}
      {eslatma && eslatmaKaliti !== yopilganEslatma && smenaBoshqaruvchi && rejim === 'joriy' && (
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
          <span className="text-sm sm:text-base font-black text-amber-900 flex-1 min-w-[200px]">
            ⏰ Hozir {eslatma.sana.split('-').reverse().slice(0, 2).join('.')} {tungimi(eslatma.smena) ? '🌙 NOCH' : '☀️ DEN'} smenasi
          </span>
          <button
            type="button"
            onClick={() => smenaAlmashuvi(() => smenagaOtish(eslatma))}
            className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm font-black"
          >
            O&apos;tish
          </button>
          <button
            type="button"
            onClick={eslatmaniYopish}
            className="h-10 w-10 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 font-black"
            aria-label="Yopish"
            title="Keyingi smenagacha yashirish"
          >
            ✕
          </button>
        </div>
      )}

      {/* ✏️ TUGAGAN SMENA (faqat shu masterning ekranida; kontrolchilar joriy smenada qoladi) */}
      {rejim !== 'joriy' && joriy && (
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 shadow-sm">
          <span className="text-sm sm:text-base font-black text-indigo-900 flex-1 min-w-[200px]">
            {rejim === 'tugagan' ? '✏️ Tugagan smena' : '🗂 Arxiv smenasi'}: {qisqaNom({ sana, smena: smenaTuri })}
          </span>
          <button
            type="button"
            onClick={joriygaQaytish}
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-black"
          >
            Joriy smenaga qaytish →
          </button>
        </div>
      )}

      {smenaXato && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-bold text-rose-700">⚠️ {smenaXato}</div>
      )}

      {/* 🚀 2. SMENA FORMASI: sana joriy smenadan keladi, smena faqat aqlli tugmalar bilan almashadi */}
      <div className={`bg-white rounded-2xl shadow-sm border-2 mb-8 overflow-hidden transition-opacity ${smenaBoshqaruvchi ? 'border-slate-200' : 'border-slate-100 opacity-70 pointer-events-none'}`}>
        <SmenaFormasi
          sana={sana}
          smenaTuri={smenaTuri}
          smenaTanlash={(q) => smenaAlmashuvi(() => smenaTanlash(q))}
          tugmalarOchiq={smenaBoshqaruvchi && rejim === 'joriy'}
          kontrolchi={kontrolchi}
          setKontrolchi={setKontrolchi}
          master={master}
          setMaster={setMaster}
        />
        {/* Bir qadam orqaga: faqat master va admin, faqat tugagan smenaga */}
        {smenaBoshqaruvchi && rejim === 'joriy' && joriy && (
          <div className="px-4 pb-4 -mt-2">
            <button
              type="button"
              onClick={tugaganniOchish}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600"
            >
              ← Tugagan smena ({qisqaNom(oldingiSmena(joriy.sana, joriy.smena))})
            </button>
          </div>
        )}
      </div>

      {/* KO'CHIRISH NATIJASI */}
      {kochirishXabari && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-xs font-bold sm:text-sm ${
            kochirishXabari.turi === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {kochirishXabari.turi === 'ok' ? '✓ ' : '⚠️ '}
          {kochirishXabari.matn}
        </div>
      )}

      {/* YANGI SMENA: hali moshina yo'q bo'lsa, oldingi smenadan ko'chirishni taklif qilamiz */}
      {moshinalar.length === 0 && masterHuquqi && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center">
          <p className="text-sm font-black text-slate-800 sm:text-base">Bu smenada hali moshina yo&apos;q</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Moshinalarni oldingi smenadan ({oldingiNomi}) raqami, talimoti, brendi, IP va loti bilan ko&apos;chiring — keyin faqat operatorlarni tanlaysiz
          </p>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              onClick={kochirish}
              disabled={kochirilmoqda}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
            >
              {kochirilmoqda ? 'Ko\'chirilmoqda...' : `⇩ Oldingi smenadan ko'chirish`}
            </button>
            <button
              onClick={moshinaQoshish}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
            >
              + Bo&apos;sh moshina qo&apos;shish
            </button>
          </div>
        </div>
      )}

      {/* 🚀 3. JADVALLAR (MOSHINALAR) - HAR DOIM YOZISH MUMKIN BOLGAN HOLATDA */}
      <div className="space-y-6">
        {moshinalar.map((moshina) => {
          const mData = moshinaMaqotlari[moshina.id] || {};

          return (
            <div key={`${sana}_${smenaTuri}_${moshina.id}`} className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden relative group p-2 sm:p-4">
              
              {/* HOVER DELETE TUGMASI (Faqat Master yoki Admin o'chira oladi) */}
              {masterHuquqi && (
                <button 
                  onClick={() => jadvalniOchirish(moshina.id)} 
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 font-black px-3 py-1.5 bg-slate-50 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs border border-transparent hover:border-rose-200 z-10"
                  title="Moshinani o'chirish"
                >
                  ✕
                </button>
              )}

              <ApparatCard 
                id={moshina.id} 
                initialData={mData} 
                onDataChange={(data: any) => handleMoshinaDataChange(moshina.id, data)} 
                joriySana={sana}
                rol={rol} // HUQUQNI APPARAT CARD GA JO'NATDIK
                readOnly={faqatKorish}
                raqamTakror={takrorlanadimi(moshina.id)}
              />
            </div>
          );
        })}
      </div>

      {/* 🚀 4. YANGI MOSHINA QO'SHISH TUGMASI (Faqat Master yoki Admin ko'radi) */}
      {masterHuquqi && moshinalar.length > 0 && (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 pb-12 sm:flex-row">
          <button
            onClick={kochirish}
            disabled={kochirilmoqda}
            title={`${oldingiNomi} smenasidagi, bu yerda hali yo'q moshinalarni qo'shadi`}
            className="bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-200 font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-60"
          >
            ⇩ {kochirilmoqda ? 'Ko\'chirilmoqda...' : 'Oldingi smenadan ko\'chirish'}
          </button>
          <button 
            onClick={moshinaQoshish} 
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-2 border-dashed border-indigo-200 hover:border-indigo-400 font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="text-xl font-black">+</span> Yangi Moshina Qo'shish
          </button>
        </div>
      )}

    </div>
  );
}