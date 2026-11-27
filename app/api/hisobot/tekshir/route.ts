import { NextRequest, NextResponse } from 'next/server';
import { joriySmenaYozuvi } from '@/lib/joriySmena';
import { kechiktirilganHisobotniYuborish } from '@/lib/hisobot';

// Tashqi budilnik (cron-job.org) har 15 daqiqada chaqiradi — hech qaysi telefon ochiq bo'lmasa ham hisobot ketadi.
// Faqat bitta ish: tugagan smenaga 3 soat bo'lgan va hisoboti hali yuborilmagan bo'lsa — Telegram kanalga yuboradi.
// "Yangilangan" hisobotlar bu yerda yuborilmaydi — ular kunlik 08:00 tekshiruvda (/api/hisobot/kunlik) ketadi.
// Vercel Pro'ga o'tilganda: shu manzil vercel.json crons'ga qo'shiladi va cron-job.org o'chiriladi.
export async function GET(req: NextRequest) {
  const kalit = process.env.CRON_SECRET;
  if (!kalit || req.headers.get('authorization') !== `Bearer ${kalit}`) {
    return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 });
  }

  try {
    const { joriy, updatedAt } = await joriySmenaYozuvi();
    const natija = await kechiktirilganHisobotniYuborish(joriy, updatedAt);
    // Telegramga yuborib bo'lmasa — 500: cron-job.org buni "xato" deb ko'rsatadi (xohlasangiz pochtaga xabar beradi)
    return NextResponse.json({ ok: natija.holat !== 'xato', ...natija }, { status: natija.holat === 'xato' ? 500 : 200 });
  } catch (e) {
    console.error('Hisobot tekshiruvi xatosi:', e);
    return NextResponse.json({ ok: false, xato: 'Ichki xato' }, { status: 500 });
  }
}
