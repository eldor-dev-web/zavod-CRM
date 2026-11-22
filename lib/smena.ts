// ============================================================
// SMENALAR
// Smenani master o'zi almashtiradi (aqlli tugmalar). Tizim soatga qarab hech narsani o'zi o'zgartirmaydi,
// faqat almashtirish unutilganda eslatadi.
// ============================================================

import { sanagaKunQoshish, toshkentVaqtMatni } from '@/lib/sana';

export const DEN = 'DEN (Kunduzgi)';
export const NOCH = 'NOCH (Tungi)';

export const tungimi = (smena: string) => String(smena).toUpperCase().includes('NOCH');
export const smenaQisqa = (smena: string) => (tungimi(smena) ? 'NOCH' : 'DEN');

// Oldingi smena: NOCH -> shu kunning DEN, DEN -> kechagi NOCH
export function oldingiSmena(sana: string, smena: string): { sana: string; smena: string } {
  return tungimi(smena) ? { sana, smena: DEN } : { sana: sanagaKunQoshish(sana, -1), smena: NOCH };
}

// Keyingi smena: DEN -> shu kunning NOCH, NOCH -> ertangi DEN
export function keyingiSmena(sana: string, smena: string): { sana: string; smena: string } {
  return tungimi(smena) ? { sana: sanagaKunQoshish(sana, 1), smena: DEN } : { sana, smena: NOCH };
}

// --- SMENA VAQTLARI (faqat eslatma uchun; tizim smenani o'zi almashtirmaydi) ---
// DEN 07:30 -> 19:30, NOCH 19:30 -> ertasi 07:30. NOCH boshlangan kunining sanasi bilan yuritiladi.
export const DEN_BOSHLANISHI = 7 * 60 + 30; // daqiqada
export const NOCH_BOSHLANISHI = 19 * 60 + 30;
export const ESLATMA_KECHIKISHI = 60; // smena boshlanganidan 1 soat keyin (08:30 / 20:30) eslatadi

// Toshkent soatiga ko'ra hozir qaysi smena va u boshlanganiga necha daqiqa bo'ldi
export function hozirgiSmena(vaqt: Date = new Date()): { sana: string; smena: string; otganDaqiqa: number } {
  const matn = toshkentVaqtMatni(vaqt); // "YYYY-MM-DD HH:MM"
  const bugun = matn.slice(0, 10);
  const daqiqa = Number(matn.slice(11, 13)) * 60 + Number(matn.slice(14, 16));
  if (daqiqa >= DEN_BOSHLANISHI && daqiqa < NOCH_BOSHLANISHI) return { sana: bugun, smena: DEN, otganDaqiqa: daqiqa - DEN_BOSHLANISHI };
  if (daqiqa >= NOCH_BOSHLANISHI) return { sana: bugun, smena: NOCH, otganDaqiqa: daqiqa - NOCH_BOSHLANISHI };
  return { sana: sanagaKunQoshish(bugun, -1), smena: NOCH, otganDaqiqa: daqiqa + 24 * 60 - NOCH_BOSHLANISHI };
}

// --- JORIY SMENA (bazada: zavod_joriy_smena) ---
// Master oxirgi o'tgan smena. Hamma qurilmalar Rulonlar'ni shu smenada ochadi.
// Tahrirlash mumkin bo'lgan smenalar faqat ikkita: joriy va tugagan (bitta oldingisi). Qolgani — arxiv, hech kim o'zgartira olmaydi.
export const JORIY_SMENA_KALITI = 'zavod_joriy_smena';
export type SmenaNuqtasi = { sana: string; smena: string };

export const birXilSmena = (a: SmenaNuqtasi, b: SmenaNuqtasi) => a.sana === b.sana && tungimi(a.smena) === tungimi(b.smena);
// Solishtirish uchun tartib: "2026-11-23|0" (DEN) < "2026-11-23|1" (NOCH) < "2026-11-24|0"
export const smenaTartibi = (s: SmenaNuqtasi) => `${s.sana}|${tungimi(s.smena) ? 1 : 0}`;
export const smenaNomi = (smena: string) => (tungimi(smena) ? NOCH : DEN);

export function tahrirlashMumkinmi(sana: string, smena: string, joriy: SmenaNuqtasi | null | undefined): boolean {
  if (!joriy || !sana || !smena) return false;
  const korilayotgan = { sana, smena };
  return birXilSmena(korilayotgan, joriy) || birXilSmena(korilayotgan, oldingiSmena(joriy.sana, joriy.smena));
}

// Joriy smena hozirgi vaqtdan orqada qolganmi (master almashtirishni unutgan):
//  - bitta orqada bo'lsa, smena boshlanganidan 1 soat o'tgach (08:30 / 20:30) eslatadi;
//  - undan ham ko'p orqada bo'lsa (masalan, dam olishdan keyin), darhol eslatadi.
export function almashuvEslatmasi(sana: string, smena: string, vaqt: Date = new Date()): SmenaNuqtasi | null {
  if (!sana || !smena) return null;
  const hozir = hozirgiSmena(vaqt);
  const joriy = { sana, smena };
  if (smenaTartibi(joriy) >= smenaTartibi(hozir)) return null;
  const bittaOrqada = birXilSmena(oldingiSmena(hozir.sana, hozir.smena), joriy);
  if (bittaOrqada && hozir.otganDaqiqa < ESLATMA_KECHIKISHI) return null;
  return { sana: hozir.sana, smena: hozir.smena };
}
