import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// 1. Bazadan barcha xotira ma'lumotlarini o'qish (GET)
export async function GET() {
  try {
    const barchaMaLumot = await (prisma as any).tizimXotira.findMany();
    return NextResponse.json(barchaMaLumot, { status: 200 });
  } catch (error) {
    console.error('Xotira GET xatosi:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// 2. Bazaga ma'lumotni saqlash yoki yangilash (POST)
export async function POST(req: Request) {
  try {
    const { kalit, qiymat } = await req.json();
    if (!kalit) return NextResponse.json({ xato: 'Kalit yoq' }, { status: 400 });

    const saqlandi = await (prisma as any).tizimXotira.upsert({
      where: { kalit },
      update: { qiymat },
      create: { kalit, qiymat },
    });

    return NextResponse.json(saqlandi, { status: 200 });
  } catch (error) {
    console.error('Xotira POST xatosi:', error);
    return NextResponse.json({ xato: 'Saqlashda xatolik' }, { status: 500 });
  }
}