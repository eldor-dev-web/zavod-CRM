'use client';
import React, { useEffect, useState } from 'react';

type Pinlar = { admin: string; master: string; kontrolchi: string; mexanik: string };

const MAYDONLAR: { kalit: keyof Pinlar; nomi: string }[] = [
  { kalit: 'admin', nomi: 'Boshqaruvchi (admin)' },
  { kalit: 'master', nomi: 'Smena masteri' },
  { kalit: 'kontrolchi', nomi: 'Kontrolchi' },
  { kalit: 'mexanik', nomi: 'Mexanik' }
];

// Sozlamalar sahifasidagi "PIN-kodlar" bo'limi (faqat admin). PIN-kodlar faqat serverda saqlanadi.
export default function PinKodlar() {
  const [pinlar, setPinlar] = useState<Pinlar>({ admin: '', master: '', kontrolchi: '', mexanik: '' });
  const [yuklandi, setYuklandi] = useState(false);
  const [xato, setXato] = useState('');
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [saqlandi, setSaqlandi] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/pin', { cache: 'no-store' });
        if (res.ok) setPinlar(await res.json());
        else setXato('PIN-kodlarni yuklab bo\'lmadi');
      } catch {
        setXato('Serverga ulanib bo\'lmadi');
      } finally {
        setYuklandi(true);
      }
    })();
  }, []);

  const saqlash = async () => {
    setXato('');
    setSaqlandi(false);
    const qiymatlar = Object.values(pinlar);
    if (!qiymatlar.every((p) => /^\d{6}$/.test(p))) return setXato('Har bir PIN-kod aynan 6 ta raqam bo\'lishi kerak');
    if (new Set(qiymatlar).size !== 4) return setXato('PIN-kodlar bir-biridan farq qilishi kerak');

    setSaqlanmoqda(true);
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinlar)
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return setXato(d.xato || 'Saqlab bo\'lmadi');
      setSaqlandi(true);
      setTimeout(() => setSaqlandi(false), 2500);
    } catch {
      setXato('Serverga ulanib bo\'lmadi');
    } finally {
      setSaqlanmoqda(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-base font-black text-gray-800 mb-1 flex items-center gap-2">
        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        PIN-kodlar
      </h2>
      <p className="text-xs text-gray-500 font-medium mb-4 pb-3 border-b border-gray-100">Har bir rol uchun 6 xonali kirish kodi. Hammasi har xil bo&apos;lishi kerak.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {MAYDONLAR.map((m) => (
          <label key={m.kalit} className="block">
            <span className="text-xs font-bold text-gray-600 block mb-1">{m.nomi}</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              disabled={!yuklandi}
              value={pinlar[m.kalit]}
              onChange={(e) => setPinlar({ ...pinlar, [m.kalit]: e.target.value.replace(/\D/g, '') })}
              className="w-full h-11 px-3 rounded-lg border border-gray-300 font-black text-base tracking-[0.3em] text-gray-900 outline-none focus:border-indigo-500 disabled:bg-gray-50"
            />
          </label>
        ))}
      </div>

      {xato && <p className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">{xato}</p>}

      <button
        type="button"
        onClick={saqlash}
        disabled={saqlanmoqda || !yuklandi}
        className="w-full sm:w-auto h-11 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black text-sm transition"
      >
        {saqlandi ? '✓ Saqlandi' : saqlanmoqda ? 'Saqlanmoqda...' : 'PIN-kodlarni saqlash'}
      </button>
    </div>
  );
}
