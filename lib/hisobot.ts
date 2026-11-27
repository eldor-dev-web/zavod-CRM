// ============================================================
// SMENA HISOBOTI -> TELEGRAM KANAL (PDF)
// Faqat serverda ishlatiladi.
// Qoidalar:
//  - bo'sh smena (birorta rulon kiritilmagan) yuborilmaydi;
//  - bir smena bir marta yuboriladi; keyin ma'lumoti o'zgarsa "Yangilangan" bo'lib qayta yuboriladi;
//  - bir vaqtda ikki so'rov kelsa ham faqat bittasi yuboradi;
//  - tugagan smena hisoboti smena almashgandan 3 SOAT KEYIN yuboriladi (shu vaqt ichidagi tuzatishlar ham kirsin).
// ============================================================

import { createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { moshinaNomi, moshinaRaqami } from '@/lib/moshina';
import { PdfSahifa, pdfYasash, qisqartirish, pdfMatn } from '@/lib/pdf';
import { toshkentVaqtMatni } from '@/lib/sana';
import { birXilSmena, oldingiSmena, smenaNomi, smenaQisqa, smenaTartibi, tungimi, type SmenaNuqtasi } from '@/lib/smena';
import { joriySmenaYozuvi } from '@/lib/joriySmena';

export const HISOBOT_PREFIKSI = 'zavod_hisobot_'; // har smena uchun: zavod_hisobot_2026-11-21_DEN
export const HISOBOT_KECHIKISHI_MS = 3 * 60 * 60 * 1000; // smena almashgandan keyin 3 soat kutiladi

type Qator = { moshina: string; operator: string; rulon: number; kg: number; tartib: number };
export type HisobotNatijasi =
  | { holat: 'yuborildi'; yangilangan: boolean }
  | { holat: 'bosh' | 'takror' | 'band' | 'topilmadi' | 'sozlanmagan' | 'kutilmoqda' }
  | { holat: 'xato'; sabab: string };

const sanaKorinishi = (s: string) => `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}`;
const kgFormat = (n: number) => {
  const [butun, kasr] = (Math.round(n * 10) / 10).toFixed(1).split('.');
  return `${butun.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${kasr === '0' ? '' : '.' + kasr}`;
};
const sonFormat = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export async function botTokeni(): Promise<string> {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN.trim();
  const y = await prisma.tizimXotira.findUnique({ where: { kalit: 'zavod_telegram_bot_token' } });
  const q = y?.qiymat;
  return typeof q === 'string' ? q.replace(/^"|"$/g, '').trim() : '';
}

// Bazadan smenani o'qib, jadval qatorlariga aylantirish
async function smenaQatorlari(sana: string, smenaTuri: string) {
  const smena = await prisma.smena.findFirst({
    where: { sana, smenaTuri },
    include: { moshinalar: { include: { rulonlar: true } } }
  });
  if (!smena) return null;

  const qatorlar: Qator[] = smena.moshinalar
    .map((m, i) => {
      const toldirilgan = m.rulonlar.filter((r) => typeof r.kg === 'number' && r.kg > 0);
      const n = moshinaRaqami(m.raqam);
      return {
        moshina: n ? moshinaNomi(n) : m.raqam?.trim() || `#${i + 1}`,
        operator: (m.operator || '').trim() || '-',
        rulon: toldirilgan.length,
        kg: toldirilgan.reduce((j, r) => j + (r.kg as number), 0),
        tartib: n ?? 100000 + i
      };
    })
    .filter((q) => q.rulon > 0)
    .sort((a, b) => a.tartib - b.tartib);

  return { master: (smena.master || '').trim(), kontrolchi: (smena.kontrolchi || '').trim(), qatorlar };
}

export function pdfChizish(o: { sana: string; smena: string; master: string; qatorlar: Qator[]; yangilangan: boolean }): Uint8Array {
  const CHAP = 40;
  const ONG = 555;
  const USTUN = { moshina: CHAP + 10, operator: CHAP + 95, rulon: ONG - 110, kg: ONG - 10 };
  const QATOR = 18; // 35 ta moshina bitta A4 sahifaga sig'adi
  const jamiRulon = o.qatorlar.reduce((j, q) => j + q.rulon, 0);
  const jamiKg = o.qatorlar.reduce((j, q) => j + q.kg, 0);

  const sahifalar: PdfSahifa[] = [];
  let s = new PdfSahifa();
  let y = 0;

  const sarlavha = (davomi: boolean) => {
    s.tortburchak(0, 0, PdfSahifa.KENGLIK, 6, [0.31, 0.27, 0.9]);
    s.matn(CHAP, 50, 'Zavod CRM - Smena hisoboti', { olcham: 17, qalin: true });
    if (o.yangilangan) s.matn(ONG, 50, 'YANGILANGAN', { olcham: 10, qalin: true, rang: [0.85, 0.45, 0.05], ong: true });
    const smenaNomi = tungimi(o.smena) ? 'NOCH (Tungi)' : 'DEN (Kunduzgi)';
    s.matn(CHAP, 72, `Sana: ${sanaKorinishi(o.sana)}     Smena: ${smenaNomi}${o.master ? `     Master: ${o.master}` : ''}${davomi ? '     (davomi)' : ''}`, {
      olcham: 10.5,
      rang: [0.3, 0.33, 0.4]
    });
    // Jadval sarlavhasi
    s.tortburchak(CHAP, 92, ONG - CHAP, 22, [0.94, 0.95, 0.97]);
    const r: [number, number, number] = [0.35, 0.38, 0.45];
    s.matn(USTUN.moshina, 107, 'Moshina', { olcham: 9.5, qalin: true, rang: r });
    s.matn(USTUN.operator, 107, 'Operator', { olcham: 9.5, qalin: true, rang: r });
    s.matn(USTUN.rulon, 107, 'Rulonlar soni', { olcham: 9.5, qalin: true, rang: r, ong: true });
    s.matn(USTUN.kg, 107, 'KG', { olcham: 9.5, qalin: true, rang: r, ong: true });
    y = 114;
  };

  sarlavha(false);
  o.qatorlar.forEach((q, i) => {
    if (y + QATOR > 786) {
      sahifalar.push(s);
      s = new PdfSahifa();
      sarlavha(true);
    }
    if (i % 2 === 1) s.tortburchak(CHAP, y, ONG - CHAP, QATOR, [0.985, 0.987, 0.992]);
    const asos = y + 12.8;
    s.matn(USTUN.moshina, asos, q.moshina, { olcham: 10, qalin: true });
    s.matn(USTUN.operator, asos, qisqartirish(pdfMatn(q.operator), 10, USTUN.rulon - USTUN.operator - 90), { olcham: 10 });
    s.matn(USTUN.rulon, asos, sonFormat(q.rulon), { olcham: 10, ong: true });
    s.matn(USTUN.kg, asos, kgFormat(q.kg), { olcham: 10, ong: true });
    y += QATOR;
    s.chiziq(CHAP, y, ONG);
  });

  // JAMI
  if (y + 30 > 790) {
    sahifalar.push(s);
    s = new PdfSahifa();
    sarlavha(true);
  }
  s.tortburchak(CHAP, y + 2, ONG - CHAP, 24, [0.93, 0.92, 1]);
  s.matn(USTUN.moshina, y + 18, 'JAMI', { olcham: 10.5, qalin: true });
  s.matn(USTUN.operator, y + 18, `${o.qatorlar.length} ta moshina`, { olcham: 9.5, rang: [0.35, 0.38, 0.45] });
  s.matn(USTUN.rulon, y + 18, sonFormat(jamiRulon), { olcham: 10.5, qalin: true, ong: true });
  s.matn(USTUN.kg, y + 18, kgFormat(jamiKg), { olcham: 10.5, qalin: true, ong: true });

  sahifalar.push(s);
  const vaqt = toshkentVaqtMatni();
  sahifalar.forEach((p, i) => {
    p.matn(CHAP, 815, `Yaratildi: ${vaqt.slice(8, 10)}.${vaqt.slice(5, 7)}.${vaqt.slice(0, 4)} ${vaqt.slice(11)}`, { olcham: 8.5, rang: [0.55, 0.58, 0.63] });
    if (sahifalar.length > 1) p.matn(ONG, 815, `${i + 1} / ${sahifalar.length}`, { olcham: 8.5, rang: [0.55, 0.58, 0.63], ong: true });
  });
  return pdfYasash(sahifalar);
}

async function telegramgaYuborish(token: string, chatId: string, pdf: Uint8Array, faylNomi: string, izoh: string) {
  const forma = new FormData();
  forma.append('chat_id', chatId);
  forma.append('caption', izoh);
  forma.append('parse_mode', 'HTML');
  forma.append('document', new Blob([pdf as BlobPart], { type: 'application/pdf' }), faylNomi);
  const javob = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: forma });
  if (!javob.ok) throw new Error(`Telegram: ${javob.status} ${(await javob.text().catch(() => '')).slice(0, 200)}`);
}

// Smena hisobotini yuborish vaqti keldimi:
//  - hali tugamagan (joriy yoki keyingi) smena — yo'q;
//  - hozirgina tugagan smena — almashganiga 3 soat bo'lgan bo'lsa;
//  - undan eski smenalar — ha.
async function yuborishVaqtimi(sana: string, smenaTuri: string): Promise<boolean> {
  const { joriy, updatedAt } = await joriySmenaYozuvi();
  const s = { sana, smena: smenaNomi(smenaTuri) };
  if (smenaTartibi(s) >= smenaTartibi(joriy)) return false;
  if (birXilSmena(s, oldingiSmena(joriy.sana, joriy.smena))) return Date.now() - updatedAt.getTime() >= HISOBOT_KECHIKISHI_MS;
  return true;
}

// Asosiy funksiya: smena hisobotini (kerak bo'lsa) kanalga yuborish
export async function smenaHisobotiniYuborish(sana: string, smenaTuri: string): Promise<HisobotNatijasi> {
  const chatId = (process.env.TELEGRAM_HISOBOT_CHAT_ID || '').trim();
  const token = await botTokeni();
  if (!chatId || !token) return { holat: 'sozlanmagan' };
  if (!(await yuborishVaqtimi(sana, smenaTuri))) return { holat: 'kutilmoqda' };

  const malumot = await smenaQatorlari(sana, smenaTuri);
  if (!malumot) return { holat: 'topilmadi' };
  if (malumot.qatorlar.length === 0) return { holat: 'bosh' };

  // Iz eski ko'rinishda (kontrolchisiz): aks holda avval yuborilgan smenalar "Yangilangan" bo'lib qayta ketadi
  const iz = createHash('sha256').update(JSON.stringify({ master: malumot.master, qatorlar: malumot.qatorlar })).digest('hex').slice(0, 24);
  const kalit = `${HISOBOT_PREFIKSI}${sana}_${smenaQisqa(smenaTuri)}`;
  const mavjud = await prisma.tizimXotira.findUnique({ where: { kalit } });
  const eski = (mavjud?.qiymat ?? null) as { iz?: string; holat?: string } | null;
  if (eski?.iz === iz) return { holat: 'takror' };

  // Navbatni "band qilish": bir vaqtda kelgan ikkinchi so'rov yubormaydi
  const yangiQiymat = { iz, holat: 'yuborilmoqda', vaqt: toshkentVaqtMatni() };
  try {
    if (!mavjud) {
      await prisma.tizimXotira.create({ data: { kalit, qiymat: yangiQiymat } });
    } else {
      const r = await prisma.tizimXotira.updateMany({ where: { kalit, updatedAt: mavjud.updatedAt }, data: { qiymat: yangiQiymat } });
      if (r.count === 0) return { holat: 'band' };
    }
  } catch {
    return { holat: 'band' }; // boshqa so'rov allaqachon yaratib bo'lgan
  }

  const yangilangan = !!eski && eski.holat === 'yuborildi';
  try {
    const pdf = pdfChizish({ sana, smena: smenaTuri, master: malumot.master, qatorlar: malumot.qatorlar, yangilangan });
    const qisqa = smenaQisqa(smenaTuri);
    const jamiKg = malumot.qatorlar.reduce((j, q) => j + q.kg, 0);
    const jamiRulon = malumot.qatorlar.reduce((j, q) => j + q.rulon, 0);
    const izoh =
      `${qisqa === 'DEN' ? '☀️' : '🌙'} <b>${sanaKorinishi(sana)} · ${qisqa}</b>\n` +
      `${kgFormat(jamiKg)} kg · ${sonFormat(jamiRulon)} rulon · ${malumot.qatorlar.length} moshina` +
      (malumot.master ? `\nMaster: ${malumot.master.replace(/[<>&]/g, '')}` : '') +
      (malumot.kontrolchi ? `\nKontrolchi: ${malumot.kontrolchi.replace(/[<>&]/g, '')}` : '') +
      (yangilangan ? '\n🔄 Yangilangan' : '');
    await telegramgaYuborish(token, chatId, pdf, `${sanaKorinishi(sana)} ${qisqa}${yangilangan ? ' (yangilangan)' : ''}.pdf`, izoh);
    await prisma.tizimXotira.update({ where: { kalit }, data: { qiymat: { iz, holat: 'yuborildi', vaqt: toshkentVaqtMatni() } } });
    return { holat: 'yuborildi', yangilangan };
  } catch (e) {
    // Yuborilmadi: keyingi urinishda qayta yuborilishi uchun belgini qaytaramiz
    try {
      if (eski) await prisma.tizimXotira.update({ where: { kalit }, data: { qiymat: eski } });
      else await prisma.tizimXotira.delete({ where: { kalit } });
    } catch {}
    return { holat: 'xato', sabab: e instanceof Error ? e.message : String(e) };
  }
}

// Tugagan smenaning hisobotini 3 soatdan keyin yuborish. Rulonlar sahifasi joriy smenani har 20 soniyada
// so'raydi — server shu payt tekshiradi (Vercel bepul tarifida soatlik vazifa yo'q). Hech qaysi qurilma
// ochiq bo'lmasa, ertalabki kunlik tekshiruv yuboradi. Faqat birinchi yuborish shu yerda; keyingi
// tuzatishlar ("Yangilangan") kunlik tekshiruvda ketadi — har 20 soniyada butun smenani o'qimaslik uchun.
export async function kechiktirilganHisobotniYuborish(joriy: SmenaNuqtasi, updatedAt: Date): Promise<void> {
  if (Date.now() - updatedAt.getTime() < HISOBOT_KECHIKISHI_MS) return;
  const t = oldingiSmena(joriy.sana, joriy.smena);
  const belgi = await prisma.tizimXotira.findUnique({ where: { kalit: `${HISOBOT_PREFIKSI}${t.sana}_${smenaQisqa(t.smena)}` } });
  if (belgi) return; // allaqachon yuborilgan yoki hozir yuborilmoqda
  await smenaHisobotiniYuborish(t.sana, t.smena);
}
