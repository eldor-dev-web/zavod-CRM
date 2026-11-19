// ============================================================
// SMENALAR
// Smenani master o'zi almashtiradi: DEN tugasa tepadan NOCH ni tanlaydi.
// Tizim soatga qarab hech narsani o'zi o'zgartirmaydi.
// ============================================================

import { sanagaKunQoshish, toshkentSana } from '@/lib/sana';

export const DEN = 'DEN (Kunduzgi)';
export const NOCH = 'NOCH (Tungi)';

export const tungimi = (smena: string) => String(smena).toUpperCase().includes('NOCH');
export const smenaQisqa = (smena: string) => (tungimi(smena) ? 'NOCH' : 'DEN');

// Oldingi smena: NOCH -> shu kunning DEN, DEN -> kechagi NOCH
export function oldingiSmena(sana: string, smena: string): { sana: string; smena: string } {
  return tungimi(smena) ? { sana, smena: DEN } : { sana: sanagaKunQoshish(sana, -1), smena: NOCH };
}

// Arxiv qulfi: bugungi va kechagi smenalar ochiq (tungi smena yarim tundan o'tadi).
// Undan eski smenalar arxivga o'tgan — ularni faqat admin o'zgartira oladi.
export const OCHIQ_KUNLAR = 2;

export function smenaQulflanganmi(sana: string, bugun: string = toshkentSana()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sana)) return false;
  return sana < sanagaKunQoshish(bugun, -(OCHIQ_KUNLAR - 1));
}
