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

// Davomat butun jadval bo'lib emas, katakma-katak (/api/davomat) yuboriladi — bu yerdan yuborilmaydi,
// lekin bazadan olinadi (pastga tortiladi).
export const DAVOMAT_KALITI = 'zavod_xodim_davomati';
const DAVOMAT_NAVBATI = '_zavod_davomat_kutmoqda'; // { katakKaliti: qiymat } — hali bazaga yetmagan kataklar
export const DAVOMAT_IDSI = 'd:davomat';
const RAD_ETILGANLAR = '_zavod_rad_etilganlar'; // arxivga kechikib tushgan, qabul qilinmagan smena ma'lumotlari

// localStorage.setItem bo'lganda bazaga avtomatik yuboriladimi
export const yuboriladimi = (kalit: string) => sinxronlanadimi(kalit) && kalit !== DAVOMAT_KALITI;

export const xotiraIdsi = (kalit: string) => `x:${kalit}`;
export const smenaIdsi = (sana: string, smena: string) => `s:${sana}|${smena}`;
// Smena hisoboti (PDF -> Telegram kanal) so'rovi ham navbat orqali: internet bo'lmasa keyin yuboriladi
export const hisobotIdsi = (sana: string, smena: string) => `h:${sana}|${smena}`;
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
  return (await postBatafsil(url, malumot)).natija;
}

async function postBatafsil(url: string, malumot: unknown): Promise<{ natija: Natija; status: number; javob: any }> {
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
    const javob = await res.json().catch(() => null);
    if (res.ok) return { natija: 'ok', status: res.status, javob };
    if (res.status === 401) {
      sessiyaTugadi();
      return { natija: 'xato', status: 401, javob };
    }
    // 403/400: ruxsat yo'q yoki noto'g'ri — qayta urinishdan foyda yo'q
    if (res.status >= 400 && res.status < 500) {
      console.warn('Server qabul qilmadi:', url, res.status, javob);
      return { natija: 'rad', status: res.status, javob };
    }
    return { natija: 'xato', status: res.status, javob };
  } catch {
    return { natija: 'xato', status: 0, javob: null };
  }
}

// --- ARXIVGA KECHIKIB TUSHGAN MA'LUMOT ---
// Server smenani arxivda deb qabul qilmasa: ma'lumot shu qurilmada saqlanadi, ekranda qizil ogohlantirish
// chiqadi va Telegram kanalga xabar ketadi. Arxivning o'zi o'zgarmaydi.
export type RadEtilgan = { vaqt: number; sana: string; smena: string; malumot: unknown; korildi?: boolean };

export function radEtilganlar(): RadEtilgan[] {
  try {
    const r = JSON.parse(localStorage.getItem(RAD_ETILGANLAR) || '[]');
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export function radEtilganlarniKorildi() {
  yozish(RAD_ETILGANLAR, JSON.stringify(radEtilganlar().map((r) => ({ ...r, korildi: true })).slice(0, 30)));
  window.dispatchEvent(new Event('zavod_rad_etildi'));
}

function arxivRadEtdi(sana: string, smena: string, malumot: any) {
  const yangi: RadEtilgan = { vaqt: Date.now(), sana, smena, malumot };
  yozish(RAD_ETILGANLAR, JSON.stringify([yangi, ...radEtilganlar()].slice(0, 30)));
  window.dispatchEvent(new Event('zavod_rad_etildi'));
  postQilish('/api/smena/rad', { sana, smena, moshinalar: malumot?.moshinalar || [] });
}

// --- DAVOMAT: katakma-katak ---
function davomatNavbati(): Record<string, unknown> {
  try {
    const n = JSON.parse(localStorage.getItem(DAVOMAT_NAVBATI) || '{}');
    return n && typeof n === 'object' ? n : {};
  } catch {
    return {};
  }
}

export const davomatKutayotganlar = davomatNavbati;

let davomatTaymeri: number | null = null;

// Bitta katakni yozish: darhol shu qurilmaga, 700 ms dan keyin bazaga (faqat shu katak)
export function davomatKatakYozish(katak: string, qiymat: unknown) {
  let jadval: Record<string, unknown> = {};
  try {
    jadval = JSON.parse(localStorage.getItem(DAVOMAT_KALITI) || '{}') || {};
  } catch {}
  jadval[katak] = qiymat;
  yozish(DAVOMAT_KALITI, JSON.stringify(jadval));
  yozish(DAVOMAT_NAVBATI, JSON.stringify({ ...davomatNavbati(), [katak]: qiymat }));
  if (davomatTaymeri) clearTimeout(davomatTaymeri);
  davomatTaymeri = window.setTimeout(() => {
    davomatTaymeri = null;
    yuborishYokiNavbat(DAVOMAT_IDSI);
  }, 700);
}

async function davomatniYuborish(): Promise<Natija> {
  const yuborilgan = davomatNavbati();
  if (Object.keys(yuborilgan).length === 0) return 'ok';
  const { natija } = await postBatafsil('/api/davomat', { kataklar: yuborilgan });
  if (natija === 'xato') return 'xato';
  // Yuborilgan (yoki yopilgan oy sababli rad etilgan) kataklarni navbatdan olib tashlaymiz,
  // agar shu orada ular yana o'zgarmagan bo'lsa
  const hozirgi = davomatNavbati();
  Object.keys(yuborilgan).forEach((k) => {
    if (JSON.stringify(hozirgi[k]) === JSON.stringify(yuborilgan[k])) delete hozirgi[k];
  });
  yozish(DAVOMAT_NAVBATI, JSON.stringify(hozirgi));
  return natija;
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
    let malumot: any;
    try {
      malumot = JSON.parse(matn);
    } catch {
      return 'rad';
    }
    const { natija, status } = await postBatafsil('/api/smena', malumot);
    if (natija === 'rad' && status === 403) arxivRadEtdi(sana, smena, malumot);
    return natija;
  }
  if (id === DAVOMAT_IDSI) return davomatniYuborish();
  if (id.startsWith('h:')) {
    const [sana, smena] = id.slice(2).split('|');
    return postQilish('/api/hisobot/smena', { sana, smena });
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
  if (davomatTaymeri) {
    clearTimeout(davomatTaymeri);
    davomatTaymeri = null;
    yuborishYokiNavbat(DAVOMAT_IDSI);
  }
  taymerlar.forEach((t, kalit) => {
    clearTimeout(t);
    yuborishYokiNavbat(xotiraIdsi(kalit));
  });
  taymerlar.clear();
}

// Bu kalit hali bazaga yetib bormaganmi (shunda bazadagi nusxa uning ustiga yozilmaydi)
export const yuborilmaganmi = (kalit: string) =>
  taymerlar.has(kalit) ||
  navbatdami(xotiraIdsi(kalit)) ||
  (kalit === DAVOMAT_KALITI && (davomatTaymeri !== null || Object.keys(davomatNavbati()).length > 0));

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
