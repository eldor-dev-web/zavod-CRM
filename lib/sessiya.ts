// Sessiya (kirish) tokenlarini yaratish va tekshirish.
// Web Crypto ishlatiladi: proxy/middleware'da ham, API route'larda ham bir xil ishlaydi.

export type Rol = 'admin' | 'master' | 'kontrolchi' | 'mexanik';
export const ROLLAR: Rol[] = ['admin', 'master', 'kontrolchi', 'mexanik'];

export const ROL_ISMLARI: Record<Rol, string> = {
  admin: 'Boshqaruvchi',
  master: 'Smena Masteri',
  kontrolchi: 'Kontrolchi',
  mexanik: 'Mexanik'
};

// Har bir rol tizimga kirgach qaysi sahifadan boshlaydi
export const BOSH_SAHIFA: Record<Rol, string> = {
  admin: '/',
  master: '/rulonlar',
  kontrolchi: '/rulonlar',
  mexanik: '/texnik'
};

// Sessiya cookie nomi va muddati (24 soat)
export const SESSIYA_COOKIE = 'zavod_sessiya';
export const SESSIYA_MUDDATI_SONIYA = 60 * 60 * 24;

const kodlovchi = new TextEncoder();

function base64url(baytlar: Uint8Array): string {
  let matn = '';
  baytlar.forEach((b) => (matn += String.fromCharCode(b)));
  return btoa(matn).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDekod(matn: string): string {
  const b64 = matn.replace(/-/g, '+').replace(/_/g, '/');
  const toliq = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const baytlar = Uint8Array.from(atob(toliq), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(baytlar);
}

// Imzolash uchun maxfiy kalit.
// Eng yaxshisi .env ga AUTH_SECRET qo'yish. Bo'lmasa DATABASE_URL dan hosil qilinadi
// (u ham maxfiy, shuning uchun soxta sessiya yasab bo'lmaydi).
function maxfiyMatn(): string {
  const authSecret = process.env.AUTH_SECRET;
  if (authSecret && authSecret.length >= 16) return authSecret;
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) return `zavod-crm:${dbUrl}`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET yoki DATABASE_URL .env faylida topilmadi');
  }
  return 'faqat-lokal-sinov-uchun-kalit';
}

let kalitKeshi: Promise<CryptoKey> | null = null;
function hmacKalit(): Promise<CryptoKey> {
  if (!kalitKeshi) {
    kalitKeshi = crypto.subtle.importKey(
      'raw',
      kodlovchi.encode(maxfiyMatn()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  }
  return kalitKeshi;
}

async function imzolash(matn: string): Promise<string> {
  const imzo = await crypto.subtle.sign('HMAC', await hmacKalit(), kodlovchi.encode(matn));
  return base64url(new Uint8Array(imzo));
}

// Ikki matnni vaqt bo'yicha bir xil tezlikda solishtirish (taxmin qilishga qarshi)
function teng(a: string, b: string) {
  if (a.length !== b.length) return false;
  let farq = 0;
  for (let i = 0; i < a.length; i++) farq |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return farq === 0;
}

// Yangi sessiya tokenini yaratish: "<ma'lumot>.<imzo>"
export async function sessiyaYaratish(rol: Rol): Promise<string> {
  const malumot = base64url(
    kodlovchi.encode(JSON.stringify({ rol, exp: Date.now() + SESSIYA_MUDDATI_SONIYA * 1000 }))
  );
  return `${malumot}.${await imzolash(malumot)}`;
}

// Tokenni tekshirish. To'g'ri bo'lsa rolni, aks holda null qaytaradi.
export async function sessiyaniTekshirish(token?: string | null): Promise<Rol | null> {
  if (!token) return null;
  const [malumot, imzo] = token.split('.');
  if (!malumot || !imzo) return null;

  try {
    if (!teng(await imzolash(malumot), imzo)) return null;
    const { rol, exp } = JSON.parse(base64urlDekod(malumot));
    if (typeof exp !== 'number' || exp < Date.now()) return null;
    return ROLLAR.includes(rol) ? rol : null;
  } catch {
    return null;
  }
}

// So'rovdagi cookie'dan rolni aniqlash (API route'lar uchun)
export function sorovRoli(req: { cookies: { get(nom: string): { value: string } | undefined } }) {
  return sessiyaniTekshirish(req.cookies.get(SESSIYA_COOKIE)?.value);
}
