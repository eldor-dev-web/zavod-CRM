// Butun ilova uchun xabar (toast) va tasdiqlash oynasi.
// Brauzerning alert()/confirm() oynalari o'rniga ishlatiladi:
//   xabarBer('Saqlandi');                       // yashil
//   xabarBer('Saqlab bo\'lmadi', 'xato');        // qizil
//   if (await tasdiqla({ sarlavha: 'Moshinani o\'chirasizmi?', xavfli: true })) { ... }

export type XabarTuri = 'yaxshi' | 'xato' | 'malumot';
export type TasdiqSorovi = {
  sarlavha: string;
  matn?: string;
  tasdiqMatni?: string;
  bekorMatni?: string;
  xavfli?: boolean;
};

export function xabarBer(matn: string, tur: XabarTuri = 'yaxshi') {
  window.dispatchEvent(new CustomEvent('zavod_xabar', { detail: { matn, tur } }));
}

export function tasdiqla(sorov: TasdiqSorovi): Promise<boolean> {
  return new Promise((javob) => {
    window.dispatchEvent(new CustomEvent('zavod_tasdiq', { detail: { ...sorov, javob } }));
  });
}
