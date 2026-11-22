import React from 'react';
import { tungimi } from '@/lib/smena';

// Smena formasi: sana tanlanmaydi (u joriy smenadan keladi). Smena — bitta yozuv; bosilganda yakunlash oynasi.
export default function SmenaFormasi({
  sana,
  smenaTuri,
  yakunlashniOchish,
  tugmalarOchiq,
  kontrolchi,
  setKontrolchi,
  master,
  setMaster
}: {
  sana: string;
  smenaTuri: string;
  yakunlashniOchish: () => void;
  tugmalarOchiq: boolean;
  kontrolchi: string;
  setKontrolchi: (v: string) => void;
  master: string;
  setMaster: (v: string) => void;
}) {
  const inputKlassi =
    'w-full border border-gray-300 rounded-lg p-2.5 text-base sm:text-sm font-semibold text-gray-800 bg-gray-50 outline-none focus:border-indigo-500 focus:bg-white';

  // Faqat joriy smena ko'rinadi. Master/adminda bosiladi -> "yakunlaysizmi?" oynasi ochiladi.
  const tun = tungimi(smenaTuri || '');
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
        <button
          type="button"
          disabled={!tugmalarOchiq}
          onClick={yakunlashniOchish}
          title={tugmalarOchiq ? 'Smenani yakunlash' : undefined}
          className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all disabled:cursor-default ${
            tun ? 'bg-slate-800 text-white' : 'bg-amber-400 text-amber-950'
          } ${tugmalarOchiq ? 'hover:brightness-110 active:scale-[0.98] shadow-sm' : ''}`}
        >
          <span className="text-sm font-black leading-tight">{tun ? '🌙 NOCH' : '☀️ DEN'}</span>
          {tugmalarOchiq && <span className="text-base font-black opacity-70">⇄</span>}
        </button>
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
