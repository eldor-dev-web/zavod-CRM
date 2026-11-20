// ============================================================
// BRAUZER <-> BAZA SINXRONIZATSIYASI
// - Har bir o'zgarish avval shu kompyuterga yoziladi, keyin bazaga yuboriladi.
// - Baza ulanmagan bo'lsa o'zgarish NAVBATga tushadi va baza qaytganda avtomatik yuboriladi.
// - Navbatdagi (hali yuborilmagan) ma'lumot ustiga bazadagi eski nusxa hech qachon yozilmaydi.
// Faqat brauzerda ishlatiladi.
// ============================================================

import { sanagaKunQoshish, toshkentSana } from '@/lib/sana';

const NAVBAT_KALITI = '_zavod_navbat';
const KOCHISH_BELGISI = '_zavod_navbat_v1';

// Faqat shu qurilmaga tegishli kalitlar (boshqa kompyuterlarga tarqatilmaydi)
const MAHALLIY_KALITLAR = ['zavod_parollar', 'zavod_foydalanuvchi', 'zavod_oxirgi_sana', 'zavod_oxirgi_smena'];

// Smenalar alohida jadvalda (/api/smena) saqlanadi, umumiy xotiraga qo'shilmaydi
export function sinxronlanadimi(kalit: string): boolean {
  return kalit.startsWith('zavod_') && !MAHALLIY_KALITLAR.includes(kalit) && !kalit.startsWith('zavod_smena_');
}

export const xotiraIdsi = (kalit: string) => `x:${kalit}`;
export const smenaIdsi = (sana: string, smena: string) => `s:${sana}|${smena}`;
export const smenaMahalliyKaliti = (sana: string, smena: string) => `zavod_smena_${sana}_${smena}`;

// --- Holat (ekrandagi belgi uchun) ---
export type SinxronHolati = { kutmoqda: number; yuborilmoqda: boolean; ulanmagan: boolean };
let yuborilmoqda = false;
let ulanmagan = false;

function yozish(kalit: string, qiymat: string) {
  // Asl setItem: navbat kaliti "zavod_" bilan boshlanmaydi, baribir to'g'ridan-to'g'ri yozamiz
  Storage.prototype.setItem.call(window.localStorage, kalit, qiymat);
}

export function navbat(): string[] {
  try {
    const n = JSON.parse(localStorage.getItem(NAVBAT_KALITI) || '[]');
    return Array.isArray(n) ? n : [];
  } catch {
    return [];
  }
}

function navbatniYozish(royxat: string[]) {
  yozish(NAVBAT_KALITI, JSON.stringify(Array.from(new Set(royxat))));
  holatniTarqatish();
}

export const navbatdami = (id: string) => navbat().includes(id);

export function joriyHolat(): SinxronHolati {
  return { kutmoqda: navbat().length, yuborilmoqda, ulanmagan };
}

function holatniTarqatish() {
  window.dispatchEvent(new CustomEvent<SinxronHolati>('zavod_sinxron', { detail: joriyHolat() }));
}

// --- So'rov yuborish ---
type Natija = 'ok' | 'xato' | 'rad';

function sessiyaTugadi() {
  if (window.location.pathname !== '/login') {
    localStorage.removeItem('zavod_foydalanuvchi');
    window.location.assign('/login');
  }
}

async function postQilish(url: string, malumot: unknown): Promise<Natija> {
  try {
    const body = JSON.stringify(malumot);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
      // keepalive faqat kichik so'rovlarga ruxsat etiladi (64 KB chegarasi)
      keepalive: body.length < 60000
    });
    if (res.ok) return 'ok';
    if (res.status === 401) {
      sessiyaTugadi();
      return 'xato';
    }
    // 403/400: ruxsat yo'q yoki noto'g'ri — qayta urinishdan foyda yo'q
    if (res.status >= 400 && res.status < 500) {
      console.warn('Server qabul qilmadi:', url, res.status, await res.text().catch(() => ''));
      return 'rad';
    }
    return 'xato';
  } catch {
    return 'xato';
  }
}

async function idniYuborish(id: string): Promise<Natija> {
  if (id.startsWith('x:')) {
    const kalit = id.slice(2);
    const qiymat = localStorage.getItem(kalit);
    if (qiymat === null) return 'ok';
    return postQilish('/api/xotira', { kalit, qiymat });
  }
  if (id.startsWith('s:')) {
    const [sana, smena] = id.slice(2).split('|');
    const matn = localStorage.getItem(smenaMahalliyKaliti(sana, smena));
    if (!matn) return 'ok';
    try {
      return postQilish('/api/smena', JSON.parse(matn));
    } catch {
      return 'rad';
    }
  }
  return 'ok';
}

// Darhol yuborish; bo'lmasa navbatga qo'yish
export async function yuborishYokiNavbat(id: string): Promise<Natija> {
  const natija = await idniYuborish(id);
  if (natija === 'xato') {
    ulanmagan = true;
    navbatniYozish([...navbat(), id]);
  } else {
    if (natija === 'ok') ulanmagan = false;
    if (navbatdami(id)) navbatniYozish(navbat().filter((x) => x !== id));
    else holatniTarqatish();
  }
  return natija;
}

// Navbatdagilarni ketma-ket yuborish (birinchi ulanish xatosida to'xtaydi)
export async function navbatniYuborish() {
  if (yuborilmoqda || navbat().length === 0) return;
  yuborilmoqda = true;
  holatniTarqatish();
  for (const id of navbat()) {
    const natija = await idniYuborish(id);
    if (natija === 'xato') {
      ulanmagan = true;
      break;
    }
    ulanmagan = false;
    navbatniYozish(navbat().filter((x) => x !== id));
  }
  yuborilmoqda = false;
  holatniTarqatish();
}

// --- Xotira kalitlarini kechiktirib yuborish (tez-tez bosishda faqat oxirgi qiymat ketadi) ---
const taymerlar = new Map<string, number>();

export function kechiktiribYuborish(kalit: string, ms = 700) {
  const eski = taymerlar.get(kalit);
  if (eski) clearTimeout(eski);
  taymerlar.set(
    kalit,
    window.setTimeout(() => {
      taymerlar.delete(kalit);
      yuborishYokiNavbat(xotiraIdsi(kalit));
    }, ms)
  );
}

// Sahifa yopilayotganda kutib turganlarni darhol jo'natish
export function kutayotganlarniDarholYuborish() {
  taymerlar.forEach((t, kalit) => {
    clearTimeout(t);
    yuborishYokiNavbat(xotiraIdsi(kalit));
  });
  taymerlar.clear();
}

// Bu kalit hali bazaga yetib bormaganmi (shunda bazadagi nusxa uning ustiga yozilmaydi)
export const yuborilmaganmi = (kalit: string) => taymerlar.has(kalit) || navbatdami(xotiraIdsi(kalit));

// --- Bir martalik ko'chish: yangi tizimdan oldin shu kompyuterda kiritilgan ma'lumotlarni navbatga qo'yish ---
// (Avval baza ulanmaganda kiritilgan ma'lumotlar bazaga hech qachon yetib bormagan bo'lishi mumkin)
export function birinchiMartaNavbatgaQoyish() {
  if (localStorage.getItem(KOCHISH_BELGISI)) return;
  const idlar: string[] = [];
  const chegara = sanagaKunQoshish(toshkentSana(), -60);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const smena = k.match(/^zavod_smena_(\d{4}-\d{2}-\d{2})_(.+)$/);
    if (smena) {
      if (smena[1] >= chegara) idlar.push(smenaIdsi(smena[1], smena[2]));
    } else if (sinxronlanadimi(k)) {
      idlar.push(xotiraIdsi(k));
    }
  }
  navbatniYozish([...navbat(), ...idlar]);
  yozish(KOCHISH_BELGISI, '1');
}

// --- Eski mahalliy smena nusxalarini tozalash ---
// Brauzer xotirasi kichik (taxminan 5 MB). Yillar davomida to'lib qolmasligi uchun 45 kundan eski
// smenalarning MAHALLIY nusxasi o'chiriladi (bazada to'liq saqlanib qoladi). Navbatdagilarga tegilmaydi.
export function eskiNusxalarniTozalash(kunlar = 45) {
  const chegara = sanagaKunQoshish(toshkentSana(), -kunlar);
  const kutmoqda = navbat();
  const ochiriladi: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const m = k?.match(/^zavod_smena_(\d{4}-\d{2}-\d{2})_(.+)$/);
    if (k && m && m[1] < chegara && !kutmoqda.includes(smenaIdsi(m[1], m[2]))) ochiriladi.push(k);
  }
  ochiriladi.forEach((k) => localStorage.removeItem(k));
}
