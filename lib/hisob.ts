// ============================================================
// YAGONA HISOB-KITOB FAYLI
// Oylik, brak jarimasi va avans faqat shu yerda hisoblanadi.
// Dashboard, Ishchilar, Braklar, Notes va Telegram bot shundan foydalanadi,
// shuning uchun hamma joyda raqamlar bir xil chiqadi.
// ============================================================

export type Ishchi = {
  id: number | string;
  ism?: string;
  lavozimi?: string;
  telefon?: string;
  [boshqa: string]: unknown;
};

export type Lavozim = { id: number | string; nomi: string; stavka: number | string };

export type BrakStavkalari = { ignaSinigi: number; luxXatosi: number };
// Brak kechirim me'yori: rulon katagidagi brak shundan kam bo'lsa hisoblanmaydi (metr)
export type BrakMeyyori = { igna: number; lux: number };

export type DavomatJadvali = Record<string, any>;
export type BrakJadvali = Record<string, { igna?: number | string; lux?: number | string } | undefined>;

// Standart qiymatlar (sozlamalarda hali hech narsa kiritilmagan bo'lsa)
export const STANDART_LAVOZIMLAR: Lavozim[] = [
  { id: 1, nomi: 'Operator', stavka: 175000 },
  { id: 2, nomi: 'Nachalnik mexanik', stavka: 500000 },
  { id: 3, nomi: 'mexaynik', stavka: 300000 }
];
export const STANDART_OPERATOR_QOSHIMCHA = 20000;
export const STANDART_BRAK_STAVKALARI: BrakStavkalari = { ignaSinigi: 8000, luxXatosi: 10000 };

// Xotiradagi kalitlar nomi (bitta joyda, adashib ketmaslik uchun)
export const KALIT = {
  ishchilar: (oy: string) => `zavod_ishchilar_${oy}`,
  davomat: 'zavod_xodim_davomati',
  lavozimlar: 'zavod_lavozimlar_bazasi',
  operatorQoshimcha: 'zavod_operator_qoshimcha',
  brakStavkalari: 'zavod_brak_stavkalari',
  brakMeyyori: 'zavod_brak_meyyori',
  brakJadvali: (oy: string) => `zavod_brak_jadval_${oy}`,
  eslatmalar: (oy: string) => `zavod_eslatmalar_${oy}`,
  sozlamaTarixi: 'zavod_sozlamalar_tarixi'
} as const;

// --- SOZLAMALAR TARIXI ---
// Admin stavka yoki narxni o'zgartirsa, o'tgan oylarning oyligi ESKI sozlama bilan hisoblanishi kerak.
// Shuning uchun har oy uchun amal qilgan sozlama saqlanadi: { "2026-10": {...}, "2026-11": {...} }
export type OySozlamasi = {
  lavozimlar: Lavozim[];
  operatorQoshimcha: number;
  brakStavkalari: BrakStavkalari;
  brakMeyyori?: BrakMeyyori;
};
export type SozlamaTarixi = Record<string, Partial<OySozlamasi>>;

// Berilgan oyda amal qilgan sozlama
export function oySozlamasi(oy: string, joriy: OySozlamasi, tarix: SozlamaTarixi | null | undefined): OySozlamasi {
  const oylar = Object.keys(tarix || {}).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
  if (!tarix || oylar.length === 0) return joriy;
  const oldingilar = oylar.filter((k) => k <= oy);
  // Birinchi yozuvdan oldingi oylar uchun eng birinchi yozuv (o'shanda o'zgarishdan oldingi qiymatlar saqlangan)
  const tanlangan = tarix[oldingilar.length ? oldingilar[oldingilar.length - 1] : oylar[0]] || {};
  return {
    lavozimlar: Array.isArray(tanlangan.lavozimlar) ? tanlangan.lavozimlar : joriy.lavozimlar,
    operatorQoshimcha: tanlangan.operatorQoshimcha ?? joriy.operatorQoshimcha,
    brakStavkalari: { ...joriy.brakStavkalari, ...(tanlangan.brakStavkalari || {}) }
  };
}

// Sozlama o'zgarganda tarixni yangilash.
// Agar joriy oydan oldingi yozuv bo'lmasa, o'tgan oy uchun ESKI qiymatlar ham yozib qo'yiladi.
export function tarixniYangilash(tarix: SozlamaTarixi | null | undefined, joriyOy: string, oldingiOyKaliti: string, eski: OySozlamasi, yangi: OySozlamasi): SozlamaTarixi {
  const natija: SozlamaTarixi = { ...(tarix || {}) };
  if (!Object.keys(natija).some((k) => k < joriyOy)) natija[oldingiOyKaliti] = eski;
  // Eski yozuvlarda keyin qo'shilgan sozlama (masalan, brak me'yori) bo'lmasa, uning ESKI qiymati yoziladi —
  // shunda o'tgan oylar yangi qiymat bilan qayta hisoblanib ketmaydi
  Object.keys(natija).forEach((k) => {
    if (k < joriyOy) natija[k] = { ...eski, ...natija[k] };
  });
  natija[joriyOy] = yangi;
  return natija;
}

// Berilgan oyda amal qilgan brak me'yori (tarixda bo'lmasa — hozirgi qiymat)
export function oyMeyyori(oy: string, joriy: BrakMeyyori, tarix: SozlamaTarixi | null | undefined): BrakMeyyori {
  const oylar = Object.keys(tarix || {}).filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
  if (!tarix || oylar.length === 0) return joriy;
  const oldingilar = oylar.filter((k) => k <= oy);
  const m = tarix[oldingilar.length ? oldingilar[oldingilar.length - 1] : oylar[0]]?.brakMeyyori;
  return m ? { igna: son(m.igna), lux: son(m.lux) } : joriy;
}

// Bazadagi qiymat ba'zan matn ko'rinishida saqlangan bo'ladi ("[...]"). Uni obyektga aylantiramiz.
export function jsonOchish<T>(qiymat: unknown, standart: T): T {
  if (qiymat === null || qiymat === undefined) return standart;
  if (typeof qiymat === 'string') {
    try {
      return JSON.parse(qiymat) as T;
    } catch {
      return standart;
    }
  }
  return qiymat as T;
}

// Har qanday qiymatni songa aylantirish ("12,5" -> 12.5, "" -> 0)
export function son(qiymat: unknown): number {
  if (qiymat === null || qiymat === undefined || qiymat === '') return 0;
  const n = Number(String(qiymat).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// 1234567 -> "1 234 567"
export function pulFormat(summa: number): string {
  return String(Math.round(summa)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function oyKunlariSoni(oy: string): number {
  const [yil, oyRaqami] = oy.split('-').map(Number);
  if (!yil || !oyRaqami) return 31;
  return new Date(yil, oyRaqami, 0).getDate();
}

export function ishchiLavozimi(ishchi: Ishchi): string {
  return String(ishchi.lavozimi ?? ishchi.lavozim ?? ishchi.mutaxassislik ?? '').trim();
}

export function operatormi(ishchi: Ishchi): boolean {
  return ishchiLavozimi(ishchi).toLowerCase().includes('operator');
}

export function faolIshchilar(ishchilar: unknown): Ishchi[] {
  return Array.isArray(ishchilar) ? ishchilar.filter((i) => i && String(i.ism ?? '').trim() !== '') : [];
}

export function lavozimStavkasi(lavozimNomi: string, lavozimlar: Lavozim[]): number {
  if (!lavozimNomi || !Array.isArray(lavozimlar)) return 0;
  const nom = lavozimNomi.trim().toLowerCase();
  const topildi = lavozimlar.find((l) => String(l.nomi).trim().toLowerCase() === nom);
  return topildi ? son(topildi.stavka) : 0;
}

// --- DAVOMAT: ishlagan kun va qo'shimcha moshinalar ---
export function davomatHisobi(ishchiId: Ishchi['id'], oy: string, davomat: DavomatJadvali) {
  let jamiKun = 0;
  let jamiMoshina = 0;
  const kunlar = oyKunlariSoni(oy);
  for (let kun = 1; kun <= kunlar; kun++) {
    const d = davomat?.[`${ishchiId}_${oy}_${kun}`];
    if (!d) continue;
    if (d === '+' || d.status === '+' || d.holat === '+') jamiKun += 1;
    jamiMoshina += son(d.moshina);
  }
  return { jamiKun, jamiMoshina };
}

// --- BRAK: jadvaldagi metrlar (kechirim me'yori rulon kiritilganda allaqachon hisobga olingan) ---
export function brakHisobi(ishchiId: Ishchi['id'], oy: string, brakJadvali: BrakJadvali, stavkalar: BrakStavkalari) {
  let igna = 0;
  let lux = 0;
  const kunlar = oyKunlariSoni(oy);
  for (let kun = 1; kun <= kunlar; kun++) {
    const b = brakJadvali?.[`${ishchiId}_${kun}`];
    if (!b) continue;
    igna += son(b.igna);
    lux += son(b.lux);
  }
  const jarima = igna * son(stavkalar?.ignaSinigi) + lux * son(stavkalar?.luxXatosi);
  return { igna, lux, jarima };
}

// --- AVANS: Notes (bloknot) ichidagi summalar ---
const SOZ_BELGILARI = "\\p{L}\\p{N}'ʻʼ‘’`";
const regexXavfsiz = (matn: string) => matn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Ism qatorda ALOHIDA so'z sifatida bormi ("Ali" "Alisher" ichida topilmaydi)
export function ismQatordaBormi(qator: string, ism: string): boolean {
  const toza = ism.trim();
  if (!toza) return false;
  return new RegExp(`(?<![${SOZ_BELGILARI}])${regexXavfsiz(toza)}(?![${SOZ_BELGILARI}])`, 'iu').test(qator);
}

// Summalarni "odamcha" yozilgan bo'lsa ham tushunish:
//   300000, 300 000, 300,000, 1.500.000, 300 ming, 300k, 1,5 mln, 2 million
// Qo'shimcha so'z (ming/mln) faqat 1000 dan kichik songa ko'paytiriladi: "300000 ming" = 300 000 (xato yozilgan deb qaraladi).
// Sanalar ([05.11]) va 1000 dan kichik sonlar (masalan "12 kun") summa hisoblanmaydi.
const SUMMA_TOKENI =
  /(?<![\p{L}\p{N}])(\d{1,3}(?:[ ,.]\d{3})+|\d+(?:[.,]\d{1,2})?)(?:\s*(ming|минг|mln|million|миллион|млн|k|к)(?![\p{L}]))?(?![\p{N}])/giu;

export type SummaTokeni = { matn: string; qiymat: number; joy: number };

export function summaTokenlari(qator: string): SummaTokeni[] {
  const sanasiz = qator.replace(/\[\d{1,2}\.\d{1,2}\]/g, (m) => ' '.repeat(m.length));
  const natija: SummaTokeni[] = [];
  for (const t of sanasiz.matchAll(SUMMA_TOKENI)) {
    const [butun, raqam, qoshimcha] = t;
    const guruhli = /^\d{1,3}(?:[ ,.]\d{3})+$/.test(raqam);
    if (!guruhli && !qoshimcha && raqam.replace(/\D/g, '').length > 9) continue; // telefon raqami va h.k.
    let qiymat = guruhli ? Number(raqam.replace(/\D/g, '')) : Number(raqam.replace(',', '.'));
    if (qoshimcha && qiymat < 1000) {
      const q = qoshimcha.toLowerCase();
      qiymat *= q === 'ming' || q === 'минг' || q === 'k' || q === 'к' ? 1000 : 1_000_000;
    }
    qiymat = Math.round(qiymat);
    if (qiymat >= 1000) natija.push({ matn: butun, qiymat, joy: t.index ?? 0 });
  }
  return natija;
}

function qatordagiSummalar(qator: string): number {
  return summaTokenlari(qator).reduce((j, t) => j + t.qiymat, 0);
}

// ism berilsa faqat o'sha xodimning qatorlari, berilmasa butun bloknot yig'indisi
// Qator kimga tegishli. Bir ism boshqa topilgan uzunroq ism ichida bo'lsa ("Ali" < "Ali Valiyev"),
// qator faqat uzunroq ismga tegishli. Natijada 2+ xil ishchi qolsa — qator noaniq (hech kimga hisoblanmaydi).
export function qatorEgalari(qator: string, ismlar: string[]): string[] {
  const sanasiz = qator.replace(/\[\d{1,2}\.\d{1,2}\]/g, '');
  const oraliqlar: { ism: string; bosh: number; oxir: number }[] = [];
  Array.from(new Set(ismlar.map((i) => String(i ?? '').trim()).filter(Boolean))).forEach((ism) => {
    const re = new RegExp(`(?<![${SOZ_BELGILARI}])${regexXavfsiz(ism)}(?![${SOZ_BELGILARI}])`, 'giu');
    for (const m of sanasiz.matchAll(re)) oraliqlar.push({ ism, bosh: m.index ?? 0, oxir: (m.index ?? 0) + m[0].length });
  });
  const qolgan = oraliqlar.filter(
    (a) => !oraliqlar.some((b) => b !== a && b.oxir - b.bosh > a.oxir - a.bosh && b.bosh <= a.bosh && b.oxir >= a.oxir)
  );
  const natija: string[] = [];
  qolgan.forEach((o) => {
    if (!natija.some((n) => n.toLowerCase() === o.ism.toLowerCase())) natija.push(o.ism);
  });
  return natija;
}

const birXilIsm = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Qator shu ishchiga tegishlimi. ismlar (barcha ishchilar) berilsa — aniq qoida (yuqoridagi);
// berilmasa — eski qoida (ism qatorda bormi).
function qatorShuIshchigami(qator: string, ism: string, ismlar?: string[]): boolean {
  if (ismlar && ismlar.length > 0) {
    const e = qatorEgalari(qator, ismlar.some((i) => birXilIsm(i, ism)) ? ismlar : [...ismlar, ism]);
    return e.length === 1 && birXilIsm(e[0], ism);
  }
  return ismQatordaBormi(qator.replace(/\[\d{1,2}\.\d{1,2}\]/g, ''), ism);
}

// ism berilsa faqat o'sha xodimning qatorlari, berilmasa butun bloknot yig'indisi
export function avansYigindisi(eslatmalar: string, ism?: string, ismlar?: string[]): number {
  if (!eslatmalar?.trim()) return 0;
  return eslatmalar
    .split('\n')
    .filter((qator) => !ism || qatorShuIshchigami(qator, ism, ismlar))
    .reduce((jami, qator) => jami + qatordagiSummalar(qator), 0);
}

// Oy jami: faqat aniq bitta ishchiga tegishli qatorlar (noaniq qatorlar hech kimga hisoblanmaydi)
export function avansJami(eslatmalar: string, ismlar: string[]): number {
  if (!eslatmalar?.trim()) return 0;
  return eslatmalar
    .split('\n')
    .filter((q) => qatorEgalari(q, ismlar).length === 1)
    .reduce((j, q) => j + qatordagiSummalar(q), 0);
}

// Summasi bor, lekin bir nechta xil ishchi yozilgan qatorlar soni (ogohlantirish uchun)
export function noaniqQatorlarSoni(eslatmalar: string, ismlar: string[]): number {
  if (!eslatmalar?.trim()) return 0;
  return eslatmalar.split('\n').filter((q) => qatordagiSummalar(q) > 0 && qatorEgalari(q, ismlar).length > 1).length;
}

// --- AVANS DAFTARI: qatorlarni ajratish (Avans daftari sahifasi va Telegram bot uchun) ---
export type AvansQatori = { sana: string; summa: number; izoh: string };

// "[05.11] Ali — 300,000 — kasallik uchun" -> "kasallik uchun"
export function izohAjratish(qator: string, ism?: string): string {
  let m = qator.replace(/\[\d{1,2}\.\d{1,2}\]/g, ' ');
  if (ism?.trim()) {
    m = m.replace(new RegExp(`(?<![${SOZ_BELGILARI}])${regexXavfsiz(ism.trim())}(?![${SOZ_BELGILARI}])`, 'giu'), ' ');
  }
  summaTokenlari(m)
    .reverse()
    .forEach((t) => {
      m = m.slice(0, t.joy) + ' ' + m.slice(t.joy + t.matn.length);
    });
  return m
    .replace(/(\s*[—–-]\s*){2,}/g, ' — ')
    .replace(/^[\s—–\-:;,.]+|[\s—–\-:;,.]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Ishchining summasi bor qatorlari: sana (kk.oo), summa va izoh
export function avansQatorlari(eslatmalar: string, ism: string, ismlar?: string[]): AvansQatori[] {
  if (!eslatmalar?.trim() || !ism?.trim()) return [];
  return eslatmalar
    .split('\n')
    .filter((q) => qatorShuIshchigami(q, ism, ismlar))
    .map((q) => ({
      sana: (q.match(/\[(\d{1,2}\.\d{1,2})\]/) || [])[1] || '',
      summa: qatordagiSummalar(q),
      izoh: izohAjratish(q, ism)
    }))
    .filter((q) => q.summa > 0);
}

// --- OYLIK: hammasi bir joyda ---
export type OylikManbalari = {
  davomat: DavomatJadvali;
  lavozimlar: Lavozim[];
  operatorQoshimcha: number;
  brakJadvali: BrakJadvali;
  brakStavkalari: BrakStavkalari;
  eslatmalar: string;
  // Shu oyning barcha ishchilari ismlari: avans qatori kimga tegishli ekanini aniq topish uchun
  // ("Ali Valiyev — 200,000" faqat Ali Valiyevga, "Ali"ga emas)
  ismlar?: string[];
};

export type OylikNatija = {
  lavozim: string;
  operator: boolean;
  stavka: number;
  jamiKun: number;
  jamiMoshina: number;
  asosiy: number; // kun x stavka
  qoshimcha: number; // operator: moshina x qo'shimcha narx
  hisoblangan: number; // asosiy + qo'shimcha (ushlanmalarsiz)
  brakIgna: number;
  brakLux: number;
  brakJarima: number;
  avans: number;
  sof: number; // qo'lga tegadigan: hisoblangan - brak - avans
};

export function ishchiOyligi(ishchi: Ishchi, oy: string, m: OylikManbalari): OylikNatija {
  const lavozim = ishchiLavozimi(ishchi);
  const operator = operatormi(ishchi);
  const stavka = lavozimStavkasi(lavozim, m.lavozimlar);
  const { jamiKun, jamiMoshina } = davomatHisobi(ishchi.id, oy, m.davomat);
  const asosiy = jamiKun * stavka;
  const qoshimcha = operator ? jamiMoshina * son(m.operatorQoshimcha) : 0;
  const hisoblangan = asosiy + qoshimcha;
  const brak = brakHisobi(ishchi.id, oy, m.brakJadvali, m.brakStavkalari);
  const avans = avansYigindisi(m.eslatmalar, String(ishchi.ism ?? ''), m.ismlar);

  return {
    lavozim,
    operator,
    stavka,
    jamiKun,
    jamiMoshina,
    asosiy,
    qoshimcha,
    hisoblangan,
    brakIgna: brak.igna,
    brakLux: brak.lux,
    brakJarima: brak.jarima,
    avans,
    sof: hisoblangan - brak.jarima - avans
  };
}
