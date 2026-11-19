import { NextRequest, NextResponse } from 'next/server';
import { pinlarniOlish, pinlarniSaqlash, pinTogriMi } from '@/lib/pinlar';
import { sorovRoli } from '@/lib/sessiya';

// PIN-kodlarni faqat admin ko'radi va o'zgartiradi

export async function GET(req: NextRequest) {
  if ((await sorovRoli(req)) !== 'admin') return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 403 });
  return NextResponse.json(await pinlarniOlish());
}

export async function POST(req: NextRequest) {
  if ((await sorovRoli(req)) !== 'admin') return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ xato: 'Noto\'g\'ri so\'rov' }, { status: 400 });
  }

  const { admin, master, kontrolchi } = body || {};
  if (![admin, master, kontrolchi].every(pinTogriMi)) {
    return NextResponse.json({ xato: 'Har bir PIN-kod aynan 6 ta raqamdan iborat bo\'lishi kerak' }, { status: 400 });
  }
  if (new Set([admin, master, kontrolchi]).size !== 3) {
    return NextResponse.json({ xato: 'PIN-kodlar bir-biridan farq qilishi kerak' }, { status: 400 });
  }

  try {
    await pinlarniSaqlash({ admin, master, kontrolchi });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PIN saqlash xatosi:', err);
    return NextResponse.json({ xato: 'Bazaga saqlab bo\'lmadi. Baza ulanishini tekshiring.' }, { status: 500 });
  }
}
