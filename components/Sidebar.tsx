'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  // 1. Barcha Hook'lar (useState, useEffect, usePathname) doim eng tepada bo'lishi shart!
  const pathname = usePathname();
  const router = useRouter();
  const [foydalanuvchi, setFoydalanuvchi] = useState<{ ism: string, rol: string } | null>(null);
  const [kutilmoqda, setKutilmoqda] = useState(true);
  const [ochiq, setOchiq] = useState(true);

  const barchaMenyular = [
    { nomi: 'Asosiy Panel', manzil: '/', ruxsat: ['admin'], icon: '📊' },
    { nomi: 'Rulonlar Hisobi', manzil: '/rulonlar', ruxsat: ['admin', 'master', 'kontrolchi'], icon: '🛢️' },
    { nomi: 'Braklar Hisobi', manzil: '/braklar', ruxsat: ['admin', 'master'], icon: '⚠️' },
    { nomi: 'Ishchilar va Oylik', manzil: '/ishchilar', ruxsat: ['admin'], icon: '👥' },
    { nomi: 'Sozlamalar', manzil: '/sozlamalar', ruxsat: ['admin'], icon: '⚙️' }
  ];

  useEffect(() => {
    // Agar login sahifasida turgan bo'lsak, xotirani tekshirib o'tirmaymiz
    if (pathname === '/login') {
      setKutilmoqda(false);
      return;
    }

    const saqlanganUser = localStorage.getItem('zavod_foydalanuvchi');
    if (!saqlanganUser) {
      router.push('/login'); 
      return;
    }
    
    const user = JSON.parse(saqlanganUser);
    setFoydalanuvchi(user);

    // Qat'iy himoya: Ruxsati yo'q joyga o'tishni cheklash
    const hozirgiSahifa = barchaMenyular.find(m => m.manzil === pathname);
    if (hozirgiSahifa && !hozirgiSahifa.ruxsat.includes(user.rol)) {
      if (user.rol === 'admin') {
        router.push('/');
      } else {
        router.push('/rulonlar');
      }
    }
    
    setKutilmoqda(false);
  }, [pathname, router]);

  const ruxsatEtilganMenyular = foydalanuvchi 
    ? barchaMenyular.filter(item => item.ruxsat.includes(foydalanuvchi.rol))
    : [];

  const tizimdanChiqish = () => {
    localStorage.removeItem('zavod_foydalanuvchi');
    document.cookie = "zavod_rol=; path=/; max-age=0"; // HIMOYA: Cookie'ni o'ldiramiz!
    window.location.href = '/login';
  };

  // 🛑 2. MANA SHU YERGA KO'CHIRILDI: Hook'lar ishlab bo'lgandan keyin return qilinadi!
  if (pathname === '/login') {
    return null; // Login sahifasida yon panelni yashirish
  }

  if (kutilmoqda || !foydalanuvchi) return null;

  // 3. Asosiy dizayn qaytariladi
  return (
    <div className={`bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-800 z-40 transition-all duration-300 ${ochiq ? 'w-[260px]' : 'w-[80px]'}`}>
      
      <div className={`p-4 flex items-center h-20 ${ochiq ? 'justify-between' : 'justify-center flex-col'}`}>
        <div className={`flex items-center gap-3 ${!ochiq && 'hidden'}`}>
          <div className="w-8 h-8 min-w-[32px] bg-blue-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-blue-500/30">Z</div>
          <h1 className="text-xl font-black text-white tracking-tight whitespace-nowrap">Zavod <span className="text-blue-500">CRM</span></h1>
        </div>
        
        {!ochiq && (
          <div className="w-8 h-8 mb-2 min-w-[32px] bg-blue-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-blue-500/30">Z</div>
        )}

        <button 
          onClick={() => setOchiq(!ochiq)}
          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-colors"
        >
          {ochiq ? '◀' : '▶'}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-2 overflow-x-hidden">
        {ruxsatEtilganMenyular.map((item, idx) => {
          const faol = pathname === item.manzil;
          return (
            <Link key={idx} href={item.manzil} title={!ochiq ? item.nomi : ''}>
              <div className={`flex items-center rounded-xl text-sm font-bold transition-all mt-1 ${
                faol ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'
              } ${ochiq ? 'gap-3 px-4 py-3' : 'justify-center py-3'}`}>
                <span className="text-lg">{item.icon}</span>
                <span className={`whitespace-nowrap transition-opacity duration-200 ${ochiq ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                  {item.nomi}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 mt-auto">
        <div className={`flex bg-slate-800/60 rounded-xl transition-all ${ochiq ? 'items-center justify-between p-3' : 'flex-col items-center p-2 gap-3'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 min-w-[32px] bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
              {foydalanuvchi.ism.charAt(0)}
            </div>
            
            {ochiq && (
              <div>
                <p className="text-[11px] text-green-400 font-black mb-0.5 flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span> Tizim faol
                </p>
                <p className="text-[10px] text-white bg-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider inline-block">
                  {foydalanuvchi.rol}
                </p>
              </div>
            )}
          </div>
          
          <button 
            onClick={tizimdanChiqish} 
            className="w-8 h-8 min-w-[32px] bg-slate-700 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-all" 
            title="Tizimdan chiqish"
          >
            🚪
          </button>
        </div>
      </div>
    </div>
  );
}