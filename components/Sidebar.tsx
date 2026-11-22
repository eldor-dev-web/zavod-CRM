'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const MenuIcons = {
  Dashboard: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Rulon: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Brak: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Ishchilar: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Sozlamalar: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Arxiv: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  Texnik: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Avans: () => (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Key: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
};

type MenyuBandi = { nomi: string; manzil: string; ruxsat: string[]; Icon: () => React.ReactElement };

// Menyu guruhlari: ishlatilishiga qarab. Rol ko'ra olmaydigan bandlar (va bo'sh guruhlar) chiqmaydi.
const MENYU_GURUHLARI: { nomi: string; bandlar: MenyuBandi[] }[] = [
  {
    nomi: 'Ish',
    bandlar: [
      { nomi: 'Asosiy panel', manzil: '/', ruxsat: ['admin'], Icon: MenuIcons.Dashboard },
      { nomi: 'Rulonlar hisobi', manzil: '/rulonlar', ruxsat: ['admin', 'master', 'kontrolchi'], Icon: MenuIcons.Rulon },
      { nomi: 'Braklar hisobi', manzil: '/braklar', ruxsat: ['admin', 'master'], Icon: MenuIcons.Brak },
      { nomi: 'Ishchilar va oylik', manzil: '/ishchilar', ruxsat: ['admin', 'master'], Icon: MenuIcons.Ishchilar },
      { nomi: 'Avans daftari', manzil: '/avans-daftari', ruxsat: ['admin'], Icon: MenuIcons.Avans }
    ]
  },
  {
    nomi: 'Nazorat',
    bandlar: [
      { nomi: 'Smenalar arxivi', manzil: '/arxiv', ruxsat: ['admin'], Icon: MenuIcons.Arxiv },
      { nomi: 'Texnik xizmat', manzil: '/texnik', ruxsat: ['admin', 'mexanik'], Icon: MenuIcons.Texnik }
    ]
  },
  {
    nomi: 'Tizim',
    bandlar: [{ nomi: 'Sozlamalar', manzil: '/sozlamalar', ruxsat: ['admin'], Icon: MenuIcons.Sozlamalar }]
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

  useEffect(() => {
    setMobilOchiq(false);
    setOchiq(false);
  }, [pathname]);

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
      {/* Kompyuterda yig'ilgan panel uchun joy (panelning o'zi ustiga chiqib ochiladi) */}
      <div className="hidden md:block w-[72px] shrink-0 print:hidden" aria-hidden="true" />

      {/* TELEFON: menyu tugmasi */}
      <button
        onClick={() => setMobilOchiq(true)}
        aria-label="Menyuni ochish"
        className="md:hidden print:hidden fixed top-3 left-3 z-40 w-10 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700/80 flex items-center justify-center"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Orqa fon: telefonda qorong'i, kompyuterda shaffof (tashqariga bosilsa yopiladi) */}
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
          print:hidden fixed top-0 left-0 bottom-0 z-50 h-[100dvh] bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800/80 transition-all duration-200
          ${mobilOchiq ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          w-[260px] ${ochiq ? 'md:w-[260px] md:shadow-2xl' : 'md:w-[72px]'}
        `}
      >
        {/* LOGO */}
        <div className={`h-16 shrink-0 flex items-center border-b border-slate-800/60 px-3 ${keng ? 'justify-between' : 'justify-center'}`}>
          {keng ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 shrink-0 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">Z</div>
              <div className="min-w-0">
                <p className="text-base font-black text-white leading-none whitespace-nowrap">
                  Zavod <span className="text-indigo-400">CRM</span>
                </p>
                <span className="text-[11px] font-semibold text-slate-500">Boshqaruv tizimi</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setOchiq(true)}
              aria-label="Menyuni ochish"
              title="Menyuni ochish"
              className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black"
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
              className="w-8 h-8 shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* MENYU (ko'p bo'lsa o'zi aylanadi — hech narsa yashirinmaydi) */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-4">
          {guruhlar.map((g) => (
            <div key={g.nomi}>
              {keng ? (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{g.nomi}</p>
              ) : (
                <div className="mx-3 mb-2 border-t border-slate-800" />
              )}
              <div className="space-y-1">
                {g.bandlar.map((item) => {
                  const faol = pathname === item.manzil;
                  const IconComp = item.Icon;
                  return (
                    <Link key={item.manzil} href={item.manzil} title={!keng ? item.nomi : undefined} aria-label={item.nomi}>
                      <div
                        className={`flex items-center h-11 rounded-xl text-sm font-bold transition-colors ${
                          faol ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        } ${keng ? 'gap-3 px-3' : 'justify-center'}`}
                      >
                        <IconComp />
                        {keng && <span className="whitespace-nowrap truncate">{item.nomi}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* PROFIL VA CHIQISH */}
        <div className="shrink-0 p-2.5 border-t border-slate-800/80">
          <div className={`flex items-center rounded-xl bg-slate-800/60 border border-slate-700/40 ${keng ? 'justify-between p-2.5 gap-2' : 'flex-col p-2 gap-2'}`}>
            <div className="flex items-center gap-2.5 min-w-0" title={!keng ? foydalanuvchi.ism : undefined}>
              <div className="w-9 h-9 shrink-0 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center text-indigo-300 font-black text-sm">
                {ROL_BELGISI[foydalanuvchi.rol] || '?'}
              </div>
              {keng && (
                <div className="min-w-0">
                  <p className="text-xs font-black text-white truncate">{foydalanuvchi.ism}</p>
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Faol sessiya
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={tizimdanChiqish}
              aria-label="Chiqish"
              title="Rolni almashtirish / chiqish"
              className="w-9 h-9 shrink-0 bg-slate-700/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl flex items-center justify-center"
            >
              <MenuIcons.Logout />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
