// ============================================================
// MOSHINALAR VA TEXNIK XIZMAT
// Moshina raqami "MK-12" ko'rinishida yoziladi. Kun va kg alohida saqlanmaydi —
// har safar arxivdagi rulonlardan hisoblanadi. Faqat limitlar va hisoblagich tarixi saqlanadi.
// ============================================================

import { sanagaKunQoshish } from '@/lib/sana';
import { tungimi } from '@/lib/smena';

export const MOSHINA_PREFIKSI = 'MK-';
export const STANDART_MOSHINALAR_SONI = 35;
export const OGOHLANTIRISH_FOIZI = 90; // limitning 90% iga yetganda ogohlantirish

export const MOSHINA_KALIT = {
  limitlar: 'zavod_moshina_limitlari', // { "12": { kg: 10000, kun: 30 }, ... }
  hisoblagich: 'zavod_moshina_hisoblagich', // { "12": [HisoblagichYozuvi, ...] }
  soni: 'zavod_moshinalar_soni'
} as const;

// Har bir moshinaning ikkita limiti (ikkalasi ham ixtiyoriy)
export type MoshinaLimiti = { kg?: number; kun?: number };
export type MoshinaLimitlari = Record<string, MoshinaLimiti>;

// Eski ko'rinish ({ "12": 10000 }) ham to'g'ri o'qiladi
export function limitlarniOqish(qiymat: unknown): MoshinaLimitlari {
  const natija: MoshinaLimitlari = {};
  if (!qiymat || typeof qiymat !== 'object') return natija;
  Object.entries(qiymat as Record<string, unknown>).forEach(([n, l]) => {
    if (typeof l === 'number') {
      if (l > 0) natija[n] = { kg: l };
    } else if (l && typeof l === 'object') {
      const kg = Number((l as MoshinaLimiti).kg) || 0;
      const kun = Number((l as MoshinaLimiti).kun) || 0;
      if (kg > 0 || kun > 0) natija[n] = { ...(kg > 0 ? { kg } : {}), ...(kun > 0 ? { kun } : {}) };
    }
  });
  return natija;
}

// Qaysi hisoblagich yangilandi
export type HisoblagichTuri = 'kg' | 'kun' | 'ikkalasi';

export type HisoblagichYozuvi = {
  vaqt: string; // "2026-11-20 14:35" (Toshkent vaqti)
  tur?: HisoblagichTuri; // eski yozuvlarda bo'lmaydi = ikkalasi
  kg: number; // yangilanish paytida kg hisoblagichida qancha bo'lgan
  kun: number; // yangilanish paytida kun hisoblagichida qancha bo'lgan
  rulon: number;
  limit?: number | null; // eski yozuvlar uchun
  kgLimit?: number | null;
  kunLimit?: number | null;
  kim: string; // tugmani bosgan mexanik ismi
};
export type HisoblagichTarixi = Record<string, HisoblagichYozuvi[]>;

export const turKgmi = (y: HisoblagichYozuvi) => !y.tur || y.tur === 'kg' || y.tur === 'ikkalasi';
export const turKunmi = (y: HisoblagichYozuvi) => !y.tur || y.tur === 'kun' || y.tur === 'ikkalasi';

export type MoshinaHisobi = { n: number; kun: number; kg: number; rulon: number; oxirgiSana: string | null };

// Har qanday yozuvdan moshina raqamini ajratish: "MK-12", "12", "№12", "mk12" -> 12
export function moshinaRaqami(yozuv: unknown): number | null {
  const m = String(yozuv ?? '').match(/\d{1,6}/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n > 0 ? n : null;
}

export const moshinaNomi = (n: number) => `${MOSHINA_PREFIKSI}${n}`;

export function moshinalarSoni(qiymat: unknown): number {
  const n = parseInt(String(qiymat ?? ''), 10);
  return n > 0 && n <= 500 ? n : STANDART_MOSHINALAR_SONI;
}

// Rulon chiqqan vaqt (solishtirish uchun): tungi smenada 12:00 dan oldingi rulon ertasi kunga tegishli
export function rulonVaqti(sana: string, smena: string, vaqt: unknown): string {
  const v = String(vaqt ?? '').trim();
  const togri = /^\d{1,2}:\d{2}$/.test(v);
  const soat = togri ? v.padStart(5, '0') : '00:00';
  const kun = tungimi(smena) && togri && soat < '12:00' ? sanagaKunQoshish(sana, 1) : sana;
  return `${kun} ${soat}`;
}

// Har bir moshina uchun kg va kun hisoblagichlari qayerdan boshlanadi (har birining oxirgi yangilanishi)
export function hisoblagichBoshlari(tarix: HisoblagichTarixi): { kg: Record<string, string>; kun: Record<string, string> } {
  const kg: Record<string, string> = {};
  const kun: Record<string, string> = {};
  Object.entries(tarix || {}).forEach(([n, yozuvlar]) => {
    (Array.isArray(yozuvlar) ? yozuvlar : []).forEach((y) => {
      if (!y?.vaqt) return;
      if (turKgmi(y) && (!kg[n] || y.vaqt > kg[n])) kg[n] = y.vaqt;
      if (turKunmi(y) && (!kun[n] || y.vaqt > kun[n])) kun[n] = y.vaqt;
    });
  });
  return { kg, kun };
}

export type LimitHolati = { holat: 'yoq' | 'yaxshi' | 'yaqin' | 'oshdi'; foiz: number; qoldi: number };

// Kg uchun ham, kun uchun ham bir xil ishlaydi
export function limitHolati(qiymat: number, limit: number | null | undefined): LimitHolati {
  if (!limit || limit <= 0) return { holat: 'yoq', foiz: 0, qoldi: 0 };
  const foiz = (qiymat / limit) * 100;
  const qoldi = limit - qiymat;
  return { holat: qiymat >= limit ? 'oshdi' : foiz >= OGOHLANTIRISH_FOIZI ? 'yaqin' : 'yaxshi', foiz, qoldi };
}

const DARAJA: Record<LimitHolati['holat'], number> = { yoq: 0, yaxshi: 1, yaqin: 2, oshdi: 3 };
// Ikki holatdan eng jiddiysi (kartaning rangi va saralash uchun)
export const jiddiyroq = (a: LimitHolati, b: LimitHolati) =>
  DARAJA[b.holat] > DARAJA[a.holat] || (DARAJA[b.holat] === DARAJA[a.holat] && b.foiz > a.foiz) ? b : a;

// Baza ulanmaganda: shu kompyuterdagi smenalardan hisoblash
export function mahalliyHisob(
  smenalar: { sana: string; smena: string; moshinalar: any[] }[],
  boshlar: { kg: Record<string, string>; kun: Record<string, string> },
  maks: number
): MoshinaHisobi[] {
  const xarita = new Map<number, { kunlar: Set<string>; kg: number; rulon: number; oxirgi: string | null }>();
  smenalar.forEach((s) =>
    (s.moshinalar || []).forEach((m: any) => {
      const n = moshinaRaqami(m?.raqam);
      if (!n || n > maks) return;
      (Array.isArray(m?.rulonlar) ? m.rulonlar : []).forEach((r: any) => {
        const kg = parseFloat(String(r?.kg ?? '').replace(',', '.'));
        if (!(kg > 0)) return;
        const vaqt = rulonVaqti(s.sana, s.smena, r?.vaqt);
        const kgBosh = boshlar.kg[String(n)];
        const kunBosh = boshlar.kun[String(n)];
        const kgdaSanaladi = !kgBosh || vaqt > kgBosh;
        const kundaSanaladi = !kunBosh || vaqt > kunBosh;
        if (!kgdaSanaladi && !kundaSanaladi) return;
        const h = xarita.get(n) || { kunlar: new Set<string>(), kg: 0, rulon: 0, oxirgi: null };
        if (kundaSanaladi) h.kunlar.add(s.sana);
        if (kgdaSanaladi) {
          h.kg += kg;
          h.rulon += 1;
        }
        if (!h.oxirgi || s.sana > h.oxirgi) h.oxirgi = s.sana;
        xarita.set(n, h);
      });
    })
  );
  return Array.from(xarita.entries()).map(([n, h]) => ({ n, kun: h.kunlar.size, kg: h.kg, rulon: h.rulon, oxirgiSana: h.oxirgi }));
}
