import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { oyBraklari } from '@/lib/braklarServer';
import {
  avansQatorlari,
  ishchiOyligi,
  jsonOchish,
  KALIT,
  pulFormat,
  son,
  STANDART_BRAK_STAVKALARI,
  STANDART_LAVOZIMLAR,
  STANDART_OPERATOR_QOSHIMCHA,
  faolIshchilar,
  oySozlamasi,
  type Ishchi,
  type OylikManbalari,
  type SozlamaTarixi
} from '@/lib/hisob';
import { oldingiOy, toshkentOy, toshkentSana } from '@/lib/sana';

// Raqam so'raydigan doimiy tugma (har safar bosib oylikni ko'rish mumkin)
const RAQAM_TUGMASI = {
  keyboard: [[{ text: '📱 Oylik hisobotni ko\'rish', request_contact: true }]],
  resize_keyboard: true
};

// Bazadan o'qish. Brauzer ma'lumotlarni matn ko'rinishida saqlaydi, shuning uchun jsonOchish bilan ochamiz.
async function xotiradanOlish<T>(kalit: string, standart: T): Promise<T> {
  try {
    const qator = await prisma.tizimXotira.findUnique({ where: { kalit } });
    return jsonOchish<T>(qator?.qiymat, standart);
  } catch (err) {
    console.error(`Bazadan o'qib bo'lmadi (${kalit}):`, err);
    return standart;
  }
}

// Telefon raqamning oxirgi 9 ta raqami (+998 90 123 45 67 -> 901234567)
function raqamniTozalash(tel: unknown) {
  return String(tel ?? '').replace(/\D/g, '').slice(-9);
}

// Telegram HTML uchun maxsus belgilarni xavfsiz qilish
function htmlXavfsiz(matn: unknown) {
  return String(matn ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function telegramXabarYuborish(token: string, chatId: number | string, text: string, replyMarkup?: unknown) {
  try {
    const javob = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {})
      })
    });
    if (!javob.ok) console.error('Telegram sendMessage xatosi:', javob.status, await javob.text());
  } catch (err) {
    console.error('Telegramga ulanib bo\'lmadi:', err);
  }
}

async function oyIshchilari(oy: string): Promise<Ishchi[]> {
  return faolIshchilar(await xotiradanOlish<unknown>(KALIT.ishchilar(oy), []));
}

async function oylikManbalari(oy: string): Promise<OylikManbalari> {
  const [davomat, lavozimlar, qoshimcha, brakJadvali, brakStavkalari, eslatmalar, tarix] = await Promise.all([
    xotiradanOlish(KALIT.davomat, {}),
    xotiradanOlish(KALIT.lavozimlar, STANDART_LAVOZIMLAR),
    xotiradanOlish<unknown>(KALIT.operatorQoshimcha, STANDART_OPERATOR_QOSHIMCHA),
    // Braklar smenalardan hisoblanadi (Braklar sahifasi bilan bir xil)
    oyBraklari(oy).then((b) => b.jadval).catch(() => ({})),
    xotiradanOlish(KALIT.brakStavkalari, STANDART_BRAK_STAVKALARI),
    xotiradanOlish<unknown>(KALIT.eslatmalar(oy), ''),
    xotiradanOlish<SozlamaTarixi>(KALIT.sozlamaTarixi, {})
  ]);
  // Shu oyda amal qilgan sozlamalar (o'tgan oylar eski stavka bilan)
  const oySozlama = oySozlamasi(
    oy,
    {
      lavozimlar: Array.isArray(lavozimlar) ? lavozimlar : STANDART_LAVOZIMLAR,
      operatorQoshimcha: qoshimcha === null || qoshimcha === '' ? STANDART_OPERATOR_QOSHIMCHA : son(qoshimcha),
      brakStavkalari: { ...STANDART_BRAK_STAVKALARI, ...brakStavkalari }
    },
    tarix
  );
  return {
    davomat,
    ...oySozlama,
    brakJadvali,
    eslatmalar: String(eslatmalar ?? ''),
    ismlar: (await oyIshchilari(oy)).map((i) => String(i.ism ?? '').trim()).filter(Boolean)
  };
}

// Oy nomlari (o'zbekcha)
const OY_NOMLARI = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const oyNomi = (oy: string) => OY_NOMLARI[Number(oy.slice(5, 7)) - 1] || oy;

// Hisobot matni (faqat 0 dan katta qatorlar chiqadi)
async function hisobotMatni(ishchi: Ishchi, oy: string) {
  const manbalar = await oylikManbalari(oy);
  const o = ishchiOyligi(ishchi, oy, manbalar);

  const qatorlar = [
    `👤 <b>${htmlXavfsiz(ishchi.ism)}</b> (${htmlXavfsiz(o.lavozim || 'Xodim')})`,
    `📅 <b>Oy:</b> ${oy}`,
    '',
    `• <b>Ishlagan kuni:</b> ${o.jamiKun} kun`
  ];
  if (o.operator && o.jamiMoshina > 0) qatorlar.push(`• <b>Qo'shimcha moshina:</b> ${o.jamiMoshina} ta`);
  if (o.hisoblangan > 0) qatorlar.push(`• <b>Hisoblangan:</b> ${pulFormat(o.hisoblangan)} UZS`);
  if (o.brakJarima > 0) {
    const metrlar = [o.brakIgna > 0 ? `igna ${o.brakIgna} m` : '', o.brakLux > 0 ? `lux ${o.brakLux} m` : '']
      .filter(Boolean)
      .join(', ');
    qatorlar.push(`• <b>Brak jarimasi:</b> -${pulFormat(o.brakJarima)} UZS (${metrlar})`);
  }
  if (o.avans > 0) {
    qatorlar.push(`• <b>Olingan avans:</b> -${pulFormat(o.avans)} UZS`);
    // Ostida: faqat izoh yozilgan avanslar (nima uchun olingani), sanasi va summasi bilan
    avansQatorlari(manbalar.eslatmalar, String(ishchi.ism ?? ''), manbalar.ismlar)
      .filter((a) => a.izoh)
      .forEach((a) => {
        const [kun, oyRaqami] = a.sana.split('.').map(Number);
        const sana = kun && oyRaqami ? `${kun}-${OY_NOMLARI[oyRaqami - 1] || ''}, ` : '';
        qatorlar.push(`    ↳ <i>${sana}${pulFormat(a.summa)} — ${htmlXavfsiz(a.izoh)}</i>`);
      });
  }
  qatorlar.push('', `💵 <b>Qo'lga tegadi: ${pulFormat(o.sof)} UZS</b>`);

  return qatorlar.join('\n');
}

// --- HISOBOT JADVALI ---
// Bot faqat har oyning 1–5 kunlari ochiq va O'TGAN oyning hisobotini ko'rsatadi.
// Bu 5 kun ichida har bir ishchi hisobotni faqat 1 marta ko'ra oladi.
const OCHIQ_KUNLAR = 5;
const SOROVLAR_KALITI = 'zavod_bot_sorovlar'; // { "901234567": "2026-12-02" } — oxirgi ko'rgan kuni


function keyingiOyBoshi(oy: string) {
  const [y, m] = oy.split('-').map(Number);
  const keyingi = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  return `1-${oyNomi(keyingi)}`;
}

async function sorovlarniOqish(): Promise<Record<string, string>> {
  const d = await xotiradanOlish<Record<string, string>>(SOROVLAR_KALITI, {});
  return d && typeof d === 'object' ? d : {};
}

async function sorovniYozish(tozaTel: string, bugun: string) {
  try {
    const sorovlar = await sorovlarniOqish();
    // Faqat joriy oyning yozuvlari saqlanadi (eski oylar o'chib ketadi)
    const joriyOy = bugun.slice(0, 7);
    const yangi: Record<string, string> = {};
    Object.entries(sorovlar).forEach(([tel, sana]) => {
      if (String(sana).startsWith(joriyOy)) yangi[tel] = sana;
    });
    yangi[tozaTel] = bugun;
    await prisma.tizimXotira.upsert({
      where: { kalit: SOROVLAR_KALITI },
      update: { qiymat: yangi },
      create: { kalit: SOROVLAR_KALITI, qiymat: yangi }
    });
  } catch (err) {
    console.error('Bot so\'rovini yozib bo\'lmadi:', err);
  }
}

// Ishchini o'tgan oy ro'yxatidan raqami bo'yicha topish (topilmasa joriy oy ro'yxatidan — ID bir xil)
async function ishchiniTopish(tozaTel: string, hisobotOyi: string): Promise<Ishchi | null> {
  const mos = (i: Ishchi) => raqamniTozalash(i.telefon) === tozaTel;
  return (await oyIshchilari(hisobotOyi)).find(mos) || (await oyIshchilari(toshkentOy())).find(mos) || null;
}

// TELEGRAM WEBHOOK
// Oyning 1–5 kunlari ishchi raqamini tugma orqali yuboradi -> o'tgan oy hisoboti qaytadi (5 kun ichida 1 marta).
export async function POST(req: Request) {
  // So'rov haqiqatan Telegramdan kelganini tekshirish (.env da TELEGRAM_WEBHOOK_SECRET bo'lsa)
  const webhookSiri = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSiri && req.headers.get('x-telegram-bot-api-secret-token') !== webhookSiri) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = body?.message;
    if (!message?.chat || message.chat.type !== 'private') return NextResponse.json({ ok: true });

    const token =
      process.env.TELEGRAM_BOT_TOKEN || String(await xotiradanOlish<unknown>('zavod_telegram_bot_token', '')).trim();
    if (!token) return NextResponse.json({ ok: false, error: 'Bot token topilmadi' });

    const chatId = message.chat.id;
    const contact = message.contact;

    // Bugun hisobot ochiqmi (Toshkent vaqti bilan oyning 1–5 kunlari)
    const bugun = toshkentSana();
    const kun = Number(bugun.slice(8, 10));
    const joriyOy = bugun.slice(0, 7);
    const hisobotOyi = oldingiOy(joriyOy);
    // Sinov uchun: Vercel'da BOT_SINOV_REJIMI=1 qo'yilsa, bot har kuni ochiq bo'ladi
    const ochiq = kun <= OCHIQ_KUNLAR || process.env.BOT_SINOV_REJIMI === '1';
    const yopiqMatn =
      `Oylik hisobotlari har oyning 1–${OCHIQ_KUNLAR} kunlari ochiladi.\n` +
      `Keyingi hisobot: <b>${keyingiOyBoshi(joriyOy)}</b> kuni (${oyNomi(joriyOy)} oyi uchun).`;

    // 1-HOLAT: Ishchi telefon raqamini yuborgan
    if (contact?.phone_number) {
      // Faqat O'Z raqamini qabul qilamiz (boshqa odamning kontaktini emas)
      if (!message.from || contact.user_id !== message.from.id) {
        await telegramXabarYuborish(
          token,
          chatId,
          `Iltimos, boshqa odamning kontaktini emas, pastdagi tugma orqali <b>o'z raqamingizni</b> yuboring.`,
          RAQAM_TUGMASI
        );
        return NextResponse.json({ ok: true });
      }

      // Hisobot faqat oyning 1–5 kunlari
      if (!ochiq) {
        await telegramXabarYuborish(token, chatId, yopiqMatn, { remove_keyboard: true });
        return NextResponse.json({ ok: true });
      }

      const tozaTel = raqamniTozalash(contact.phone_number);
      const ishchi = tozaTel.length === 9 ? await ishchiniTopish(tozaTel, hisobotOyi) : null;

      if (!ishchi) {
        await telegramXabarYuborish(
          token,
          chatId,
          'Raqamingiz tizimdan topilmadi. Raqamingizni Ishchilar bo\'limiga kiritish uchun rahbarga murojaat qiling.',
          RAQAM_TUGMASI
        );
        return NextResponse.json({ ok: true });
      }

      // 1–5 kunlar ichida faqat 1 marta
      const sorovlar = await sorovlarniOqish();
      const korganSana = String(sorovlar[tozaTel] || '');
      if (korganSana.startsWith(joriyOy)) {
        await telegramXabarYuborish(
          token,
          chatId,
          `Siz ${oyNomi(hisobotOyi)} oyi hisobotini ${Number(korganSana.slice(8, 10))}-${oyNomi(joriyOy)} kuni ko'rgansiz.\n` +
            `Keyingi hisobot: <b>${keyingiOyBoshi(joriyOy)}</b> kuni ochiladi.`,
          { remove_keyboard: true }
        );
        return NextResponse.json({ ok: true });
      }

      await telegramXabarYuborish(token, chatId, await hisobotMatni(ishchi, hisobotOyi), { remove_keyboard: true });
      await sorovniYozish(tozaTel, bugun);
      return NextResponse.json({ ok: true });
    }

    // 2-HOLAT: /start yoki boshqa har qanday xabar
    if (!ochiq) {
      await telegramXabarYuborish(token, chatId, yopiqMatn, { remove_keyboard: true });
      return NextResponse.json({ ok: true });
    }
    await telegramXabarYuborish(
      token,
      chatId,
      `${oyNomi(hisobotOyi).replace(/^./, (h) => h.toUpperCase())} oyi hisobotingizni ko'rish uchun pastdagi tugmani bosib telefon raqamingizni tasdiqlang:`,
      RAQAM_TUGMASI
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook xatosi:', error);
    return NextResponse.json({ ok: true });
  }
}
