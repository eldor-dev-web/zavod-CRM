// Brauzer: braklarni serverdan olish; baza ulanmasa — shu qurilmadagi smena nusxalaridan xuddi shu qoida bilan
import { faolIshchilar, KALIT, oyMeyyori, son, type BrakJadvali, type BrakMeyyori, type SozlamaTarixi } from '@/lib/hisob';
import { oqish, oyIshchilari } from '@/lib/mahalliyXotira';
import { eskiKunlarniQoshish, smenalardanBraklar, type BrakSmenasi, type BraklarNatijasi } from '@/lib/braklar';

function mahalliyBraklar(oy: string): BraklarNatijasi {
  const smenalar: BrakSmenasi[] = [];
  const naqsh = new RegExp(`^zavod_smena_${oy}-\\d{2}_`);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !naqsh.test(k)) continue;
    try {
      const d = JSON.parse(localStorage.getItem(k) || '{}');
      const smena = d.smena ?? d.smenaTuri;
      const moshinalar = Array.isArray(d.moshinalar) ? d.moshinalar : Object.values(d.moshinalar || {});
      if (d.sana && smena) smenalar.push({ sana: d.sana, smena: String(smena), moshinalar });
    } catch {}
  }

  const eski = oqish<BrakJadvali>(KALIT.brakJadvali(oy), {});
  if (smenalar.length === 0) return { jadval: eski, topilmadi: [], manba: 'mahalliy' };

  const joriy = oqish<Partial<BrakMeyyori>>(KALIT.brakMeyyori, {});
  const meyyor = oyMeyyori(oy, { igna: son(joriy?.igna), lux: son(joriy?.lux) }, oqish<SozlamaTarixi>(KALIT.sozlamaTarixi, {}));
  const natija = smenalardanBraklar(smenalar, faolIshchilar(oyIshchilari(oy)), meyyor);
  const smenaKunlari = new Set(smenalar.map((s) => Number(String(s.sana).slice(8, 10))).filter(Boolean));
  return { jadval: eskiKunlarniQoshish(natija.jadval, eski, smenaKunlari), topilmadi: natija.topilmadi, manba: 'mahalliy' };
}

export async function braklarniOlish(oy: string): Promise<BraklarNatijasi> {
  try {
    const res = await fetch(`/api/braklar?oy=${oy}&t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      if (d && typeof d.jadval === 'object') return { jadval: d.jadval || {}, topilmadi: Array.isArray(d.topilmadi) ? d.topilmadi : [], manba: d.manba || 'smenalar' };
    }
  } catch {}
  return mahalliyBraklar(oy);
}
