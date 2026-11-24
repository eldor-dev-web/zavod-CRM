import { useState, useEffect, useRef, useCallback } from 'react';
import { birXilSmena, hozirgiSmena, keyingiSmena, oldingiSmena, smenaQisqa, tahrirlashMumkinmi, tungimi, type SmenaNuqtasi } from '@/lib/smena';
import { hisobotIdsi, navbatdami, smenaIdsi, smenaMahalliyKaliti, yuborishYokiNavbat } from '@/lib/sinxron';
import { NUQSON_TURLARI } from '@/lib/arxiv';
import { moshinaNomi, moshinaRaqami } from '@/lib/moshina';

const JORIY_MAHALLIY = '_zavod_joriy'; // internet bo'lmaganda: shu qurilmadagi oxirgi ma'lum joriy smena (sinxronlanmaydi)
const JORIY_TEKSHIRISH_MS = 20 * 1000; // boshqa qurilma smenani almashtirdimi — shuncha vaqtda tekshiriladi

export type RulonlarRejimi = 'joriy' | 'tugagan' | 'arxiv';

// --- Smena ma'lumotini solishtirish uchun bir xil ko'rinishga keltirish ---
// (bo'sh rulonlar olib tashlanadi, raqamlar bir xil yoziladi). Shu orqali "haqiqatan o'zgardimi" aniqlanadi.
function kgTozalash(kg: unknown): string {
  const t = String(kg ?? '').trim().replace(',', '.');
  if (t === '') return '';
  const n = parseFloat(t);
  return Number.isFinite(n) ? String(n) : t;
}

export function moshinaniTozalash(m: any) {
  const rulonlar = (Array.isArray(m?.rulonlar) ? m.rulonlar : [])
    .map((r: any) => ({
      kg: kgTozalash(r?.kg),
      vaqt: String(r?.vaqt ?? ''),
      nuqsonlar: Object.fromEntries(NUQSON_TURLARI.map((n) => [n, String(r?.nuqsonlar?.[n] ?? '').trim()]))
    }))
    .filter((r: any) => r.kg !== '' || Object.values(r.nuqsonlar).some((v) => v !== ''));
  return {
    raqam: String(m?.raqam ?? ''),
    talimoti: String(m?.talimoti ?? ''),
    brend: String(m?.brend ?? ''),
    ip: String(m?.ip ?? ''),
    lot: String(m?.lot ?? ''),
    operator: String(m?.operator ?? ''),
    operatorId: m?.operatorId ? String(m.operatorId) : '',
    rulonlar
  };
}

type MoshinaId = number | string;

function tartibliMoshinalar(moshinalar: { id: MoshinaId }[], maqotlar: Record<string, any>) {
  return moshinalar.map((m) => maqotlar[m.id]).filter(Boolean);
}

function suratOlish(kontrolchi: string, master: string, moshinalar: any[]) {
  return JSON.stringify({ kontrolchi: kontrolchi || '', master: master || '', moshinalar: moshinalar.map(moshinaniTozalash) });
}

const smenaKaliti = (sana: string, smena: string) => `${sana}_${smena}`;
const YANGILASH_MS = 15 * 1000; // boshqa kompyuterdagi o'zgarishlarni tekshirish oralig'i
const TINCH_MS = 8 * 1000; // foydalanuvchi shuncha vaqt hech narsa yozmasa, yangilash mumkin

export function useRulonlar() {
  const [moshinalar, setMoshinalar] = useState<{ id: MoshinaId }[]>([]);
  const [sana, setSana] = useState('');
  const [smenaTuri, setSmenaTuri] = useState('');
  const [kontrolchi, setKontrolchi] = useState('');
  const [master, setMaster] = useState('');
  const [moshinaMaqotlari, setMoshinaMaqotlari] = useState<Record<string, any>>({});

  // Hozir ekrandagi ma'lumot QAYSI smenaga tegishli. Smena almashgan zahoti eski smena
  // ma'lumoti yangi smena nomi bilan saqlanib ketmasligi uchun shu bilan tekshiramiz.
  const [yuklanganKalit, setYuklanganKalit] = useState('');
  const yuklanganKalitRef = useRef('');

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const suratRef = useRef(''); // bazaga oxirgi yuborilgan (yoki yuklangan) holat
  const oxirgiTahrirRef = useRef(0); // foydalanuvchi oxirgi marta qachon nimadir o'zgartirdi
  const yuklanganVaqtRef = useRef(0);
  const kutayotganYuborishRef = useRef<null | (() => Promise<unknown>)>(null);
  const oldingiSmenaRef = useRef<{ sana: string; smena: string } | null>(null);

  // JORIY SMENA: bazada saqlanadi, hamma qurilmalar shu smenada ochadi.
  // Master "tugagan smena"ni ochsa — bu faqat o'z ekranida, joriy smena va boshqa qurilmalar o'zgarmaydi.
  const [joriy, setJoriy] = useState<SmenaNuqtasi | null>(null);
  const joriyRef = useRef<SmenaNuqtasi | null>(null);
  const korinishRef = useRef<SmenaNuqtasi>({ sana: '', smena: '' });
  useEffect(() => {
    korinishRef.current = { sana, smena: smenaTuri };
  }, [sana, smenaTuri]);

  const joriyniQollash = useCallback((j: SmenaNuqtasi, korinishniHam: boolean) => {
    joriyRef.current = j;
    setJoriy(j);
    try {
      Storage.prototype.setItem.call(window.localStorage, JORIY_MAHALLIY, JSON.stringify(j));
    } catch {}
    if (korinishniHam) {
      setSana(j.sana);
      setSmenaTuri(j.smena);
    }
  }, []);

  const tahrirMumkin = (s: string, sm: string) => tahrirlashMumkinmi(s, sm, joriyRef.current);

  // 1. Ochilganda: joriy smenani bazadan olamiz (internet bo'lmasa — shu qurilmadagi oxirgi ma'lum)
  useEffect(() => {
    (async () => {
      let j: SmenaNuqtasi | null = null;
      try {
        const res = await fetch(`/api/smena/joriy?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) j = (await res.json())?.joriy || null;
      } catch {}
      if (!j) {
        try {
          j = JSON.parse(localStorage.getItem(JORIY_MAHALLIY) || 'null');
        } catch {}
      }
      if (!j) {
        const h = hozirgiSmena();
        j = { sana: h.sana, smena: h.smena };
      }
      joriyniQollash(j, true);
      setIsInitialized(true);
    })();
  }, [joriyniQollash]);

  // Boshqa qurilma (masalan, ikkinchi master) smenani almashtirsa — hamma qurilma yangi joriy smenaga o'tadi.
  // Tugagan smenani ko'rayotgan master o'sha joyda qoladi, faqat u smena arxivga o'tib ketgan bo'lsa joriyga qaytariladi.
  useEffect(() => {
    if (!isInitialized) return;
    const t = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`/api/smena/joriy?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const j: SmenaNuqtasi | null = (await res.json())?.joriy || null;
        const eski = joriyRef.current;
        if (!j || (eski && birXilSmena(j, eski))) return;
        const k = korinishRef.current;
        const joriydaEdi = !!eski && birXilSmena(k, eski);
        const endiTahrirlanmaydi = !tahrirlashMumkinmi(k.sana, k.smena, j);
        joriyniQollash(j, joriydaEdi || endiTahrirlanmaydi);
      } catch {}
    }, JORIY_TEKSHIRISH_MS);
    return () => clearInterval(t);
  }, [isInitialized, joriyniQollash]);

  // Ma'lumotni ekranga qo'yish (bir smenaga tegishli hammasi birga)
  const malumotniQollash = useCallback((d: any, kalit: string) => {
    const royxat: any[] = Array.isArray(d?.moshinalar) ? d.moshinalar : Object.values(d?.moshinalar || {});
    const idlar: { id: MoshinaId }[] = [];
    const maqotlar: Record<string, any> = {};
    const bosh = Date.now();
    royxat.forEach((m, i) => {
      const id: MoshinaId = m?.id ?? bosh + i;
      idlar.push({ id });
      maqotlar[id] = { ...m, id };
    });
    setKontrolchi(d?.kontrolchi || '');
    setMaster(d?.master || '');
    setMoshinalar(idlar);
    setMoshinaMaqotlari(maqotlar);
    setYuklanganKalit(kalit);
    yuklanganKalitRef.current = kalit;
    suratRef.current = suratOlish(d?.kontrolchi, d?.master, royxat);
  }, []);

  // 1.5. Smena almashganda:
  //  a) eski smenaning hali yuborilmagan oxirgi o'zgarishini DARHOL bazaga yuboramiz (yo'qolmasin);
  //  b) agar bu navbatdagi smenaga haqiqiy o'tish bo'lsa (DEN -> shu kunning NOCH, NOCH -> ertangi DEN),
  //     tugagan smenaning PDF hisobotini Telegram kanalga so'raymiz. Eski kunni ko'rish uchun sana
  //     o'zgartirilsa yoki orqaga qaytilsa, hech narsa yuborilmaydi. Bo'sh smenani server o'zi o'tkazib yuboradi.
  //  Bu effekt 2-effektdan OLDIN turishi shart (u kutayotganYuborishRef ni tozalaydi).
  useEffect(() => {
    if (!sana || !smenaTuri || !isInitialized) return;
    const eski = oldingiSmenaRef.current;
    oldingiSmenaRef.current = { sana, smena: smenaTuri };
    const kutayotgan = kutayotganYuborishRef.current;
    kutayotganYuborishRef.current = null;
    if (!eski) return;

    const kutilgan = oldingiSmena(sana, smenaTuri);
    const haqiqiyOtish = kutilgan.sana === eski.sana && smenaQisqa(kutilgan.smena) === smenaQisqa(eski.smena);

    (async () => {
      if (kutayotgan) await kutayotgan(); // avval ma'lumot bazaga yetib borsin
      if (haqiqiyOtish) await yuborishYokiNavbat(hisobotIdsi(eski.sana, eski.smena));
    })();
  }, [sana, smenaTuri, isInitialized]);

  // 2. Smena tanlanganda: avval shu kompyuterdagi nusxa, keyin bazadagi
  useEffect(() => {
    if (!sana || !smenaTuri || !isInitialized) return;
    let bekor = false;
    const kalit = smenaKaliti(sana, smenaTuri);
    const mahalliyKalit = smenaMahalliyKaliti(sana, smenaTuri);

    kutayotganYuborishRef.current = null;
    oxirgiTahrirRef.current = 0;
    yuklanganVaqtRef.current = Date.now();

    let mahalliy: any = null;
    try {
      mahalliy = JSON.parse(localStorage.getItem(mahalliyKalit) || 'null');
    } catch {}
    malumotniQollash(mahalliy || {}, kalit);
    setIsLoaded(!!mahalliy);

    (async () => {
      try {
        const res = await fetch(`/api/smena?sana=${sana}&smena=${encodeURIComponent(smenaTuri)}&t=${Date.now()}`, { cache: 'no-store' });
        if (bekor || !res.ok) return;
        const bazadagi = (await res.json())?.smena;
        if (bekor || !bazadagi) return;

        // Bazadagi nusxani faqat quyidagi hollarda qo'yamiz:
        // - bu smenaning yuborilmagan (navbatdagi) o'zgarishi yo'q
        // - foydalanuvchi yuklangandan beri hech narsa o'zgartirmagan
        if (navbatdami(smenaIdsi(sana, smenaTuri))) return;
        if (oxirgiTahrirRef.current > yuklanganVaqtRef.current) return;

        malumotniQollash(bazadagi, kalit);
        localStorage.setItem(
          mahalliyKalit,
          JSON.stringify({ sana, smena: smenaTuri, kontrolchi: bazadagi.kontrolchi, master: bazadagi.master, moshinalar: bazadagi.moshinalar })
        );
      } catch (e) {
        console.error('Smenani bazadan o\'qib bo\'lmadi:', e);
      } finally {
        if (!bekor) setIsLoaded(true);
      }
    })();

    return () => {
      bekor = true;
    };
  }, [sana, smenaTuri, isInitialized, malumotniQollash]);

  // 3. O'zgarish bo'lsa: darhol shu kompyuterga, 1.2 soniyadan keyin bazaga
  useEffect(() => {
    const kalit = smenaKaliti(sana, smenaTuri);
    if (!sana || !isLoaded || yuklanganKalit !== kalit) return;

    const royxat = tartibliMoshinalar(moshinalar, moshinaMaqotlari);
    const surat = suratOlish(kontrolchi, master, royxat);
    if (surat === suratRef.current) return; // haqiqatda hech narsa o'zgarmagan
    if (!tahrirMumkin(sana, smenaTuri)) return; // arxiv: hech kim o'zgartira olmaydi

    oxirgiTahrirRef.current = Date.now();
    const payload = {
      sana,
      smena: smenaTuri,
      kontrolchi,
      master,
      moshinalar: royxat.map((m) => ({ id: m.id, ...moshinaniTozalash(m) }))
    };
    localStorage.setItem(smenaMahalliyKaliti(sana, smenaTuri), JSON.stringify(payload));

    const yuborish = () => {
      kutayotganYuborishRef.current = null;
      suratRef.current = surat;
      return yuborishYokiNavbat(smenaIdsi(sana, smenaTuri));
    };
    kutayotganYuborishRef.current = yuborish;
    const taymer = setTimeout(yuborish, 1200);
    return () => clearTimeout(taymer);
  }, [sana, smenaTuri, kontrolchi, master, moshinalar, moshinaMaqotlari, isLoaded, yuklanganKalit]);

  // Sahifa yopilsa yoki boshqa oynaga o'tilsa, kutib turgan saqlashni darhol yuborish
  useEffect(() => {
    const yashirindi = () => {
      if (document.visibilityState === 'hidden') kutayotganYuborishRef.current?.();
    };
    document.addEventListener('visibilitychange', yashirindi);
    window.addEventListener('pagehide', yashirindi);
    return () => {
      document.removeEventListener('visibilitychange', yashirindi);
      window.removeEventListener('pagehide', yashirindi);
    };
  }, []);

  // 4. Bir smenada bir nechta kompyuter (master va kontrolchi) ishlasa: har 15 soniyada bazani tekshirib,
  // boshqa kompyuterda kiritilgan o'zgarishlarni ko'rsatamiz. Foydalanuvchi yozayotgan paytda tegmaymiz.
  useEffect(() => {
    if (!sana || !smenaTuri) return;
    const kalit = smenaKaliti(sana, smenaTuri);
    const tinchmi = () =>
      document.visibilityState === 'visible' &&
      !kutayotganYuborishRef.current &&
      Date.now() - oxirgiTahrirRef.current >= TINCH_MS &&
      yuklanganKalitRef.current === kalit &&
      !navbatdami(smenaIdsi(sana, smenaTuri));

    const taymer = setInterval(async () => {
      if (!tinchmi()) return;
      try {
        const res = await fetch(`/api/smena?sana=${sana}&smena=${encodeURIComponent(smenaTuri)}&t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const bazadagi = (await res.json())?.smena;
        if (!bazadagi || !tinchmi()) return;
        const royxat = Array.isArray(bazadagi.moshinalar) ? bazadagi.moshinalar : [];
        if (suratOlish(bazadagi.kontrolchi, bazadagi.master, royxat) === suratRef.current) return;
        malumotniQollash(bazadagi, kalit);
        localStorage.setItem(
          smenaMahalliyKaliti(sana, smenaTuri),
          JSON.stringify({ sana, smena: smenaTuri, kontrolchi: bazadagi.kontrolchi, master: bazadagi.master, moshinalar: royxat })
        );
      } catch {}
    }, YANGILASH_MS);
    return () => clearInterval(taymer);
  }, [sana, smenaTuri, malumotniQollash]);

  // 5. Braklar endi smenalardan serverda hisoblanadi (lib/braklarServer.ts) — bu yerda alohida jadvalga yozilmaydi

  const moshinaQoshish = () => {
    const newId = Date.now();
    setMoshinalar(prev => [...prev, { id: newId }]);
    setMoshinaMaqotlari(prev => ({
      ...prev,
      [newId]: { id: newId, raqam: '', talimoti: '', ip: '', lot: '', brend: '', operator: '', operatorId: null, rulonlar: [] }
    }));
  };
  
  const jadvalniOchirish = (idToRemove: MoshinaId) => {
    // Tasdiqlash sahifada (yangi oyna) so'raladi
    setMoshinalar(prev => prev.filter(m => m.id !== idToRemove));
    setMoshinaMaqotlari(prev => { const yangi = { ...prev }; delete yangi[idToRemove]; return yangi; });
  };

  const handleMoshinaDataChange = (id: MoshinaId, data: any) => setMoshinaMaqotlari(prev => ({ ...prev, [id]: data }));

  const rejim: RulonlarRejimi = !joriy
    ? 'joriy'
    : birXilSmena({ sana, smena: smenaTuri }, joriy)
      ? 'joriy'
      : tahrirlashMumkinmi(sana, smenaTuri, joriy)
        ? 'tugagan'
        : 'arxiv';

  // Joriy smenani almashtirish (serverda). Xato bo'lsa — matni qaytadi.
  const joriyniAlmashtirish = async (maqsad: SmenaNuqtasi): Promise<string | null> => {
    try {
      const res = await fetch('/api/smena/joriy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maqsad),
        cache: 'no-store'
      });
      const d = await res.json().catch(() => ({}));
      if (d?.joriy) joriyniQollash(d.joriy, true);
      if (res.ok) return null;
      return d?.xato || 'Smenani almashtirib bo\'lmadi';
    } catch {
      return 'Internet yo\'q — smenani almashtirib bo\'lmadi. Ulanish tiklangach qayta bosing.';
    }
  };

  // Aqlli smena tugmalari (faqat joriy smenada): DEN -> shu kunning NOCH, NOCH -> ertangi DEN
  const smenaTanlash = async (qiymat: string): Promise<string | null> => {
    const j = joriyRef.current;
    if (!j || rejim !== 'joriy' || tungimi(qiymat) === tungimi(j.smena)) return null;
    return joriyniAlmashtirish(keyingiSmena(j.sana, j.smena));
  };

  // Eslatmadagi "O'tish": aniq smenaga (navbatdagi yoki dam olishdan keyin — hozirgi)
  const smenagaOtish = (maqsad: SmenaNuqtasi) => joriyniAlmashtirish(maqsad);

  // Bir qadam orqaga: faqat tugagan smena (faqat shu ekranda)
  const tugaganniOchish = () => {
    const j = joriyRef.current;
    if (!j) return;
    const o = oldingiSmena(j.sana, j.smena);
    setSana(o.sana);
    setSmenaTuri(o.smena);
  };

  const joriygaQaytish = () => {
    const j = joriyRef.current;
    if (!j) return;
    setSana(j.sana);
    setSmenaTuri(j.smena);
  };

  // OLDINGI SMENADAN MOSHINALARNI KO'CHIRISH
  // Raqam, talimoti, brend, IP va lot ko'chiriladi. Operator bo'sh qoladi, rulonlar yangidan boshlanadi.
  // Bu smenada allaqachon bor moshina raqamlari qayta qo'shilmaydi.
  const oldingiSmenadanKochirish = async (): Promise<{ qoshildi: number; xato?: string }> => {
    const oldingi = oldingiSmena(sana, smenaTuri);
    let manbaMoshinalar: any[] = [];

    try {
      const res = await fetch(`/api/smena?sana=${oldingi.sana}&smena=${encodeURIComponent(oldingi.smena)}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) manbaMoshinalar = (await res.json())?.smena?.moshinalar || [];
    } catch {}

    // Baza ulanmagan bo'lsa yoki u yerda bo'lmasa, shu kompyuterdagi nusxadan
    if (manbaMoshinalar.length === 0) {
      try {
        const mahalliy = JSON.parse(localStorage.getItem(smenaMahalliyKaliti(oldingi.sana, oldingi.smena)) || 'null');
        const m = mahalliy?.moshinalar;
        manbaMoshinalar = Array.isArray(m) ? m : Object.values(m || {});
      } catch {}
    }

    if (manbaMoshinalar.length === 0) {
      return { qoshildi: 0, xato: `Oldingi smenada (${oldingi.sana.split('-').reverse().join('.')}, ${oldingi.smena.split(' ')[0]}) moshina topilmadi` };
    }

    // Raqam bo'yicha solishtiramiz: "12", "MK-12", "mk12" — bitta moshina
    const borRaqamlar = new Set(Object.values(moshinaMaqotlari).map((m: any) => moshinaRaqami(m.raqam)).filter(Boolean));
    const boshId = Date.now();
    const yangilar = manbaMoshinalar
      .filter((m: any) => {
        const n = moshinaRaqami(m.raqam);
        return !n || !borRaqamlar.has(n);
      })
      .map((m: any, i: number) => ({
        id: boshId + i,
        raqam: moshinaRaqami(m.raqam) ? moshinaNomi(moshinaRaqami(m.raqam)!) : '',
        talimoti: m.talimoti || '',
        brend: m.brend || '',
        ip: m.ip || '',
        lot: m.lot || '',
        operator: '',
        operatorId: null,
        rulonlar: []
      }));

    if (yangilar.length === 0) return { qoshildi: 0, xato: 'Oldingi smenadagi barcha moshinalar bu smenada allaqachon bor' };

    setMoshinalar((prev) => [...prev, ...yangilar.map((m) => ({ id: m.id }))]);
    setMoshinaMaqotlari((prev) => {
      const yangi = { ...prev };
      yangilar.forEach((m) => (yangi[m.id] = m));
      return yangi;
    });
    return { qoshildi: yangilar.length };
  };

  return {
    moshinalar, sana, setSana, smenaTuri, setSmenaTuri, kontrolchi, setKontrolchi, master, setMaster,
    moshinaMaqotlari, moshinaQoshish, jadvalniOchirish, handleMoshinaDataChange, oldingiSmenadanKochirish,
    joriy, rejim, smenaTanlash, smenagaOtish, tugaganniOchish, joriygaQaytish,
    isLoaded 
  };
}