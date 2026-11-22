import React from 'react';
import { DEN, NOCH, tungimi } from '@/lib/smena';

// Smena formasi: sana tanlanmaydi (u joriy smenadan keladi), smena faqat aqlli tugmalar bilan almashtiriladi.
export default function SmenaFormasi({
  sana,
  smenaTuri,
  smenaTanlash,
  tugmalarOchiq,
  kontrolchi,
  setKontrolchi,
  master,
  setMaster
}: {
  sana: string;
  smenaTuri: string;
  smenaTanlash: (qiymat: string) => void;
  tugmalarOchiq: boolean;
  kontrolchi: string;
  setKontrolchi: (v: string) => void;
  master: string;
  setMaster: (v: string) => void;
}) {
  const inputKlassi =
    'w-full border border-gray-300 rounded-lg p-2.5 text-base sm:text-sm font-semibold text-gray-800 bg-gray-50 outline-none focus:border-indigo-500 focus:bg-white';

  const smenaTugmasi = (qiymat: string, belgi: string, nomi: string) => {
    const tanlangan = tungimi(qiymat) === tungimi(smenaTuri || '');
    return (
      <button
        type="button"
        disabled={!tugmalarOchiq}
        onClick={() => smenaTanlash(qiymat)}
        className={`flex-1 rounded-lg px-2 py-1.5 transition-all disabled:cursor-not-allowed ${
          tanlangan
            ? tungimi(qiymat)
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-amber-400 text-amber-950 shadow-sm'
            : tugmalarOchiq
              ? 'text-gray-500 hover:bg-gray-100'
              : 'text-gray-300'
        }`}
      >
        <span className="block text-center text-sm font-black leading-tight">
          {belgi} {nomi}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Sana</label>
        <div className="w-full border border-gray-200 rounded-lg p-2.5 text-sm font-black text-gray-800 bg-gray-100">
          📅 {sana ? sana.split('-').reverse().join('.') : '...'}
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Smena</label>
        <div className="flex gap-1 rounded-xl border border-gray-300 bg-gray-50 p-1">
          {smenaTugmasi(DEN, '☀️', 'DEN')}
          {smenaTugmasi(NOCH, '🌙', 'NOCH')}
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kontrolchi *</label>
        <input type="text" value={kontrolchi} onChange={(e) => setKontrolchi(e.target.value)} placeholder="Kontrolchi ismi" className={inputKlassi} />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Master *</label>
        <input type="text" value={master} onChange={(e) => setMaster(e.target.value)} placeholder="Master ismi" className={inputKlassi} />
      </div>
    </div>
  );
}
