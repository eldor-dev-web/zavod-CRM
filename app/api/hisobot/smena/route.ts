import { NextRequest, NextResponse } from 'next/server';
import { sorovRoli } from '@/lib/sessiya';
import { smenaHisobotiniYuborish } from '@/lib/hisobot';

// Smena almashganda brauzer chaqiradi: tugagan smenaning PDF hisobotini kanalga yuborish
export async function POST(req: NextRequest) {
  const rol = await sorovRoli(req);
  if (!rol) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });
  if (rol === 'mexanik') return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 403 });

  const { sana, smena } = await req.json().catch(() => ({}));
  if (typeof sana !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(sana) || typeof smena !== 'string' || !smena) {
    return NextResponse.json({ xato: 'Sana yoki smena noto\'g\'ri' }, { status: 400 });
  }

  const natija = await smenaHisobotiniYuborish(sana, smena);
  if (natija.holat === 'xato') {
    console.error('Smena hisoboti yuborilmadi:', natija.sabab);
    // Telegram 4xx (kanal topilmadi, bot admin emas) — qayta urinishdan foyda yo'q, sozlamani tuzatish kerak
    if (/Telegram: 4\d\d/.test(natija.sabab)) return NextResponse.json(natija, { status: 200 });
    // 500 — brauzer navbatda saqlab, keyinroq qayta urinadi
    return NextResponse.json(natija, { status: 500 });
  }
  return NextResponse.json(natija, { status: 200 });
}
