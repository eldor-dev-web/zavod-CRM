'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [foydalanuvchi, setFoydalanuvchi] = useState<{ ism: string, rol: string } | null>(null);
  const [kutilmoqda, setKutilmoqda] = useState(true);
  
  // Ochiq/Yopiq holatlari
  const [ochiq, setOchiq] = useState(true); // Kompyuter uchun (keng/torgina holat)
  const [mobilOchiq, setMobilOchiq] = useState(false); // Mobil telefon uchun (sirpanib chiqish)

  const barchaMenyular = [
    { nomi: 'Asosiy Panel', manzil: '/', ruxsat: ['admin'], icon: '📊' },
    { nomi: 'Rulonlar Hisobi', manzil: '/rulonlar', ruxsat: ['admin', 'master', 'kontrolchi'], icon: '🛢️' },
    { nomi: 'Braklar Hisobi', manzil: '/braklar', ruxsat: ['admin', 'master'], icon: '⚠️' },
    { nomi: 'Ishchilar va Oylik', manzil: '/ishchilar', ruxsat: ['admin'], icon: '👥' },
    { nomi: 'Sozlamalar', manzil: '/sozlamalar', ruxsat: ['admin'], icon: '⚙️' }
  ];

  // Telefonda biror menyuga bosganda (sahifa o'zgarganda) panelni avtomatik yopish
  useEffect(() => {
    setMobilOchiq(false);
  }, [pathname]);

  useEffect(() => {
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
    document.cookie = "zavod_rol=; path=/; max-age=0"; 
    window.location.href = '/login';
  };

  if (pathname === '/login') return null;
  if (kutilmoqda || !foydalanuvchi) return null;

  return (
    <>
      {/* 1. MOBIL UCHUN GAMBURGER TUGMA (Kompyuterda yashirinadi) */}
      <button
        onClick={() => setMobilOchiq(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-lg border border-slate-700 flex items-center justify-center transition-all"
      >
        <span className="text-xl leading-none">☰</span>
      </button>

      {/* 2. MOBIL UCHUN QORONG'I ORQA FON (Faqat menyu ochiq bo'lganda ko'rinadi) */}
      {mobilOchiq && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobilOchiq(false)}
        />
      )}

      {/* 3. ASOSIY YON PANEL (Responsive qilingan) */}
      <div className={`
        bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 z-50 transition-transform duration-300
        /* Kompyuterda: Joyida turadi, Mobilda: Ekranga yopishib, yon tomondan chiqadi */
        fixed md:sticky top-0 left-0
        ${mobilOchiq ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        w-[260px] ${ochiq ? 'md:w-[260px]' : 'md:w-[80px]'}
      `}>
        
        {/* LOGO VA YOPISH TUGMALARI */}
        <div className={`p-4 flex items-center h-20 ${ochiq ? 'justify-between' : 'justify-between md:justify-center md:flex-col'}`}>
          <div className={`flex items-center gap-3 ${!ochiq && 'md:hidden'}`}>
            <div className="w-8 h-8 min-w-[32px] bg-blue-600 rounded-lg flex items-center justify-center text-white font-black shadow-md shadow-blue-500/30">Z</div>
            <h1 className="text-xl font-black text-white tracking-tight whitespace-nowrap">Zavod <span className="text-blue-500">CRM</span></h1>
          </div>
          
          {/* Kichraytirilgandagi Logo (Faqat kompyuterda) */}
          {!ochiq && (
            <div className="hidden md:flex w-8 h-8 mb-2 min-w-[32px] bg-blue-600 rounded-lg items-center justify-center text-white font-black shadow-md shadow-blue-500/30">Z</div>
          )}

          {/* Kompyuter uchun kichraytirish tugmasi */}
          <button 
            onClick={() => setOchiq(!ochiq)}
            className="hidden md:flex w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg items-center justify-center transition-colors"
          >
            {ochiq ? '◀' : '▶'}
          </button>

          {/* Mobil uchun yopish tugmasi (X) */}
          <button 
            onClick={() => setMobilOchiq(false)}
            className="md:hidden w-8 h-8 bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 rounded-lg flex items-center justify-center transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* MENYU BANDLARI */}
        <nav className="flex-1 px-3 space-y-2 mt-2 overflow-x-hidden overflow-y-auto custom-scrollbar">
          {ruxsatEtilganMenyular.map((item, idx) => {
            const faol = pathname === item.manzil;
            return (
              <Link key={idx} href={item.manzil} title={!ochiq ? item.nomi : ''}>
                <div className={`flex items-center rounded-xl text-sm font-bold transition-all mt-1 ${
                  faol ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'
                } ${ochiq ? 'gap-3 px-4 py-3' : 'gap-3 px-4 py-3 md:justify-center md:px-0 md:py-3'}`}>
                  <span className="text-lg">{item.icon}</span>
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${ochiq ? 'opacity-100 block' : 'opacity-100 block md:hidden md:opacity-0'}`}>
                    {item.nomi}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* PROFIL QISMI */}
        <div className="p-3 border-t border-slate-800 mt-auto">
          <div className={`flex bg-slate-800/60 rounded-xl transition-all ${ochiq ? 'items-center justify-between p-3' : 'items-center justify-between p-3 md:flex-col md:p-2 md:gap-3'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 min-w-[32px] bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
                {foydalanuvchi.ism.charAt(0)}
              </div>
              
              <div className={`${!ochiq ? 'md:hidden' : ''}`}>
                <p className="text-[11px] text-green-400 font-black mb-0.5 flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse"></span> Tizim faol
                </p>
                <p className="text-[10px] text-white bg-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider inline-block">
                  {foydalanuvchi.rol}
                </p>
              </div>
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
    </>
  );
}