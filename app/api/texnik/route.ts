import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { moshinalarSoni } from '@/lib/moshina';
import { sorovRoli } from '@/lib/sessiya';

const VAQT_FORMATI = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

// Har bir moshina: hisoblagich yangilangandan beri necha kun ishlagan va necha kg chiqargan.
// POST /api/texnik  { boshlar: { kg: { "12": "2026-11-20 14:35" }, kun: { ... } }, maks: 35 }
// (boshlar brauzerdan keladi: hali bazaga yetib bormagan yangilanish ham hisobga olinadi)
export async function POST(req: NextRequest) {
  const rol = await sorovRoli(req);
  if (rol !== 'admin' && rol !== 'mexanik') {
    return NextResponse.json({ xato: 'Ruxsat yo\'q' }, { status: 403 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const maks = moshinalarSoni(body?.maks);
  // Har moshina uchun kg va kun hisoblagichlari alohida boshlanadi
  const tayyorlash = (obj: unknown) =>
    Object.entries((obj as Record<string, unknown>) || {})
      .map(([n, dan]) => ({ n: parseInt(n, 10), dan: String(dan) }))
      .filter((b) => b.n > 0 && b.n <= maks && VAQT_FORMATI.test(b.dan));
  const kgBoshlari = tayyorlash(body?.boshlar?.kg);
  const kunBoshlari = tayyorlash(body?.boshlar?.kun);

  try {
    // Rulon vaqti: tungi smenada 12:00 dan oldingi rulon ertasi kunga tegishli
    const qatorlar = await prisma.$queryRaw<{ n: number; kun: number; kg: number; rulon: number; oxirgiSana: string | null }[]>`
      WITH rulonlar AS (
        SELECT
          NULLIF(substring(m."raqam" from '[0-9]{1,6}'), '')::int AS n,
          s."sana" AS sana,
          (CASE
             WHEN s."smenaTuri" ILIKE '%NOCH%' AND r."vaqt" ~ '^[0-9]{1,2}:[0-9]{2}$' AND lpad(r."vaqt", 5, '0') < '12:00'
             THEN to_char(s."sana"::date + 1, 'YYYY-MM-DD')
             ELSE s."sana"
           END)
          || ' ' ||
          (CASE WHEN r."vaqt" ~ '^[0-9]{1,2}:[0-9]{2}$' THEN lpad(r."vaqt", 5, '0') ELSE '00:00' END) AS vaqt,
          r."kg" AS kg
        FROM "Rulon" r
        JOIN "Moshina" m ON m."id" = r."moshinaId"
        JOIN "Smena" s ON s."id" = m."smenaId"
        WHERE r."kg" > 0 AND s."sana" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      ),
      kg_boshlar AS (
        SELECT (x->>'n')::int AS n, x->>'dan' AS dan
        FROM json_array_elements(${JSON.stringify(kgBoshlari)}::json) AS x
      ),
      kun_boshlar AS (
        SELECT (x->>'n')::int AS n, x->>'dan' AS dan
        FROM json_array_elements(${JSON.stringify(kunBoshlari)}::json) AS x
      )
      SELECT r.n,
             (COUNT(DISTINCT r.sana) FILTER (WHERE ub.dan IS NULL OR r.vaqt > ub.dan))::int AS kun,
             COALESCE(SUM(r.kg) FILTER (WHERE kb.dan IS NULL OR r.vaqt > kb.dan), 0)::float AS kg,
             (COUNT(*) FILTER (WHERE kb.dan IS NULL OR r.vaqt > kb.dan))::int AS rulon,
             MAX(r.sana) AS "oxirgiSana"
      FROM rulonlar r
      LEFT JOIN kg_boshlar kb ON kb.n = r.n
      LEFT JOIN kun_boshlar ub ON ub.n = r.n
      WHERE r.n BETWEEN 1 AND ${maks}
      GROUP BY r.n
    `;
    return NextResponse.json({
      moshinalar: qatorlar.map((q) => ({ ...q, n: Number(q.n), kun: Number(q.kun), kg: Number(q.kg), rulon: Number(q.rulon) }))
    });
  } catch (err) {
    console.error('Texnik hisob xatosi:', err);
    return NextResponse.json({ xato: 'Bazaga ulanib bo\'lmadi' }, { status: 503 });
  }
}
