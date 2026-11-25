'use client';
import React, { useEffect, useState } from 'react';
import AvansDaftari from '@/components/AvansDaftari';
import { faolIshchilar, type Ishchi } from '@/lib/hisob';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentOy, toshkentSana } from '@/lib/sana';
import { oyYopilganmi } from '@/lib/oyQulfi';
import { SahifaSarlavhasi, OyTanlash } from '@/components/ui';
import { useXotiraYangilanishi } from '@/hooks/useXotiraYangilanishi';

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

  useXotiraYangilanishi(
    (k) => k === `zavod_ishchilar_${oy}`,
    () => oy && setIshchilar(faolIshchilar(oyIshchilari(oy)))
  );

  if (!oy) return null;

  return (
    <div className="max-w-3xl mx-auto">
            <SahifaSarlavhasi sarlavha="Avans daftari" amallar={<OyTanlash oy={oy} ozgartirish={setOy} />} />

      <AvansDaftari key={oy} tanlanganOy={oy} ishchilar={ishchilar} yopiq={!!bugun && oyYopilganmi(oy, bugun)} />
    </div>
  );
}
