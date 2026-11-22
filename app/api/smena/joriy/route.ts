import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sorovRoli } from '@/lib/sessiya';
import { joriySmenaYozuvi } from '@/lib/joriySmena';
import { birXilSmena, hozirgiSmena, JORIY_SMENA_KALITI, keyingiSmena, smenaNomi, smenaTartibi } from '@/lib/smena';
import { toshkentVaqtMatni } from '@/lib/sana';

// Joriy smenani olish (hamma rollar)
export async function GET(req: NextRequest) {
  if (!(await sorovRoli(req))) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });
  const { joriy } = await joriySmenaYozuvi();
  return NextResponse.json({ joriy });
}

// Joriy smenani almashtirish (faqat master va admin).
// Ruxsat etilgan: navbatdagi smena yoki (dam olishdan keyin) Toshkent vaqtiga ko'ra hozirgi smena.
// Orqaga qaytarib bo'lmaydi. Boshqa qurilma allaqachon almashtirgan bo'lsa — 409 va hozirgi joriy smena.
export async function POST(req: NextRequest) {
  const rol = await sorovRoli(req);
  if (!rol) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });
  if (rol !== 'admin' && rol !== 'master') return NextResponse.json({ xato: 'Smenani faqat master yoki admin almashtiradi' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (typeof body?.sana !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.sana) || typeof body?.smena !== 'string') {
    return NextResponse.json({ xato: 'Sana yoki smena noto\'g\'ri' }, { status: 400 });
  }
  const maqsad = { sana: body.sana, smena: smenaNomi(body.smena) };

  const { joriy, updatedAt } = await joriySmenaYozuvi();
  if (birXilSmena(maqsad, joriy)) return NextResponse.json({ joriy });

  const keyingi = keyingiSmena(joriy.sana, joriy.smena);
  const hozir = hozirgiSmena();
  const ruxsat =
    birXilSmena(maqsad, keyingi) || (birXilSmena(maqsad, hozir) && smenaTartibi(maqsad) > smenaTartibi(joriy));
  if (!ruxsat) return NextResponse.json({ xato: 'Bu smenaga o\'tib bo\'lmaydi', joriy }, { status: 409 });

  const r = await prisma.tizimXotira.updateMany({
    where: { kalit: JORIY_SMENA_KALITI, updatedAt },
    data: { qiymat: { ...maqsad, vaqt: toshkentVaqtMatni(), kim: rol } }
  });
  if (r.count === 0) {
    const yangi = await joriySmenaYozuvi();
    return NextResponse.json({ xato: 'Smena boshqa qurilmada allaqachon almashtirilgan', joriy: yangi.joriy }, { status: 409 });
  }
  return NextResponse.json({ joriy: maqsad });
}
