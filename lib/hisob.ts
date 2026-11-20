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
  avanslar: (oy: string) => `zavod_avanslar_${oy}`,
  sozlamaTarixi: 'zavod_sozlamalar_tarixi'
} as const;

// --- SOZLAMALAR TARIXI ---
// Admin stavka yoki narxni o'zgartirsa, o'tgan oylarning oyligi ESKI sozlama bilan hisoblanishi kerak.
// Shuning uchun har oy uchun amal qilgan sozlama saqlanadi: { "2026-10": {...}, "2026-11": {...} }
export type OySozlamasi = {
  lavozimlar: Lavozim[];
  operatorQoshimcha: number;
  brakStavkalari: BrakStavkalari;
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
  natija[joriyOy] = yangi;
  return natija;
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

function qatordagiSummalar(qator: string): number {
  const sanasiz = qator.replace(/\[\d{1,2}\.\d{1,2}\]/g, '');
  const raqamlar = sanasiz.match(/\b\d{1,3}(?:[ ,]\d{3})+\b|\b\d{4,9}\b/g) || [];
  return raqamlar.reduce((jami, r) => {
    const s = Number(r.replace(/\D/g, ''));
    return jami + (s >= 1000 ? s : 0);
  }, 0);
}

// ism berilsa faqat o'sha xodimning qatorlari, berilmasa butun bloknot yig'indisi
export function avansYigindisi(eslatmalar: string, ism?: string): number {
  if (!eslatmalar?.trim()) return 0;
  return eslatmalar
    .split('\n')
    .filter((qator) => !ism || ismQatordaBormi(qator.replace(/\[\d{1,2}\.\d{1,2}\]/g, ''), ism))
    .reduce((jami, qator) => jami + qatordagiSummalar(qator), 0);
}

// --- AVANSLAR JADVALI (Avanslar sahifasi, faqat admin) ---
// Har bir avans alohida yozuv: ishchi ID bo'yicha bog'lanadi, shuning uchun ism xato yozilishi muammo emas.
export type AvansYozuvi = {
  id: string;
  sana: string; // YYYY-MM-DD
  ishchiId: number | string;
  ism: string;
  summa: number;
  izoh?: string;
};

export function avanslarniOchish(qiymat: unknown): AvansYozuvi[] {
  const r = jsonOchish<unknown>(qiymat, []);
  if (!Array.isArray(r)) return [];
  return r
    .filter((a) => a && a.ishchiId !== undefined && son(a.summa) > 0)
    .map((a) => ({
      id: String(a.id ?? ''),
      sana: String(a.sana ?? ''),
      ishchiId: a.ishchiId,
      ism: String(a.ism ?? ''),
      summa: son(a.summa),
      izoh: a.izoh ? String(a.izoh) : ''
    }))
    .sort((a, b) => a.sana.localeCompare(b.sana));
}

export function ishchiAvanslari(ishchi: Ishchi, avanslar: AvansYozuvi[]): AvansYozuvi[] {
  return avanslar.filter((a) => String(a.ishchiId) === String(ishchi.id));
}

// Eski Notes: shu ishchining ismi yozilgan qatorlar (bot izoh sifatida ko'rsatadi)
export function ishchiEslatmaQatorlari(eslatmalar: string, ism: string): string[] {
  if (!eslatmalar?.trim() || !ism?.trim()) return [];
  return eslatmalar
    .split('\n')
    .map((q) => q.trim())
    .filter((q) => q && ismQatordaBormi(q.replace(/\[\d{1,2}\.\d{1,2}\]/g, ''), ism));
}

// --- OYLIK: hammasi bir joyda ---
export type OylikManbalari = {
  davomat: DavomatJadvali;
  lavozimlar: Lavozim[];
  operatorQoshimcha: number;
  brakJadvali: BrakJadvali;
  brakStavkalari: BrakStavkalari;
  eslatmalar: string;
  // Avanslar jadvali. Shu oyda jadvalda kamida bitta yozuv bo'lsa — faqat jadval hisoblanadi,
  // bo'lmasa (eski oylar) Notes matnidagi summalar eski usulda hisoblanadi.
  avanslar?: AvansYozuvi[];
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
  avansRoyxati: AvansYozuvi[]; // jadvaldan (bo'sh bo'lsa — avans eski Notes'dan)
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
  const jadvalBor = (m.avanslar?.length ?? 0) > 0;
  const avansRoyxati = jadvalBor ? ishchiAvanslari(ishchi, m.avanslar!) : [];
  const avans = jadvalBor
    ? avansRoyxati.reduce((j, a) => j + a.summa, 0)
    : avansYigindisi(m.eslatmalar, String(ishchi.ism ?? ''));

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
    avansRoyxati,
    sof: hisoblangan - brak.jarima - avans
  };
}
