'use client';
import React, { useState, useEffect, useCallback } from 'react';

export default function LoginSahifasi() {
  const [pin, setPin] = useState('');
  const [xatolik, setXatolik] = useState('');
  const [parollar, setParollar] = useState({
    admin: '111111',
    master: '222222',
    kontrolchi: '333333'
  });

  // Bazadan (localStorage) saqlangan parollarni yuklash
  useEffect(() => {
    const yuklash = () => {
      try {
        const saqlangan = localStorage.getItem('zavod_parollar');
        if (saqlangan) {
          const parsed = JSON.parse(saqlangan);
          setParollar({
            admin: parsed.admin?.length === 6 ? parsed.admin : '111111',
            master: parsed.master?.length === 6 ? parsed.master : '222222',
            kontrolchi: parsed.kontrolchi?.length === 6 ? parsed.kontrolchi : '333333'
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    yuklash();
    window.addEventListener('storage', yuklash);
    return () => window.removeEventListener('storage', yuklash);
  }, []);

  // Parolga qarab kim kirayotganini avtomatik aniqlash
  const tekshirish = useCallback(
    (kiritilganPin: string) => {
      const cookieSozlama = 'path=/; max-age=86400';

      if (kiritilganPin === parollar.admin) {
        localStorage.setItem('zavod_foydalanuvchi', JSON.stringify({ ism: 'Boshqaruvchi', rol: 'admin' }));
        document.cookie = `zavod_rol=admin; ${cookieSozlama}`;
        window.location.href = '/';
      } else if (kiritilganPin === parollar.master) {
        localStorage.setItem('zavod_foydalanuvchi', JSON.stringify({ ism: 'Smena Masteri', rol: 'master' }));
        document.cookie = `zavod_rol=master; ${cookieSozlama}`;
        window.location.href = '/rulonlar';
      } else if (kiritilganPin === parollar.kontrolchi) {
        localStorage.setItem('zavod_foydalanuvchi', JSON.stringify({ ism: 'Kontrolchi', rol: 'kontrolchi' }));
        document.cookie = `zavod_rol=kontrolchi; ${cookieSozlama}`;
        window.location.href = '/rulonlar';
      } else {
        setXatolik('Parol notoʻgʻri!');
        setTimeout(() => setPin(''), 550);
      }
    },
    [parollar]
  );

  useEffect(() => {
    if (pin.length === 6) {
      tekshirish(pin);
    }
  }, [pin, tekshirish]);

  const raqamBosish = useCallback((raqam: string) => {
    setPin((prev) => {
      if (prev.length < 6) {
        setXatolik('');
        return prev + raqam;
      }
      return prev;
    });
  }, []);

  const ochirishBosish = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setXatolik('');
  }, []);

  // Kompyuter klaviaturasidan terish imkoniyati (0-9 va Backspace)
  useEffect(() => {
    const klaviaturaHodisasi = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        raqamBosish(e.key);
      } else if (e.key === 'Backspace') {
        ochirishBosish();
      } else if (e.key === 'Escape') {
        setPin('');
        setXatolik('');
      }
    };
    window.addEventListener('keydown', klaviaturaHodisasi);
    return () => window.removeEventListener('keydown', klaviaturaHodisasi);
  }, [raqamBosish, ochirishBosish]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] p-4 font-sans select-none">
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-900/5 w-full max-w-sm border border-slate-200/80 flex flex-col items-center">
        
        {/* 1. LOGO VA SARLAVHA */}
        <div className="text-center mb-8">
          <div className="w-18 h-18 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-lg shadow-indigo-600/30">
            Z
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Zavod CRM</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1.5">Kirish uchun shaxsiy PIN-kodni tering</p>
        </div>

        {/* 2. PIN INDIKATOR NUQTALARI */}
        <div className="flex gap-4 mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                xatolik
                  ? 'bg-rose-500 scale-110 animate-bounce'
                  : pin.length > index
                  ? 'bg-indigo-600 scale-125 shadow-md shadow-indigo-500/40'
                  : 'bg-slate-200'
              }`}
            ></div>
          ))}
        </div>

        {/* 3. XATOLIK XABARI */}
        <div className="h-6 mb-5 flex items-center justify-center">
          {xatolik && (
            <span className="text-rose-600 text-xs font-black tracking-wide bg-rose-50 px-4 py-1 rounded-full border border-rose-200">
              {xatolik}
            </span>
          )}
        </div>

        {/* 4. RAQAMLI KLAVIATURA */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[250px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((raqam) => (
            <button
              key={raqam}
              type="button"
              onClick={() => raqamBosish(raqam)}
              className="w-16 h-16 rounded-full bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-300 active:scale-95 active:bg-slate-100 border border-slate-200/70 text-2xl font-black text-slate-700 flex items-center justify-center transition-all mx-auto"
            >
              {raqam}
            </button>
          ))}

          <div className="w-16 h-16"></div>

          <button
            type="button"
            onClick={() => raqamBosish('0')}
            className="w-16 h-16 rounded-full bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-300 active:scale-95 active:bg-slate-100 border border-slate-200/70 text-2xl font-black text-slate-700 flex items-center justify-center transition-all mx-auto"
          >
            0
          </button>

          <button
            type="button"
            onClick={ochirishBosish}
            className="w-16 h-16 rounded-full bg-rose-50/60 hover:bg-rose-50 hover:shadow-md hover:shadow-rose-500/10 active:scale-95 border border-rose-100 text-xl font-black text-rose-500 flex items-center justify-center transition-all mx-auto"
            title="Oʻchirish"
          >
            ⌫
          </button>
        </div>

      </div>
    </div>
  );
}