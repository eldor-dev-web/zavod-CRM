import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PIN_KALITI } from '@/lib/pinlar';
import { sorovRoli, type Rol } from '@/lib/sessiya';
import { kalitOyi, oyYopilganmi } from '@/lib/oyQulfi';
import { toshkentSana } from '@/lib/sana';

// Bu kalitlarni faqat admin o'zgartira oladi (Sozlamalar sahifasi)
const FAQAT_ADMIN_KALITLAR = [
  'zavod_lavozimlar_bazasi',
  'zavod_operator_qoshimcha',
  'zavod_brak_stavkalari',
  'zavod_brak_meyyori',
  'zavod_sozlamalar_tarixi',
  'zavod_moshinalar_soni',
  'zavod_telegram_bot_token'
];

// Avans daftari (pul ma'lumoti) — faqat admin ko'radi va o'zgartiradi
const FAQAT_ADMIN_PREFIKSLAR = ['zavod_eslatmalar_'];

// Bu kalitlarni admin va master o'zgartiradi (Ishchilar sahifasi)
const ADMIN_MASTER_PREFIKSLAR = ['zavod_ishchilar_', 'zavod_xodim_davomati'];

// Texnik xizmat: moshina limitlari va hisoblagich tarixi (admin va mexanik)
const TEXNIK_KALITLAR = ['zavod_moshina_limitlari', 'zavod_moshina_hisoblagich'];

function yozishgaRuxsat(rol: Rol, kalit: string) {
  if (TEXNIK_KALITLAR.includes(kalit)) return rol === 'admin' || rol === 'mexanik';
  // Mexanik faqat texnik xizmat ma'lumotlarini o'zgartira oladi
  if (rol === 'mexanik') return false;
  if (FAQAT_ADMIN_KALITLAR.includes(kalit)) return rol === 'admin';
  if (FAQAT_ADMIN_PREFIKSLAR.some((p) => kalit.startsWith(p))) return rol === 'admin';
  if (ADMIN_MASTER_PREFIKSLAR.some((p) => kalit.startsWith(p))) return rol === 'admin' || rol === 'master';
  return true;
}

// 1. Bazadan barcha xotira ma'lumotlarini o'qish (PIN-kodlarsiz)
export async function GET(req: NextRequest) {
  const rol = await sorovRoli(req);
  if (!rol) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });

  try {
    // Smenalar o'z jadvalida (/api/smena), qurilma sozlamalari esa har bir kompyuterning o'zida turadi.
    // Ularni bu yerda yubormaymiz, aks holda yillar o'tib har sahifa ochilishi juda og'irlashadi.
    const barchaMalumot = await prisma.tizimXotira.findMany({
      where: {
        AND: [
          { kalit: { notIn: [PIN_KALITI, 'zavod_telegram_bot_token', 'zavod_oxirgi_sana', 'zavod_oxirgi_smena', 'zavod_foydalanuvchi', 'zavod_bot_sorovlar', 'zavod_rad_etilganlar'] } },
          { NOT: { kalit: { startsWith: 'zavod_smena_' } } },
          // Smena hisobotlari qachon yuborilgani — faqat server uchun
          { NOT: { kalit: { startsWith: 'zavod_hisobot_' } } },
          // Avans daftarini faqat admin oladi
          ...(rol === 'admin' ? [] : FAQAT_ADMIN_PREFIKSLAR.map((p) => ({ NOT: { kalit: { startsWith: p } } })))
        ]
      }
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
    // Smenalar faqat /api/smena orqali saqlanadi
    if (kalit.startsWith('zavod_smena_')) {
      return NextResponse.json({ ok: true, eslatma: 'Smenalar alohida saqlanadi' }, { status: 200 });
    }
    // Bot so'rovlari faqat server (Telegram bot) tomonidan yoziladi
    // Davomat endi katakma-katak /api/davomat orqali saqlanadi (butun jadval ustidan yozilmaydi)
    if (kalit === 'zavod_xodim_davomati') {
      return NextResponse.json({ ok: true, eslatma: 'Davomat /api/davomat orqali saqlanadi' }, { status: 200 });
    }
    // Oy yopilgan bo'lsa (6-sanadan keyin o'tgan oy): ishchilar, braklar, avans daftarini hech kim o'zgartira olmaydi
    const oy = kalitOyi(kalit);
    if (oy && oyYopilganmi(oy, toshkentSana())) {
      return NextResponse.json({ xato: 'Oy yopilgan — o\'zgartirib bo\'lmaydi' }, { status: 403 });
    }
    if (kalit === 'zavod_bot_sorovlar' || kalit === 'zavod_joriy_smena' || kalit === 'zavod_rad_etilganlar' || kalit.startsWith('zavod_hisobot_')) {
      return NextResponse.json({ ok: true, eslatma: 'Bot ma\'lumoti' }, { status: 200 });
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
