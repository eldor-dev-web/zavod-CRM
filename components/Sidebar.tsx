'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ikonka, type IkonkaNomi } from '@/components/ui';

type MenyuBandi = { nomi: string; manzil: string; ruxsat: string[]; ikonka: IkonkaNomi };

// Menyu guruhlari: ishlatilishiga qarab. Rol ko'ra olmaydigan bandlar (va bo'sh guruhlar) chiqmaydi.
const MENYU_GURUHLARI: { nomi: string; bandlar: MenyuBandi[] }[] = [
  {
    nomi: 'Ish',
    bandlar: [
      { nomi: 'Asosiy panel', manzil: '/', ruxsat: ['admin'], ikonka: 'panel' },
      { nomi: 'Rulonlar hisobi', manzil: '/rulonlar', ruxsat: ['admin', 'master', 'kontrolchi'], ikonka: 'rulon' },
      { nomi: 'Braklar hisobi', manzil: '/braklar', ruxsat: ['admin', 'master'], ikonka: 'ogohlantirish' },
      { nomi: 'Ishchilar va oylik', manzil: '/ishchilar', ruxsat: ['admin', 'master'], ikonka: 'ishchilar' },
      { nomi: 'Avans daftari', manzil: '/avans-daftari', ruxsat: ['admin'], ikonka: 'avans' }
    ]
  },
  {
    nomi: 'Nazorat',
    bandlar: [
      { nomi: 'Smenalar arxivi', manzil: '/arxiv', ruxsat: ['admin'], ikonka: 'arxiv' },
      { nomi: 'Texnik xizmat', manzil: '/texnik', ruxsat: ['admin', 'mexanik'], ikonka: 'texnik' }
    ]
  },
  {
    nomi: 'Tizim',
    bandlar: [{ nomi: 'Sozlamalar', manzil: '/sozlamalar', ruxsat: ['admin'], ikonka: 'sozlama' }]
  }
];
const BARCHA_BANDLAR = MENYU_GURUHLARI.flatMap((g) => g.bandlar);

const ROL_BELGISI: Record<string, string> = { admin: 'A', master: 'M', kontrolchi: 'K', mexanik: 'T' };

// Yon panel: doim YIG'ILGAN holatda (faqat ikonkalar) turadi, jadvallarni siqmaydi.
// ▶ bosilsa sahifa USTIGA ochiladi (kontentni surmaydi); band tanlansa yoki tashqariga bosilsa yopiladi.
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [foydalanuvchi, setFoydalanuvchi] = useState<{ ism: string; rol: string } | null>(null);
  const [kutilmoqda, setKutilmoqda] = useState(true);
  const [ochiq, setOchiq] = useState(false); // kompyuterda: ustiga ochilgan
  const [mobilOchiq, setMobilOchiq] = useState(false);
  const [otilmoqda, setOtilmoqda] = useState(false); // sahifa almashayotganda yuklanish chizig'i
  const [yorliq, setYorliq] = useState<{ matn: string; y: number } | null>(null);
  const yorliqKorsat = (e: React.MouseEvent<HTMLElement>, matn: string) => {
    const r = e.currentTarget.getBoundingClientRect();
    setYorliq({ matn, y: r.top + r.height / 2 });
  };

  useEffect(() => {
    setMobilOchiq(false);
    setOchiq(false);
    setOtilmoqda(false);
    setYorliq(null);
  }, [pathname]);

  // Yuklanish chizig'i biror sabab bilan qolib ketmasin (masalan, sahifa ochilmasa)
  useEffect(() => {
    if (!otilmoqda) return;
    const t = setTimeout(() => setOtilmoqda(false), 8000);
    return () => clearTimeout(t);
  }, [otilmoqda]);

  useEffect(() => {
    if (!ochiq && !mobilOchiq) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOchiq(false);
        setMobilOchiq(false);
      }
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [ochiq, mobilOchiq]);

  useEffect(() => {
    if (pathname === '/login') {
      setKutilmoqda(false);
      return;
    }

    const saqlanganUser = localStorage.getItem('zavod_foydalanuvchi');
    if (!saqlanganUser) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(saqlanganUser);
    setFoydalanuvchi(user);

    // Eski versiyadan qolgan ochiq PIN-kodlarni brauzerdan o'chirib tashlaymiz
    localStorage.removeItem('zavod_parollar');

    const hozirgiSahifa = BARCHA_BANDLAR.find((m) => m.manzil === pathname);
    if (hozirgiSahifa && !hozirgiSahifa.ruxsat.includes(user.rol)) {
      if (user.rol === 'admin') router.push('/');
      else if (user.rol === 'mexanik') router.push('/texnik');
      else router.push('/rulonlar');
    }

    setKutilmoqda(false);
  }, [pathname, router]);

  const tizimdanChiqish = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('zavod_foydalanuvchi');
    window.location.href = '/login';
  };

  if (pathname === '/login') return null;
  if (kutilmoqda || !foydalanuvchi) return null;

  const guruhlar = MENYU_GURUHLARI.map((g) => ({ ...g, bandlar: g.bandlar.filter((b) => b.ruxsat.includes(foydalanuvchi.rol)) })).filter(
    (g) => g.bandlar.length > 0
  );
  // Matnlar ko'rinadimi: telefonda panel ochilganda yoki kompyuterda ▶ bosilganda
  const keng = ochiq || mobilOchiq;

  return (
    <>
      {/* Sahifalar orasida o'tishda tepada ingichka yuklanish chizig'i */}
      {otilmoqda && (
        <div className="print:hidden fixed top-0 left-0 right-0 z-[80] h-0.5 bg-asosiy/20 overflow-hidden">
          <div className="h-full w-1/3 bg-asosiy animate-[zavod-yuklanish_1s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Kompyuterda yig'ilgan panel uchun joy (panelning o'zi ustiga chiqib ochiladi) */}
      <div className="hidden md:block w-[72px] shrink-0 print:hidden" aria-hidden="true" />

      {/* TELEFON: menyu tugmasi */}
      <button
        onClick={() => setMobilOchiq(true)}
        aria-label="Menyuni ochish"
        className="md:hidden print:hidden fixed top-3 left-3 z-40 w-10 h-10 bg-menyu text-white rounded-boshqaruv shadow-lg flex items-center justify-center"
      >
        <Ikonka nom="menyu" className="w-5 h-5" />
      </button>

      {/* Orqa fon: telefonda qorong'i, kompyuterda yengil (tashqariga bosilsa yopiladi) */}
      {(mobilOchiq || ochiq) && (
        <div
          className={`print:hidden fixed inset-0 z-40 ${mobilOchiq ? 'bg-black/60 md:bg-black/20' : 'bg-black/20'}`}
          onClick={() => {
            setMobilOchiq(false);
            setOchiq(false);
          }}
        />
      )}

      {/* YON PANEL */}
      <aside
        className={`
          print:hidden fixed top-0 left-0 bottom-0 z-50 h-[100dvh] bg-menyu text-slate-300 flex flex-col border-r border-white/5 transition-[width,transform] duration-200
          ${mobilOchiq ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          w-[260px] ${ochiq ? 'md:w-[260px] md:shadow-2xl' : 'md:w-[72px]'}
        `}
      >
        {/* LOGO */}
        <div className={`h-16 shrink-0 flex items-center px-3 ${keng ? 'justify-between' : 'justify-center'}`}>
          {keng ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 shrink-0 bg-asosiy rounded-boshqaruv flex items-center justify-center text-white font-bold">Z</div>
              <div className="min-w-0">
                <p className="text-base font-bold text-white leading-none whitespace-nowrap">Zavod CRM</p>
                <span className="text-xs text-slate-500">Boshqaruv tizimi</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setOchiq(true)}
              aria-label="Menyuni ochish"
              onMouseEnter={(e) => yorliqKorsat(e, 'Menyuni ochish')}
              onMouseLeave={() => setYorliq(null)}
              className="w-10 h-10 bg-asosiy hover:bg-asosiy-toq rounded-boshqaruv flex items-center justify-center text-white font-bold"
            >
              Z
            </button>
          )}
          {keng && (
            <button
              onClick={() => {
                setOchiq(false);
                setMobilOchiq(false);
              }}
              aria-label="Menyuni yopish"
              className="w-8 h-8 shrink-0 text-slate-400 hover:bg-white/10 hover:text-white rounded-boshqaruv flex items-center justify-center"
            >
              <Ikonka nom="chapga" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* MENYU (ko'p bo'lsa o'zi aylanadi — hech narsa yashirinmaydi) */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 pb-3">
          {guruhlar.map((g, gi) => (
            <div key={g.nomi} className={gi > 0 ? 'mt-3' : 'mt-1'}>
              {keng ? (
                <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.nomi}</p>
              ) : (
                gi > 0 && <div className="mx-2 mb-3 border-t border-white/10" />
              )}
              <div className="space-y-1">
                {g.bandlar.map((item) => {
                  const faol = pathname === item.manzil;
                  return (
                    <Link
                      key={item.manzil}
                      href={item.manzil}
                      aria-label={item.nomi}
                      onClick={() => !faol && setOtilmoqda(true)}
                      onMouseEnter={(e) => !keng && yorliqKorsat(e, item.nomi)}
                      onMouseLeave={() => setYorliq(null)}
                      className={`relative flex items-center h-11 rounded-boshqaruv text-sm font-medium transition-colors ${
                        faol ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      } ${keng ? 'gap-3 px-3' : 'justify-center'}`}
                    >
                      {faol && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-asosiy" aria-hidden="true" />}
                      <Ikonka nom={item.ikonka} className={`w-5 h-5 ${faol ? 'text-white' : ''}`} />
                      {keng && <span className="whitespace-nowrap truncate">{item.nomi}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* PROFIL VA CHIQISH */}
        <div className="shrink-0 p-3 border-t border-white/10">
          <div className={`flex items-center ${keng ? 'justify-between gap-2' : 'flex-col gap-2'}`}>
            <div
              className="flex items-center gap-2.5 min-w-0"
              onMouseEnter={(e) => !keng && yorliqKorsat(e, `${foydalanuvchi.ism} · faol sessiya`)}
              onMouseLeave={() => setYorliq(null)}
            >
              <div className="relative w-10 h-10 shrink-0 bg-asosiy/20 rounded-boshqaruv flex items-center justify-center text-indigo-200 font-bold text-sm">
                {ROL_BELGISI[foydalanuvchi.rol] || '?'}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-menyu" aria-hidden="true" />
              </div>
              {keng && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{foydalanuvchi.ism}</p>
                  <p className="text-xs text-slate-500">Faol sessiya</p>
                </div>
              )}
            </div>
            <button
              onClick={tizimdanChiqish}
              aria-label="Chiqish"
              onMouseEnter={(e) => !keng && yorliqKorsat(e, 'Chiqish')}
              onMouseLeave={() => setYorliq(null)}
              className="w-10 h-10 shrink-0 text-slate-400 hover:bg-rose-600 hover:text-white rounded-boshqaruv flex items-center justify-center transition-colors"
            >
              <Ikonka nom="chiqish" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Yig'ilgan holatda ikonka nomi (yorliq) — panel chegarasidan tashqarida chiqadi */}
      {yorliq && !keng && (
        <div
          className="hidden md:block print:hidden fixed z-[60] left-[80px] -translate-y-1/2 px-2.5 py-1.5 rounded-boshqaruv bg-slate-800 text-white text-xs font-semibold shadow-lg pointer-events-none whitespace-nowrap"
          style={{ top: yorliq.y }}
        >
          {yorliq.matn}
        </div>
      )}
    </>
  );
}
