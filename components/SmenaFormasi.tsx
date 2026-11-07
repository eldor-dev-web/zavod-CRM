import React from 'react';

export default function SmenaFormasi({
  sana, setSana,
  smenaTuri, setSmenaTuri,
  kontrolchi, setKontrolchi,
  master, setMaster,
  topilganSmena
}: any) {
  const isYopiq = !!topilganSmena;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Sana *</label>
        <input 
          type="date" 
          value={sana} 
          onChange={(e) => setSana(e.target.value)} 
          disabled={isYopiq}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 bg-gray-50 outline-none disabled:opacity-70" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Smena *</label>
        <select 
          value={smenaTuri} 
          onChange={(e) => setSmenaTuri(e.target.value)} 
          disabled={isYopiq}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 bg-gray-50 outline-none disabled:opacity-70"
        >
          <option>DEN (Kunduzgi)</option>
          <option>NOCH (Tungi)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kontrolchi *</label>
        <input 
          type="text" 
          value={kontrolchi} 
          onChange={(e) => setKontrolchi(e.target.value)} 
          disabled={isYopiq}
          placeholder="Kontrolchi ismi" 
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 bg-gray-50 outline-none disabled:opacity-70" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Master *</label>
        <input 
          type="text" 
          value={master} 
          onChange={(e) => setMaster(e.target.value)} 
          disabled={isYopiq}
          placeholder="Master ismi" 
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 bg-gray-50 outline-none disabled:opacity-70" 
        />
      </div>
    </div>
  );
}