// Klasslarni birlashtirish (bo'sh/false qiymatlar tashlab yuboriladi)
export const cn = (...k: (string | false | null | undefined)[]) => k.filter(Boolean).join(' ');
