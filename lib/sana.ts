// Sana va oyni har doim Toshkent vaqti bo'yicha olish.
// (new Date().toISOString() UTC beradi: Toshkentda 00:00–05:00 orasida kechagi sana chiqib qoladi)

const VAQT_ZONASI = 'Asia/Tashkent';

function qismlar(sana: Date) {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: VAQT_ZONASI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(sana);
  const ol = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return { yil: ol('year'), oy: ol('month'), kun: ol('day') };
}

// "2026-11-19"
export function toshkentSana(sana: Date = new Date()): string {
  const { yil, oy, kun } = qismlar(sana);
  return `${yil}-${oy}-${kun}`;
}

// "2026-11"
export function toshkentOy(sana: Date = new Date()): string {
  return toshkentSana(sana).slice(0, 7);
}

// "2026-01" -> "2025-12"
export function oldingiOy(oy: string): string {
  const [y, m] = oy.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

// "2026-11-19" -> "2026-11-18" (kun qo'shish/ayirish, vaqt zonasi xatosisiz)
export function sanagaKunQoshish(sana: string, kunlar: number): string {
  const [y, m, d] = sana.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + kunlar));
  return t.toISOString().slice(0, 10);
}
