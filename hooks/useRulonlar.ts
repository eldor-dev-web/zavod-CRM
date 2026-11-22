import { useState, useEffect, useRef, useCallback } from 'react';
import { faolIshchilar, KALIT } from '@/lib/hisob';
import { joriyRol, oyIshchilari } from '@/lib/mahalliyXotira';
import { sanagaKunQoshish, toshkentSana } from '@/lib/sana';
import { DEN, NOCH, oldingiSmena, smenaQisqa, smenaQulflanganmi } from '@/lib/smena';
import { hisobotIdsi, navbatdami, smenaIdsi, smenaMahalliyKaliti, yuborishYokiNavbat } from '@/lib/sinxron';
import { NUQSON_TURLARI } from '@/lib/arxiv';
import { moshinaNomi, moshinaRaqami } from '@/lib/moshina';

// Arxivga o'tgan smena: faqat admin o'zgartira oladi
const faqatKorish = (sana: string) => smenaQulflanganmi(sana) && joriyRol() !== 'admin';

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

  // 1. Ochilganda: master oxirgi tanlagan sana va smena (smenani master o'zi almashtiradi)
  useEffect(() => {
    const saqlanganSana = localStorage.getItem('zavod_oxirgi_sana');
    const saqlanganSmena = localStorage.getItem('zavod_oxirgi_smena');
    // Faqat u sana arxivga o'tib ketgan bo'lsa, bugungi kun ochiladi
    setSana(saqlanganSana && !smenaQulflanganmi(saqlanganSana) ? saqlanganSana : toshkentSana());
    setSmenaTuri(saqlanganSmena || DEN);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (sana) localStorage.setItem('zavod_oxirgi_sana', sana);
  }, [sana]);

  useEffect(() => {
    if (smenaTuri) localStorage.setItem('zavod_oxirgi_smena', smenaTuri);
  }, [smenaTuri]);

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
    if (faqatKorish(sana)) return;

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

  // 5. Rulonlardagi nuqsonlardan operatorlar brakini Braklar jadvaliga avtomatik yozish
  useEffect(() => {
    if (!sana || !isInitialized || faqatKorish(sana)) return;
    if (yuklanganKalit !== smenaKaliti(sana, smenaTuri)) return; // boshqa smenaning ma'lumoti hali ekranda
    const joriyYilOy = sana.slice(0, 7);
    const kun = Number(sana.split('-')[2]);
    const ishchilarBazasi = faolIshchilar(oyIshchilari(joriyYilOy));

    const meyyorlar = JSON.parse(localStorage.getItem(KALIT.brakMeyyori) || '{"igna": 0, "lux": 0}');
    const ignaMeyyor = Number(meyyorlar.igna) || 0;
    const luxMeyyor = Number(meyyorlar.lux) || 0;

    const joriyBraklar: Record<string, { igna: number, lux: number }> = {};
    
    Object.values(moshinaMaqotlari).forEach((mData: any) => {
      let opId = mData.operatorId;
      if (!opId && mData.operator) {
        const topilganIshchi = ishchilarBazasi.find((x: any) => x.ism?.toLowerCase().trim() === String(mData.operator).toLowerCase().trim());
        if (topilganIshchi) opId = topilganIshchi.id;
      }
      
      if (opId && mData.rulonlar && Array.isArray(mData.rulonlar)) {
        let moshinaIgna = 0, moshinaLux = 0;
        
        mData.rulonlar.forEach((rulon: any) => {
          if (rulon.nuqsonlar) {
            const ignaKiritilgan = Number(rulon.nuqsonlar["Igna siniq"] || 0);
            const luxKiritilgan = Number(rulon.nuqsonlar["Lyc xato"] || 0);
            
            const haqiqiyIgna = ignaKiritilgan >= ignaMeyyor ? ignaKiritilgan : 0;
            const haqiqiyLux = luxKiritilgan >= luxMeyyor ? luxKiritilgan : 0;

            moshinaIgna += haqiqiyIgna;
            moshinaLux += haqiqiyLux;
          }
        });

        if (moshinaIgna > 0 || moshinaLux > 0) {
          const kalit = `${opId}_${kun}`;
          if (!joriyBraklar[kalit]) joriyBraklar[kalit] = { igna: 0, lux: 0 };
          joriyBraklar[kalit].igna += moshinaIgna;
          joriyBraklar[kalit].lux += moshinaLux;
        }
      }
    });

    const shadowKey = `zavod_brak_shadow_${sana}_${smenaTuri}`;
    const oldingiBraklar = JSON.parse(localStorage.getItem(shadowKey) || '{}');
    const brakXotiraNomi = KALIT.brakJadvali(joriyYilOy);
    const brakTable = JSON.parse(localStorage.getItem(brakXotiraNomi) || '{}');

    Object.keys(oldingiBraklar).forEach(kalit => {
      if (brakTable[kalit]) {
        brakTable[kalit].igna = Math.max(0, (Number(brakTable[kalit].igna) || 0) - (oldingiBraklar[kalit].igna || 0));
        brakTable[kalit].lux = Math.max(0, (Number(brakTable[kalit].lux) || 0) - (oldingiBraklar[kalit].lux || 0));
      }
    });

    Object.keys(joriyBraklar).forEach(kalit => {
      if (!brakTable[kalit]) brakTable[kalit] = { igna: '', lux: '' };
      brakTable[kalit].igna = (Number(brakTable[kalit].igna) || 0) + joriyBraklar[kalit].igna;
      brakTable[kalit].lux = (Number(brakTable[kalit].lux) || 0) + joriyBraklar[kalit].lux;
    });

    // Faqat haqiqatan o'zgargan bo'lsa yozamiz (bazaga ortiqcha so'rov ketmasin)
    const yangiJadval = JSON.stringify(brakTable);
    const yangiSoya = JSON.stringify(joriyBraklar);
    if (localStorage.getItem(brakXotiraNomi) !== yangiJadval) localStorage.setItem(brakXotiraNomi, yangiJadval);
    if (localStorage.getItem(shadowKey) !== yangiSoya) localStorage.setItem(shadowKey, yangiSoya);

    window.dispatchEvent(new Event('braklar_yangilandi'));
  }, [moshinaMaqotlari, sana, smenaTuri, isInitialized, yuklanganKalit]);

  const moshinaQoshish = () => {
    const newId = Date.now();
    setMoshinalar(prev => [...prev, { id: newId }]);
    setMoshinaMaqotlari(prev => ({
      ...prev,
      [newId]: { id: newId, raqam: '', talimoti: '', ip: '', lot: '', brend: '', operator: '', operatorId: null, rulonlar: [] }
    }));
  };
  
  const jadvalniOchirish = (idToRemove: MoshinaId) => {
    if (window.confirm("Ushbu moshina jadvalini o'chirib yubormoqchimisiz?")) {
      setMoshinalar(prev => prev.filter(m => m.id !== idToRemove));
      setMoshinaMaqotlari(prev => { const yangi = { ...prev }; delete yangi[idToRemove]; return yangi; });
    }
  };

  const handleMoshinaDataChange = (id: MoshinaId, data: any) => setMoshinaMaqotlari(prev => ({ ...prev, [id]: data }));

  // Keyingi smenaga o'tish: DEN -> shu kunning NOCH, NOCH -> ertangi DEN
  const yangiSmenagaOtish = () => {
    if (smenaTuri.includes('DEN')) {
      setSmenaTuri(NOCH);
    } else {
      setSana(sanagaKunQoshish(sana, 1));
      setSmenaTuri(DEN);
    }
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
    moshinaMaqotlari, moshinaQoshish, jadvalniOchirish, handleMoshinaDataChange, yangiSmenagaOtish, oldingiSmenadanKochirish,
    isLoaded 
  };
}