'use client';
import React, { useEffect, useState } from 'react';
import { ziddiyatlar, ziddiyatniKorildi, type SaqlangZiddiyat } from '@/lib/sinxron';
import { Ikonka } from '@/components/ui';

// Ikki qurilma bir joyni turlicha o'zgartirganda chiqadigan qizil ogohlantirish (Avans daftari, Ishchilar)
export default function ZiddiyatOgohlantirish({ tur, kalit }: { tur: 'avans' | 'xodim'; kalit: string }) {
  const [royxat, setRoyxat] = useState<SaqlangZiddiyat[]>([]);

  useEffect(() => {
    const yangila = () => setRoyxat(ziddiyatlar().filter((z) => !z.korildi && z.tur === tur && z.kalit === kalit));
    yangila();
    window.addEventListener('zavod_ziddiyat', yangila);
    return () => window.removeEventListener('zavod_ziddiyat', yangila);
  }, [tur, kalit]);

  if (royxat.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {royxat.map((z) => (
        <div key={z.id} role="alert" className="rounded-karta border border-rose-300 bg-xato-och px-4 py-3">
          <div className="flex gap-2.5">
            <Ikonka nom="ogohlantirish" className="mt-0.5 h-5 w-5 shrink-0 text-xato" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-xato">{z.matn}</p>
              {tur === 'avans' && z.tafsilot.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-sm text-xato">
                  {z.tafsilot.map((q, i) => (
                    <li key={i} className="font-mono break-all">
                      {q}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => ziddiyatniKorildi(z.id)}
                className="mt-2 h-9 rounded-boshqaruv bg-xato-fon px-4 text-sm font-semibold text-white hover:bg-xato"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
