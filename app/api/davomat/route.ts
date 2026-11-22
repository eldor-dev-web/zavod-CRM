import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sorovRoli } from '@/lib/sessiya';
import { davomatKatakOyi, oyYopilganmi } from '@/lib/oyQulfi';
import { toshkentSana } from '@/lib/sana';

// DAVOMAT — har bir katak (ishchi + kun) alohida saqlanadi.
// Brauzer butun jadvalni emas, faqat o'zgargan kataklarni yuboradi; server ularni bazadagi jadvalga
// bitta so'rovda (atomik) qo'shadi. Shunda ikki kishi bir vaqtda belgilasa, ikkalasining belgisi saqlanadi.
const KALIT = 'zavod_xodim_davomati';

export async function GET(req: NextRequest) {
  if (!(await sorovRoli(req))) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });
  const y = await prisma.tizimXotira.findUnique({ where: { kalit: KALIT } });
  let q: unknown = y?.qiymat ?? {};
  if (typeof q === 'string') {
    try {
      q = JSON.parse(q);
    } catch {
      q = {};
    }
  }
  return NextResponse.json({ davomat: q && typeof q === 'object' ? q : {} });
}

export async function POST(req: NextRequest) {
  const rol = await sorovRoli(req);
  if (!rol) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });
  if (rol !== 'admin' && rol !== 'master') return NextResponse.json({ xato: 'Davomatni faqat admin yoki master belgilaydi' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const kataklar = body?.kataklar;
  if (!kataklar || typeof kataklar !== 'object' || Array.isArray(kataklar)) {
    return NextResponse.json({ xato: 'Ma\'lumot noto\'g\'ri' }, { status: 400 });
  }

  const bugun = toshkentSana();
  const qabul: Record<string, { status: string; moshina: number | '' }> = {};
  const rad: string[] = [];
  for (const [kalit, qiymat] of Object.entries(kataklar).slice(0, 2000)) {
    const oy = davomatKatakOyi(kalit);
    if (!oy || kalit.length > 120) continue;
    if (oyYopilganmi(oy, bugun)) {
      rad.push(kalit); // yopilgan oy — hech kim o'zgartira olmaydi
      continue;
    }
    const v = (qiymat || {}) as { status?: unknown; moshina?: unknown };
    const moshina = Number(String(v.moshina ?? '').replace(/\D/g, ''));
    qabul[kalit] = { status: v.status === '+' ? '+' : '', moshina: String(v.moshina ?? '').trim() === '' || !Number.isFinite(moshina) ? '' : moshina };
  }

  if (Object.keys(qabul).length > 0) {
    const yangi = JSON.stringify(qabul);
    // Eski yozuv matn (JSON string) ko'rinishida saqlangan bo'lishi ham mumkin — avval obyektga aylantiramiz
    await prisma.$executeRaw`
      INSERT INTO "TizimXotira" ("kalit", "qiymat", "updatedAt")
      VALUES (${KALIT}, ${yangi}::jsonb, NOW())
      ON CONFLICT ("kalit") DO UPDATE SET
        "qiymat" = (
          CASE
            WHEN jsonb_typeof("TizimXotira"."qiymat") = 'object' THEN "TizimXotira"."qiymat"
            WHEN jsonb_typeof("TizimXotira"."qiymat") = 'string' THEN ("TizimXotira"."qiymat" #>> '{}')::jsonb
            ELSE '{}'::jsonb
          END
        ) || ${yangi}::jsonb,
        "updatedAt" = NOW()
    `;
  }
  return NextResponse.json({ ok: true, qabul: Object.keys(qabul).length, rad });
}
