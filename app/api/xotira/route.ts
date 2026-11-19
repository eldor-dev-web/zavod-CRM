import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PIN_KALITI } from '@/lib/pinlar';
import { sorovRoli, type Rol } from '@/lib/sessiya';

// Bu kalitlarni faqat admin o'zgartira oladi (Sozlamalar sahifasi)
const FAQAT_ADMIN_KALITLAR = [
  'zavod_lavozimlar_bazasi',
  'zavod_operator_qoshimcha',
  'zavod_brak_stavkalari',
  'zavod_brak_meyyori',
  'zavod_telegram_bot_token'
];

// Bu kalitlarni admin va master o'zgartiradi (Ishchilar sahifasi)
const ADMIN_MASTER_PREFIKSLAR = ['zavod_ishchilar_', 'zavod_xodim_davomati'];

function yozishgaRuxsat(rol: Rol, kalit: string) {
  if (FAQAT_ADMIN_KALITLAR.includes(kalit)) return rol === 'admin';
  if (ADMIN_MASTER_PREFIKSLAR.some((p) => kalit.startsWith(p))) return rol === 'admin' || rol === 'master';
  return true;
}

// 1. Bazadan barcha xotira ma'lumotlarini o'qish (PIN-kodlarsiz)
export async function GET(req: NextRequest) {
  if (!(await sorovRoli(req))) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });

  try {
    const barchaMalumot = await prisma.tizimXotira.findMany({
      where: { kalit: { notIn: [PIN_KALITI, 'zavod_telegram_bot_token'] } }
    });
    return NextResponse.json(barchaMalumot, { status: 200 });
  } catch (error) {
    console.error('Xotira GET xatosi:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// 2. Bazaga ma'lumotni saqlash yoki yangilash
export async function POST(req: NextRequest) {
  const rol = await sorovRoli(req);
  if (!rol) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });

  try {
    const { kalit, qiymat } = await req.json();
    if (typeof kalit !== 'string' || !kalit.startsWith('zavod_')) {
      return NextResponse.json({ xato: 'Noto\'g\'ri kalit' }, { status: 400 });
    }
    if (kalit === PIN_KALITI) {
      return NextResponse.json({ xato: 'PIN-kodlar faqat maxsus oyna orqali o\'zgartiriladi' }, { status: 403 });
    }
    if (!yozishgaRuxsat(rol, kalit)) {
      return NextResponse.json({ xato: 'Bu ma\'lumotni o\'zgartirishga ruxsatingiz yo\'q' }, { status: 403 });
    }

    const saqlandi = await prisma.tizimXotira.upsert({
      where: { kalit },
      update: { qiymat },
      create: { kalit, qiymat }
    });

    return NextResponse.json(saqlandi, { status: 200 });
  } catch (error) {
    console.error('Xotira POST xatosi:', error);
    return NextResponse.json({ xato: 'Saqlashda xatolik' }, { status: 500 });
  }
}
