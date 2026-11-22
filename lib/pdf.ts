// ============================================================
// ODDIY PDF YASOVCHI (tashqi kutubxonasiz)
// Standart Helvetica shrifti bilan A4 jadval hisobot. Faqat serverda ishlatiladi.
// Shrift fayli kerak emas: o'zbek lotin harflari (o', g', sh, ch) oddiy belgilar bilan yoziladi,
// kirill harflari lotinga o'giriladi.
// ============================================================

// Helvetica belgilar kengligi (1000 birlikda), 32..126
const KENGLIK = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556,
  556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
];

const KIRILL: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: "'", ы: 'i', ь: '',
  э: 'e', ю: 'yu', я: 'ya', ў: "o'", қ: 'q', ғ: "g'", ҳ: 'h'
};

// Matnni PDF standart shriftiga mos holga keltirish
export function pdfMatn(matn: unknown): string {
  return String(matn ?? '')
    .replace(/[ʻʼ‘’`´]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/[Ѐ-ӿ]/g, (h) => {
      const kichik = h.toLowerCase();
      const lotin = KIRILL[kichik] ?? '';
      return h !== kichik && lotin ? lotin.charAt(0).toUpperCase() + lotin.slice(1) : lotin;
    })
    .replace(/[^\x20-\x7E]/g, '');
}

export function matnKengligi(matn: string, olcham: number, qalin = false): number {
  let w = 0;
  for (const h of matn) w += KENGLIK[h.charCodeAt(0) - 32] ?? 556;
  return (w * olcham * (qalin ? 1.06 : 1)) / 1000;
}

// Belgilangan kenglikka sig'masa, oxirini "..." bilan qisqartirish
export function qisqartirish(matn: string, olcham: number, maks: number, qalin = false): string {
  if (matnKengligi(matn, olcham, qalin) <= maks) return matn;
  let m = matn;
  while (m.length > 1 && matnKengligi(m + '...', olcham, qalin) > maks) m = m.slice(0, -1);
  return m.trimEnd() + '...';
}

const qochirish = (m: string) => m.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

type Rang = [number, number, number];

// Bitta sahifaning chizmalari
export class PdfSahifa {
  amallar: string[] = [];
  static BALANDLIK = 842;
  static KENGLIK = 595;

  matn(x: number, y: number, matn: string, o: { olcham?: number; qalin?: boolean; rang?: Rang; ong?: boolean } = {}) {
    const olcham = o.olcham ?? 10;
    const toza = pdfMatn(matn);
    const xx = o.ong ? x - matnKengligi(toza, olcham, o.qalin) : x;
    const [r, g, b] = o.rang ?? [0.1, 0.12, 0.16];
    this.amallar.push(
      `BT /${o.qalin ? 'F2' : 'F1'} ${olcham} Tf ${r} ${g} ${b} rg ${xx.toFixed(2)} ${(PdfSahifa.BALANDLIK - y).toFixed(2)} Td (${qochirish(toza)}) Tj ET`
    );
  }

  tortburchak(x: number, y: number, w: number, h: number, rang: Rang) {
    const [r, g, b] = rang;
    this.amallar.push(`${r} ${g} ${b} rg ${x} ${(PdfSahifa.BALANDLIK - y - h).toFixed(2)} ${w} ${h} re f`);
  }

  chiziq(x1: number, y: number, x2: number, rang: Rang = [0.85, 0.87, 0.9], qalinlik = 0.6) {
    const [r, g, b] = rang;
    const yy = (PdfSahifa.BALANDLIK - y).toFixed(2);
    this.amallar.push(`${r} ${g} ${b} RG ${qalinlik} w ${x1} ${yy} m ${x2} ${yy} l S`);
  }
}

// Sahifalardan PDF fayl yasash
export function pdfYasash(sahifalar: PdfSahifa[]): Uint8Array {
  const obyektlar: string[] = [];
  const qosh = (m: string) => obyektlar.push(m) ; // raqami = indeks + 1

  qosh('<< /Type /Catalog /Pages 2 0 R >>'); // 1
  qosh(''); // 2 - Pages (keyin to'ldiriladi)
  qosh('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // 3
  qosh('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4

  const sahifaRaqamlari: number[] = [];
  sahifalar.forEach((s) => {
    const oqim = s.amallar.join('\n');
    qosh(`<< /Length ${Buffer.byteLength(oqim, 'latin1')} >>\nstream\n${oqim}\nendstream`);
    const oqimRaqami = obyektlar.length;
    qosh(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PdfSahifa.KENGLIK} ${PdfSahifa.BALANDLIK}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${oqimRaqami} 0 R >>`
    );
    sahifaRaqamlari.push(obyektlar.length);
  });
  obyektlar[1] = `<< /Type /Pages /Kids [${sahifaRaqamlari.map((n) => `${n} 0 R`).join(' ')}] /Count ${sahifaRaqamlari.length} >>`;

  let fayl = '%PDF-1.4\n';
  const joylar: number[] = [];
  obyektlar.forEach((o, i) => {
    joylar.push(Buffer.byteLength(fayl, 'latin1'));
    fayl += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(fayl, 'latin1');
  fayl += `xref\n0 ${obyektlar.length + 1}\n0000000000 65535 f \n`;
  joylar.forEach((j) => (fayl += `${String(j).padStart(10, '0')} 00000 n \n`));
  fayl += `trailer\n<< /Size ${obyektlar.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(fayl, 'latin1'));
}
