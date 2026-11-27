'use client';
import React, { useState } from 'react';
import { tungimi, type SmenaNuqtasi } from '@/lib/smena';
import { Belgi, Ikonka, Ogohlantirish, Oyna, Tugma } from '@/components/ui';

export type SmenaXulosasi = { moshina: number; rulon: number; kg: number };

const sanaQisqa = (s: string) => s.split('-').reverse().slice(0, 2).join('.');
export const kgFormat = (n: number) => {
  const [b, k] = (Math.round(n * 10) / 10).toFixed(1).split('.');
  return `${b.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${k === '0' ? '' : ',' + k}`;
};

// "Smenani yakunlaysizmi?" oynasi
export default function SmenaYakunlashOynasi({
  joriy,
  keyingi,
  xulosa,
  kamchiliklar = [],
  tasdiqlash,
  yopish
}: {
  joriy: SmenaNuqtasi;
  keyingi: SmenaNuqtasi;
  xulosa: SmenaXulosasi;
  kamchiliklar?: string[]; // to'ldirilmagan joylar (ogohlantirish — yakunlashga to'sqinlik qilmaydi)
  tasdiqlash: () => Promise<string | null>;
  yopish: () => void;
}) {
  const [bajarilmoqda, setBajarilmoqda] = useState(false);
  const [xato, setXato] = useState('');
  const bosh = xulosa.rulon === 0;

  const ha = async () => {
    if (bajarilmoqda) return;
    setBajarilmoqda(true);
    setXato('');
    const x = await tasdiqlash();
    setBajarilmoqda(false);
    if (x) setXato(x);
    else yopish();
  };

  return (
    <Oyna
      ochiq
      yopish={yopish}
      yopibBolmaydi={bajarilmoqda}
      sarlavha={`${sanaQisqa(joriy.sana)} ${tungimi(joriy.smena) ? 'NOCH' : 'DEN'} smenasini yakunlaysizmi?`}
      amallar={
        <>
          {kamchiliklar.length > 0 ? (
            <>
              <Tugma tur="asosiy" disabled={bajarilmoqda} onClick={yopish}>
                Ortga, to&apos;ldiraman
              </Tugma>
              <Tugma yuklanmoqda={bajarilmoqda} onClick={ha}>
                {bajarilmoqda ? 'Bajarilmoqda...' : 'Baribir yakunlash'}
              </Tugma>
            </>
          ) : (
            <>
              <Tugma disabled={bajarilmoqda} onClick={yopish}>
                Bekor
              </Tugma>
              <Tugma tur="asosiy" yuklanmoqda={bajarilmoqda} onClick={ha}>
                {bajarilmoqda ? 'Bajarilmoqda...' : 'Ha, yakunlash'}
              </Tugma>
            </>
          )}
        </>
      }
    >
      <div className="rounded-boshqaruv bg-sirt-2 border border-chiziq p-3 md:p-4">
        {bosh ? (
          <p className="font-semibold text-matn-2">Bu smenada ma&apos;lumot kiritilmagan</p>
        ) : (
          <>
            <p className="text-base font-semibold text-matn tabular-nums">
              {xulosa.moshina} moshina · {xulosa.rulon} rulon · {kgFormat(xulosa.kg)} kg
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-matn-2">
              <Ikonka nom="hujjat" className="w-4 h-4" />
              Hisobot 3 soatdan keyin Telegram kanalga yuboriladi
            </p>
          </>
        )}
      </div>
      {kamchiliklar.length > 0 && (
        <Ogohlantirish tur="diqqat" ikonka="ogohlantirish" className="mt-4">
          <p>To&apos;ldirilmagan joylar bor:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 font-normal">
            {kamchiliklar.slice(0, 10).map((k, i) => (
              <li key={i}>{k}</li>
            ))}
            {kamchiliklar.length > 10 && <li>va yana {kamchiliklar.length - 10} ta</li>}
          </ul>
        </Ogohlantirish>
      )}
      <p className="mt-4 flex items-center gap-2 font-semibold text-matn-2">
        Keyingi smena:
        <Belgi tur={tungimi(keyingi.smena) ? 'noch' : 'den'}>
          {sanaQisqa(keyingi.sana)} {tungimi(keyingi.smena) ? 'NOCH' : 'DEN'}
        </Belgi>
      </p>
      {xato && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-xato">
          <Ikonka nom="ogohlantirish" className="w-4 h-4" />
          {xato}
        </p>
      )}
    </Oyna>
  );
}
