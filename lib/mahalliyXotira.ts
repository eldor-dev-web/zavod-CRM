// Brauzer xotirasi (localStorage) bilan ishlash uchun yordamchilar.
// Faqat brauzerda (client component'larda) chaqiriladi.

import { faolIshchilar, KALIT, type Ishchi } from '@/lib/hisob';
import { toshkentOy } from '@/lib/sana';

export function oqish<T>(kalit: string, standart: T): T {
  try {
    const matn = localStorage.getItem(kalit);
    return matn === null ? standart : (JSON.parse(matn) as T);
  } catch {
    return standart;
  }
}

export function joriyRol(): string {
  return oqish<{ rol?: string }>('zavod_foydalanuvchi', {}).rol || '';
}

// Tanlangan oyning ishchilar ro'yxati.
// Agar bu oy uchun ro'yxat hali yo'q bo'lsa (yangi oy boshlandi), oldingi oydagi xodimlar
// o'sha ID'lari bilan ko'chiriladi. Shunda yangi oyda ham operatorlar ro'yxati darrov chiqadi
// va xodimning yillar davomidagi tarixi bitta ID bilan bog'lanib qoladi.
export function oyIshchilari(oy: string): Ishchi[] {
  const kalit = KALIT.ishchilar(oy);
  const saqlangan = localStorage.getItem(kalit);
  if (saqlangan !== null) {
    const royxat = oqish<unknown>(kalit, []);
    return Array.isArray(royxat) ? royxat : [];
  }

  // O'tgan oylarni ko'rganda ro'yxatni o'ylab topmaymiz: faqat joriy va keyingi oylar uchun ko'chiramiz
  if (oy < toshkentOy()) return [];

  const oldingiKalitlar: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && /^zavod_ishchilar_\d{4}-\d{2}$/.test(k) && k < kalit) oldingiKalitlar.push(k);
  }
  oldingiKalitlar.sort().reverse();

  for (const k of oldingiKalitlar) {
    const xodimlar = faolIshchilar(oqish<unknown>(k, []));
    if (xodimlar.length === 0) continue;

    const nusxa: Ishchi[] = xodimlar.map((x) => ({
      id: x.id,
      ism: String(x.ism).trim(),
      lavozimi: x.lavozimi || '',
      telefon: x.telefon || ''
    }));

    // Ro'yxatni faqat uni o'zgartirishga ruxsati borlar saqlaydi (admin, master)
    const rol = joriyRol();
    if (rol === 'admin' || rol === 'master') localStorage.setItem(kalit, JSON.stringify(nusxa));
    return nusxa;
  }
  return [];
}
