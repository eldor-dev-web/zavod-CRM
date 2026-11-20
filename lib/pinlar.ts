import prisma from '@/lib/prisma';
import type { Rol } from '@/lib/sessiya';

// PIN-kodlar bazada shu kalit ostida saqlanadi. Bu kalit hech qachon brauzerga yuborilmaydi.
export const PIN_KALITI = 'zavod_parollar';

export type PinKodlar = Record<Rol, string>;

const STANDART_PINLAR: PinKodlar = { admin: '111111', master: '222222', kontrolchi: '333333', mexanik: '444444' };

export const pinTogriMi = (pin: unknown): pin is string => typeof pin === 'string' && /^\d{6}$/.test(pin);

// Bazadagi qiymat matn (eski usul) yoki obyekt bo'lishi mumkin
function obyektgaAylantirish(qiymat: unknown): Record<string, unknown> | null {
  if (typeof qiymat === 'string') {
    try {
      return JSON.parse(qiymat);
    } catch {
      return null;
    }
  }
  return qiymat && typeof qiymat === 'object' ? (qiymat as Record<string, unknown>) : null;
}

export async function pinlarniOlish(): Promise<PinKodlar> {
  try {
    const qator = await prisma.tizimXotira.findUnique({ where: { kalit: PIN_KALITI } });
    const saqlangan = obyektgaAylantirish(qator?.qiymat);
    if (saqlangan) {
      return {
        admin: pinTogriMi(saqlangan.admin) ? saqlangan.admin : STANDART_PINLAR.admin,
        master: pinTogriMi(saqlangan.master) ? saqlangan.master : STANDART_PINLAR.master,
        kontrolchi: pinTogriMi(saqlangan.kontrolchi) ? saqlangan.kontrolchi : STANDART_PINLAR.kontrolchi,
        mexanik: pinTogriMi(saqlangan.mexanik) ? saqlangan.mexanik : STANDART_PINLAR.mexanik
      };
    }
  } catch (err) {
    console.error('PIN-kodlarni bazadan o\'qib bo\'lmadi, standart PIN-kodlar ishlatiladi:', err);
  }
  return { ...STANDART_PINLAR };
}

export async function pinlarniSaqlash(pinlar: PinKodlar) {
  await prisma.tizimXotira.upsert({
    where: { kalit: PIN_KALITI },
    update: { qiymat: pinlar },
    create: { kalit: PIN_KALITI, qiymat: pinlar }
  });
}
