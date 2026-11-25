import { useEffect, useRef } from 'react';

// Boshqa qurilmada o'zgargan ma'lumot bazadan kelganda sahifa o'z ekranini yangilaydi (sahifa qayta yuklanmaydi).
//   useXotiraYangilanishi((k) => k.startsWith('zavod_ishchilar_'), () => qaytaOqish());
export function useXotiraYangilanishi(mosmi: (kalit: string) => boolean, yangilash: () => void) {
  const mosRef = useRef(mosmi);
  const yangilashRef = useRef(yangilash);
  useEffect(() => {
    mosRef.current = mosmi;
    yangilashRef.current = yangilash;
  });

  useEffect(() => {
    const tingla = (e: Event) => {
      const kalitlar: string[] = (e as CustomEvent<{ kalitlar: string[] }>).detail?.kalitlar || [];
      if (kalitlar.some((k) => mosRef.current(k))) yangilashRef.current();
    };
    window.addEventListener('zavod_xotira_yangilandi', tingla);
    return () => window.removeEventListener('zavod_xotira_yangilandi', tingla);
  }, []);
}
