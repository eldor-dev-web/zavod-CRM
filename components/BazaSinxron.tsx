'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  bazadanTortish,
  birinchiMartaNavbatgaQoyish,
  eskiNusxalarniTozalash,
  joriyHolat,
  kalitNomi,
  kechiktiribYuborish,
  kutayotganlarniDarholYuborish,
  navbatniYuborish,
  radEtilganlar,
  radEtilganlarniKorildi,
  saqlanmaganlar,
  saqlanmaganlarniKorildi,
  yuboriladimi,
  type RadEtilgan,
  type Saqlanmagan,
  type SinxronHolati
} from '@/lib/sinxron';
import { Ikonka } from '@/components/ui';

const QAYTA_URINISH_MS = 30 * 1000;
const TEKSHIRISH_MS = 45 * 1000; // boshqa qurilmalardagi o'zgarishlarni olish
const UZOQ_KUTISH_MS = 30 * 60 * 1000; // 30 daqiqadan beri yuborilmagan — qizil

// Jiddiy (qizil) ogohlantirish: ekran pastida, "Tushunarli" bosilguncha turadi
function QizilXabar({ sarlavha, matn, tugma }: { sarlavha: string; matn: string; tugma?: () => void }) {
  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 z-50 rounded-karta border border-rose-300 bg-xato-och px-4 py-3 shadow-lg sm:left-auto sm:max-w-md print:hidden"
    >
      <div className="flex gap-2.5">
        <Ikonka nom="ogohlantirish" className="mt-0.5 h-5 w-5 shrink-0 text-xato" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-xato">{sarlavha}</p>
          <p className="mt-0.5 text-sm text-xato">{matn}</p>
          {tugma && (
            <button type="button" onClick={tugma} className="mt-2 h-9 rounded-boshqaruv bg-xato-fon px-4 text-sm font-semibold text-white hover:bg-xato">
              Tushunarli
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BazaSinxron() {
  const loginSahifasida = usePathname() === '/login';
  const [holat, setHolat] = useState<SinxronHolati>({ kutmoqda: 0, yuborilmoqda: false, ulanmagan: false, navbatBoshi: null });
  const [saqlandiKorsat, setSaqlandiKorsat] = useState(false);
  const [hozir, setHozir] = useState(0);
  const oldingiKutmoqda = useRef(0);

  // Arxivga kechikib tushib, qabul qilinmagan smena ma'lumotlari (qizil ogohlantirish)
  const [radlar, setRadlar] = useState<RadEtilgan[]>([]);
  // Server qabul qilmagan o'zgarishlar (qizil ogohlantirish)
  const [saqlanmagan, setSaqlanmagan] = useState<Saqlanmagan[]>([]);
  useEffect(() => {
    const yangila = () => {
      setRadlar(radEtilganlar().filter((r) => !r.korildi));
      setSaqlanmagan(saqlanmaganlar().filter((r) => !r.korildi));
    };
    yangila();
    window.addEventListener('zavod_rad_etildi', yangila);
    window.addEventListener('zavod_saqlanmadi', yangila);
    return () => {
      window.removeEventListener('zavod_rad_etildi', yangila);
      window.removeEventListener('zavod_saqlanmadi', yangila);
    };
  }, []);

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

  // 30 daqiqalik chegarani tekshirish uchun soat (har daqiqada)
  useEffect(() => {
    const t = setInterval(() => setHozir(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Login sahifasida hali sessiya yo'q
    if (loginSahifasida) return;

    // 1. Har bir o'zgarishni avval shu qurilmaga, keyin (kechiktirib) bazaga yozish
    const aslSetItem = window.localStorage.setItem;
    window.localStorage.setItem = function (kalit: string, qiymat: string) {
      aslSetItem.apply(this, [kalit, qiymat]);
      if (yuboriladimi(kalit)) kechiktiribYuborish(kalit);
    };

    // 2. Ishga tushganda: avval kutib turgan o'zgarishlarni yuboramiz, keyin bazadan hammasini olamiz.
    //    Yangi ma'lumot kelsa sahifa qayta yuklanmaydi — sahifalar o'z ekranini o'zi yangilaydi.
    const ishgaTushish = async () => {
      birinchiMartaNavbatgaQoyish();
      window.dispatchEvent(new CustomEvent('zavod_sinxron', { detail: joriyHolat() }));
      setHozir(Date.now());
      await navbatniYuborish();
      await bazadanTortish(true);
      eskiNusxalarniTozalash();
    };
    ishgaTushish();

    // 3. Navbatni qayta yuborish va boshqa qurilmalardagi o'zgarishlarni olish
    const navbatTaymeri = setInterval(navbatniYuborish, QAYTA_URINISH_MS);
    const tekshirish = () => {
      if (document.visibilityState === 'visible') bazadanTortish();
    };
    const tekshirishTaymeri = setInterval(tekshirish, TEKSHIRISH_MS);
    const onlayn = async () => {
      await navbatniYuborish();
      bazadanTortish();
    };
    const korinish = () => {
      if (document.visibilityState === 'hidden') kutayotganlarniDarholYuborish();
      else bazadanTortish(); // telefon qayta ochilganda darhol
    };
    window.addEventListener('online', onlayn);
    document.addEventListener('visibilitychange', korinish);
    return () => {
      window.localStorage.setItem = aslSetItem;
      clearInterval(navbatTaymeri);
      clearInterval(tekshirishTaymeri);
      window.removeEventListener('online', onlayn);
      document.removeEventListener('visibilitychange', korinish);
    };
  }, [loginSahifasida]);

  if (loginSahifasida) return null;

  if (radlar.length > 0) {
    const nomlar = Array.from(
      new Set(radlar.map((r) => `${r.sana.split('-').reverse().slice(0, 2).join('.')} ${String(r.smena).toUpperCase().includes('NOCH') ? 'NOCH' : 'DEN'}`))
    ).join(', ');
    return (
      <QizilXabar
        sarlavha={`${nomlar} smenasiga kiritilgan o'zgarishlar saqlanmadi`}
        matn="Smena arxivga o'tib bo'lgan. Adminga (Telegram kanalga) xabar yuborildi, ma'lumot shu qurilmada saqlab qo'yildi."
        tugma={radEtilganlarniKorildi}
      />
    );
  }

  if (saqlanmagan.length > 0) {
    const nomlar = Array.from(new Set(saqlanmagan.map((s) => kalitNomi(s.kalit)))).join(', ');
    return (
      <QizilXabar
        sarlavha="O'zgarish saqlanmadi"
        matn={`${nomlar}: server qabul qilmadi (${saqlanmagan[0].sabab}). Bu o'zgarish faqat shu qurilmada qoldi.`}
        tugma={saqlanmaganlarniKorildi}
      />
    );
  }

  // 30 daqiqadan beri yuborilmagan o'zgarishlar — faqat shu qurilmada turibdi
  if (holat.kutmoqda > 0 && holat.navbatBoshi && hozir - holat.navbatBoshi > UZOQ_KUTISH_MS) {
    const daqiqa = Math.floor((hozir - holat.navbatBoshi) / 60000);
    return (
      <QizilXabar
        sarlavha={`${daqiqa} daqiqadan beri ${holat.kutmoqda} ta o'zgarish faqat shu qurilmada`}
        matn="Bazaga yuborilmadi — boshqalar ko'rmaydi. Internetni tekshiring; ulanishi bilan o'zi yuboriladi."
      />
    );
  }

  // Holat belgisi: faqat kerak bo'lganda ko'rinadi
  if (holat.kutmoqda > 0) {
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-karta border border-amber-200 bg-diqqat-och px-3.5 py-2.5 text-sm text-diqqat shadow-lg print:hidden"
      >
        <p className="font-semibold">{holat.yuborilmoqda ? 'Bazaga yuborilmoqda...' : 'Baza ulanmagan'}</p>
        <p className="mt-0.5 text-xs">{holat.kutmoqda} ta o&apos;zgarish shu qurilmada saqlangan, baza ulanganda o&apos;zi yuboriladi</p>
      </div>
    );
  }

  if (saqlandiKorsat) {
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-karta border border-emerald-200 bg-yaxshi-och px-3.5 py-2.5 text-sm font-semibold text-yaxshi shadow-lg print:hidden"
      >
        <Ikonka nom="tasdiq" className="h-4 w-4" />
        Barcha o&apos;zgarishlar bazaga saqlandi
      </div>
    );
  }

  return null;
}
