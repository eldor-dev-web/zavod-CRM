import React from 'react';

// --- KICHIK VA CHIROYLI IKONKALAR ---
const Icons = {
  Calendar: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-indigo-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>,
  Shift: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Shield: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  User: () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
};

export default function SmenaFormasi({
  sana, setSana,
  smenaTuri, setSmenaTuri,
  kontrolchi, setKontrolchi,
  master, setMaster,
  topilganSmena
}: any) {
  const isYopiq = !!topilganSmena;

  return (
    // Mobilda 2 ta ustun (grid-cols-2), kompyuterda 4 ta ustun (lg:grid-cols-4). Tashqi ramkalar olib tashlandi.
    <div className="bg-white p-3 sm:p-5 w-full grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative">
      
      {/* Agar smena yopiq bo'lsa (yuklangan bo'lsa), ustiga xira parda tortiladi */}
      {isYopiq && (
        <div className="absolute inset-0 z-10 bg-slate-50/40 rounded-xl cursor-not-allowed" title="Bu smena yopilgan"></div>
      )}

      {/* SANA */}
      <div className="flex flex-col relative group">
        <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
          <Icons.Calendar /> Sana
        </label>
        <input 
          type="date" 
          value={sana} 
          onChange={(e) => setSana(e.target.value)} 
          disabled={isYopiq}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-3 text-xs sm:text-sm font-black text-slate-700 outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60" 
        />
      </div>

      {/* SMENA TURI */}
      <div className="flex flex-col relative group">
        <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
          <Icons.Shift /> Smena
        </label>
        <select 
          value={smenaTuri} 
          onChange={(e) => setSmenaTuri(e.target.value)} 
          disabled={isYopiq}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-3 text-xs sm:text-sm font-black text-slate-700 outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 appearance-none cursor-pointer"
        >
          <option>DEN</option>
          <option>NOCH</option>
        </select>
        {/* Select o'qi */}
        <div className="absolute right-3 bottom-3 sm:bottom-4 pointer-events-none text-slate-400">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </div>
      </div>

      {/* KONTROLCHI */}
      <div className="flex flex-col relative group">
        <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
          <Icons.Shield /> Kontrolchi
        </label>
        <input 
          type="text" 
          value={kontrolchi} 
          onChange={(e) => setKontrolchi(e.target.value)} 
          disabled={isYopiq}
          placeholder="Ismi..." 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-3 text-xs sm:text-sm font-black text-slate-700 outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 placeholder:text-slate-300 placeholder:font-medium" 
        />
      </div>

      {/* MASTER */}
      <div className="flex flex-col relative group">
        <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
          <Icons.User /> Master
        </label>
        <input 
          type="text" 
          value={master} 
          onChange={(e) => setMaster(e.target.value)} 
          disabled={isYopiq}
          placeholder="Ismi..." 
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-3 text-xs sm:text-sm font-black text-slate-700 outline-none transition-all focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 placeholder:text-slate-300 placeholder:font-medium" 
        />
      </div>

    </div>
  );
}