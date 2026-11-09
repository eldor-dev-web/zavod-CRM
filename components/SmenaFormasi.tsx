import React from 'react';

export default function SmenaFormasi({
  sana, setSana,
  smenaTuri, setSmenaTuri,
  kontrolchi, setKontrolchi,
  master, setMaster
}: any) {
  
  // Hamma qulflash (isYopiq, disabled) mantiqlari to'liq olib tashlandi!
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Sana *</label>
        <input 
          type="date" 
          value={sana} 
          onChange={(e) => setSana(e.target.value)} 
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 bg-gray-50 outline-none" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Smena *</label>
        <select 
          value={smenaTuri} 
          onChange={(e) => setSmenaTuri(e.target.value)} 
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 bg-gray-50 outline-none"
        >
          <option value="DEN (Kunduzgi)">DEN (Kunduzgi)</option>
          <option value="NOCH (Tungi)">NOCH (Tungi)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Kontrolchi *</label>
        <input 
          type="text" 
          value={kontrolchi} 
          onChange={(e) => setKontrolchi(e.target.value)} 
          placeholder="Kontrolchi ismi" 
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 bg-gray-50 outline-none" 
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Master *</label>
        <input 
          type="text" 
          value={master} 
          onChange={(e) => setMaster(e.target.value)} 
          placeholder="Master ismi" 
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-semibold text-gray-800 bg-gray-50 outline-none" 
        />
      </div>
    </div>
  );
}