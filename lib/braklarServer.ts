// Server: oyning braklarini bazadagi smenalardan hisoblash (Braklar sahifasi, Asosiy panel va Telegram bot shundan oladi)
import prisma from '@/lib/prisma';
import { faolIshchilar, jsonOchish, KALIT, oyMeyyori, son, type BrakJadvali, type BrakMeyyori, type Ishchi, type SozlamaTarixi } from '@/lib/hisob';
import { eskiKunlarniQoshish, smenalardanBraklar, type BraklarNatijasi } from '@/lib/braklar';

async function xotira<T>(kalit: string, standart: T): Promise<T> {
  const qator = await prisma.tizimXotira.findUnique({ where: { kalit } });
  return jsonOchish<T>(qator?.qiymat, standart);
}

// Oy ro'yxati bo'lmasa — eng yaqin oldingi oy ro'yxati (xodim ID lari o'zgarmaydi)
async function oyIshchilari(oy: string): Promise<Ishchi[]> {
  const kalit = KALIT.ishchilar(oy);
  const qator = await prisma.tizimXotira.findUnique({ where: { kalit } });
  if (qator) return faolIshchilar(jsonOchish<unknown>(qator.qiymat, []));
  const oldingilar = await prisma.tizimXotira.findMany({
    where: { kalit: { startsWith: 'zavod_ishchilar_', lt: kalit } },
    orderBy: { kalit: 'desc' },
    take: 12
  });
  for (const r of oldingilar) {
    const xodimlar = faolIshchilar(jsonOchish<unknown>(r.qiymat, []));
    if (xodimlar.length > 0) return xodimlar;
  }
  return [];
}

export async function oyBraklari(oy: string): Promise<BraklarNatijasi> {
  const [smenalar, eski] = await Promise.all([
    prisma.smena.findMany({
      where: { sana: { startsWith: oy } },
      include: { moshinalar: { include: { rulonlar: true } } }
    }),
    xotira<BrakJadvali>(KALIT.brakJadvali(oy), {})
  ]);

  // Bu oyda bazada smena yo'q (smenalar bazaga yozilishidan oldingi oy) — eski saqlangan jadval
  if (smenalar.length === 0) return { jadval: eski, topilmadi: [], manba: 'eski' };

  const [ishchilar, joriyMeyyor, tarix] = await Promise.all([
    oyIshchilari(oy),
    xotira<Partial<BrakMeyyori>>(KALIT.brakMeyyori, {}),
    xotira<SozlamaTarixi>(KALIT.sozlamaTarixi, {})
  ]);
  const meyyor = oyMeyyori(oy, { igna: son(joriyMeyyor?.igna), lux: son(joriyMeyyor?.lux) }, tarix);

  const natija = smenalardanBraklar(
    smenalar.map((s) => ({
      sana: s.sana,
      smena: s.smenaTuri,
      moshinalar: s.moshinalar.map((m) => ({
        raqam: m.raqam,
        operator: m.operator,
        operatorId: m.operatorId,
        rulonlar: m.rulonlar.map((r) => ({ nuqsonlar: { 'Igna siniq': r.ignaSiniq, 'Lyc xato': r.lycXato } }))
      }))
    })),
    ishchilar,
    meyyor
  );

  const smenaKunlari = new Set(smenalar.map((s) => Number(s.sana.slice(8, 10))).filter(Boolean));
  return { jadval: eskiKunlarniQoshish(natija.jadval, eski, smenaKunlari), topilmadi: natija.topilmadi, manba: 'smenalar' };
}
