'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { avansJami, noaniqQatorlarSoni, pulFormat, type Ishchi } from '@/lib/hisob';
import { toshkentSana } from '@/lib/sana';
import { Oyna, Tugma, Ogohlantirish, Korsatkich, cn } from '@/components/ui';
import ZiddiyatOgohlantirish from '@/components/ZiddiyatOgohlantirish';
import { useXotiraYangilanishi } from '@/hooks/useXotiraYangilanishi';

// AVANS DAFTARI (faqat admin) — sodda versiya.
// Bitta Notes: ism yozilgan qatordagi summa shu ishchining avansi (oylik ham, bot ham shundan hisoblaydi).
// "+ Xodim" -> oyna: Ism (yozganda ro'yxat chiqadi), Summa, Izoh (ixtiyoriy) -> Saqlash -> Notes'ga qator tushadi.
export default function AvansDaftari({ tanlanganOy, ishchilar = [], yopiq = false }: { tanlanganOy: string; ishchilar?: Ishchi[]; yopiq?: boolean }) {
  const [matn, setMatn] = useState('');
  const [qulflangan, setQulflangan] = useState(true);
  const [bugunSana, setBugunSana] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Oyna
  const [oynaOchiq, setOynaOchiq] = useState(false);
  const [ism, setIsm] = useState('');
  const [royxatOchiq, setRoyxatOchiq] = useState(false);
  const [belgilangan, setBelgilangan] = useState(0);
  const [summa, setSumma] = useState('');
  const [izoh, setIzoh] = useState('');
  const [xato, setXato] = useState('');

  const xotiraKaliti = `zavod_eslatmalar_${tanlanganOy}`;

  // Boshqa qurilmada yozilgan avans kelsa — darhol ko'rsatamiz. Birlashtirilgan matn shu qurilmadagi
  // yozuvlarni ham o'z ichiga oladi; yozib turgan bo'lsangiz, kursor joyida qoladi.
  useXotiraYangilanishi(
    (k) => k === xotiraKaliti,
    () => {
      const ta = textareaRef.current;
      const yozilmoqda = !!ta && document.activeElement === ta;
      const bosh = ta?.selectionStart ?? 0;
      const oxir = ta?.selectionEnd ?? 0;
      setMatn(localStorage.getItem(xotiraKaliti) || '');
      if (yozilmoqda && ta) {
        requestAnimationFrame(() => {
          try {
            ta.setSelectionRange(bosh, oxir);
          } catch {}
        });
      }
    }
  );

  useEffect(() => {
    setBugunSana(toshkentSana());
    setMatn(localStorage.getItem(xotiraKaliti) || '');
  }, [xotiraKaliti]);

  // Matn ko'paygan sari oynani cho'zish (skrollsiz hamma yozuv ko'rinadi)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(150, textareaRef.current.scrollHeight)}px`;
    }
  }, [matn]);

  const matnniSaqlash = (yangi: string) => {
    setMatn(yangi);
    localStorage.setItem(xotiraKaliti, yangi);
  };

  // Enter bosilganda katta sonlarni 200,000 ko'rinishiga keltirish
  const klaviaturaBosilganda = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const f = matn.replace(/\b(\d{4,9})\b/g, (r) => Number(r).toLocaleString('en-US'));
      if (f !== matn) matnniSaqlash(f);
    }
  };

  // Tanlangan oy joriy oy bo'lmasa, sana o'sha oyning 1-kuni qo'yiladi
  const yozuvSanasi = bugunSana.startsWith(tanlanganOy)
    ? `${bugunSana.slice(8, 10)}.${bugunSana.slice(5, 7)}`
    : `01.${tanlanganOy.slice(5, 7)}`;

  const ismlar = useMemo(
    () => Array.from(new Set(ishchilar.map((i) => String(i.ism ?? '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [ishchilar]
  );

  // Har bir harf terilganda mos ishchilar (avval ism bilan boshlanadiganlar)
  const mosIsmlar = useMemo(() => {
    const q = ism.trim().toLowerCase();
    if (!q) return ismlar.slice(0, 8);
    const boshi = ismlar.filter((i) => i.toLowerCase().startsWith(q));
    const ichida = ismlar.filter((i) => !i.toLowerCase().startsWith(q) && i.toLowerCase().includes(q));
    return [...boshi, ...ichida].slice(0, 8);
  }, [ism, ismlar]);

  const oynaniOchish = () => {
    setIsm('');
    setSumma('');
    setIzoh('');
    setXato('');
    setBelgilangan(0);
    setRoyxatOchiq(true);
    setOynaOchiq(true);
  };

  const oynaniYopish = () => setOynaOchiq(false);

  const ismTanlash = (tanlangan: string) => {
    setIsm(tanlangan);
    setRoyxatOchiq(false);
    setXato('');
    setTimeout(() => document.getElementById('avans-summa')?.focus(), 30);
  };

  const ismKlaviatura = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!royxatOchiq || mosIsmlar.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setBelgilangan((b) => Math.min(b + 1, mosIsmlar.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setBelgilangan((b) => Math.max(b - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      ismTanlash(mosIsmlar[belgilangan] || mosIsmlar[0]);
    }
  };

  const saqlash = (e: React.FormEvent) => {
    e.preventDefault();
    const tanlanganIsm = ismlar.find((i) => i.toLowerCase() === ism.trim().toLowerCase());
    if (!tanlanganIsm) return setXato('Ishchini ro‘yxatdan tanlang');
    const s = Number(summa.replace(/\D/g, ''));
    if (!s || s < 1000) return setXato('Summani yozing (masalan 200 000)');

    const qator = `[${yozuvSanasi}] ${tanlanganIsm} — ${s.toLocaleString('en-US')}${izoh.trim() ? ` — ${izoh.trim()}` : ''}`;
    matnniSaqlash(matn.trim().length > 0 ? `${matn.trimEnd()}\n${qator}` : qator);
    setOynaOchiq(false);
  };

  const oyJami = avansJami(matn, ismlar);
  const noaniqSoni = noaniqQatorlarSoni(matn, ismlar);
  const maydon =
    'w-full h-11 md:h-10 px-3 rounded-boshqaruv bg-sirt border border-chiziq-2 text-base md:text-sm text-matn placeholder:text-matn-3 outline-none transition-colors focus:border-asosiy focus:ring-2 focus:ring-asosiy/20';
  const yorliq = 'block mb-1.5 text-sm font-semibold text-matn-2';

  return (
    <div className="space-y-4">
      <ZiddiyatOgohlantirish tur="avans" kalit={xotiraKaliti} />

      <Korsatkich ixcham nomi="Oy jami avans" qiymat={pulFormat(oyJami)} birlik="so'm" />

      {noaniqSoni > 0 && (
        <Ogohlantirish tur="xato">
          {noaniqSoni} ta qatorda bir nechta ishchi yozilgan — bu summalar hech kimga hisoblanmadi. Qatorda bitta ishchi qoldiring.
        </Ogohlantirish>
      )}

      <div className="bg-sirt border border-chiziq rounded-karta overflow-hidden">
        {/* TEPA: Notes + Tahrirlash + "+ Xodim" */}
        <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 border-b border-chiziq">
          <span className="mr-auto text-sm md:text-base font-semibold text-matn">Notes</span>
          {!yopiq && (
            <>
              <Tugma kichik ikonka={qulflangan ? 'tahrir' : 'tasdiq'} onClick={() => setQulflangan(!qulflangan)}>
                {qulflangan ? 'Tahrirlash' : 'Tayyor'}
              </Tugma>
              <Tugma kichik tur="asosiy" ikonka="qoshish" onClick={oynaniOchish}>
                Xodim
              </Tugma>
            </>
          )}
        </div>

        {/* NOTES */}
        <div className="p-2.5 md:p-3">
          <textarea
            ref={textareaRef}
            readOnly={qulflangan || yopiq}
            value={matn}
            onChange={(e) => matnniSaqlash(e.target.value)}
            onKeyDown={klaviaturaBosilganda}
            onDoubleClick={() => qulflangan && !yopiq && setQulflangan(false)}
            placeholder="Hali yozuv yo‘q. “+ Xodim” tugmasini bosing."
            className={cn(
              'w-full overflow-hidden resize-none min-h-[150px] text-base md:text-sm leading-7 text-matn placeholder:text-matn-3 outline-none rounded-boshqaruv p-3 transition-colors',
              qulflangan || yopiq ? 'bg-sirt-2 cursor-default' : 'bg-sirt ring-2 ring-asosiy/30 focus:ring-asosiy/60'
            )}
          />
        </div>
      </div>

      {/* OYNA: Ism + Summa + Izoh */}
      <Oyna
        ochiq={oynaOchiq}
        yopish={oynaniYopish}
        sarlavha={
          <>
            Avans qo‘shish <span className="ml-1 text-sm font-normal text-matn-3">{yozuvSanasi}</span>
          </>
        }
        amallar={
          <>
            <Tugma onClick={oynaniYopish}>Bekor qilish</Tugma>
            <Tugma type="submit" form="avans-forma" tur="asosiy">
              Saqlash
            </Tugma>
          </>
        }
      >
        <form id="avans-forma" onSubmit={saqlash} className="space-y-4">
          {/* Ism: yozganda pastda ishchilar chiqadi */}
          <div>
            <label htmlFor="avans-ism" className={yorliq}>
              Ism
            </label>
            <input
              id="avans-ism"
              type="text"
              autoFocus
              placeholder="Ishchi ismi"
              value={ism}
              onChange={(e) => {
                setIsm(e.target.value);
                setRoyxatOchiq(true);
                setBelgilangan(0);
                setXato('');
              }}
              onFocus={() => setRoyxatOchiq(true)}
              onKeyDown={ismKlaviatura}
              className={maydon}
              autoComplete="off"
            />
            {royxatOchiq && mosIsmlar.length > 0 && (
              <ul className="mt-1 max-h-56 overflow-auto rounded-boshqaruv border border-chiziq bg-sirt py-1">
                {mosIsmlar.map((i, idx) => (
                  <li key={i}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => ismTanlash(i)}
                      className={cn('w-full text-left px-3 py-2 text-sm font-medium', idx === belgilangan ? 'bg-asosiy-och text-asosiy' : 'text-matn hover:bg-sirt-2')}
                    >
                      {i}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {royxatOchiq && ism.trim() && mosIsmlar.length === 0 && <p className="mt-1 text-xs text-matn-3">Bunday ishchi topilmadi</p>}
          </div>

          <div>
            <label htmlFor="avans-summa" className={yorliq}>
              Summa
            </label>
            <input
              id="avans-summa"
              type="text"
              inputMode="numeric"
              placeholder="200 000"
              value={summa}
              onFocus={() => setRoyxatOchiq(false)}
              onChange={(e) => {
                const r = e.target.value.replace(/\D/g, '').slice(0, 10);
                setSumma(r ? pulFormat(Number(r)) : '');
                setXato('');
              }}
              className={maydon}
            />
          </div>

          <div>
            <label htmlFor="avans-izoh" className={yorliq}>
              Izoh (ixtiyoriy)
            </label>
            <input
              id="avans-izoh"
              type="text"
              placeholder="Nima uchun"
              value={izoh}
              maxLength={120}
              onFocus={() => setRoyxatOchiq(false)}
              onChange={(e) => setIzoh(e.target.value)}
              className={maydon}
            />
          </div>

          {xato && <p className="text-sm font-semibold text-xato">{xato}</p>}
        </form>
      </Oyna>
    </div>
  );
}
