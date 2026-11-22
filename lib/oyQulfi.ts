// ============================================================
// OYNI YOPISH
// Har oyning 6-kunidan (Toshkent vaqti, 00:00) o'tgan oy yopiladi: davomat, braklar, ishchilar ro'yxati
// va avans daftarini HECH KIM o'zgartira olmaydi (server tekshiradi). Bot 1–5 kunlari ishlaydi.
// ============================================================

import { oldingiOy } from '@/lib/sana';

export const OY_YOPILISH_KUNI = 6;

// bugun: "YYYY-MM-DD" (Toshkent). Brauzerda vaqt faqat effect ichida olinadi, shuning uchun parametr.
export function oyYopilganmi(oy: string, bugun: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(oy) || !/^\d{4}-\d{2}-\d{2}$/.test(bugun)) return false;
  const joriyOy = bugun.slice(0, 7);
  if (oy >= joriyOy) return false;
  if (oy < oldingiOy(joriyOy)) return true;
  return Number(bugun.slice(8, 10)) >= OY_YOPILISH_KUNI;
}

// Oyga bog'liq xotira kalitlari: qaysi oyga tegishli
export function kalitOyi(kalit: string): string | null {
  const m = kalit.match(/^zavod_(?:ishchilar|brak_jadval|brak_ismlar|eslatmalar|eslatmalar_tarixi)_(\d{4}-\d{2})$/);
  return m ? m[1] : null;
}

// Davomat katagi kaliti: "<ishchiId>_YYYY-MM_<kun>"
export function davomatKatakOyi(kalit: string): string | null {
  const m = kalit.match(/_(\d{4}-\d{2})_\d{1,2}$/);
  return m ? m[1] : null;
}
