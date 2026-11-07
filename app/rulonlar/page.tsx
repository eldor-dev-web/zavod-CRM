'use client';
import React, { useState, useEffect } from 'react';
import ApparatCard from '@/components/ApparatCard';
import SmenaFormasi from '@/components/SmenaFormasi'; 
import { useRulonlar } from '@/hooks/useRulonlar'; 

export default function RulonlarSahifasi() {
  const {
    moshinalar, sana, setSana, smenaTuri, setSmenaTuri, kontrolchi, setKontrolchi, master, setMaster,
    moshinaMaqotlari, moshinaQoshish, jadvalniOchirish, handleMoshinaDataChange
  } = useRulonlar();

  // 1. ROLNI ANIQLASH (HUQUQLAR UCHUN)
  const [rol, setRol] = useState('');
  useEffect(() => {
    const saqlanganUser = localStorage.getItem('zavod_foydalanuvchi');
    if (saqlanganUser) {
      setRol(JSON.parse(saqlanganUser).rol);
    }
  }, []);

  const masterHuquqi = rol === 'admin' || rol === 'master';
  // (Kontrolchi huquqi asosan ApparatCard ichida ishlatiladi, u yog'ini komponenting ichiga uzatamiz)

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto font-sans min-h-screen">
      
      {/* 🚀TEPADAGI STATUS BLOKI - MU'JAZ VA TOZA */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">Rulonlar va Sifat Nazorati</h1>
        
        {/* Smena doim ochiq, avtomat saqlab boradi */}
        <div className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-emerald-200">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          AVTOMAT SAQLANMOQDA
        </div>
      </div>

      {/* 🚀 2. SMENA FORMASI (Sana, Smena, Master, Kantrolchi shu yerda aylanadi) */}
      <div className={`bg-white rounded-2xl shadow-sm border-2 mb-8 overflow-hidden transition-opacity ${masterHuquqi ? 'border-slate-200' : 'border-slate-100 opacity-70 pointer-events-none'}`}>
        {/* Master va Admindan boshqa odam kira olmasligi uchun 'pointer-events-none' berildi */}
        <SmenaFormasi 
          sana={sana} setSana={setSana} 
          smenaTuri={smenaTuri} setSmenaTuri={setSmenaTuri} 
          kontrolchi={kontrolchi} setKontrolchi={setKontrolchi} 
          master={master} setMaster={setMaster} 
        />
      </div>

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
              />
            </div>
          );
        })}
      </div>

      {/* 🚀 4. YANGI MOSHINA QO'SHISH TUGMASI (Faqat Master yoki Admin ko'radi) */}
      {masterHuquqi && (
        <div className="mt-8 flex justify-center pb-12">
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