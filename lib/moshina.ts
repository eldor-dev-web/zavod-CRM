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
  limitlar: 'zavod_moshina_limitlari', // { "12": 10000, ... }
  hisoblagich: 'zavod_moshina_hisoblagich', // { "12": [HisoblagichYozuvi, ...] }
  soni: 'zavod_moshinalar_soni'
} as const;

export type MoshinaLimitlari = Record<string, number>;

export type HisoblagichYozuvi = {
  vaqt: string; // "2026-11-20 14:35" (Toshkent vaqti)
  kg: number; // yangilanish paytida hisoblagichda qancha kg bo'lgan
  kun: number;
  rulon: number;
  limit: number | null;
  kim: string; // tugmani bosgan mexanik ismi
};
export type HisoblagichTarixi = Record<string, HisoblagichYozuvi[]>;

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

// Har bir moshina uchun hisob qayerdan boshlanadi (oxirgi yangilanish vaqti)
export function hisoblagichBoshlari(tarix: HisoblagichTarixi): Record<string, string> {
  const natija: Record<string, string> = {};
  Object.entries(tarix || {}).forEach(([n, yozuvlar]) => {
    const oxirgi = Array.isArray(yozuvlar) ? yozuvlar[yozuvlar.length - 1] : undefined;
    if (oxirgi?.vaqt) natija[n] = oxirgi.vaqt;
  });
  return natija;
}

export type LimitHolati = { holat: 'yoq' | 'yaxshi' | 'yaqin' | 'oshdi'; foiz: number; qoldi: number };

export function limitHolati(kg: number, limit: number | null | undefined): LimitHolati {
  if (!limit || limit <= 0) return { holat: 'yoq', foiz: 0, qoldi: 0 };
  const foiz = (kg / limit) * 100;
  const qoldi = limit - kg;
  return { holat: kg >= limit ? 'oshdi' : foiz >= OGOHLANTIRISH_FOIZI ? 'yaqin' : 'yaxshi', foiz, qoldi };
}

// Baza ulanmaganda: shu kompyuterdagi smenalardan hisoblash
export function mahalliyHisob(
  smenalar: { sana: string; smena: string; moshinalar: any[] }[],
  boshlar: Record<string, string>,
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
        const bosh = boshlar[String(n)];
        if (bosh && rulonVaqti(s.sana, s.smena, r?.vaqt) <= bosh) return;
        const h = xarita.get(n) || { kunlar: new Set<string>(), kg: 0, rulon: 0, oxirgi: null };
        h.kunlar.add(s.sana);
        h.kg += kg;
        h.rulon += 1;
        if (!h.oxirgi || s.sana > h.oxirgi) h.oxirgi = s.sana;
        xarita.set(n, h);
      });
    })
  );
  return Array.from(xarita.entries()).map(([n, h]) => ({ n, kun: h.kunlar.size, kg: h.kg, rulon: h.rulon, oxirgiSana: h.oxirgi }));
}
