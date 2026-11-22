// ============================================================
// SMENALAR
// Smenani master o'zi almashtiradi: DEN tugasa tepadan NOCH ni tanlaydi.
// Tizim soatga qarab hech narsani o'zi o'zgartirmaydi.
// ============================================================

import { sanagaKunQoshish, toshkentSana, toshkentVaqtMatni } from '@/lib/sana';

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

// Master almashtirishni unutganmi: ekranda hozirgi smenadan BITTA oldingisi turibdi va 1 soat o'tgan.
// Eski kunni ataylab ko'rayotgan bo'lsa (2 smena va undan oldin) yoki kelajak tanlangan bo'lsa — eslatmaydi.
export function almashuvEslatmasi(sana: string, smena: string, vaqt: Date = new Date()): { sana: string; smena: string } | null {
  if (!sana || !smena) return null;
  const hozir = hozirgiSmena(vaqt);
  if (hozir.otganDaqiqa < ESLATMA_KECHIKISHI) return null;
  const oldingi = oldingiSmena(hozir.sana, hozir.smena);
  return oldingi.sana === sana && tungimi(oldingi.smena) === tungimi(smena) ? { sana: hozir.sana, smena: hozir.smena } : null;
}

// Arxiv qulfi: bugungi va kechagi smenalar ochiq (tungi smena yarim tundan o'tadi).
// Undan eski smenalar arxivga o'tgan — ularni faqat admin o'zgartira oladi.
export const OCHIQ_KUNLAR = 2;

export function smenaQulflanganmi(sana: string, bugun: string = toshkentSana()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sana)) return false;
  return sana < sanagaKunQoshish(bugun, -(OCHIQ_KUNLAR - 1));
}
