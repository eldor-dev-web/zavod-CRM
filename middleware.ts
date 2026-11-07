import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userRol = request.cookies.get('zavod_rol')?.value;

  // 1. Agar login oynasida bo'lsa va tizimga allaqachon kirgan bo'lsa, asosiyga qaytarish
  if (pathname === '/login') {
    if (userRol) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  // 2. Tizimga kirmagan bo'lsa, har qanday ruxsatsiz urinishni loginga haydash
  if (!userRol) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. QAT'IY HIMOYA: Rolga qarab ruxsatlarni tekshirish
  if (pathname.startsWith('/ishchilar') || pathname.startsWith('/sozlamalar')) {
    if (userRol !== 'admin') return NextResponse.redirect(new URL('/rulonlar', request.url));
  }

  if (pathname.startsWith('/braklar')) {
    if (userRol !== 'admin' && userRol !== 'master') {
      return NextResponse.redirect(new URL('/rulonlar', request.url));
    }
  }

  return NextResponse.next();
}

// Qaysi fayllarda middleware ishlamasligini belgilash (rasmlar, api, css va hokazo)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};