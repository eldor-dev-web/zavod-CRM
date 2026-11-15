'use client';
import { useEffect } from 'react';

export default function BazaSinxron() {
  useEffect(() => {
    // 1. Sayt ochilganda Bazadagi barcha ma'lumotlarni yuklab olish
    const bazadanYuklash = async () => {
      try {
        const res = await fetch('/api/xotira', { cache: 'no-store' });
        if (!res.ok) return;
        const malumotlar = await res.json();

        let ozgarishBor = false;

        if (Array.isArray(malumotlar) && malumotlar.length > 0) {
          malumotlar.forEach((item: { kalit: string; qiymat: any }) => {
            if (item.kalit.startsWith('zavod_')) {
              const yangiQiymat = typeof item.qiymat === 'string' 
                ? item.qiymat 
                : JSON.stringify(item.qiymat);

              const eskiQiymat = window.localStorage.getItem(item.kalit);
              if (eskiQiymat !== yangiQiymat) {
                // Asl setItem orqali yozamiz
                Storage.prototype.setItem.call(window.localStorage, item.kalit, yangiQiymat);
                ozgarishBor = true;
              }
            }
          });
        } else {
          // Agar baza bo'm-bo'sh bo'lsa, kompyuterdagi hozirgi ma'lumotlarni bazaga 1 marta yuklab qo'yadi
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith('zavod_')) {
              const v = window.localStorage.getItem(k);
              fetch('/api/xotira', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kalit: k, qiymat: v }),
              });
            }
          }
        }

        // Agar bazadan yangi ma'lumot kelgan bo'lsa, sahifani 1 marta yangilab ko'rsatadi
        if (ozgarishBor) {
          window.dispatchEvent(new Event('storage'));
          window.location.reload();
        }
      } catch (err) {
        console.error('Sinxronizatsiya xatosi:', err);
      }
    };

    bazadanYuklash();

    // 2. Har safar biror sahifa localStorage'ga ma'lumot saqlaganda, uni Bazaga ham yuborish
    const aslSetItem = window.localStorage.setItem;
    window.localStorage.setItem = function (kalit: string, qiymat: string) {
      aslSetItem.apply(this, [kalit, qiymat]);

      if (kalit.startsWith('zavod_')) {
        fetch('/api/xotira', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kalit, qiymat }),
        }).catch((e) => console.error('Bazaga yozishda xato:', e));
      }
    };

    return () => {
      window.localStorage.setItem = aslSetItem;
    };
  }, []);

  return null;
}