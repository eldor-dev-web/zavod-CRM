import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sorovRoli } from '@/lib/sessiya';

const sanaTogri = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Dashboard uchun: har bir smenaning jami kg va rulon soni (bazada hisoblanadi, tez ishlaydi)
// GET /api/statistika?dan=2026-01-01&gacha=2026-12-31
export async function GET(req: NextRequest) {
  if ((await sorovRoli(req)) !== 'admin') {
    return NextResponse.json({ xato: 'Faqat admin uchun' }, { status: 403 });
  }

  const dan = req.nextUrl.searchParams.get('dan');
  const gacha = req.nextUrl.searchParams.get('gacha');
  if (!sanaTogri(dan) || !sanaTogri(gacha)) {
    return NextResponse.json({ xato: 'Sana oralig\'i noto\'g\'ri' }, { status: 400 });
  }

  try {
    const qatorlar = await prisma.$queryRaw<{ sana: string; smena: string; rulon: number; kg: number }[]>`
      SELECT s."sana" AS sana,
             s."smenaTuri" AS smena,
             COUNT(r."id")::int AS rulon,
             COALESCE(SUM(r."kg"), 0)::float AS kg
      FROM "Smena" s
      LEFT JOIN "Moshina" m ON m."smenaId" = s."id"
      LEFT JOIN "Rulon" r ON r."moshinaId" = m."id" AND r."kg" > 0
      WHERE s."sana" >= ${dan} AND s."sana" <= ${gacha}
      GROUP BY s."sana", s."smenaTuri"
    `;
    return NextResponse.json({ smenalar: qatorlar.map((q) => ({ ...q, rulon: Number(q.rulon), kg: Number(q.kg) })) });
  } catch (err) {
    console.error('Statistika xatosi:', err);
    return NextResponse.json({ xato: 'Bazaga ulanib bo\'lmadi' }, { status: 503 });
  }
}
