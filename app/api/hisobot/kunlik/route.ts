import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { smenaHisobotiniYuborish } from '@/lib/hisobot';
import { sanagaKunQoshish, toshkentSana } from '@/lib/sana';

// Har kuni ertalab Vercel o'zi chaqiradi (vercel.json -> crons).
// Smena almashtirilmay qolgan bo'lsa (masalan, dam olish oldidan), oxirgi 2 kunning
// to'ldirilgan, lekin yuborilmagan smenalarini yuboradi. Yuborilganlari qayta ketmaydi.
// Hozirgina tugagan smena (almashganiga 3 soat bo'lmagan) bu yerda yuborilmaydi — 3 soatdan keyin ketadi.
export async function GET(req: NextRequest) {
  const kalit = process.env.CRON_SECRET;
  if (!kalit || req.headers.get('authorization') !== `Bearer ${kalit}`) {
    return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 401 });
  }

  const bugun = toshkentSana();
  const sanalar = [sanagaKunQoshish(bugun, -2), sanagaKunQoshish(bugun, -1)];
  const smenalar = await prisma.smena.findMany({ where: { sana: { in: sanalar } }, select: { sana: true, smenaTuri: true } });

  const natijalar = [];
  for (const s of smenalar.sort((a, b) => `${a.sana}${a.smenaTuri}`.localeCompare(`${b.sana}${b.smenaTuri}`))) {
    natijalar.push({ ...s, ...(await smenaHisobotiniYuborish(s.sana, s.smenaTuri)) });
  }
  return NextResponse.json({ ok: true, natijalar });
}
