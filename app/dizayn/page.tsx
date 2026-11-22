'use client';
import React, { useState } from 'react';
import {
  Belgi,
  BoshHolat,
  IKONKA_NOMLARI,
  Ikonka,
  Jadval,
  Karta,
  Korsatkich,
  Maydon,
  Oyna,
  SahifaSarlavhasi,
  Tanlash,
  Tugma,
  jadvalKatak,
  jadvalQator,
  jadvalRaqam,
  jadvalSarlavha,
  tasdiqla,
  xabarBer
} from '@/components/ui';

// DIZAYN NAMUNASI (faqat admin): barcha ranglar va komponentlar bir joyda.
// Telefon va kompyuterda ochib ko'riladi; yoqsa — sahifalar shu uslubga o'tkaziladi.
const RANGLAR = [
  ['fon', 'bg-fon'],
  ['sirt', 'bg-sirt'],
  ['sirt-2', 'bg-sirt-2'],
  ['menyu', 'bg-menyu'],
  ['asosiy', 'bg-asosiy'],
  ['yaxshi', 'bg-yaxshi'],
  ['diqqat', 'bg-diqqat'],
  ['xato', 'bg-xato'],
  ['den', 'bg-den'],
  ['noch', 'bg-noch']
] as const;

const MOSHINALAR = [
  { mk: 'MK-1', op: 'Ali Valiyev', rulon: 12, kg: 1450.5, holat: 'yaxshi' as const },
  { mk: 'MK-2', op: 'Sardor Rahimov', rulon: 9, kg: 1102, holat: 'yaxshi' as const },
  { mk: 'MK-3', op: '—', rulon: 0, kg: 0, holat: 'diqqat' as const }
];

export default function DizaynSahifasi() {
  const [oyna, setOyna] = useState(false);
  const [yuklanmoqda, setYuklanmoqda] = useState(false);

  return (
    <div className="p-4 md:p-0 max-w-5xl mx-auto space-y-6 pb-16">
      <SahifaSarlavhasi
        sarlavha="Dizayn namunasi"
        izoh="Yangi uslubning barcha qismlari. Telefon va kompyuterda ochib ko'ring."
        amallar={
          <>
            <Tugma ikonka="yuklab">Ikkinchi</Tugma>
            <Tugma tur="asosiy" ikonka="qoshish">Asosiy amal</Tugma>
          </>
        }
      />

      <Karta sarlavha="Ranglar" izoh="Rang faqat ma'no uchun: asosiy, yaxshi, diqqat, xato. Qolgani oq va kulrang.">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {RANGLAR.map(([nom, klass]) => (
            <div key={nom}>
              <div className={`h-12 rounded-boshqaruv border border-chiziq ${klass}`} />
              <p className="mt-1 text-xs font-semibold text-matn-2">{nom}</p>
            </div>
          ))}
        </div>
      </Karta>

      <Karta sarlavha="Shrift (Inter)">
        <div className="space-y-2">
          <p className="text-3xl font-bold tabular-nums">21 450 kg</p>
          <p className="text-2xl font-bold">Sahifa sarlavhasi</p>
          <p className="text-xl font-semibold">Bo&apos;lim sarlavhasi</p>
          <p className="text-sm">Oddiy matn: o&apos;quv sexi, g&apos;altak, sho&apos;ba — Ўзбекча кирилл ҳам: қўғ.</p>
          <p className="text-xs text-matn-3">Izoh matni, 12 px</p>
        </div>
      </Karta>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Korsatkich nomi="Jami kg" qiymat="21 450" birlik="kg" ikonka="rulon" izoh="186 rulon · 12 moshina" />
        <Korsatkich nomi="Ishchilar" qiymat="35" ikonka="ishchilar" holat="yaxshi" izoh="Hammasi kelgan" />
        <Korsatkich nomi="Brak" qiymat="1.8" birlik="%" ikonka="ogohlantirish" holat="diqqat" izoh="Me'yordan biroz yuqori" />
        <Korsatkich nomi="Limit" qiymat="96" birlik="%" ikonka="texnik" holat="xato" izoh="MK-7 xizmatga" />
      </div>

      <Karta sarlavha="Tugmalar" izoh="Telefonda 44 px, kompyuterda 40 px">
        <div className="flex flex-wrap gap-2">
          <Tugma tur="asosiy" ikonka="tasdiq">Saqlash</Tugma>
          <Tugma ikonka="yuklab">Yuklab olish</Tugma>
          <Tugma tur="shaffof" ikonka="tahrir">Tahrirlash</Tugma>
          <Tugma tur="xavfli" ikonka="ochirish">O&apos;chirish</Tugma>
          <Tugma
            tur="asosiy"
            yuklanmoqda={yuklanmoqda}
            onClick={() => {
              setYuklanmoqda(true);
              setTimeout(() => setYuklanmoqda(false), 1500);
            }}
          >
            {yuklanmoqda ? 'Bajarilmoqda...' : 'Bosib ko\'ring'}
          </Tugma>
          <Tugma kichik ikonka="qoshish">Kichik</Tugma>
        </div>
      </Karta>

      <Karta sarlavha="Maydonlar">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Maydon yorliq="Ism" placeholder="Ali Valiyev" />
          <Maydon yorliq="Summa" inputMode="numeric" placeholder="200 000" izoh="So'mda" />
          <Maydon yorliq="Telefon" defaultValue="90123" xato="Raqam to'liq emas" />
          <Tanlash yorliq="Lavozim" defaultValue="op">
            <option value="op">Operator</option>
            <option value="mx">Mexanik</option>
          </Tanlash>
        </div>
      </Karta>

      <Karta sarlavha="Belgilar">
        <div className="flex flex-wrap gap-2">
          <Belgi tur="den">DEN</Belgi>
          <Belgi tur="noch">NOCH</Belgi>
          <Belgi tur="asosiy">Joriy</Belgi>
          <Belgi tur="yaxshi">Saqlandi</Belgi>
          <Belgi tur="diqqat">Limitga yaqin</Belgi>
          <Belgi tur="xato">Xato</Belgi>
          <Belgi>12 ta</Belgi>
        </div>
      </Karta>

      <Karta sarlavha="Jadval" amallar={<Belgi tur="den">23.11 DEN</Belgi>} ichki={false}>
        <Jadval>
          <thead>
            <tr>
              <th className={jadvalSarlavha}>Moshina</th>
              <th className={jadvalSarlavha}>Operator</th>
              <th className={`${jadvalSarlavha} text-right`}>Rulon</th>
              <th className={`${jadvalSarlavha} text-right`}>KG</th>
              <th className={jadvalSarlavha}>Holat</th>
            </tr>
          </thead>
          <tbody>
            {MOSHINALAR.map((m) => (
              <tr key={m.mk} className={jadvalQator}>
                <td className={`${jadvalKatak} font-semibold`}>{m.mk}</td>
                <td className={jadvalKatak}>{m.op}</td>
                <td className={`${jadvalKatak} ${jadvalRaqam}`}>{m.rulon}</td>
                <td className={`${jadvalKatak} ${jadvalRaqam}`}>{m.kg.toLocaleString('ru-RU')}</td>
                <td className={jadvalKatak}>
                  <Belgi tur={m.holat}>{m.holat === 'yaxshi' ? 'Ishlayapti' : 'Kiritilmagan'}</Belgi>
                </td>
              </tr>
            ))}
          </tbody>
        </Jadval>
      </Karta>

      <Karta sarlavha="Oyna va xabarlar" izoh="Brauzerning oddiy alert/confirm oynalari o'rniga">
        <div className="flex flex-wrap gap-2">
          <Tugma onClick={() => setOyna(true)}>Oynani ochish</Tugma>
          <Tugma
            onClick={async () => {
              const ha = await tasdiqla({ sarlavha: 'Moshinani o\'chirasizmi?', matn: 'MK-3 jadvali smenadan olib tashlanadi.', tasdiqMatni: 'O\'chirish', xavfli: true });
              xabarBer(ha ? 'O\'chirildi' : 'Bekor qilindi', ha ? 'yaxshi' : 'malumot');
            }}
          >
            Tasdiqlash oynasi
          </Tugma>
          <Tugma onClick={() => xabarBer('Saqlandi')}>Yashil xabar</Tugma>
          <Tugma onClick={() => xabarBer('Internet yo\'q — saqlab bo\'lmadi', 'xato')}>Qizil xabar</Tugma>
        </div>
      </Karta>

      <Karta ichki={false}>
        <BoshHolat ikonka="rulon" sarlavha="Bu smenada hali moshina yo'q" izoh="Oldingi smenadan ko'chiring yoki yangi moshina qo'shing." amal={<Tugma tur="asosiy" ikonka="qoshish">Moshina qo&apos;shish</Tugma>} />
      </Karta>

      <Karta sarlavha="Ikonkalar">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {IKONKA_NOMLARI.map((n) => (
            <div key={n} className="flex flex-col items-center gap-1 p-2 rounded-boshqaruv hover:bg-sirt-2 text-matn-2">
              <Ikonka nom={n} />
              <span className="text-[11px] text-matn-3 truncate max-w-full">{n}</span>
            </div>
          ))}
        </div>
      </Karta>

      <Oyna
        ochiq={oyna}
        yopish={() => setOyna(false)}
        sarlavha="23.11 NOCH smenasini yakunlaysizmi?"
        amallar={
          <>
            <Tugma onClick={() => setOyna(false)}>Bekor</Tugma>
            <Tugma tur="asosiy" onClick={() => setOyna(false)}>
              Ha, yakunlash
            </Tugma>
          </>
        }
      >
        <div className="rounded-boshqaruv bg-sirt-2 p-3">
          <p className="text-base font-semibold text-matn tabular-nums">12 moshina · 186 rulon · 21 450 kg</p>
          <p className="mt-1 text-sm text-matn-2">Hisobot Telegram kanalga yuboriladi</p>
        </div>
        <p className="mt-3">
          Keyingi smena: <Belgi tur="den">24.11 DEN</Belgi>
        </p>
      </Oyna>
    </div>
  );
}
