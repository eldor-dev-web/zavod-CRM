// ============================================================
// BRAUZER <-> BAZA SINXRONIZATSIYASI
// - Har bir o'zgarish avval shu kompyuterga yoziladi, keyin bazaga yuboriladi.
// - Baza ulanmagan bo'lsa o'zgarish NAVBATga tushadi va baza qaytganda avtomatik yuboriladi.
// - Navbatdagi (hali yuborilmagan) ma'lumot ustiga bazadagi eski nusxa hech qachon yozilmaydi.
// Faqat brauzerda ishlatiladi.
// ============================================================

import { sanagaKunQoshish, toshkentSana } from '@/lib/sana';
import { birlashtir, type Ziddiyat } from '@/lib/birlashtirish';

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
export type SinxronHolati = { kutmoqda: number; yuborilmoqda: boolean; ulanmagan: boolean; navbatBoshi: number | null };
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

// Navbat qachondan beri bo'sh emas (30 daqiqadan oshsa — qizil ogohlantirish)
const NAVBAT_BOSHI = '_zavod_navbat_boshi';
function navbatBoshi(): number | null {
  const n = Number(localStorage.getItem(NAVBAT_BOSHI));
  return n > 0 ? n : null;
}

function navbatniYozish(royxat: string[]) {
  const yangi = Array.from(new Set(royxat));
  yozish(NAVBAT_KALITI, JSON.stringify(yangi));
  if (yangi.length === 0) localStorage.removeItem(NAVBAT_BOSHI);
  else if (!navbatBoshi()) yozish(NAVBAT_BOSHI, String(Date.now()));
  holatniTarqatish();
}

export const navbatdami = (id: string) => navbat().includes(id);

export function joriyHolat(): SinxronHolati {
  return { kutmoqda: navbat().length, yuborilmoqda, ulanmagan, navbatBoshi: navbat().length ? navbatBoshi() : null };
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

// ============================================================
// VERSIYA VA BIRLASHTIRISH
// Har bir kalit uchun "asos" — bazadan oxirgi olingan (yoki saqlangan) nusxa va uning versiyasi.
// Saqlashda server shu versiyani tekshiradi; bazada yangirog'i bo'lsa — 409, qurilma birlashtirib qayta yuboradi.
// ============================================================
const ASOS_PREFIKSI = '_zavod_asos__';
const ASOS_TAYYOR = '_zavod_asos_tayyor'; // kamida bir marta to'liq olingan (shundan keyin yangi kalit "asos: null" bilan ketadi)
const OXIRGI_TORTISH = '_zavod_oxirgi_tortish';
const ZIDDIYATLAR = '_zavod_ziddiyatlar';
const SAQLANMADI = '_zavod_saqlanmadi';

type Asos = { v: string; q: string };

function asosOl(kalit: string): Asos | null {
  try {
    const a = JSON.parse(localStorage.getItem(ASOS_PREFIKSI + kalit) || 'null');
    return a && typeof a.v === 'string' && typeof a.q === 'string' ? a : null;
  } catch {
    return null;
  }
}

function asosYoz(kalit: string, v: unknown, q: string) {
  if (kalit === DAVOMAT_KALITI || !v) return; // davomat katakma-katak saqlanadi
  try {
    yozish(ASOS_PREFIKSI + kalit, JSON.stringify({ v: new Date(String(v)).toISOString(), q }));
  } catch {}
}

const qiymatMatni = (q: unknown) => (typeof q === 'string' ? q : JSON.stringify(q ?? null));

// Boshqa qurilmadan yangi ma'lumot kelganda sahifalar o'z ekranini yangilaydi (sahifa qayta yuklanmaydi)
function yangilandiDeb(kalitlar: string[]) {
  if (kalitlar.length) window.dispatchEvent(new CustomEvent('zavod_xotira_yangilandi', { detail: { kalitlar } }));
}

// --- Jiddiy ogohlantirishlar ---
export type SaqlangZiddiyat = Ziddiyat & { id: string; vaqt: number; korildi?: boolean };

export function ziddiyatlar(): SaqlangZiddiyat[] {
  try {
    const r = JSON.parse(localStorage.getItem(ZIDDIYATLAR) || '[]');
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

function ziddiyatlarniQoshish(yangi: Ziddiyat[]) {
  if (!yangi.length) return;
  const vaqt = Date.now();
  const royxat = [...yangi.map((z, i) => ({ ...z, id: `${vaqt}_${i}`, vaqt })), ...ziddiyatlar()].slice(0, 30);
  yozish(ZIDDIYATLAR, JSON.stringify(royxat));
  window.dispatchEvent(new Event('zavod_ziddiyat'));
}

export function ziddiyatniKorildi(id: string) {
  yozish(ZIDDIYATLAR, JSON.stringify(ziddiyatlar().map((z) => (z.id === id ? { ...z, korildi: true } : z))));
  window.dispatchEvent(new Event('zavod_ziddiyat'));
}

export type Saqlanmagan = { vaqt: number; kalit: string; sabab: string; korildi?: boolean };

export function saqlanmaganlar(): Saqlanmagan[] {
  try {
    const r = JSON.parse(localStorage.getItem(SAQLANMADI) || '[]');
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export function saqlanmaganlarniKorildi() {
  yozish(SAQLANMADI, JSON.stringify(saqlanmaganlar().map((r) => ({ ...r, korildi: true })).slice(0, 30)));
  window.dispatchEvent(new Event('zavod_saqlanmadi'));
}

function saqlanmadiDeb(kalit: string, sabab: string) {
  yozish(SAQLANMADI, JSON.stringify([{ vaqt: Date.now(), kalit, sabab }, ...saqlanmaganlar()].slice(0, 30)));
  window.dispatchEvent(new Event('zavod_saqlanmadi'));
}

// Kalitning odamga tushunarli nomi (ogohlantirishlar uchun)
export function kalitNomi(kalit: string): string {
  const oy = kalit.match(/(\d{4})-(\d{2})$/);
  const oyM = oy ? ` (${oy[2]}.${oy[1]})` : '';
  if (kalit.startsWith('zavod_eslatmalar_')) return `Avans daftari${oyM}`;
  if (kalit.startsWith('zavod_ishchilar_')) return `Ishchilar ro'yxati${oyM}`;
  if (kalit.startsWith('zavod_moshina_')) return 'Texnik xizmat';
  if (kalit.startsWith('zavod_brak_')) return `Braklar sozlamasi${oyM}`;
  return 'Sozlamalar';
}

async function xotiraniYuborish(kalit: string, urinish = 0): Promise<Natija> {
  const qiymat = localStorage.getItem(kalit);
  if (qiymat === null) return 'ok';
  const asos = asosOl(kalit);
  const malumot: Record<string, unknown> = { kalit, qiymat };
  if (asos) malumot.asos = asos.v;
  else if (localStorage.getItem(ASOS_TAYYOR)) malumot.asos = null;

  const { natija, status, javob } = await postBatafsil('/api/xotira', malumot);
  if (natija === 'ok') {
    asosYoz(kalit, javob?.updatedAt, qiymat);
    return 'ok';
  }

  // Bazada yangiroq nusxa — birlashtiramiz va qayta yuboramiz
  if (status === 409 && javob && urinish < 3) {
    const bazadagi = qiymatMatni(javob.qiymat);
    const hozirgi = localStorage.getItem(kalit) ?? qiymat;
    const r = birlashtir(kalit, asos?.q ?? null, hozirgi, bazadagi);
    yozish(kalit, r.qiymat);
    asosYoz(kalit, javob.updatedAt, bazadagi);
    ziddiyatlarniQoshish(r.ziddiyatlar);
    yangilandiDeb([kalit]);
    if (r.qiymat === bazadagi) return 'ok';
    return xotiraniYuborish(kalit, urinish + 1);
  }

  if (natija === 'rad') saqlanmadiDeb(kalit, String(javob?.xato || 'Server qabul qilmadi'));
  return natija;
}

// Bazadan yangiliklarni olish. toliq=true — hammasi (ilova ochilganda), aks holda faqat oxirgi tekshiruvdan keyin o'zgarganlar
let tortilmoqda = false;
export async function bazadanTortish(toliq = false): Promise<void> {
  if (tortilmoqda) return;
  tortilmoqda = true;
  try {
    const dan = toliq ? null : localStorage.getItem(OXIRGI_TORTISH);
    const res = await fetch(`/api/xotira${dan ? `?dan=${encodeURIComponent(dan)}` : ''}`, { cache: 'no-store' });
    if (res.status === 401) {
      sessiyaTugadi();
      return;
    }
    if (!res.ok) return;
    const malumotlar = await res.json();
    if (!Array.isArray(malumotlar)) return;

    let engKech = dan ? Date.parse(dan) : 0;
    const ozgargan: string[] = [];
    const yangiZiddiyatlar: Ziddiyat[] = [];

    malumotlar.forEach((item: { kalit: string; qiymat: unknown; updatedAt?: string }) => {
      const v = item.updatedAt ? Date.parse(item.updatedAt) : 0;
      if (v > engKech) engKech = v;
      if (!sinxronlanadimi(item.kalit)) return;
      const kalit = item.kalit;
      const bazadagi = qiymatMatni(item.qiymat);
      const mahalliy = localStorage.getItem(kalit);

      // Davomat: bazadagi + shu qurilmada hali yuborilmagan kataklar
      if (kalit === DAVOMAT_KALITI) {
        let obj: Record<string, unknown> = {};
        try {
          obj = JSON.parse(bazadagi) || {};
        } catch {}
        const birlashgan = JSON.stringify({ ...obj, ...davomatNavbati() });
        if (mahalliy !== birlashgan) {
          yozish(kalit, birlashgan);
          ozgargan.push(kalit);
        }
        return;
      }

      // Shu qurilmada hali yuborilmagan o'zgarish bor — ustidan yozmaymiz, birlashtiramiz
      if (yuborilmaganmi(kalit)) {
        const asos = asosOl(kalit);
        if (mahalliy !== null && mahalliy !== bazadagi && (!asos || Date.parse(asos.v) !== v)) {
          const r = birlashtir(kalit, asos?.q ?? null, mahalliy, bazadagi);
          if (r.qiymat !== mahalliy) {
            yozish(kalit, r.qiymat);
            ozgargan.push(kalit);
          }
          yangiZiddiyatlar.push(...r.ziddiyatlar);
        }
        asosYoz(kalit, item.updatedAt, bazadagi);
        return;
      }

      if (mahalliy !== bazadagi) {
        yozish(kalit, bazadagi);
        ozgargan.push(kalit);
      }
      asosYoz(kalit, item.updatedAt, bazadagi);
    });

    if (toliq) yozish(ASOS_TAYYOR, '1');
    // 5 soniya ustma-ust: shu paytda saqlangan narsa o'tkazib yuborilmasin (qayta ko'rish zarar qilmaydi)
    if (engKech) yozish(OXIRGI_TORTISH, new Date(engKech - 5000).toISOString());
    ziddiyatlarniQoshish(yangiZiddiyatlar);
    yangilandiDeb(ozgargan);
  } catch (err) {
    console.error('Bazadan olishda xato:', err);
  } finally {
    tortilmoqda = false;
  }
}

async function idniYuborish(id: string): Promise<Natija> {
  if (id.startsWith('x:')) return xotiraniYuborish(id.slice(2));
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
