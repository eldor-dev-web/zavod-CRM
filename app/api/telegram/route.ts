import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
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
import { oldingiOy, toshkentOy } from '@/lib/sana';

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
    xotiradanOlish(KALIT.brakJadvali(oy), {}),
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
    eslatmalar: String(eslatmalar ?? '')
  };
}

// Hisobot matni (faqat 0 dan katta qatorlar chiqadi)
async function hisobotMatni(ishchi: Ishchi, oy: string) {
  const o = ishchiOyligi(ishchi, oy, await oylikManbalari(oy));

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
  if (o.avans > 0) qatorlar.push(`• <b>Olingan avans:</b> -${pulFormat(o.avans)} UZS`);
  qatorlar.push('', `💵 <b>Qo'lga tegadi: ${pulFormat(o.sof)} UZS</b>`);

  return qatorlar.join('\n');
}

// Ishchini raqami bo'yicha topish: avval joriy oy, topilmasa o'tgan oy
async function ishchiVaOyniTopish(tozaTel: string): Promise<{ ishchi: Ishchi; oy: string } | null> {
  const joriy = toshkentOy();
  const oldingi = oldingiOy(joriy);
  const mos = (i: Ishchi) => raqamniTozalash(i.telefon) === tozaTel;

  const joriyIshchi = (await oyIshchilari(joriy)).find(mos);
  if (joriyIshchi) return { ishchi: joriyIshchi, oy: joriy };

  const oldingiIshchi = (await oyIshchilari(oldingi)).find(mos);
  if (!oldingiIshchi) return null;

  // Yangi oy ro'yxati hali saqlanmagan bo'lsa ham, shu oyda davomat bo'lsa joriy oyni ko'rsatamiz
  const joriyManbalar = await oylikManbalari(joriy);
  const joriyOylik = ishchiOyligi(oldingiIshchi, joriy, joriyManbalar);
  return { ishchi: oldingiIshchi, oy: joriyOylik.jamiKun > 0 ? joriy : oldingi };
}

// TELEGRAM WEBHOOK
// Ishchi har safar raqamini tugma orqali yuboradi -> hisobot qaytadi. Bazaga hech narsa yozilmaydi.
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

      const tozaTel = raqamniTozalash(contact.phone_number);
      const topildi = tozaTel.length === 9 ? await ishchiVaOyniTopish(tozaTel) : null;

      if (topildi) {
        await telegramXabarYuborish(token, chatId, await hisobotMatni(topildi.ishchi, topildi.oy), RAQAM_TUGMASI);
      } else {
        await telegramXabarYuborish(
          token,
          chatId,
          'Raqamingiz tizimdan topilmadi. Raqamingizni Ishchilar bo\'limiga kiritish uchun rahbarga murojaat qiling.',
          RAQAM_TUGMASI
        );
      }
      return NextResponse.json({ ok: true });
    }

    // 2-HOLAT: /start yoki boshqa har qanday xabar -> raqam so'raymiz
    await telegramXabarYuborish(
      token,
      chatId,
      'Oylik hisobotingizni ko\'rish uchun pastdagi tugmani bosib telefon raqamingizni tasdiqlang:',
      RAQAM_TUGMASI
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook xatosi:', error);
    return NextResponse.json({ ok: true });
  }
}
