'use client';
import React, { useState, useEffect } from 'react';

export default function ArxivSahifasi() {
  const [arxivlar, setArxivlar] = useState<any[]>([]);
  const [qidiruvSana, setQidiruvSana] = useState('');

  // Sahifa ochilganda xotiradagi barcha yopilgan smenalarni o'qib olish
  useEffect(() => {
    const saqlangan = JSON.parse(localStorage.getItem('zavod_smena_arxivlari') || '[]');
    setArxivlar(saqlangan);
  }, []);

  // Sanaga qarab qidirish
  const filtrlanganArxivlar = qidiruvSana 
    ? arxivlar.filter(item => item.sana === qidiruvSana) 
    : arxivlar;

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
      
      {/* Sarlavha */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Smenalar Arxivi (Tarix)</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Oldingi yopilgan smenalar va zakazchik uchun dalillar bazasi</p>
        </div>

        {/* Sana bo'yicha filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-gray-600 uppercase">Sanani tanlang:</label>
          <input 
            type="date" 
            value={qidiruvSana}
            onChange={(e) => setQidiruvSana(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-sm font-semibold bg-white outline-none focus:border-blue-500"
          />
          {qidiruvSana && (
            <button 
              onClick={() => setQidiruvSana('')} 
              className="text-xs bg-gray-200 hover:bg-gray-300 font-bold px-3 py-2 rounded-lg transition-all"
            >
              Barchasi
            </button>
          )}
        </div>
      </div>

      {/* Arxivlar ro'yxati */}
      {filtrlanganArxivlar.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
          <p className="text-base font-semibold">Hozircha saqlangan smena ma'lumotlari yo'q yoki bu sanada smena yopilmagan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrlanganArxivlar.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-1 rounded-md uppercase">
                    {item.smena}
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    {item.sana}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-gray-700">
                  <p><strong className="text-gray-900">Master:</strong> {item.master}</p>
                  <p><strong className="text-gray-900">Kontrolchi:</strong> {item.kontrolchi || '-'}</p>
                  <p><strong className="text-gray-900">Moshinalar soni:</strong> {item.moshinalarSoni} ta</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 font-medium">
                <span>Saqlangan vaqt: {item.vaqti || 'Nomaʼlum'}</span>
                <span className="text-green-600 font-bold">🔒 Himoyalangan</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}