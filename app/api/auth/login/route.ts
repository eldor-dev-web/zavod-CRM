import { NextRequest, NextResponse } from 'next/server';
import { pinlarniOlish, pinTogriMi } from '@/lib/pinlar';
import { ROL_ISMLARI, ROLLAR, SESSIYA_COOKIE, SESSIYA_MUDDATI_SONIYA, sessiyaYaratish } from '@/lib/sessiya';

// PIN-ni taxmin qilib topishga urinishni to'xtatish: 5 daqiqada 10 ta noto'g'ri urinish
const URINISH_LIMITI = 10;
const OYNA_MS = 5 * 60 * 1000;
const urinishlar = new Map<string, { soni: number; boshlangan: number }>();

function mijozIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'nomalum';
}

export async function POST(req: NextRequest) {
  const ip = mijozIp(req);
  const hozir = Date.now();
  const yozuv = urinishlar.get(ip);
  if (yozuv && hozir - yozuv.boshlangan < OYNA_MS && yozuv.soni >= URINISH_LIMITI) {
    return NextResponse.json(
      { xato: 'Juda ko\'p noto\'g\'ri urinish. 5 daqiqadan keyin qayta urinib ko\'ring.' },
      { status: 429 }
    );
  }

  let pin: unknown;
  try {
    ({ pin } = await req.json());
  } catch {
    return NextResponse.json({ xato: 'Noto\'g\'ri so\'rov' }, { status: 400 });
  }

  const pinlar = await pinlarniOlish();
  const rol = pinTogriMi(pin) ? ROLLAR.find((r) => pinlar[r] === pin) : undefined;

  if (!rol) {
    const yangi = !yozuv || hozir - yozuv.boshlangan >= OYNA_MS ? { soni: 1, boshlangan: hozir } : { ...yozuv, soni: yozuv.soni + 1 };
    urinishlar.set(ip, yangi);
    return NextResponse.json({ xato: 'PIN-kod noto\'g\'ri' }, { status: 401 });
  }

  urinishlar.delete(ip);

  const javob = NextResponse.json({ rol, ism: ROL_ISMLARI[rol] });
  javob.cookies.set(SESSIYA_COOKIE, await sessiyaYaratish(rol), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSIYA_MUDDATI_SONIYA
  });
  // Eski (himoyasiz) cookie'ni o'chirib tashlaymiz
  javob.cookies.set('zavod_rol', '', { path: '/', maxAge: 0 });
  return javob;
}
