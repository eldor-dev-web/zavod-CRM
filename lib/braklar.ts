// BRAKLAR: smenalardagi rulonlardan har safar qaytadan hisoblanadi (server ham, brauzer ham shu funksiyani ishlatadi).
// Qoida (brak kechirim me'yori): rulon katagidagi brak me'yordan kam bo'lsa — hisoblanmaydi,
// me'yorga teng yoki ko'p bo'lsa — to'liq hisoblanadi. Natija: { "operatorId_kun": { igna, lux } }.
import { son, type BrakJadvali, type BrakMeyyori, type Ishchi } from '@/lib/hisob';

export type BrakSmenasi = {
  sana: string;
  smena: string;
  moshinalar: {
    raqam?: string | null;
    operator?: string | null;
    operatorId?: string | number | null;
    rulonlar?: { nuqsonlar?: Record<string, unknown> | null }[] | null;
  }[];
};

// Operatori ro'yxatdan topilmagan, lekin braki bor moshina (bu brak hech kimga hisoblanmaydi)
export type TopilmaganOperator = { sana: string; smena: string; raqam: string; operator: string; igna: number; lux: number };

export type BraklarNatijasi = {
  jadval: BrakJadvali;
  topilmadi: TopilmaganOperator[];
  manba: 'smenalar' | 'eski' | 'mahalliy';
};

const kichik = (m: unknown) => String(m ?? '').toLowerCase().trim();

export function smenalardanBraklar(smenalar: BrakSmenasi[], ishchilar: Ishchi[], meyyor: BrakMeyyori): Omit<BraklarNatijasi, 'manba'> {
  const jadval: Record<string, { igna: number; lux: number }> = {};
  const topilmadi: TopilmaganOperator[] = [];
  const idlar = new Set(ishchilar.map((i) => String(i.id)));
  const ignaMeyyor = son(meyyor?.igna);
  const luxMeyyor = son(meyyor?.lux);

  smenalar.forEach((s) => {
    const kun = Number(String(s.sana).slice(8, 10));
    if (!kun) return;
    (s.moshinalar || []).forEach((m) => {
      let igna = 0;
      let lux = 0;
      (m.rulonlar || []).forEach((r) => {
        const i = son(r?.nuqsonlar?.['Igna siniq']);
        const l = son(r?.nuqsonlar?.['Lyc xato']);
        if (i > 0 && i >= ignaMeyyor) igna += i;
        if (l > 0 && l >= luxMeyyor) lux += l;
      });
      if (igna === 0 && lux === 0) return;

      // Operator: saqlangan ID bo'yicha, bo'lmasa ism bo'yicha
      let opId = m.operatorId !== null && m.operatorId !== undefined && idlar.has(String(m.operatorId)) ? String(m.operatorId) : '';
      if (!opId && m.operator) {
        const topilgan = ishchilar.find((x) => kichik(x.ism) === kichik(m.operator));
        if (topilgan) opId = String(topilgan.id);
      }
      if (!opId) {
        topilmadi.push({ sana: s.sana, smena: String(s.smena), raqam: String(m.raqam || '—'), operator: String(m.operator || ''), igna, lux });
        return;
      }

      const kalit = `${opId}_${kun}`;
      if (!jadval[kalit]) jadval[kalit] = { igna: 0, lux: 0 };
      jadval[kalit].igna += igna;
      jadval[kalit].lux += lux;
    });
  });

  return { jadval, topilmadi };
}

// Bazaga smenalari tushmagan kunlar uchun eski saqlangan jadvaldan olinadi (eski oylar jarimasi 0 bo'lib qolmasin)
export function eskiKunlarniQoshish(jadval: BrakJadvali, eski: BrakJadvali, smenaKunlari: Set<number>): BrakJadvali {
  const natija: BrakJadvali = { ...jadval };
  Object.entries(eski || {}).forEach(([kalit, qiymat]) => {
    const kun = Number(kalit.split('_').pop());
    if (!kun || smenaKunlari.has(kun) || !qiymat) return;
    if (son(qiymat.igna) > 0 || son(qiymat.lux) > 0) natija[kalit] = { igna: son(qiymat.igna), lux: son(qiymat.lux) };
  });
  return natija;
}
