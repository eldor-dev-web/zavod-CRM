'use client';
import React, { useState, useEffect } from 'react';

export default function LoginSahifasi() {
  const [pin, setPin] = useState('');
  const [xatolik, setXatolik] = useState('');

  useEffect(() => {
    if (pin.length === 4) {
      tekshirish(pin);
    }
  }, [pin]);

  const raqamBosish = (raqam: string) => {
    if (pin.length < 4) {
      setXatolik('');
      setPin(prev => prev + raqam);
    }
  };

  const ochirishBosish = () => {
    setPin(prev => prev.slice(0, -1));
    setXatolik('');
  };

  const tekshirish = (kiritilganPin: string) => {
    // 🛡️ HIMOYA: Middleware uchun 24 soatlik ruxsatnoma (Cookie) yozamiz
    const cookieSozlama = "path=/; max-age=86400"; 

    if (kiritilganPin === '1111') {
      localStorage.setItem('zavod_foydalanuvchi', JSON.stringify({ ism: 'Boshqaruvchi', rol: 'admin' }));
      document.cookie = `zavod_rol=admin; ${cookieSozlama}`; // Qorovulga ruxsatnoma
      window.location.href = '/'; 
    } else if (kiritilganPin === '2222') {
      localStorage.setItem('zavod_foydalanuvchi', JSON.stringify({ ism: 'Smena Masteri', rol: 'master' }));
      document.cookie = `zavod_rol=master; ${cookieSozlama}`;
      window.location.href = '/rulonlar';
    } else if (kiritilganPin === '3333') {
      localStorage.setItem('zavod_foydalanuvchi', JSON.stringify({ ism: 'Kontrolchi', rol: 'kontrolchi' }));
      document.cookie = `zavod_rol=kontrolchi; ${cookieSozlama}`;
      window.location.href = '/rulonlar';
    } else {
      setXatolik('Parol notoʻgʻri!');
      setTimeout(() => setPin(''), 600); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-blue-900/5 w-full max-w-sm border border-slate-100 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-5 shadow-lg shadow-blue-600/30">
            Z
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Zavod CRM</h1>
          <p className="text-sm font-semibold text-slate-400 mt-2">Kirish uchun parolni tering</p>
        </div>

        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > index ? 'bg-blue-600 scale-125 shadow-md shadow-blue-500/40' : 'bg-slate-200'
              } ${xatolik ? 'bg-red-500 animate-pulse' : ''}`}
            ></div>
          ))}
        </div>

        <div className="h-6 mb-4">
          {xatolik && (
            <span className="text-red-500 text-xs font-black tracking-wide bg-red-50 px-4 py-1.5 rounded-full border border-red-100">
              {xatolik}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-5 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((raqam) => (
            <button
              key={raqam}
              onClick={() => raqamBosish(raqam)}
              className="w-16 h-16 rounded-full bg-slate-50 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 active:scale-95 active:bg-slate-100 border border-slate-100 text-2xl font-black text-slate-700 flex items-center justify-center transition-all mx-auto"
            >
              {raqam}
            </button>
          ))}
          <div className="w-16 h-16"></div>
          <button
            onClick={() => raqamBosish('0')}
            className="w-16 h-16 rounded-full bg-slate-50 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 active:scale-95 active:bg-slate-100 border border-slate-100 text-2xl font-black text-slate-700 flex items-center justify-center transition-all mx-auto"
          >
            0
          </button>
          <button
            onClick={ochirishBosish}
            className="w-16 h-16 rounded-full bg-red-50/50 hover:bg-red-50 hover:shadow-md hover:shadow-red-500/20 active:scale-95 active:bg-red-100 border border-red-100/50 text-xl font-black text-red-500 flex items-center justify-center transition-all mx-auto"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}