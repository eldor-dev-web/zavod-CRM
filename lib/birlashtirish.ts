// ============================================================
// IKKI QURILMA O'ZGARISHLARINI BIRLASHTIRISH (3 tomonlama)
//   asos     — ikkala qurilma ham boshlagan oxirgi umumiy nusxa
//   meniki   — shu qurilmadagi nusxa
//   ularniki — bazadagi (boshqa qurilma saqlagan) nusxa
// Qoida: kim o'zgartirgan bo'lsa, o'shaning o'zgarishi olinadi; ikkalasi ham bitta joyni o'zgartirsa — meniki.
// Faqat 2 ta holat ogohlantiriladi (pul/xodim yo'qolmasligi uchun): avans qatori va xodim.
// ============================================================

export type Ziddiyat = { tur: 'avans' | 'xodim'; kalit: string; matn: string; tafsilot: string[] };
export type BirlashNatija = { qiymat: string; ziddiyatlar: Ziddiyat[] };

const obyektmi = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

// Kalitlar tartibidan qat'i nazar bir xil matn (taqqoslash uchun)
function barqaror(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(barqaror).join(',')}]`;
  if (obyektmi(v)) {
    return `{${Object.keys(v)
      .filter((k) => v[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${barqaror(v[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v ?? null);
}
const teng = (a: unknown, b: unknown) => barqaror(a) === barqaror(b);

const idliRoyxatmi = (v: unknown): v is Record<string, unknown>[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => obyektmi(x) && x.id !== undefined && x.id !== null);

type Kontekst = { kalit: string; ziddiyatlar: Ziddiyat[]; xodimlar: boolean };

// Umumiy 3 tomonlama birlashtirish (obyektlar maydonma-maydon, id li ro'yxatlar elementma-element)
function uch(asos: unknown, men: unknown, ular: unknown, ktx: Kontekst): unknown {
  if (teng(men, ular)) return men;
  if (teng(men, asos)) return ular;
  if (teng(ular, asos)) return men;

  if (obyektmi(men) && obyektmi(ular)) {
    const a = obyektmi(asos) ? asos : {};
    const natija: Record<string, unknown> = {};
    const kalitlar = Array.from(new Set([...Object.keys(men), ...Object.keys(ular)]));
    kalitlar.forEach((k) => {
      const r = uch(a[k], men[k], ular[k], { ...ktx, xodimlar: false });
      if (r !== undefined) natija[k] = r;
    });
    return natija;
  }

  if ((idliRoyxatmi(men) || idliRoyxatmi(ular)) && Array.isArray(men) && Array.isArray(ular)) {
    return idlarBilan(Array.isArray(asos) ? asos : [], men, ular, ktx);
  }

  return men;
}

function idlarBilan(asos: unknown[], men: unknown[], ular: unknown[], ktx: Kontekst): unknown[] {
  const xarita = (r: unknown[]) => {
    const m = new Map<string, Record<string, unknown>>();
    r.forEach((x) => obyektmi(x) && x.id !== undefined && m.set(String(x.id), x));
    return m;
  };
  const A = xarita(asos);
  const M = xarita(men);
  const U = xarita(ular);
  const tartib = [...M.keys(), ...Array.from(U.keys()).filter((id) => !M.has(id))];
  const natija: unknown[] = [];

  tartib.forEach((id) => {
    const a = A.get(id);
    const m = M.get(id);
    const u = U.get(id);
    if (m && u) {
      natija.push(uch(a, m, u, { ...ktx, xodimlar: false }));
      return;
    }
    const bor = (m || u)!;
    if (!a) {
      natija.push(bor); // yangi qo'shilgan
      return;
    }
    if (teng(bor, a)) return; // boshqa qurilmada o'chirilgan, bu yerda o'zgarmagan — o'chiriladi
    // Bir qurilmada o'chirilgan, boshqasida o'zgartirilgan — yo'qotmaymiz
    natija.push(bor);
    if (ktx.xodimlar) {
      const ism = String(bor.ism ?? '').trim() || 'Xodim';
      ktx.ziddiyatlar.push({
        tur: 'xodim',
        kalit: ktx.kalit,
        matn: `"${ism}" bir qurilmada o'chirilgan, boshqasida o'zgartirilgan — ro'yxatda saqlab qolindi`,
        tafsilot: [ism]
      });
    }
  });

  // Elementlari id siz qolgan bo'lsa (kam uchraydi) — meniki
  men.forEach((x) => {
    if (!(obyektmi(x) && x.id !== undefined)) natija.push(x);
  });
  return natija;
}

// --- AVANS DAFTARI: qatorma-qator ---
const qatorBoshi = (q: string) => q.split(' — ')[0].trim(); // "[03.11] Eldor — 300,000 — izoh" -> "[03.11] Eldor"

function sanoq(qatorlar: string[]) {
  const m = new Map<string, number>();
  qatorlar.forEach((q) => m.set(q, (m.get(q) || 0) + 1));
  return m;
}

function matnUch(asos: string, men: string, ular: string, kalit: string, ziddiyatlar: Ziddiyat[]): string {
  const B = asos ? asos.split('\n') : [];
  const M = men.split('\n');
  const U = ular.split('\n');
  const cB = sanoq(B);
  const cM = sanoq(M);
  const cU = sanoq(U);

  const kerak = new Map<string, number>();
  new Set([...cB.keys(), ...cM.keys(), ...cU.keys()]).forEach((q) => {
    const b = cB.get(q) || 0;
    const dM = (cM.get(q) || 0) - b;
    const dU = (cU.get(q) || 0) - b;
    // Ikkalasi ham bir xil qatorni qo'shgan bo'lsa — bitta (ikki marta hisoblanmasin)
    kerak.set(q, dM > 0 && dU > 0 ? b + Math.max(dM, dU) : Math.max(0, b + dM + dU));
  });

  const natija: string[] = [];
  const qoldi = new Map(kerak);
  const ol = (q: string) => {
    const n = qoldi.get(q) || 0;
    if (n > 0) {
      natija.push(q);
      qoldi.set(q, n - 1);
    }
  };
  M.forEach(ol);
  U.forEach(ol); // boshqa qurilmada qo'shilgan qatorlar oxiriga

  // Bitta qator ikkala qurilmada turlicha tuzatilganmi?
  const qoshilganM = M.filter((q) => (cM.get(q) || 0) > (cB.get(q) || 0) && !(cU.get(q) || 0));
  const qoshilganU = U.filter((q) => (cU.get(q) || 0) > (cB.get(q) || 0) && !(cM.get(q) || 0));
  B.forEach((eski) => {
    if (!eski.trim() || (cM.get(eski) || 0) > 0 || (cU.get(eski) || 0) > 0) return;
    const bosh = qatorBoshi(eski);
    const m = qoshilganM.find((q) => qatorBoshi(q) === bosh);
    const u = qoshilganU.find((q) => qatorBoshi(q) === bosh);
    if (m && u && m !== u && !ziddiyatlar.some((z) => z.tafsilot.includes(m))) {
      ziddiyatlar.push({
        tur: 'avans',
        kalit,
        matn: 'Avans qatori ikki qurilmada turlicha o\'zgartirilgan — ikkalasi ham qoldirildi, keraksizini o\'chiring',
        tafsilot: [m.trim(), u.trim()]
      });
    }
  });

  // Oxiridagi ortiqcha bo'sh qatorlar
  while (natija.length > 1 && natija[natija.length - 1].trim() === '' && natija[natija.length - 2].trim() === '') natija.pop();
  return natija.join('\n');
}

// --- Hisoblagich tarixi: yozuvlar faqat qo'shiladi ---
function tarixBirlashtir(men: unknown, ular: unknown): unknown {
  const m = obyektmi(men) ? men : {};
  const u = obyektmi(ular) ? ular : {};
  const natija: Record<string, unknown[]> = {};
  new Set([...Object.keys(m), ...Object.keys(u)]).forEach((n) => {
    const hammasi = [...(Array.isArray(m[n]) ? (m[n] as unknown[]) : []), ...(Array.isArray(u[n]) ? (u[n] as unknown[]) : [])];
    const korilgan = new Set<string>();
    natija[n] = hammasi
      .filter((y) => {
        const k = barqaror(y);
        if (korilgan.has(k)) return false;
        korilgan.add(k);
        return true;
      })
      .sort((a, b) => String((a as any)?.vaqt ?? '').localeCompare(String((b as any)?.vaqt ?? '')));
  });
  return natija;
}

function ochish(matn: string | null): { ok: boolean; v: unknown } {
  if (matn === null) return { ok: true, v: undefined };
  try {
    return { ok: true, v: JSON.parse(matn) };
  } catch {
    return { ok: false, v: undefined };
  }
}

export function birlashtir(kalit: string, asos: string | null, meniki: string, ularniki: string): BirlashNatija {
  const ziddiyatlar: Ziddiyat[] = [];
  if (meniki === ularniki) return { qiymat: meniki, ziddiyatlar };

  // Avans daftari — oddiy matn
  if (kalit.startsWith('zavod_eslatmalar_')) {
    return { qiymat: matnUch(asos ?? '', meniki, ularniki, kalit, ziddiyatlar), ziddiyatlar };
  }

  const a = ochish(asos);
  const m = ochish(meniki);
  const u = ochish(ularniki);
  if (!m.ok || !u.ok) return { qiymat: meniki, ziddiyatlar };

  if (kalit === 'zavod_moshina_hisoblagich') {
    return { qiymat: JSON.stringify(tarixBirlashtir(m.v, u.v)), ziddiyatlar };
  }

  const natija = uch(a.ok ? a.v : undefined, m.v, u.v, { kalit, ziddiyatlar, xodimlar: kalit.startsWith('zavod_ishchilar_') });
  return { qiymat: JSON.stringify(natija), ziddiyatlar };
}
