'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const MenuIcons = {
  Dashboard: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Rulon: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Brak: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Ishchilar: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Sozlamalar: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Key: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [foydalanuvchi, setFoydalanuvchi] = useState<{ ism: string; rol: string } | null>(null);
  const [kutilmoqda, setKutilmoqda] = useState(true);

  const [ochiq, setOchiq] = useState(true);
  const [mobilOchiq, setMobilOchiq] = useState(false);

  // Admin uchun Parollarni o'zgartirish oynasi
  const [parolModalOchiq, setParolModalOchiq] = useState(false);
  const [parollar, setParollar] = useState({ admin: '1111', master: '2222', kontrolchi: '3333' });
  const [saqlandiXabar, setSaqlandiXabar] = useState(false);

  const barchaMenyular = [
    { nomi: 'Asosiy Panel', manzil: '/', ruxsat: ['admin'], Icon: MenuIcons.Dashboard },
    { nomi: 'Rulonlar Hisobi', manzil: '/rulonlar', ruxsat: ['admin', 'master', 'kontrolchi'], Icon: MenuIcons.Rulon },
    { nomi: 'Braklar Hisobi', manzil: '/braklar', ruxsat: ['admin', 'master', 'kontrolchi'], Icon: MenuIcons.Brak },
    { nomi: 'Ishchilar va Oylik', manzil: '/ishchilar', ruxsat: ['admin', 'master'], Icon: MenuIcons.Ishchilar },
    { nomi: 'Sozlamalar', manzil: '/sozlamalar', ruxsat: ['admin'], Icon: MenuIcons.Sozlamalar }
  ];

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

    // Saqlangan parollarni o'qish
    try {
      const saqlanganParol = localStorage.getItem('zavod_parollar');
      if (saqlanganParol) {
        const p = JSON.parse(saqlanganParol);
        setParollar({
          admin: p.admin || '1111',
          master: p.master || '2222',
          kontrolchi: p.kontrolchi || '3333'
        });
      }
    } catch (e) {}

    const hozirgiSahifa = barchaMenyular.find((m) => m.manzil === pathname);
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
    ? barchaMenyular.filter((item) => item.ruxsat.includes(foydalanuvchi.rol))
    : [];

  const tizimdanChiqish = () => {
    localStorage.removeItem('zavod_foydalanuvchi');
    document.cookie = 'zavod_rol=; path=/; max-age=0';
    window.location.href = '/login';
  };

  const parollarniSaqlash = () => {
    const tozaParollar = {
      admin: parollar.admin.length === 4 ? parollar.admin : '1111',
      master: parollar.master.length === 4 ? parollar.master : '2222',
      kontrolchi: parollar.kontrolchi.length === 4 ? parollar.kontrolchi : '3333'
    };
    setParollar(tozaParollar);
    localStorage.setItem('zavod_parollar', JSON.stringify(tozaParollar));
    setSaqlandiXabar(true);
    setTimeout(() => {
      setSaqlandiXabar(false);
      setParolModalOchiq(false);
    }, 900);
  };

  if (pathname === '/login') return null;
  if (kutilmoqda || !foydalanuvchi) return null;

  return (
    <>
      {/* 1. MOBIL UCHUN GAMBURGER TUGMA */}
      <button
        onClick={() => setMobilOchiq(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700/80 flex items-center justify-center transition-all"
      >
        <span className="text-lg leading-none">☰</span>
      </button>

      {/* 2. MOBIL UCHUN QORONG'I ORQA FON */}
      {mobilOchiq && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity"
          onClick={() => setMobilOchiq(false)}
        />
      )}

      {/* 3. ASOSIY YON PANEL */}
      <div
        className={`
          bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800/80 z-50 transition-all duration-300
          fixed md:sticky top-0 left-0
          ${mobilOchiq ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          w-[260px] ${ochiq ? 'md:w-[260px]' : 'md:w-[80px]'}
        `}
      >
        {/* LOGO VA YOPISH TUGMALARI */}
        <div className={`p-4 flex items-center h-20 border-b border-slate-800/60 ${ochiq ? 'justify-between' : 'justify-between md:justify-center md:flex-col'}`}>
          <div className={`flex items-center gap-3 ${!ochiq && 'md:hidden'}`}>
            <div className="w-9 h-9 min-w-[36px] bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/30">
              Z
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight whitespace-nowrap leading-none">
                Zavod <span className="text-indigo-400">CRM</span>
              </h1>
              <span className="text-[10px] font-semibold text-slate-500">Boshqaruv tizimi</span>
            </div>
          </div>

          {!ochiq && (
            <div className="hidden md:flex w-9 h-9 mb-1 min-w-[36px] bg-indigo-600 rounded-xl items-center justify-center text-white font-black shadow-md shadow-indigo-500/30">
              Z
            </div>
          )}

          <button
            onClick={() => setOchiq(!ochiq)}
            className="hidden md:flex w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg items-center justify-center transition-colors text-xs"
          >
            {ochiq ? '◀' : '▶'}
          </button>

          <button
            onClick={() => setMobilOchiq(false)}
            className="md:hidden w-8 h-8 bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 rounded-lg flex items-center justify-center transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* MENYU BANDLARI */}
        <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-x-hidden overflow-y-auto custom-scrollbar">
          {ruxsatEtilganMenyular.map((item, idx) => {
            const faol = pathname === item.manzil;
            const IconComp = item.Icon;
            return (
              <Link key={idx} href={item.manzil} title={!ochiq ? item.nomi : ''}>
                <div
                  className={`flex items-center rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    faol
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  } ${ochiq ? 'gap-3 px-3.5 py-3' : 'gap-3 px-3.5 py-3 md:justify-center md:px-0 md:py-3'}`}
                >
                  <IconComp />
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${ochiq ? 'opacity-100 block' : 'opacity-100 block md:hidden md:opacity-0'}`}>
                    {item.nomi}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* ADMIN UCHUN PAROLLARNI BOSHQARISH TUGMASI */}
        {foydalanuvchi.rol === 'admin' && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setParolModalOchiq(true)}
              title="PIN-kodlarni oʻzgartirish"
              className={`w-full flex items-center rounded-xl text-xs font-bold bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 transition-all ${
                ochiq ? 'gap-2.5 px-3.5 py-2.5 justify-start' : 'gap-2.5 px-3.5 py-2.5 md:justify-center md:px-0'
              }`}
            >
              <MenuIcons.Key />
              <span className={`${!ochiq ? 'md:hidden' : ''}`}>PIN-kodlarni boshqarish</span>
            </button>
          </div>
        )}

        {/* PROFIL VA CHIQISH QISMI */}
        <div className="p-3 border-t border-slate-800/80">
          <div className={`flex bg-slate-800/60 rounded-2xl border border-slate-700/40 transition-all ${ochiq ? 'items-center justify-between p-3' : 'items-center justify-between p-3 md:flex-col md:p-2 md:gap-2.5'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 min-w-[36px] bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center text-indigo-300 font-black text-sm">
                {foydalanuvchi.rol === 'admin' ? '👑' : foydalanuvchi.rol === 'master' ? '👷‍♂️' : '🔍'}
              </div>

              <div className={`min-w-0 ${!ochiq ? 'md:hidden' : ''}`}>
                <p className="text-xs font-black text-white truncate">{foydalanuvchi.ism}</p>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Faol sessiya
                </p>
              </div>
            </div>

            <button
              onClick={tizimdanChiqish}
              className="w-8 h-8 min-w-[32px] bg-slate-700/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition-all"
              title="Rolni almashtirish / Chiqish"
            >
              <MenuIcons.Logout />
            </button>
          </div>
        </div>
      </div>

      {/* 4. PAROLLARNI BOSHQARISH MODALI (FAQAT ADMIN UCHUN) */}
      {parolModalOchiq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">PIN-kodlarni boshqarish</h3>
                <p className="text-xs text-slate-400 font-medium">4 xonali kirish parollarini yangilash</p>
              </div>
              <button
                onClick={() => setParolModalOchiq(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 mb-5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">👑 Boshqaruvchi (Admin) PIN-kodi</label>
                <input
                  type="text"
                  maxLength={4}
                  value={parollar.admin}
                  onChange={(e) => setParollar({ ...parollar, admin: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-black text-base tracking-widest text-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">👷‍♂️ Smena Masteri PIN-kodi</label>
                <input
                  type="text"
                  maxLength={4}
                  value={parollar.master}
                  onChange={(e) => setParollar({ ...parollar, master: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-black text-base tracking-widest text-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">🔍 Kontrolchi PIN-kodi</label>
                <input
                  type="text"
                  maxLength={4}
                  value={parollar.kontrolchi}
                  onChange={(e) => setParollar({ ...parollar, kontrolchi: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-black text-base tracking-widest text-slate-900 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={parollarniSaqlash}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all"
            >
              {saqlandiXabar ? '✓ Bazaga saqlandi!' : 'Parollarni saqlash'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}