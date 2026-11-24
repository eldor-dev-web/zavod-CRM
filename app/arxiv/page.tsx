'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { arxivCsv, mahalliySmenaniOgirish, NUQSON_TURLARI, smenaJamisi, type ArxivSmena } from '@/lib/arxiv';
import { sanagaKunQoshish, toshkentSana } from '@/lib/sana';
import { tungimi } from '@/lib/smena';
import { SahifaSarlavhasi, SanaTanlash, Ogohlantirish, Korsatkich, BoshHolat, Tugma, Ikonka, cn } from '@/components/ui';

const kgFormat = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

// Telefonda nuqson ustunlari qisqa nom bilan (Rulonlardagi tik jadval bilan bir xil)
const QISQA: Record<string, string> = { Patlak: 'Pat.', 'Lyc xato': 'Lyc', 'Igna siniq': 'Igna', 'Yog izi': "Yog'", Kumas: 'Kum.' };
const TOLIQ: Record<string, string> = { 'Yog izi': "Yog' izi" };

// Baza ulanmaganda: shu brauzerda saqlangan smenalardan qidirish
function mahalliyArxiv(sana: string, smena: string): ArxivSmena[] {
  const xarita = new Map<string, ArxivSmena>();
  const qosh = (s: ArxivSmena | null) => {
    if (s && s.sana) xarita.set(`${s.sana}_${s.smena}`, s);
  };

  try {
    const eskiArxiv = JSON.parse(localStorage.getItem('zavod_smena_arxivlari') || '[]');
    if (Array.isArray(eskiArxiv)) eskiArxiv.forEach((s: any) => qosh(mahalliySmenaniOgirish({ ...s, moshinalar: s.moshinaTafsilotlari })));
  } catch {}

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !/^zavod_smena_\d{4}-\d{2}-\d{2}_/.test(k)) continue;
    try {
      qosh(mahalliySmenaniOgirish(JSON.parse(localStorage.getItem(k) || 'null')));
    } catch {}
  }

  return Array.from(xarita.values())
    .filter((s) => s.sana === sana && (!smena || s.smena.includes(smena)))
    .sort((a, b) => Number(tungimi(a.smena)) - Number(tungimi(b.smena)));
}

// Bitta moshina: Rulonlardagi tik jadval ko'rinishi (faqat o'qish uchun)
function ArxivMoshina({ m }: { m: ArxivSmena['moshinalar'][number] }) {
  const mKg = m.rulonlar.reduce((a, r) => a + (r.kg ?? 0), 0);
  return (
    <div className="overflow-hidden rounded-boshqaruv border border-chiziq bg-sirt print:break-inside-avoid">
      <div className="flex items-baseline gap-2 px-3 pt-2.5">
        <span className="shrink-0 text-xl font-bold uppercase text-matn">{m.raqam || '—'}</span>
        <span className="flex-1 min-w-0 truncate text-sm text-matn-2">{m.talimoti || ''}</span>
        <span className="shrink-0 text-sm font-bold text-yaxshi tabular-nums">{kgFormat(mKg)} kg</span>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-1.5 px-3 pt-2 pb-3">
        <div className="min-w-0 rounded-boshqaruv bg-asosiy-och px-2 py-1">
          <p className="text-[11px] text-asosiy">Operator</p>
          <p className="truncate text-sm font-semibold text-asosiy">{m.operator || '—'}</p>
        </div>
        {(
          [
            ['Brend', m.brend],
            ['IP', m.ip],
            ['Lot', m.lot]
          ] as const
        ).map(([nomi, qiymat]) => (
          <div key={nomi} className="min-w-0 rounded-boshqaruv bg-sirt-2 px-2 py-1">
            <p className="text-[11px] text-matn-3">{nomi}</p>
            <p className="truncate text-sm text-matn">{qiymat || '—'}</p>
          </div>
        ))}
      </div>

      {m.rulonlar.length > 0 ? (
        <table className="w-full table-fixed border-collapse text-center">
          <colgroup>
            <col className="w-7 md:w-12" />
            <col className="w-[58px] md:w-28" />
            {NUQSON_TURLARI.map((n) => (
              <col key={n} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-sirt-2 border-y border-chiziq text-[11px] md:text-xs font-semibold text-matn-2">
              <th className="py-2 font-semibold">№</th>
              <th className="py-2 font-semibold text-yaxshi border-l border-chiziq">KG</th>
              {NUQSON_TURLARI.map((n) => (
                <th key={n} className="py-2 font-semibold truncate px-0.5 border-l border-chiziq">
                  <span className="md:hidden">{QISQA[n] || n}</span>
                  <span className="hidden md:inline">{TOLIQ[n] || n}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.rulonlar.map((r) => (
              <tr key={r.tartib} className="h-10 border-b border-chiziq last:border-b-0">
                <td className="text-xs text-matn-3 tabular-nums">{r.tartib}</td>
                <td className="border-l border-chiziq text-base font-bold text-yaxshi tabular-nums">{r.kg !== null ? kgFormat(r.kg) : '—'}</td>
                {NUQSON_TURLARI.map((n) => {
                  const q = r.nuqsonlar[n];
                  return (
                    <td key={n} className={cn('border-l border-chiziq text-base truncate px-0.5', q ? 'bg-xato-och font-bold text-xato' : 'text-matn-3')}>
                      {q || '·'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="border-t border-chiziq px-3 py-2.5 text-sm text-matn-3">Rulon kiritilmagan</p>
      )}
    </div>
  );
}

export default function ArxivSahifasi() {
  // Bugungi sana faqat brauzerda olinadi (sahifa yig'ilayotganda vaqtni o'qish taqiqlangan — cacheComponents)
  const [sana, setSana] = useState('');
  useEffect(() => {
    setSana(toshkentSana());
  }, []);
  const [smena, setSmena] = useState<'' | 'DEN' | 'NOCH'>('');

  const [smenalar, setSmenalar] = useState<ArxivSmena[]>([]);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);
  const [manba, setManba] = useState<'baza' | 'mahalliy'>('baza');

  const yuklash = useCallback(async (kun: string, sm: string) => {
    if (!kun) return;
    setYuklanmoqda(true);
    try {
      const params = new URLSearchParams({ dan: kun, gacha: kun, smena: sm });
      const res = await fetch(`/api/arxiv?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const royxat: ArxivSmena[] = data.smenalar || [];
      setSmenalar(royxat.sort((a, b) => Number(tungimi(a.smena)) - Number(tungimi(b.smena))));
      setManba('baza');
    } catch {
      setSmenalar(mahalliyArxiv(kun, sm));
      setManba('mahalliy');
    } finally {
      setYuklanmoqda(false);
    }
  }, []);

  // Sana yoki smena o'zgarishi bilan darhol qidiradi
  useEffect(() => {
    yuklash(sana, smena);
  }, [sana, smena, yuklash]);

  const jami = useMemo(
    () =>
      smenalar.reduce(
        (acc, s) => {
          const j = smenaJamisi(s);
          return { kg: acc.kg + j.kg, rulon: acc.rulon + j.rulon, moshina: acc.moshina + s.moshinalar.length };
        },
        { kg: 0, rulon: 0, moshina: 0 }
      ),
    [smenalar]
  );

  const excelgaYuklash = () => {
    const blob = new Blob([arxivCsv(smenalar)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arxiv_${sana}${smena ? `_${smena}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SMENA_TANLOVI: { qiymat: '' | 'DEN' | 'NOCH'; nomi: string; ikonka?: 'quyosh' | 'oy' }[] = [
    { qiymat: '', nomi: 'Ikkalasi' },
    { qiymat: 'DEN', nomi: 'DEN', ikonka: 'quyosh' },
    { qiymat: 'NOCH', nomi: 'NOCH', ikonka: 'oy' }
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <SahifaSarlavhasi
        sarlavha="Smenalar arxivi"
        amallar={
          <div className="flex items-center gap-2 print:hidden">
            <Tugma kichik ikonka="yuklab" onClick={excelgaYuklash} disabled={smenalar.length === 0}>
              Excel
            </Tugma>
            <Tugma kichik ikonka="chop" onClick={() => window.print()} disabled={smenalar.length === 0} aria-label="Chop etish" title="Chop etish">
              <span className="hidden md:inline">Chop etish</span>
            </Tugma>
          </div>
        }
      />

      {/* TANLASH: SANA + SMENA */}
      <div className="mb-4 flex flex-col gap-2.5 md:flex-row md:items-center print:hidden">
        <SanaTanlash
          sana={sana}
          ozgartirish={setSana}
          oldingi={() => sana && setSana(sanagaKunQoshish(sana, -1))}
          keyingi={() => sana && setSana(sanagaKunQoshish(sana, 1))}
          className="md:w-96"
        />
        <div className="grid grid-cols-3 gap-1 rounded-boshqaruv bg-sirt-2 p-1 md:w-80">
          {SMENA_TANLOVI.map((t) => {
            const tanlangan = smena === t.qiymat;
            return (
              <button
                key={t.nomi}
                type="button"
                onClick={() => setSmena(t.qiymat)}
                aria-pressed={tanlangan}
                className={cn(
                  'h-9 md:h-8 inline-flex items-center justify-center gap-1.5 rounded-[6px] text-sm transition-colors',
                  tanlangan ? 'bg-sirt border border-chiziq font-semibold text-matn shadow-sm' : 'text-matn-2 hover:text-matn'
                )}
              >
                {t.ikonka && <Ikonka nom={t.ikonka} className="w-4 h-4" />}
                {t.nomi}
              </button>
            );
          })}
        </div>
      </div>

      {manba === 'mahalliy' && (
        <Ogohlantirish tur="diqqat" ikonka="ogohlantirish" className="mb-4 print:hidden">
          Baza ulanmagan. Faqat shu kompyuterda saqlangan smenalar ko&apos;rsatilmoqda — to&apos;liq arxiv baza ulanganda chiqadi.
        </Ogohlantirish>
      )}

      {/* JAMI */}
      <div className="mb-4 grid grid-cols-3 gap-2 md:gap-3">
        <Korsatkich ixcham nomi="Jami kg" qiymat={kgFormat(jami.kg)} />
        <Korsatkich ixcham nomi="Rulonlar" qiymat={jami.rulon} />
        <Korsatkich ixcham nomi="Moshinalar" qiymat={jami.moshina} />
      </div>

      {/* NATIJA */}
      {yuklanmoqda ? (
        <div className="rounded-karta border border-chiziq bg-sirt p-10 text-center text-sm text-matn-3">Yuklanmoqda...</div>
      ) : smenalar.length === 0 ? (
        <div className="rounded-karta border border-chiziq bg-sirt">
          <BoshHolat ikonka="arxiv" sarlavha={`Bu sanada ${smena ? `${smena} smenasi` : 'smena'} topilmadi`} izoh="‹ › tugmalari bilan boshqa kunni tanlab ko'ring" />
        </div>
      ) : (
        <div className="space-y-4">
          {smenalar.map((s) => {
            const j = smenaJamisi(s);
            const tungi = tungimi(s.smena);
            return (
              <section key={`${s.sana}_${s.smena}`} className="overflow-hidden rounded-karta border border-chiziq bg-sirt">
                <div className="border-b border-chiziq px-3 md:px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                        tungi ? 'bg-noch text-white' : 'bg-den-och text-diqqat'
                      )}
                    >
                      <Ikonka nom={tungi ? 'oy' : 'quyosh'} className="w-3.5 h-3.5" />
                      {tungi ? 'NOCH' : 'DEN'}
                    </span>
                    <span className="text-sm text-matn-2 tabular-nums">
                      {s.moshinalar.length} moshina · {j.rulon} rulon · <b className="font-semibold text-yaxshi">{kgFormat(j.kg)} kg</b>
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs md:text-sm text-matn-2">
                    Master: <span className="text-matn">{s.master || '—'}</span> · Kontrolchi: <span className="text-matn">{s.kontrolchi || '—'}</span>
                  </p>
                </div>

                <div className="space-y-3 p-2.5 md:p-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  {s.moshinalar.length === 0 && <p className="text-sm text-matn-3">Bu smenada moshina ma&apos;lumoti yo&apos;q</p>}
                  {s.moshinalar.map((m, mi) => (
                    <ArxivMoshina key={mi} m={m} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
