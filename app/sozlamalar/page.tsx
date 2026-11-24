'use client';
import React, { useState, useEffect } from 'react';
import { KALIT, STANDART_BRAK_STAVKALARI, STANDART_LAVOZIMLAR, STANDART_OPERATOR_QOSHIMCHA, tarixniYangilash, type OySozlamasi } from '@/lib/hisob';
import { oqish } from '@/lib/mahalliyXotira';
import { oldingiOy, toshkentOy } from '@/lib/sana';
import { MOSHINA_KALIT, moshinalarSoni } from '@/lib/moshina';
import PinKodlar from '@/components/PinKodlar';
import { SahifaSarlavhasi, Oyna, Maydon, Tugma, Ikonka, xabarBer, tasdiqla } from '@/components/ui';

// Bo'lim: kichik sarlavha + guruh (qatorlar)
function Bolim({ sarlavha, izoh, children }: { sarlavha: string; izoh?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-sm font-semibold text-matn-2">{sarlavha}</h2>
      <div className="overflow-hidden rounded-karta border border-chiziq bg-sirt divide-y divide-chiziq">{children}</div>
      {izoh && <p className="mt-1.5 px-1 text-xs text-matn-3">{izoh}</p>}
    </section>
  );
}

// Qator: chapda nomi (+izoh), o'ngda boshqaruv
function Qator({ nomi, izoh, belgi, children }: { nomi: React.ReactNode; izoh?: string; belgi?: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-3 md:px-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-matn">
          {nomi}
          {belgi && <span className="ml-2 rounded-full bg-sirt-2 px-2 py-0.5 text-[11px] font-semibold text-matn-2 align-middle">{belgi}</span>}
        </p>
        {izoh && <p className="text-xs text-matn-3">{izoh}</p>}
      </div>
      {children}
    </div>
  );
}

// Raqam maydoni: "175 000" ko'rinishida, o'ngda birlik
function SonMaydon({
  qiymat,
  ozgartirish,
  birlik,
  kenglik = 'w-32',
  ...qolgan
}: { qiymat: number; ozgartirish: (n: number) => void; birlik?: string; kenglik?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className={`flex h-10 shrink-0 items-center gap-1 rounded-boshqaruv border border-chiziq-2 bg-sirt px-2.5 focus-within:border-asosiy focus-within:ring-2 focus-within:ring-asosiy/20 ${kenglik}`}>
      <input
        type="text"
        inputMode="numeric"
        value={qiymat ? qiymat.toLocaleString('ru-RU') : '0'}
        onChange={(e) => ozgartirish(Number(e.target.value.replace(/\D/g, '').slice(0, 9)) || 0)}
        className="w-full min-w-0 bg-transparent text-right text-base md:text-sm font-semibold text-matn tabular-nums outline-none"
        {...qolgan}
      />
      {birlik && <span className="shrink-0 text-xs text-matn-3">{birlik}</span>}
    </label>
  );
}

export default function SozlamalarSahifasi() {
  const [operatorQoshimcha, setOperatorQoshimcha] = useState<number>(STANDART_OPERATOR_QOSHIMCHA);
  const [lavozimlar, setLavozimlar] = useState<any[]>([]);
  const [yangiLavozimNomi, setYangiLavozimNomi] = useState('');
  const [yangiStavka, setYangiStavka] = useState('');
  const [lavozimOynasi, setLavozimOynasi] = useState(false);
  const [lavozimXato, setLavozimXato] = useState('');
  const [brakMeyyori, setBrakMeyyori] = useState({ igna: 0, lux: 0 });
  const [brakStavkalari, setBrakStavkalari] = useState(STANDART_BRAK_STAVKALARI);
  const [moshinaSoni, setMoshinaSoni] = useState('35');

  useEffect(() => {
    setMoshinaSoni(String(moshinalarSoni(localStorage.getItem(MOSHINA_KALIT.soni))));
    const saqlanganQoshimcha = localStorage.getItem('zavod_operator_qoshimcha');
    if (saqlanganQoshimcha !== null) setOperatorQoshimcha(Number(saqlanganQoshimcha));

    const saqlanganLavozimlar = localStorage.getItem('zavod_lavozimlar_bazasi');
    let boshlangichLavozimlar: any[] = STANDART_LAVOZIMLAR;

    if (saqlanganLavozimlar) {
      try {
        const parsed = JSON.parse(saqlanganLavozimlar);
        const hasOperator = parsed.some((l: any) => l.nomi.toLowerCase() === 'operator');
        if (!hasOperator) parsed.unshift({ id: 0, nomi: 'Operator', stavka: 175000 });
        boshlangichLavozimlar = parsed;
      } catch (e) {
        console.error(e);
      }
    }
    setLavozimlar(boshlangichLavozimlar);

    const saqlanganMeyyor = localStorage.getItem('zavod_brak_meyyori');
    if (saqlanganMeyyor) {
      try {
        setBrakMeyyori(JSON.parse(saqlanganMeyyor));
      } catch (e) {
        console.error(e);
      }
    }

    const saqlanganNarxlar = localStorage.getItem('zavod_brak_stavkalari');
    if (saqlanganNarxlar) {
      try {
        setBrakStavkalari(JSON.parse(saqlanganNarxlar));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Har bir o'zgarish shu oyning sozlamasi sifatida tarixga yoziladi.
  // Shunda o'tgan oylarning oyligi eski stavka/narx bilan hisoblanishda davom etadi.
  const tarixgaYozish = (ozgarish: Partial<OySozlamasi>) => {
    const eski: OySozlamasi = { lavozimlar, operatorQoshimcha, brakStavkalari, brakMeyyori };
    const oy = toshkentOy();
    const yangiTarix = tarixniYangilash(oqish(KALIT.sozlamaTarixi, {}), oy, oldingiOy(oy), eski, { ...eski, ...ozgarish });
    localStorage.setItem(KALIT.sozlamaTarixi, JSON.stringify(yangiTarix));
  };

  const handleOperatorQoshimchaChange = (val: number) => {
    setOperatorQoshimcha(val);
    localStorage.setItem('zavod_operator_qoshimcha', val.toString());
    tarixgaYozish({ operatorQoshimcha: val });
  };

  const lavozimniSaqlash = (yangiRoyxat: any[]) => {
    setLavozimlar(yangiRoyxat);
    localStorage.setItem('zavod_lavozimlar_bazasi', JSON.stringify(yangiRoyxat));
    tarixgaYozish({ lavozimlar: yangiRoyxat });
  };

  const handleOperatorStavkaChange = (yangiStavka: number) => {
    const yangi = lavozimlar.map((l) => (l.nomi.toLowerCase() === 'operator' ? { ...l, stavka: yangiStavka } : l));
    lavozimniSaqlash(yangi);
  };

  const lavozimOynasiniOchish = () => {
    setYangiLavozimNomi('');
    setYangiStavka('');
    setLavozimXato('');
    setLavozimOynasi(true);
  };

  const yangiLavozimQoshish = (e: React.FormEvent) => {
    e.preventDefault();
    const nomi = yangiLavozimNomi.trim();
    const stavka = Number(yangiStavka.replace(/\D/g, ''));
    if (!nomi) return setLavozimXato('Lavozim nomini yozing');
    if (!stavka) return setLavozimXato('Smena stavkasini yozing');
    if (nomi.toLowerCase() === 'operator') {
      xabarBer("'Operator' lavozimi tizimda bor — uni qayta qo'shib bo'lmaydi", 'xato');
      setYangiLavozimNomi('');
      return;
    }
    lavozimniSaqlash([...lavozimlar, { id: Date.now(), nomi, stavka }]);
    setLavozimOynasi(false);
  };

  const lavozimniOchirish = async (id: number, nomi: string) => {
    const ha = await tasdiqla({ sarlavha: `"${nomi}" lavozimini o'chirasizmi?`, tasdiqMatni: "O'chirish", xavfli: true });
    if (!ha) return;
    lavozimniSaqlash(lavozimlar.filter((l) => l.id !== id));
  };

  const meyyorniOzgartirish = (tur: string, qiymat: string) => {
    const num = Number(qiymat.replace(/\D/g, '')) || 0;
    const yangi = { ...brakMeyyori, [tur]: num };
    setBrakMeyyori(yangi);
    localStorage.setItem('zavod_brak_meyyori', JSON.stringify(yangi));
    tarixgaYozish({ brakMeyyori: yangi });
  };

  const narxniOzgartirish = (tur: string, qiymat: string) => {
    const num = Number(qiymat.replace(/\D/g, '')) || 0;
    const yangi = { ...brakStavkalari, [tur]: num };
    setBrakStavkalari(yangi);
    localStorage.setItem('zavod_brak_stavkalari', JSON.stringify(yangi));
    tarixgaYozish({ brakStavkalari: yangi });
  };

  const operatorLavozim = lavozimlar.find((l) => l.nomi.toLowerCase() === 'operator') || { id: 0, nomi: 'Operator', stavka: 175000 };
  const qolganLavozimlar = lavozimlar.filter((l) => l.nomi.toLowerCase() !== 'operator');

  return (
    <div className="mx-auto max-w-2xl">
      <SahifaSarlavhasi sarlavha="Sozlamalar" />

      <Bolim sarlavha="Ish haqi · smena uchun" izoh="Shu oydan amal qiladi">
        <Qator nomi="Operator" belgi="Tizim">
          <SonMaydon qiymat={Number(operatorLavozim.stavka) || 0} ozgartirish={handleOperatorStavkaChange} birlik="so'm" aria-label="Operator stavkasi" />
          <span className="w-8 shrink-0" />
        </Qator>
        <Qator nomi="Qo'shimcha moshina">
          <SonMaydon qiymat={operatorQoshimcha} ozgartirish={handleOperatorQoshimchaChange} birlik="so'm" aria-label="Qo'shimcha moshina puli" />
          <span className="w-8 shrink-0" />
        </Qator>
        {qolganLavozimlar.map((lavozim) => (
          <Qator key={lavozim.id} nomi={lavozim.nomi}>
            <SonMaydon
              qiymat={Number(lavozim.stavka) || 0}
              ozgartirish={(val) => lavozimniSaqlash(lavozimlar.map((l) => (l.id === lavozim.id ? { ...l, stavka: val } : l)))}
              birlik="so'm"
              aria-label={`${lavozim.nomi} stavkasi`}
            />
            <button
              type="button"
              onClick={() => lavozimniOchirish(lavozim.id, lavozim.nomi)}
              aria-label={`${lavozim.nomi} lavozimini o'chirish`}
              title="O'chirish"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-boshqaruv text-matn-3 transition-colors hover:bg-xato-och hover:text-xato"
            >
              <Ikonka nom="ochirish" className="w-4 h-4" />
            </button>
          </Qator>
        ))}
        <button
          type="button"
          onClick={lavozimOynasiniOchish}
          className="flex min-h-12 w-full items-center gap-2 px-3 md:px-4 text-[15px] font-medium text-asosiy transition-colors hover:bg-sirt-2"
        >
          <Ikonka nom="qoshish" className="w-4 h-4" />
          Lavozim qo&apos;shish
        </button>
      </Bolim>

      <Bolim sarlavha="Brak">
        <Qator nomi="Igna siniq" izoh="Jarima, 1 metr">
          <SonMaydon qiymat={Number(brakStavkalari.ignaSinigi) || 0} ozgartirish={(n) => narxniOzgartirish('ignaSinigi', String(n))} birlik="so'm" aria-label="Igna siniq jarimasi" />
        </Qator>
        <Qator nomi="Lux xato" izoh="Jarima, 1 metr">
          <SonMaydon qiymat={Number(brakStavkalari.luxXatosi) || 0} ozgartirish={(n) => narxniOzgartirish('luxXatosi', String(n))} birlik="so'm" aria-label="Lux xato jarimasi" />
        </Qator>
        <Qator nomi="Igna me'yori">
          <SonMaydon qiymat={Number(brakMeyyori.igna) || 0} ozgartirish={(n) => meyyorniOzgartirish('igna', String(n))} birlik="m" aria-label="Igna me'yori" />
        </Qator>
        <Qator nomi="Lux me'yori">
          <SonMaydon qiymat={Number(brakMeyyori.lux) || 0} ozgartirish={(n) => meyyorniOzgartirish('lux', String(n))} birlik="m" aria-label="Lux me'yori" />
        </Qator>
      </Bolim>

      <Bolim sarlavha="Ishlab chiqarish">
        <Qator nomi="Moshinalar soni" izoh={`MK-1 dan MK-${moshinalarSoni(moshinaSoni)} gacha`}>
          <input
            type="text"
            inputMode="numeric"
            value={moshinaSoni}
            aria-label="Moshinalar soni"
            onChange={(e) => setMoshinaSoni(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onBlur={() => {
              const n = moshinalarSoni(moshinaSoni);
              setMoshinaSoni(String(n));
              localStorage.setItem(MOSHINA_KALIT.soni, String(n));
            }}
            className="h-10 w-20 shrink-0 rounded-boshqaruv border border-chiziq-2 bg-sirt text-center text-base md:text-sm font-semibold text-matn tabular-nums outline-none focus:border-asosiy focus:ring-2 focus:ring-asosiy/20"
          />
        </Qator>
      </Bolim>

      <PinKodlar />

      {/* LAVOZIM QO'SHISH OYNASI */}
      <Oyna
        ochiq={lavozimOynasi}
        yopish={() => setLavozimOynasi(false)}
        sarlavha="Yangi lavozim"
        kenglik="max-w-sm"
        amallar={
          <>
            <Tugma onClick={() => setLavozimOynasi(false)}>Bekor qilish</Tugma>
            <Tugma type="submit" form="lavozim-forma" tur="asosiy">
              Qo&apos;shish
            </Tugma>
          </>
        }
      >
        <form id="lavozim-forma" onSubmit={yangiLavozimQoshish} className="space-y-4">
          <Maydon
            yorliq="Lavozim nomi"
            autoFocus
            value={yangiLavozimNomi}
            onChange={(e) => {
              setYangiLavozimNomi(e.target.value);
              setLavozimXato('');
            }}
            placeholder="Masalan: Kontrolchi"
          />
          <Maydon
            yorliq="Smena stavkasi, so'm"
            inputMode="numeric"
            value={yangiStavka}
            onChange={(e) => {
              const r = e.target.value.replace(/\D/g, '').slice(0, 9);
              setYangiStavka(r ? Number(r).toLocaleString('ru-RU') : '');
              setLavozimXato('');
            }}
            placeholder="160 000"
            xato={lavozimXato || undefined}
          />
        </form>
      </Oyna>
    </div>
  );
}
