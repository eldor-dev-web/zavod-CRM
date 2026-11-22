import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sorovRoli } from '@/lib/sessiya';
import { botTokeni } from '@/lib/hisobot';
import { smenaQisqa } from '@/lib/smena';
import { toshkentVaqtMatni } from '@/lib/sana';

// Kechikkan ma'lumot arxivdagi smenaga tushib, server uni qabul qilmagan bo'lsa — brauzer shu yerga xabar beradi.
// Arxiv o'zgarmaydi; faqat Telegram kanalga ogohlantirish ketadi va qayd saqlanadi (adminga ko'rinishi uchun).
const QAYD_KALITI = 'zavod_rad_etilganlar';

export async function POST(req: NextRequest) {
  const rol = await sorovRoli(req);
  if (!rol) return NextResponse.json({ xato: 'Tizimga kiring' }, { status: 401 });

  const b = await req.json().catch(() => null);
  const sana = String(b?.sana ?? '');
  const smena = String(b?.smena ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sana) || !smena) return NextResponse.json({ xato: 'Noto\'g\'ri' }, { status: 400 });

  const moshinalar: any[] = Array.isArray(b?.moshinalar) ? b.moshinalar.slice(0, 100) : [];
  let rulon = 0;
  let kg = 0;
  const raqamlar: string[] = [];
  moshinalar.forEach((m) => {
    const t = (Array.isArray(m?.rulonlar) ? m.rulonlar : [])
      .map((r: any) => parseFloat(String(r?.kg ?? '').replace(',', '.')))
      .filter((n: number) => Number.isFinite(n) && n > 0);
    if (t.length > 0 && m?.raqam) raqamlar.push(String(m.raqam).slice(0, 12));
    rulon += t.length;
    kg += t.reduce((j: number, n: number) => j + n, 0);
  });

  const vaqt = toshkentVaqtMatni();
  // Qayd (oxirgi 100 ta)
  try {
    const y = await prisma.tizimXotira.findUnique({ where: { kalit: QAYD_KALITI } });
    const eski = Array.isArray(y?.qiymat) ? (y!.qiymat as unknown[]) : [];
    const yozuv = { vaqt, sana, smena: smenaQisqa(smena), rol, rulon, kg: Math.round(kg * 10) / 10, moshinalar };
    await prisma.tizimXotira.upsert({
      where: { kalit: QAYD_KALITI },
      update: { qiymat: [yozuv, ...eski].slice(0, 100) as any },
      create: { kalit: QAYD_KALITI, qiymat: [yozuv] as any }
    });
  } catch (e) {
    console.error('Rad qaydini yozib bo\'lmadi:', e);
  }

  // Telegram kanal
  const chatId = (process.env.TELEGRAM_HISOBOT_CHAT_ID || '').trim();
  const token = await botTokeni();
  if (chatId && token) {
    const s = `${sana.slice(8, 10)}.${sana.slice(5, 7)}.${sana.slice(0, 4)}`;
    const matn =
      `⚠️ <b>${s} ${smenaQisqa(smena)}: kechikkan ma'lumot qabul qilinmadi</b>\n` +
      `Smena arxivga o'tib bo'lgan, shuning uchun o'zgarish saqlanmadi.\n` +
      (rulon > 0 ? `${raqamlar.join(', ')} · ${rulon} rulon · ${Math.round(kg * 10) / 10} kg\n` : '') +
      `Kim: ${rol} · ${vaqt.slice(11)}`;
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: matn, parse_mode: 'HTML' })
      });
    } catch {}
  }
  return NextResponse.json({ ok: true });
}
