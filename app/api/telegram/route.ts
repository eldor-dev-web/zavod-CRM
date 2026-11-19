import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Bazadan kalit bo'yicha JSON ma'lumotni o'qish
async function xotiradanOlish(kalit: string, defaultQiymat: any = null) {
  try {
    const qator = await prisma.tizimXotira.findUnique({ where: { kalit } });
    if (!qator || qator.qiymat === null || qator.qiymat === undefined) return defaultQiymat;
    
    // Agar JSON formatda bo'lsa, o'zi qaytaradi
    return qator.qiymat;
  } catch {
    return defaultQiymat;
  }
}

// Bazaga saqlash
async function xotiragaYozish(kalit: string, qiymat: any) {
  try {
    await prisma.tizimXotira.upsert({
      where: { kalit },
      update: { qiymat },
      create: { kalit, qiymat }
    });
  } catch (err) {
    console.error('Xotiraga yozish xatosi:', err);
  }
}

// Telefon raqamning oxirgi 9 ta raqamini ajratib olish (masalan: +998 90 123 45 67 -> 901234567)
function raqamniTozalash(tel: string) {
  const faqatRaqam = String(tel || '').replace(/\D/g, '');
  return faqatRaqam.slice(-9);
}

// Telegramga xabar yuborish
async function telegramXabarYuborish(token: string, chatId: number | string, text: string, replyMarkup?: any) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {})
    })
  });
}

// Xodimning oylik hisobot matnini tuzish (Faqat > 0 bo'lgan qatorlar qo'shiladi)
async function hisobotMatniniTuzish(ishchi: any, joriyOy: string) {
  const davomat = (await xotiradanOlish('zavod_xodim_davomati', {})) || {};
  const lavozimlar = (await xotiradanOlish('zavod_lavozimlar_bazasi', [
    { id: 1, nomi: 'Operator', stavka: 175000 },
    { id: 2, nomi: 'Master 1', stavka: 220000 }
  ])) || [];
  const operatorQoshimcha = Number(await xotiradanOlish('zavod_operator_qoshimcha', 20000)) || 20000;
  const brakNarxi = Number(await xotiradanOlish('zavod_brak_jarima_narxi', 10000)) || 10000;
  const brakJadvali = (await xotiradanOlish('zavod_brak_jadvali', {})) || {};
  const eslatmalar = String((await xotiradanOlish(`zavod_eslatmalar_${joriyOy}`, '')) || '');

  const [yil, oy] = joriyOy.split('-').map(Number);
  const kunlarSoni = new Date(yil, oy, 0).getDate();

  // 1. Ishlagan kun va moshina soni
  let jamiKun = 0;
  let jamiMoshina = 0;
  for (let kun = 1; kun <= kunlarSoni; kun++) {
    const d = davomat[`${ishchi.id}_${joriyOy}_${kun}`];
    if (d) {
      if (d.status === '+') jamiKun += 1;
      if (d.moshina !== '' && !isNaN(Number(d.moshina))) jamiMoshina += Number(d.moshina);
    }
  }

  // 2. Stavka va lavozim
  const lavozimNomi = String(ishchi.lavozimi || '');
  const isOperator = lavozimNomi.toLowerCase().includes('operator');
  const topilganLavozim = Array.isArray(lavozimlar)
    ? lavozimlar.find((l: any) => String(l.nomi).toLowerCase() === lavozimNomi.toLowerCase())
    : null;
  const stavka = topilganLavozim ? Number(topilganLavozim.stavka) || 0 : 0;

  // 3. Brak (Faqat operator uchun)
  let brakKg = 0;
  if (isOperator && ishchi.ism) {
    const tozaIsm = ishchi.ism.trim();
    for (let kun = 1; kun <= kunlarSoni; kun++) {
      const q = brakJadvali[`${tozaIsm}_${joriyOy}_${kun}`];
      if (q && !isNaN(Number(q))) brakKg += Number(q);
    }
  }
  const brakJarima = brakKg * brakNarxi;

  // 4. Avans (AvansBloknot ichidan ism bo'yicha)
  let jamiAvans = 0;
  if (ishchi.ism && eslatmalar.trim()) {
    const tozaIsm = ishchi.ism.trim().toLowerCase();
    eslatmalar.split('\n').forEach((qator) => {
      const sanasiz = qator.replace(/\[\d{1,2}\.\d{1,2}\]/g, '').trim();
      if (sanasiz.toLowerCase().includes(tozaIsm)) {
        const raqamlar = sanasiz.match(/\b\d{1,3}(?:[ ,]\d{3})+\b|\b\d{4,9}\b/g);
        if (raqamlar) {
          raqamlar.forEach((r) => {
            const son = Number(r.replace(/\D/g, ''));
            if (son >= 1000) jamiAvans += son;
          });
        }
      }
    });
  }

  // 5. Yakuniy sof oylik
  const hisoblanganOylik = jamiKun * stavka + (isOperator ? jamiMoshina * operatorQoshimcha : 0);
  const sofOylik = hisoblanganOylik - brakJarima - jamiAvans;

  // 6. Xabar matnini yig'ish (Faqat bor narsalargina qo'shiladi!)
  const qatorlar: string[] = [
    `👤 <b>${ishchi.ism}</b> (${lavozimNomi || 'Xodim'})`,
    `📅 <b>Oy:</b> ${joriyOy}`,
    ``
  ];

  qatorlar.push(`• <b>Ishlagan kuni:</b> ${jamiKun} kun`);

  if (isOperator && jamiMoshina > 0) {
    qatorlar.push(`• <b>Moshina:</b> ${jamiMoshina} ta`);
  }

  if (isOperator && brakKg > 0) {
    qatorlar.push(`• <b>Brak:</b> ${brakKg} kg (-${brakJarima.toLocaleString()} UZS)`);
  }

  if (jamiAvans > 0) {
    qatorlar.push(`• <b>Olingan avans:</b> -${jamiAvans.toLocaleString()} UZS`);
  }

  qatorlar.push(``);
  qatorlar.push(`💵 <b>Oylik: ${sofOylik.toLocaleString()} UZS</b>`);

  return qatorlar.join('\n');
}

// TELEGRAM WEBHOOK (Faqat ishchi /start bosganda yoki raqam yuborganda ishlaydi)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const token =
      process.env.TELEGRAM_BOT_TOKEN ||
      String((await xotiradanOlish('zavod_telegram_bot_token', '')) || '').trim();

    if (!token) return NextResponse.json({ ok: false, error: 'Bot token topilmadi' });

    const chatId = message.chat.id;
    const text = String(message.text || '').trim();
    const contact = message.contact;

    const joriyOy = new Date().toISOString().slice(0, 7);
    const ishchilarKaliti = `zavod_ishchilar_${joriyOy}`;
    const ishchilar: any[] = (await xotiradanOlish(ishchilarKaliti, [])) || [];

    // 1-HOLAT: Ishchi telefon raqamini (Contact) yuborgan bo'lsa
    if (contact && contact.phone_number) {
      const yuborilganTel = raqamniTozalash(contact.phone_number);
      const topilganIndex = ishchilar.findIndex(
        (i: any) => i.telefon && raqamniTozalash(i.telefon) === yuborilganTel && yuborilganTel.length === 9
      );

      if (topilganIndex !== -1) {
        ishchilar[topilganIndex].telegramChatId = String(chatId);
        await xotiragaYozish(ishchilarKaliti, ishchilar);

        const hisobot = await hisobotMatniniTuzish(ishchilar[topilganIndex], joriyOy);
        await telegramXabarYuborish(token, chatId, hisobot, { remove_keyboard: true });
      } else {
        await telegramXabarYuborish(
          token,
          chatId,
          `Raqamingiz tizimdan topilmadi. Iltimos, raqamingizni Ishchilar bo'limiga kiritish uchun rahbarga murojaat qiling.`,
          { remove_keyboard: true }
        );
      }
      return NextResponse.json({ ok: true });
    }

    // 2-HOLAT: Ishchi /start bosgan bo'lsa
    if (text === '/start') {
      const topilganIshchi = ishchilar.find((i: any) => String(i.telegramChatId) === String(chatId));

      if (topilganIshchi) {
        const hisobot = await hisobotMatniniTuzish(topilganIshchi, joriyOy);
        await telegramXabarYuborish(token, chatId, hisobot);
      } else {
        // Agar birinchi marta kirayotgan bo'lsa, telefon raqamini tugma orqali so'raymiz
        await telegramXabarYuborish(
          token,
          chatId,
          `Oylik hisobotingizni ko'rish uchun pastdagi tugmani bosib telefon raqamingizni tasdiqlang:`,
          {
            keyboard: [[{ text: '📱 Telefon raqamni tasdiqlash', request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook xatosi:', error);
    return NextResponse.json({ ok: true });
  }
}