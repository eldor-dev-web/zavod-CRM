'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ikonka } from '@/components/ui';

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
        window.location.href = data.boshSahifa || (data.rol === 'admin' ? '/' : '/rulonlar');
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
    'h-16 rounded-karta bg-sirt-2 hover:bg-chiziq active:scale-95 text-2xl font-semibold text-matn flex items-center justify-center transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asosiy/40';

  return (
    <div className="min-h-[calc(100dvh-6rem)] md:min-h-[calc(100dvh-4rem)] w-full flex items-center justify-center select-none">
      <div className="bg-sirt border border-chiziq rounded-oyna shadow-sm w-full max-w-sm px-6 py-8 sm:px-8 sm:py-10 flex flex-col items-center">
        {/* LOGO VA SARLAVHA */}
        <div className="w-14 h-14 bg-asosiy rounded-karta flex items-center justify-center text-white text-2xl font-bold">Z</div>
        <h1 className="mt-4 text-2xl font-bold text-matn">Zavod CRM</h1>
        <p className="mt-1 text-sm text-matn-2">Kirish uchun PIN-kodni kiriting</p>

        {/* PIN NUQTALARI */}
        <div
          key={xatolik ? 'xato' : 'oddiy'}
          className={`flex gap-3.5 mt-8 ${xatolik ? 'animate-[zavod-silkinish_0.35s_ease-in-out]' : ''}`}
          aria-label={`${pin.length} ta raqam kiritildi`}
        >
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <span
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                xatolik ? 'bg-xato-fon' : pin.length > index ? `bg-asosiy scale-110 ${tekshirilmoqda ? 'animate-pulse' : ''}` : 'bg-chiziq-2'
              }`}
            />
          ))}
        </div>

        {/* HOLAT: xato yoki tekshirilmoqda */}
        <div className="h-6 mt-4 flex items-center justify-center" role="alert">
          {xatolik ? (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-xato">
              <Ikonka nom="ogohlantirish" className="w-4 h-4" />
              {xatolik}
            </span>
          ) : (
            tekshirilmoqda && <span className="text-sm font-medium text-matn-3">Tekshirilmoqda...</span>
          )}
        </div>

        {/* RAQAMLI KLAVIATURA */}
        <div className="grid grid-cols-3 gap-3 w-full mt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((raqam) => (
            <button key={raqam} type="button" disabled={tekshirilmoqda} onClick={() => raqamBosish(raqam)} className={tugmaKlassi}>
              {raqam}
            </button>
          ))}
          <div />
          <button type="button" disabled={tekshirilmoqda} onClick={() => raqamBosish('0')} className={tugmaKlassi}>
            0
          </button>
          <button
            type="button"
            disabled={tekshirilmoqda}
            onClick={ochirishBosish}
            className="h-16 rounded-karta text-matn-2 hover:bg-sirt-2 active:scale-95 flex items-center justify-center transition disabled:opacity-50"
            aria-label="Oxirgi raqamni o'chirish"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
              <path d="m18 9-6 6" />
              <path d="m12 9 6 6" />
            </svg>
          </button>
        </div>
        <p className="mt-6 text-xs text-matn-3">Kompyuter klaviaturasidan ham terish mumkin</p>
      </div>
    </div>
  );
}
