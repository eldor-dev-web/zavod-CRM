'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Bu kalitlar hech qachon brauzerdan bazaga yuborilmaydi
const YUBORILMAYDIGAN_KALITLAR = ['zavod_parollar', 'zavod_foydalanuvchi'];

// Sessiya tugagan bo'lsa (server 401 qaytarsa) loginga qaytarish
function sessiyaTugagan(res: Response) {
  if (res.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem('zavod_foydalanuvchi');
    window.location.href = '/login';
    return true;
  }
  return false;
}

export default function BazaSinxron() {
  const loginSahifasida = usePathname() === '/login';

  useEffect(() => {
    // Login sahifasida hali sessiya yo'q, sinxronlash shart emas
    if (loginSahifasida) return;

    // 1. Sayt ochilganda Bazadagi barcha ma'lumotlarni yuklab olish
    const bazadanYuklash = async () => {
      try {
        const res = await fetch('/api/xotira', { cache: 'no-store' });
        if (sessiyaTugagan(res) || !res.ok) return;
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
            if (k && k.startsWith('zavod_') && !YUBORILMAYDIGAN_KALITLAR.includes(k)) {
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

      if (kalit.startsWith('zavod_') && !YUBORILMAYDIGAN_KALITLAR.includes(kalit)) {
        fetch('/api/xotira', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kalit, qiymat }),
        })
          .then((res) => {
            if (!sessiyaTugagan(res) && !res.ok) console.error('Bazaga yozilmadi:', kalit, res.status);
          })
          .catch((e) => console.error('Bazaga yozishda xato:', e));
      }
    };

    return () => {
      window.localStorage.setItem = aslSetItem;
    };
  }, [loginSahifasida]);

  return null;
}