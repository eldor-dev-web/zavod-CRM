'use client';
import React, { useEffect, useMemo, useState } from 'react';
import EslatmaDaftar from '@/components/EslatmaDaftar';
import { avanslarniOchish, faolIshchilar, KALIT, pulFormat, type AvansYozuvi, type Ishchi } from '@/lib/hisob';
import { oyIshchilari } from '@/lib/mahalliyXotira';
import { toshkentOy, toshkentSana } from '@/lib/sana';

const OY_NOMLARI = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const oyMatni = (oy: string) => (oy ? `${OY_NOMLARI[Number(oy.slice(5, 7)) - 1]} ${oy.slice(0, 4)}` : '');
const sanaQisqa = (s: string) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}` : '');

function oyQoshish(oy: string, n: number) {
  const [y, m] = oy.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function oyKunlari(oy: string) {
  const [y, m] = oy.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const yangiId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const BOSH_FORMA = { sana: '', ishchiId: '', summa: '', izoh: '' };

export default function AvanslarSahifasi() {
  const [oy, setOy] = useState('');
  const [bugun, setBugun] = useState('');
  const [ishchilar, setIshchilar] = useState<Ishchi[]>([]);
  const [yozuvlar, setYozuvlar] = useState<AvansYozuvi[]>([]);

  const [forma, setForma] = useState(BOSH_FORMA);
  const [tahrirId, setTahrirId] = useState<string | null>(null);
  const [xato, setXato] = useState('');
  const [ochirishId, setOchirishId] = useState<string | null>(null);
  const [filtrId, setFiltrId] = useState<string>('');

  // Sana faqat brauzerda olinadi (cacheComponents)
  useEffect(() => {
    setBugun(toshkentSana());
    setOy(toshkentOy());
  }, []);

  const standartSana = (o: string) => (bugun.startsWith(o) ? bugun : `${o}-01`);

  useEffect(() => {
    if (!oy) return;
    setIshchilar(faolIshchilar(oyIshchilari(oy)));
    setYozuvlar(avanslarniOchish(localStorage.getItem(KALIT.avanslar(oy))));
    setForma({ ...BOSH_FORMA, sana: standartSana(oy) });
    setTahrirId(null);
    setFiltrId('');
    setXato('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oy]);

  const saqlash = (yangi: AvansYozuvi[]) => {
    const tartiblangan = [...yangi].sort((a, b) => a.sana.localeCompare(b.sana));
    setYozuvlar(tartiblangan);
    localStorage.setItem(KALIT.avanslar(oy), JSON.stringify(tartiblangan));
  };

  const yuborish = (e: React.FormEvent) => {
    e.preventDefault();
    const summa = Number(forma.summa.replace(/\D/g, ''));
    const ishchi = ishchilar.find((i) => String(i.id) === forma.ishchiId);
    const eskiYozuv = tahrirId ? yozuvlar.find((y) => y.id === tahrirId) : undefined;

    if (!forma.ishchiId || (!ishchi && !eskiYozuv)) return setXato('Ishchini tanlang');
    if (!forma.sana.startsWith(oy)) return setXato(`Sana ${oyMatni(oy)} oyi ichida bo'lishi kerak`);
    if (!summa || summa < 1000) return setXato("Summani kiriting (kamida 1 000 so'm)");

    const yozuv: AvansYozuvi = {
      id: tahrirId || yangiId(),
      sana: forma.sana,
      ishchiId: ishchi ? ishchi.id : eskiYozuv!.ishchiId,
      ism: ishchi ? String(ishchi.ism).trim() : eskiYozuv!.ism,
      summa,
      izoh: forma.izoh.trim()
    };

    saqlash(tahrirId ? yozuvlar.map((y) => (y.id === tahrirId ? yozuv : y)) : [...yozuvlar, yozuv]);
    setForma({ ...BOSH_FORMA, sana: forma.sana, ishchiId: tahrirId ? '' : forma.ishchiId });
    setTahrirId(null);
    setXato('');
  };

  const tahrirlash = (y: AvansYozuvi) => {
    setTahrirId(y.id);
    setForma({ sana: y.sana, ishchiId: String(y.ishchiId), summa: pulFormat(y.summa), izoh: y.izoh || '' });
    setXato('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ochirish = (id: string) => {
    if (ochirishId !== id) {
      setOchirishId(id);
      setTimeout(() => setOchirishId((joriy) => (joriy === id ? null : joriy)), 3000);
      return;
    }
    saqlash(yozuvlar.filter((y) => y.id !== id));
    setOchirishId(null);
    if (tahrirId === id) {
      setTahrirId(null);
      setForma({ ...BOSH_FORMA, sana: standartSana(oy) });
    }
  };

  const oyJami = useMemo(() => yozuvlar.reduce((j, y) => j + y.summa, 0), [yozuvlar]);

  const ishchiJamilari = useMemo(() => {
    const xarita = new Map<string, { id: string; ism: string; jami: number; soni: number }>();
    yozuvlar.forEach((y) => {
      const k = String(y.ishchiId);
      const e = xarita.get(k) || { id: k, ism: y.ism, jami: 0, soni: 0 };
      e.jami += y.summa;
      e.soni += 1;
      xarita.set(k, e);
    });
    return Array.from(xarita.values()).sort((a, b) => b.jami - a.jami);
  }, [yozuvlar]);

  const korinadigan = useMemo(
    () => [...yozuvlar].filter((y) => !filtrId || String(y.ishchiId) === filtrId).reverse(),
    [yozuvlar, filtrId]
  );

  if (!oy) return null;

  const maydon =
    'w-full h-11 px-3 rounded-xl bg-white border border-slate-200 text-base sm:text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition';

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* SARLAVHA + OY TANLASH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Avanslar</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Berilgan avanslar oylikdan avtomatik ayriladi va botda ko'rinadi</p>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white border border-slate-200 rounded-xl p-1">
          <button type="button" onClick={() => setOy(oyQoshish(oy, -1))} className="w-9 h-9 rounded-lg hover:bg-slate-100 font-black text-slate-600" aria-label="Oldingi oy">
            ‹
          </button>
          <span className="min-w-[120px] text-center text-sm font-black text-slate-800">{oyMatni(oy)}</span>
          <button type="button" onClick={() => setOy(oyQoshish(oy, 1))} className="w-9 h-9 rounded-lg hover:bg-slate-100 font-black text-slate-600" aria-label="Keyingi oy">
            ›
          </button>
        </div>
      </div>

      {/* QISQA NATIJALAR */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Oy jami</p>
          <p className="text-base sm:text-2xl font-black text-rose-600 mt-0.5">{pulFormat(oyJami)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Yozuvlar</p>
          <p className="text-base sm:text-2xl font-black text-slate-800 mt-0.5">{yozuvlar.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Olganlar</p>
          <p className="text-base sm:text-2xl font-black text-slate-800 mt-0.5">{ishchiJamilari.length}</p>
        </div>
      </div>

      {/* QO'SHISH / TAHRIRLASH FORMASI */}
      <form onSubmit={yuborish} className={`bg-white rounded-2xl border p-3 sm:p-4 space-y-3 ${tahrirId ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'}`}>
        <p className="text-sm font-black text-slate-800">{tahrirId ? '✏️ Avansni tahrirlash' : "+ Yangi avans"}</p>
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-2">
          <input
            type="date"
            value={forma.sana}
            min={`${oy}-01`}
            max={`${oy}-${String(oyKunlari(oy)).padStart(2, '0')}`}
            onChange={(e) => setForma({ ...forma, sana: e.target.value })}
            className={`${maydon} col-span-1 sm:col-span-3`}
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Summa"
            value={forma.summa}
            onChange={(e) => {
              const raqam = e.target.value.replace(/\D/g, '').slice(0, 10);
              setForma({ ...forma, summa: raqam ? pulFormat(Number(raqam)) : '' });
            }}
            className={`${maydon} col-span-1 sm:col-span-3 text-right`}
          />
          <select
            value={forma.ishchiId}
            onChange={(e) => setForma({ ...forma, ishchiId: e.target.value })}
            className={`${maydon} col-span-2 sm:col-span-6`}
          >
            <option value="">Ishchini tanlang...</option>
            {ishchilar.map((i) => (
              <option key={String(i.id)} value={String(i.id)}>
                {i.ism}
                {i.lavozimi ? ` — ${i.lavozimi}` : ''}
              </option>
            ))}
            {tahrirId && !ishchilar.some((i) => String(i.id) === forma.ishchiId) && forma.ishchiId && (
              <option value={forma.ishchiId}>{yozuvlar.find((y) => y.id === tahrirId)?.ism}</option>
            )}
          </select>
          <input
            type="text"
            placeholder="Izoh (ixtiyoriy) — botda ishchiga ko'rinadi"
            value={forma.izoh}
            maxLength={120}
            onChange={(e) => setForma({ ...forma, izoh: e.target.value })}
            className={`${maydon} col-span-2 sm:col-span-12`}
          />
        </div>
        {xato && <p className="text-xs font-bold text-rose-600">{xato}</p>}
        <div className="flex gap-2">
          <button type="submit" className="flex-1 sm:flex-none h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-black transition">
            {tahrirId ? 'Saqlash' : "Qo'shish"}
          </button>
          {tahrirId && (
            <button
              type="button"
              onClick={() => {
                setTahrirId(null);
                setForma({ ...BOSH_FORMA, sana: standartSana(oy) });
                setXato('');
              }}
              className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition"
            >
              Bekor qilish
            </button>
          )}
        </div>
        {ishchilar.length === 0 && (
          <p className="text-xs font-semibold text-amber-600">Bu oy uchun ishchilar ro'yxati topilmadi. Avval Ishchilar bo'limini tekshiring.</p>
        )}
      </form>

      {/* ISHCHILAR BO'YICHA JAMI (bosilsa ro'yxat filtrlanadi) */}
      {ishchiJamilari.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filtrId && (
            <button type="button" onClick={() => setFiltrId('')} className="h-9 px-3 rounded-xl bg-slate-800 text-white text-xs font-bold">
              ✕ Hammasi
            </button>
          )}
          {ishchiJamilari.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setFiltrId(filtrId === i.id ? '' : i.id)}
              className={`h-9 px-3 rounded-xl border text-xs font-bold transition ${
                filtrId === i.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {i.ism} · <span className={filtrId === i.id ? 'text-indigo-100' : 'text-rose-600'}>{pulFormat(i.jami)}</span>
              {i.soni > 1 && <span className="opacity-60"> ({i.soni})</span>}
            </button>
          ))}
        </div>
      )}

      {/* RO'YXAT */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {korinadigan.length === 0 ? (
          <p className="p-6 text-center text-sm font-semibold text-slate-400">{oyMatni(oy)} oyida hali avans kiritilmagan</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {korinadigan.map((y) => (
              <li key={y.id} className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 ${tahrirId === y.id ? 'bg-amber-50' : ''}`}>
                <span className="shrink-0 w-12 text-xs font-black text-slate-400">{sanaQisqa(y.sana)}</span>
                <button type="button" onClick={() => tahrirlash(y)} className="flex-1 min-w-0 text-left" title="Tahrirlash">
                  <p className="text-sm font-bold text-slate-800 truncate">{y.ism}</p>
                  {y.izoh && <p className="text-xs text-slate-500 truncate">{y.izoh}</p>}
                </button>
                <span className="shrink-0 text-sm font-black text-rose-600">{pulFormat(y.summa)}</span>
                <button
                  type="button"
                  onClick={() => ochirish(y.id)}
                  className={`shrink-0 h-8 rounded-lg text-xs font-bold transition ${
                    ochirishId === y.id ? 'px-2.5 bg-rose-600 text-white' : 'w-8 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                  }`}
                  title="O'chirish"
                >
                  {ochirishId === y.id ? "O'chirilsinmi?" : '✕'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ERKIN ESLATMALAR (eski Notes) */}
      <EslatmaDaftar tanlanganOy={oy} ishchilar={ishchilar} hisobgaOlinadi={yozuvlar.length === 0} />
    </div>
  );
}
