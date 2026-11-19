// Eslatma: Next.js 16 da bu fayl nomi 'proxy.ts' ga o'zgargan. Keyingi qadamda nomini almashtiramiz.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSIYA_COOKIE, sessiyaniTekshirish, type Rol } from '@/lib/sessiya';

// Tizimga kirmasdan ochiladigan API manzillar
const OCHIQ_API = ['/api/auth/login', '/api/auth/logout', '/api/telegram'];

// Sahifalarga kim kira oladi (Sidebar menyusi bilan bir xil)
const SAHIFA_RUXSATLARI: { prefiks: string; rollar: Rol[] }[] = [
  { prefiks: '/ishchilar', rollar: ['admin', 'master'] },
  { prefiks: '/sozlamalar', rollar: ['admin'] },
  { prefiks: '/arxiv', rollar: ['admin', 'master'] },
  { prefiks: '/braklar', rollar: ['admin', 'master', 'kontrolchi'] },
  { prefiks: '/rulonlar', rollar: ['admin', 'master', 'kontrolchi'] }
];

const boshSahifa = (rol: Rol) => (rol === 'admin' ? '/' : '/rulonlar');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rol = await sessiyaniTekshirish(request.cookies.get(SESSIYA_COOKIE)?.value);

  // 1. API so'rovlari: sessiya bo'lmasa 401 qaytaramiz (redirect emas)
  if (pathname.startsWith('/api/')) {
    if (OCHIQ_API.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
    if (!rol) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });
    return NextResponse.next();
  }

  // 2. Login sahifasi: allaqachon kirgan bo'lsa o'z bosh sahifasiga
  if (pathname === '/login') {
    return rol ? NextResponse.redirect(new URL(boshSahifa(rol), request.url)) : NextResponse.next();
  }

  // 3. Kirmagan bo'lsa loginga
  if (!rol) return NextResponse.redirect(new URL('/login', request.url));

  // 4. Asosiy panel faqat admin uchun
  if (pathname === '/' && rol !== 'admin') {
    return NextResponse.redirect(new URL('/rulonlar', request.url));
  }

  // 5. Qolgan sahifalar uchun rol tekshiruvi
  const qoida = SAHIFA_RUXSATLARI.find((q) => pathname === q.prefiks || pathname.startsWith(`${q.prefiks}/`));
  if (qoida && !qoida.rollar.includes(rol)) {
    return NextResponse.redirect(new URL(boshSahifa(rol), request.url));
  }

  return NextResponse.next();
}

// Rasmlar, statik fayllar va favicon'dan tashqari hamma narsa tekshiriladi (API ham)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
