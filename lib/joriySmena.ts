// Joriy smena — serverda (faqat API route'larda ishlatiladi)
import prisma from '@/lib/prisma';
import { hozirgiSmena, JORIY_SMENA_KALITI, smenaNomi, type SmenaNuqtasi } from '@/lib/smena';
import { toshkentVaqtMatni } from '@/lib/sana';

function tozalash(q: unknown): SmenaNuqtasi | null {
  const o = (typeof q === 'string' ? (() => { try { return JSON.parse(q); } catch { return null; } })() : q) as Partial<SmenaNuqtasi> | null;
  if (!o || typeof o.sana !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.sana) || typeof o.smena !== 'string') return null;
  return { sana: o.sana, smena: smenaNomi(o.smena) };
}

// Bazadagi joriy smena (+ o'zgarish vaqti, bir vaqtda ikki qurilma almashtirmasligi uchun).
// Hali yozilmagan bo'lsa, Toshkent vaqtiga qarab BIR MARTA o'rnatiladi.
export async function joriySmenaYozuvi(): Promise<{ joriy: SmenaNuqtasi; updatedAt: Date }> {
  const y = await prisma.tizimXotira.findUnique({ where: { kalit: JORIY_SMENA_KALITI } });
  const j = tozalash(y?.qiymat);
  if (y && j) return { joriy: j, updatedAt: y.updatedAt };

  const h = hozirgiSmena();
  const boshlangich = { sana: h.sana, smena: h.smena };
  const yangi = await prisma.tizimXotira.upsert({
    where: { kalit: JORIY_SMENA_KALITI },
    update: { qiymat: { ...boshlangich, vaqt: toshkentVaqtMatni() } },
    create: { kalit: JORIY_SMENA_KALITI, qiymat: { ...boshlangich, vaqt: toshkentVaqtMatni() } }
  });
  return { joriy: boshlangich, updatedAt: yangi.updatedAt };
}

export async function joriySmena(): Promise<SmenaNuqtasi> {
  return (await joriySmenaYozuvi()).joriy;
}
