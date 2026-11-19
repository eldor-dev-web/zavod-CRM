'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function LoginSahifasi() {
  const [pin, setPin] = useState('');
  const [xatolik, setXatolik] = useState('');
  const [tekshirilmoqda, setTekshirilmoqda] = useState(false);
  const yuborilmoqda = useRef(false);

  // PIN serverda tekshiriladi. To'g'ri bo'lsa server himoyalangan sessiya cookie'sini qo'yadi.
  const tekshirish = useCallback(async (kiritilganPin: string) => {
    if (yuborilmoqda.current) return;
    yuborilmoqda.current = true;
    setTekshirilmoqda(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: kiritilganPin })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.rol) {
        // Faqat ko'rsatish uchun (ism va rol). Ruxsatlarni server cookie orqali tekshiradi.
        localStorage.setItem('zavod_foydalanuvchi', JSON.stringify({ ism: data.ism, rol: data.rol }));
        localStorage.removeItem('zavod_parollar');
        window.location.href = data.rol === 'admin' ? '/' : '/rulonlar';
        return;
      }

      setXatolik(data.xato || 'PIN-kod noto\'g\'ri');
    } catch {
      setXatolik('Serverga ulanib bo\'lmadi');
    }

    setTimeout(() => setPin(''), 550);
    setTekshirilmoqda(false);
    yuborilmoqda.current = false;
  }, []);

  useEffect(() => {
    if (pin.length === 6) tekshirish(pin);
  }, [pin, tekshirish]);

  const raqamBosish = useCallback((raqam: string) => {
    if (yuborilmoqda.current) return;
    setXatolik('');
    setPin((prev) => (prev.length < 6 ? prev + raqam : prev));
  }, []);

  const ochirishBosish = useCallback(() => {
    if (yuborilmoqda.current) return;
    setPin((prev) => prev.slice(0, -1));
    setXatolik('');
  }, []);

  // Kompyuter klaviaturasidan terish (0-9, Backspace, Escape)
  useEffect(() => {
    const klaviaturaHodisasi = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') raqamBosish(e.key);
      else if (e.key === 'Backspace') ochirishBosish();
      else if (e.key === 'Escape' && !yuborilmoqda.current) {
        setPin('');
        setXatolik('');
      }
    };
    window.addEventListener('keydown', klaviaturaHodisasi);
    return () => window.removeEventListener('keydown', klaviaturaHodisasi);
  }, [raqamBosish, ochirishBosish]);

  const tugmaKlassi =
    'w-16 h-16 rounded-full bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-300 active:scale-95 active:bg-slate-100 border border-slate-200/70 text-2xl font-black text-slate-700 flex items-center justify-center transition-all mx-auto disabled:opacity-50';

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-slate-50 p-4 select-none">
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-900/5 w-full max-w-sm border border-slate-200/80 flex flex-col items-center">
        {/* 1. LOGO VA SARLAVHA */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-lg shadow-indigo-600/30">
            Z
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Zavod CRM</h1>
          <p className="text-sm font-semibold text-slate-400 mt-1.5">Kirish uchun shaxsiy PIN-kodni tering</p>
        </div>

        {/* 2. PIN INDIKATOR NUQTALARI */}
        <div className="flex gap-4 mb-6" aria-label={`${pin.length} ta raqam kiritildi`}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                xatolik
                  ? 'bg-rose-500 scale-110 animate-bounce'
                  : pin.length > index
                  ? `bg-indigo-600 scale-125 shadow-md shadow-indigo-500/40 ${tekshirilmoqda ? 'animate-pulse' : ''}`
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* 3. XATOLIK XABARI */}
        <div className="h-6 mb-5 flex items-center justify-center" role="alert">
          {xatolik && (
            <span className="text-rose-600 text-xs font-black tracking-wide bg-rose-50 px-4 py-1 rounded-full border border-rose-200 text-center">
              {xatolik}
            </span>
          )}
        </div>

        {/* 4. RAQAMLI KLAVIATURA */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[250px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((raqam) => (
            <button key={raqam} type="button" disabled={tekshirilmoqda} onClick={() => raqamBosish(raqam)} className={tugmaKlassi}>
              {raqam}
            </button>
          ))}

          <div className="w-16 h-16" />

          <button type="button" disabled={tekshirilmoqda} onClick={() => raqamBosish('0')} className={tugmaKlassi}>
            0
          </button>

          <button
            type="button"
            disabled={tekshirilmoqda}
            onClick={ochirishBosish}
            className="w-16 h-16 rounded-full bg-rose-50/60 hover:bg-rose-50 hover:shadow-md active:scale-95 border border-rose-100 text-xl font-black text-rose-500 flex items-center justify-center transition-all mx-auto disabled:opacity-50"
            title="Oʻchirish"
            aria-label="Oxirgi raqamni o'chirish"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
