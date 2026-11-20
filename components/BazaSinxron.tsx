'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  birinchiMartaNavbatgaQoyish,
  eskiNusxalarniTozalash,
  joriyHolat,
  kechiktiribYuborish,
  kutayotganlarniDarholYuborish,
  navbatniYuborish,
  sinxronlanadimi,
  yuborilmaganmi,
  type SinxronHolati
} from '@/lib/sinxron';

const QAYTA_URINISH_MS = 30 * 1000;

export default function BazaSinxron() {
  const loginSahifasida = usePathname() === '/login';
  const [holat, setHolat] = useState<SinxronHolati>({ kutmoqda: 0, yuborilmoqda: false, ulanmagan: false });
  const [saqlandiKorsat, setSaqlandiKorsat] = useState(false);
  const oldingiKutmoqda = useRef(0);

  // Holat belgisini yangilash
  useEffect(() => {
    const tingla = (e: Event) => {
      const yangi = (e as CustomEvent<SinxronHolati>).detail;
      setHolat(yangi);
      // Navbat bo'shagan zahoti "saqlandi" deb qisqa ko'rsatamiz
      if (oldingiKutmoqda.current > 0 && yangi.kutmoqda === 0) {
        setSaqlandiKorsat(true);
        setTimeout(() => setSaqlandiKorsat(false), 3000);
      }
      oldingiKutmoqda.current = yangi.kutmoqda;
    };
    window.addEventListener('zavod_sinxron', tingla);
    return () => window.removeEventListener('zavod_sinxron', tingla);
  }, []);

  useEffect(() => {
    // Login sahifasida hali sessiya yo'q
    if (loginSahifasida) return;

    // 1. Har bir o'zgarishni avval shu kompyuterga, keyin (kechiktirib) bazaga yozish
    const aslSetItem = window.localStorage.setItem;
    window.localStorage.setItem = function (kalit: string, qiymat: string) {
      aslSetItem.apply(this, [kalit, qiymat]);
      if (sinxronlanadimi(kalit)) kechiktiribYuborish(kalit);
    };

    // 2. Ishga tushganda: avval kutib turgan o'zgarishlarni yuboramiz, keyin bazadan yangilarini olamiz
    const ishgaTushish = async () => {
      birinchiMartaNavbatgaQoyish();
      window.dispatchEvent(new CustomEvent('zavod_sinxron', { detail: joriyHolat() }));
      await navbatniYuborish();

      try {
        const res = await fetch('/api/xotira', { cache: 'no-store' });
        if (res.status === 401) {
          localStorage.removeItem('zavod_foydalanuvchi');
          window.location.assign('/login');
          return;
        }
        if (!res.ok) return;
        const malumotlar = await res.json();
        if (!Array.isArray(malumotlar)) return;

        let ozgarishBor = false;
        malumotlar.forEach((item: { kalit: string; qiymat: unknown }) => {
          if (!sinxronlanadimi(item.kalit)) return;
          // Hali bazaga yetib bormagan mahalliy o'zgarish ustiga eski nusxani yozmaymiz
          if (yuborilmaganmi(item.kalit)) return;

          const bazadagi = typeof item.qiymat === 'string' ? item.qiymat : JSON.stringify(item.qiymat);
          if (window.localStorage.getItem(item.kalit) !== bazadagi) {
            Storage.prototype.setItem.call(window.localStorage, item.kalit, bazadagi);
            ozgarishBor = true;
          }
        });

        // Boshqa kompyuterdan yangi ma'lumot kelgan bo'lsa, sahifani bir marta yangilaymiz
        if (ozgarishBor) window.location.reload();
      } catch (err) {
        console.error('Sinxronizatsiya xatosi:', err);
      } finally {
        eskiNusxalarniTozalash();
      }
    };
    ishgaTushish();

    // 3. Baza qaytishini kutib, navbatni qayta yuborish
    const taymer = setInterval(navbatniYuborish, QAYTA_URINISH_MS);
    const onlayn = () => navbatniYuborish();
    const yashirindi = () => {
      if (document.visibilityState === 'hidden') kutayotganlarniDarholYuborish();
    };
    window.addEventListener('online', onlayn);
    document.addEventListener('visibilitychange', yashirindi);

    return () => {
      window.localStorage.setItem = aslSetItem;
      clearInterval(taymer);
      window.removeEventListener('online', onlayn);
      document.removeEventListener('visibilitychange', yashirindi);
    };
  }, [loginSahifasida]);

  if (loginSahifasida) return null;

  // Holat belgisi: faqat kerak bo'lganda ko'rinadi
  if (holat.kutmoqda > 0) {
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800 shadow-lg print:hidden"
      >
        {holat.yuborilmoqda ? '⏳ Bazaga yuborilmoqda...' : '⚠️ Baza ulanmagan'}
        <span className="mt-0.5 block font-semibold text-amber-700">
          {holat.kutmoqda} ta o&apos;zgarish shu kompyuterda saqlangan, baza ulanganda o&apos;zi yuboriladi
        </span>
      </div>
    );
  }

  if (saqlandiKorsat) {
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 shadow-lg print:hidden"
      >
        ✓ Barcha o&apos;zgarishlar bazaga saqlandi
      </div>
    );
  }

  return null;
}
