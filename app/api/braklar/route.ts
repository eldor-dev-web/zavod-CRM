import { NextRequest, NextResponse } from 'next/server';
import { sorovRoli } from '@/lib/sessiya';
import { oyBraklari } from '@/lib/braklarServer';

// GET /api/braklar?oy=2026-11 — oyning braklari, smenalardan hisoblangan
export async function GET(req: NextRequest) {
  const rol = await sorovRoli(req);
  if (rol !== 'admin' && rol !== 'master') {
    return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 403 });
  }
  const oy = req.nextUrl.searchParams.get('oy') || '';
  if (!/^\d{4}-\d{2}$/.test(oy)) {
    return NextResponse.json({ xato: 'Oy noto\'g\'ri' }, { status: 400 });
  }
  try {
    return NextResponse.json(await oyBraklari(oy), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Braklarni hisoblab bo\'lmadi:', err);
    return NextResponse.json({ xato: 'Bazaga ulanib bo\'lmadi' }, { status: 500 });
  }
}
