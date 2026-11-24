'use client';
import React, { useEffect, useState } from 'react';
import { Tugma, Ikonka, xabarBer } from '@/components/ui';

type Pinlar = { admin: string; master: string; kontrolchi: string; mexanik: string };

const MAYDONLAR: { kalit: keyof Pinlar; nomi: string }[] = [
  { kalit: 'admin', nomi: 'Admin' },
  { kalit: 'master', nomi: 'Master' },
  { kalit: 'kontrolchi', nomi: 'Kontrolchi' },
  { kalit: 'mexanik', nomi: 'Mexanik' }
];

// Sozlamalar sahifasidagi "Xavfsizlik · PIN-kodlar" bo'limi (faqat admin). PIN-kodlar faqat serverda saqlanadi.
export default function PinKodlar() {
  const [pinlar, setPinlar] = useState<Pinlar>({ admin: '', master: '', kontrolchi: '', mexanik: '' });
  const [yuklandi, setYuklandi] = useState(false);
  const [xato, setXato] = useState('');
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [korinadi, setKorinadi] = useState(false);

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
      xabarBer('PIN-kodlar saqlandi');
      setKorinadi(false);
    } catch {
      setXato('Serverga ulanib bo\'lmadi');
    } finally {
      setSaqlanmoqda(false);
    }
  };

  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-sm font-semibold text-matn-2">Xavfsizlik · PIN-kodlar</h2>
      <div className="overflow-hidden rounded-karta border border-chiziq bg-sirt divide-y divide-chiziq">
        {MAYDONLAR.map((m) => (
          <label key={m.kalit} className="flex min-h-14 items-center gap-3 px-3 md:px-4 py-2">
            <span className="flex-1 text-[15px] text-matn">{m.nomi}</span>
            <input
              type={korinadi ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              disabled={!yuklandi}
              value={pinlar[m.kalit]}
              onChange={(e) => {
                setPinlar({ ...pinlar, [m.kalit]: e.target.value.replace(/\D/g, '') });
                setXato('');
              }}
              aria-label={`${m.nomi} PIN-kodi`}
              className="h-10 w-32 shrink-0 rounded-boshqaruv border border-chiziq-2 bg-sirt text-center text-base font-semibold tracking-[0.3em] text-matn tabular-nums outline-none focus:border-asosiy focus:ring-2 focus:ring-asosiy/20 disabled:bg-sirt-2"
            />
          </label>
        ))}
        <div className="flex items-center justify-between gap-3 px-3 md:px-4 py-2.5">
          <button
            type="button"
            onClick={() => setKorinadi(!korinadi)}
            className="inline-flex items-center gap-1.5 text-sm text-matn-2 hover:text-matn"
            aria-pressed={korinadi}
          >
            <Ikonka nom={korinadi ? 'yopish' : 'qidirish'} className="w-4 h-4" />
            {korinadi ? 'Yashirish' : "Ko'rsatish"}
          </button>
          <Tugma kichik tur="asosiy" onClick={saqlash} yuklanmoqda={saqlanmoqda} disabled={!yuklandi}>
            Saqlash
          </Tugma>
        </div>
      </div>
      {xato ? (
        <p className="mt-1.5 px-1 text-xs font-semibold text-xato">{xato}</p>
      ) : (
        <p className="mt-1.5 px-1 text-xs text-matn-3">6 xonali, hammasi har xil</p>
      )}
    </section>
  );
}
