'use client';
import React, { useState, useEffect } from 'react';
import { Oyna, Maydon, Tanlash, Tugma } from '@/components/ui';

interface XodimModalProps {
  ochiq: boolean;
  yopish: () => void;
  tanlanganXodim: any | null;
  lavozimlarBazasi: any[];
  saqlash: (xodimData: { id?: number | string; ism: string; lavozimi: string; telefon: string }) => void;
  ochirish?: (id: number | string, ism: string) => void;
}

// Xodim qo'shish / tahrirlash oynasi (telefonda pastdan chiqadi)
export default function XodimModal({ ochiq, yopish, tanlanganXodim, lavozimlarBazasi, saqlash, ochirish }: XodimModalProps) {
  const [ism, setIsm] = useState('');
  const [lavozimi, setLavozimi] = useState('');
  const [telefon, setTelefon] = useState('');
  const [xatolik, setXatolik] = useState<{ ism?: string; lavozimi?: string }>({});

  useEffect(() => {
    if (tanlanganXodim) {
      setIsm(tanlanganXodim.ism || '');
      setLavozimi(tanlanganXodim.lavozimi || '');
      setTelefon(tanlanganXodim.telefon || '+998 ');
    } else {
      setIsm('');
      setLavozimi(lavozimlarBazasi[0]?.nomi || '');
      setTelefon('+998 ');
    }
    setXatolik({});
  }, [tanlanganXodim, ochiq, lavozimlarBazasi]);

  const formaniSaqlash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ism.trim()) {
      setXatolik({ ism: 'Xodim ismini kiriting' });
      return;
    }
    if (!lavozimi) {
      setXatolik({ lavozimi: 'Lavozimni tanlang' });
      return;
    }
    saqlash({ id: tanlanganXodim?.id, ism: ism.trim(), lavozimi, telefon: telefon.trim() });
    yopish();
  };

  return (
    <Oyna ochiq={ochiq} yopish={yopish} sarlavha={tanlanganXodim ? 'Xodimni tahrirlash' : 'Yangi xodim'} kenglik="max-w-sm">
      <form onSubmit={formaniSaqlash} className="space-y-4">
        <Maydon
          yorliq="Ism-familiya"
          autoFocus
          value={ism}
          onChange={(e) => {
            setIsm(e.target.value);
            if (xatolik.ism) setXatolik({});
          }}
          placeholder="Ismni kiriting"
          xato={xatolik.ism}
        />

        <Tanlash
          yorliq="Lavozim"
          value={lavozimi}
          onChange={(e) => {
            setLavozimi(e.target.value);
            if (xatolik.lavozimi) setXatolik({});
          }}
          xato={xatolik.lavozimi}
        >
          <option value="" disabled>
            Tanlang...
          </option>
          {lavozimlarBazasi.map((l: any) => (
            <option key={l.id} value={l.nomi}>
              {l.nomi} — {Number(l.stavka).toLocaleString('ru-RU')} UZS
            </option>
          ))}
        </Tanlash>

        <Maydon
          yorliq="Telefon raqam"
          izoh="Telegram botdagi raqami bilan bir xil bo'lsin"
          type="tel"
          inputMode="tel"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          placeholder="+998 90 123 45 67"
        />

        <div className="flex items-center gap-2 pt-1">
          {tanlanganXodim && ochirish && (
            <Tugma
              ikonka="ochirish"
              aria-label="Xodimni o'chirish"
              title="Xodimni o'chirish"
              className="text-xato hover:bg-xato-och px-3"
              onClick={() => {
                ochirish(tanlanganXodim.id, tanlanganXodim.ism);
                yopish();
              }}
            />
          )}
          <Tugma type="submit" tur="asosiy" ikonka="tasdiq" toliq className="flex-1">
            Saqlash
          </Tugma>
        </div>
      </form>
    </Oyna>
  );
}
