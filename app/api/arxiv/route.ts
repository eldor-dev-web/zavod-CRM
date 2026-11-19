import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { bazaSmenasiniOgirish } from '@/lib/arxiv';
import { sorovRoli } from '@/lib/sessiya';

const MAKS_SMENA = 400; // bitta so'rovda ko'pi bilan (taxminan 200 kun)
const sanaTogri = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Smenalar arxivi: sana oralig'i va qidiruv bo'yicha (faqat admin)
// GET /api/arxiv?dan=2026-01-01&gacha=2026-11-19&smena=DEN&q=LOT-123
export async function GET(req: NextRequest) {
  if ((await sorovRoli(req)) !== 'admin') {
    return NextResponse.json({ xato: 'Arxivni faqat admin ko\'ra oladi' }, { status: 403 });
  }

  const p = req.nextUrl.searchParams;
  const dan = p.get('dan');
  const gacha = p.get('gacha');
  const smena = p.get('smena') || '';
  const q = (p.get('q') || '').trim().slice(0, 100);

  // Katta-kichik harfga qaramay qidirish
  const oz = { contains: q, mode: 'insensitive' as const };

  try {
    const smenalar = await prisma.smena.findMany({
      where: {
        ...(sanaTogri(dan) || sanaTogri(gacha)
          ? { sana: { ...(sanaTogri(dan) ? { gte: dan! } : {}), ...(sanaTogri(gacha) ? { lte: gacha! } : {}) } }
          : {}),
        ...(smena ? { smenaTuri: { contains: smena } } : {}),
        ...(q
          ? {
              OR: [
                { kontrolchi: oz },
                { master: oz },
                {
                  moshinalar: {
                    some: {
                      OR: [{ raqam: oz }, { talimoti: oz }, { brend: oz }, { ip: oz }, { lot: oz }, { operator: oz }]
                    }
                  }
                }
              ]
            }
          : {})
      },
      include: { moshinalar: { include: { rulonlar: { orderBy: { tartibRaqam: 'asc' } } } } },
      orderBy: [{ sana: 'desc' }, { smenaTuri: 'asc' }],
      take: MAKS_SMENA + 1
    });

    return NextResponse.json({
      smenalar: smenalar.slice(0, MAKS_SMENA).map(bazaSmenasiniOgirish),
      kesilgan: smenalar.length > MAKS_SMENA
    });
  } catch (err) {
    console.error('Arxiv xatosi:', err);
    return NextResponse.json({ xato: 'Bazaga ulanib bo\'lmadi' }, { status: 503 });
  }
}
