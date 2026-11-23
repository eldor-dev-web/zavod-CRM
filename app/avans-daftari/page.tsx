'use client';
import React, { useEffect, useState } from 'react';
import AvansDaftari from '@/components/AvansDaftari';
import { faolIshchilar, type Ishchi } from '@/lib/hisob';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentOy, toshkentSana } from '@/lib/sana';
import { oyYopilganmi } from '@/lib/oyQulfi';
import { SahifaSarlavhasi, OyTanlash } from '@/components/ui';

// Avans daftari — faqat admin (proxy.ts va /api/xotira ham tekshiradi)
export default function AvansDaftariSahifasi() {
  const [oy, setOy] = useState('');
  const [ishchilar, setIshchilar] = useState<Ishchi[]>([]);
  const [bugun, setBugun] = useState('');

  // Oy faqat brauzerda olinadi (cacheComponents)
  useEffect(() => {
    setOy(toshkentOy());
    setBugun(toshkentSana());
  }, []);

  useEffect(() => {
    if (!oy) return;
    setIshchilar(faolIshchilar(oyIshchilari(oy)));
  }, [oy]);

  if (!oy) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <SahifaSarlavhasi sarlavha="Avans daftari" izoh="+ Xodim → ism, summa, izoh → Saqlash" amallar={<OyTanlash oy={oy} ozgartirish={setOy} />} />

      <AvansDaftari key={oy} tanlanganOy={oy} ishchilar={ishchilar} yopiq={!!bugun && oyYopilganmi(oy, bugun)} />
    </div>
  );
}
