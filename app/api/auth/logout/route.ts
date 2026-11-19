import { NextResponse } from 'next/server';
import { SESSIYA_COOKIE } from '@/lib/sessiya';

export async function POST() {
  const javob = NextResponse.json({ ok: true });
  javob.cookies.set(SESSIYA_COOKIE, '', { path: '/', maxAge: 0 });
  javob.cookies.set('zavod_rol', '', { path: '/', maxAge: 0 });
  return javob;
}
