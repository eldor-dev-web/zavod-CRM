// Arxiv uchun umumiy turlar va yordamchilar (server ham, brauzer ham ishlatadi)

export const NUQSON_TURLARI = ['Patlak', 'Lyc xato', 'Igna siniq', 'Yog izi', 'Kumas'] as const;

export type ArxivRulon = {
  tartib: number;
  kg: number | null;
  vaqt: string;
  nuqsonlar: Record<string, string>;
};

export type ArxivMoshina = {
  raqam: string;
  talimoti: string;
  brend: string;
  ip: string;
  lot: string;
  operator: string;
  rulonlar: ArxivRulon[];
};

export type ArxivSmena = {
  sana: string;
  smena: string;
  kontrolchi: string;
  master: string;
  moshinalar: ArxivMoshina[];
};

const matn = (q: unknown) => (q === null || q === undefined ? '' : String(q).trim());

function kgSon(q: unknown): number | null {
  if (q === null || q === undefined || String(q).trim() === '') return null;
  const n = parseFloat(String(q).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// Bo'sh rulon (na og'irlik, na nuqson) arxivga kirmaydi
function rulonBormi(r: ArxivRulon) {
  return r.kg !== null || Object.values(r.nuqsonlar).some((v) => v !== '');
}

// --- Bazadagi (Prisma) smenani arxiv ko'rinishiga keltirish ---
export function bazaSmenasiniOgirish(s: any): ArxivSmena {
  return {
    sana: matn(s.sana),
    smena: matn(s.smenaTuri),
    kontrolchi: matn(s.kontrolchi),
    master: matn(s.master),
    moshinalar: (s.moshinalar || []).map((m: any) => ({
      raqam: matn(m.raqam),
      talimoti: matn(m.talimoti),
      brend: matn(m.brend),
      ip: matn(m.ip),
      lot: matn(m.lot),
      operator: matn(m.operator),
      rulonlar: (m.rulonlar || [])
        .map((r: any, i: number) => ({
          tartib: r.tartibRaqam || i + 1,
          kg: kgSon(r.kg),
          vaqt: matn(r.vaqt),
          nuqsonlar: {
            Patlak: matn(r.patlak),
            'Lyc xato': matn(r.lycXato),
            'Igna siniq': matn(r.ignaSiniq),
            'Yog izi': matn(r.yogIzi),
            Kumas: matn(r.kumas)
          }
        }))
        .filter(rulonBormi)
    }))
  };
}

// --- Brauzerda saqlangan smenani arxiv ko'rinishiga keltirish (baza ulanmaganda) ---
export function mahalliySmenaniOgirish(s: any): ArxivSmena | null {
  if (!s || !s.sana) return null;
  const moshinalar = Array.isArray(s.moshinalar) ? s.moshinalar : Object.values(s.moshinalar || {});
  return {
    sana: matn(s.sana),
    smena: matn(s.smena ?? s.smenaTuri),
    kontrolchi: matn(s.kontrolchi),
    master: matn(s.master),
    moshinalar: moshinalar.map((m: any) => ({
      raqam: matn(m.raqam),
      talimoti: matn(m.talimoti),
      brend: matn(m.brend),
      ip: matn(m.ip),
      lot: matn(m.lot),
      operator: matn(m.operator),
      rulonlar: (Array.isArray(m.rulonlar) ? m.rulonlar : [])
        .map((r: any, i: number) => ({
          tartib: i + 1,
          kg: kgSon(r.kg),
          vaqt: matn(r.vaqt),
          nuqsonlar: Object.fromEntries(NUQSON_TURLARI.map((n) => [n, matn(r.nuqsonlar?.[n])]))
        }))
        .filter(rulonBormi)
    }))
  };
}

// --- Qidiruv: moshina ma'lumotlari ichida so'z bormi ---
export function moshinaMoskeladi(m: ArxivMoshina, qidiruv: string) {
  const q = qidiruv.trim().toLowerCase();
  if (!q) return true;
  return [m.raqam, m.talimoti, m.brend, m.ip, m.lot, m.operator].some((v) => v.toLowerCase().includes(q));
}

export function smenaMoskeladi(s: ArxivSmena, qidiruv: string) {
  const q = qidiruv.trim().toLowerCase();
  if (!q) return true;
  return (
    s.kontrolchi.toLowerCase().includes(q) ||
    s.master.toLowerCase().includes(q) ||
    s.moshinalar.some((m) => moshinaMoskeladi(m, q))
  );
}

// --- Jami ko'rsatkichlar ---
export function smenaJamisi(s: ArxivSmena) {
  let kg = 0;
  let rulon = 0;
  s.moshinalar.forEach((m) =>
    m.rulonlar.forEach((r) => {
      if (r.kg !== null) {
        kg += r.kg;
        rulon += 1;
      }
    })
  );
  return { kg, rulon };
}

// --- Excel uchun CSV (har bir rulon alohida qator) ---
export function arxivCsv(smenalar: ArxivSmena[]): string {
  const sarlavha = [
    'Sana', 'Smena', 'Kontrolchi', 'Master', 'Moshina', 'Operator', 'Talimoti', 'Brend', 'IP', 'Lot',
    'Rulon №', 'Vaqt', 'Kg', ...NUQSON_TURLARI
  ];
  const katak = (q: unknown) => {
    const t = String(q ?? '');
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const qatorlar: string[] = [sarlavha.join(';')];
  smenalar.forEach((s) =>
    s.moshinalar.forEach((m) =>
      m.rulonlar.forEach((r) =>
        qatorlar.push(
          [
            s.sana, s.smena, s.kontrolchi, s.master, m.raqam, m.operator, m.talimoti, m.brend, m.ip, m.lot,
            r.tartib, r.vaqt, r.kg === null ? '' : String(r.kg).replace('.', ','),
            ...NUQSON_TURLARI.map((n) => r.nuqsonlar[n] || '')
          ]
            .map(katak)
            .join(';')
        )
      )
    )
  );
  // BOM: Excel o'zbek/kirill harflarini to'g'ri ochishi uchun
  return '﻿' + qatorlar.join('\r\n');
}
