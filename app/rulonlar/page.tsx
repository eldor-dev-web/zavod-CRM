'use client';
import React, { useState, useEffect } from 'react';
import ApparatCard from '@/components/ApparatCard';
import SmenaFormasi from '@/components/SmenaFormasi';
import SmenaYakunlashOynasi, { type SmenaXulosasi } from '@/components/SmenaYakunlashOynasi';
import { useRulonlar } from '@/hooks/useRulonlar';
import { almashuvEslatmasi, keyingiSmena, oldingiSmena, smenaQisqa, tungimi, type SmenaNuqtasi } from '@/lib/smena';
import { moshinaRaqami } from '@/lib/moshina';
import { BoshHolat, Ikonka, Korsatkich, Ogohlantirish, SahifaSarlavhasi, Tugma, tasdiqla, xabarBer } from '@/components/ui';
import { kgFormat } from '@/components/SmenaYakunlashOynasi';

export default function RulonlarSahifasi() {
  const {
    moshinalar, sana, smenaTuri, kontrolchi, setKontrolchi, master, setMaster,
    moshinaMaqotlari, moshinaQoshish, jadvalniOchirish, handleMoshinaDataChange, oldingiSmenadanKochirish,
    joriy, rejim, smenagaOtish, tugaganniOchish, joriygaQaytish
  } = useRulonlar();

  // "Smenani yakunlaysizmi?" oynasi: qaysi smenaga o'tiladi (navbatdagi yoki eslatmadagi hozirgi)
  const [yakunlashMaqsadi, setYakunlashMaqsadi] = useState<SmenaNuqtasi | null>(null);
  const yakunlashniOchish = (maqsad?: SmenaNuqtasi) => {
    if (!joriy) return;
    setYakunlashMaqsadi(maqsad || keyingiSmena(joriy.sana, joriy.smena));
  };

  // Joriy smena xulosasi: kg yozilgan rulonlar, ular bor moshinalar va jami kg
  const smenaXulosasi = (): SmenaXulosasi => {
    let moshina = 0;
    let rulon = 0;
    let kg = 0;
    moshinalar.forEach((m: any) => {
      const toldirilgan = (moshinaMaqotlari[m.id]?.rulonlar || [])
        .map((r: any) => parseFloat(String(r?.kg ?? '').replace(',', '.')))
        .filter((n: number) => Number.isFinite(n) && n > 0);
      if (toldirilgan.length > 0) moshina++;
      rulon += toldirilgan.length;
      kg += toldirilgan.reduce((j: number, n: number) => j + n, 0);
    });
    return { moshina, rulon, kg };
  };
  const qisqaNom = (s: { sana: string; smena: string }) =>
    `${s.sana.split('-').reverse().slice(0, 2).join('.')} ${tungimi(s.smena) ? 'NOCH' : 'DEN'}`;

  // "Oldingi smenadan ko'chirish" holati
  const [kochirilmoqda, setKochirilmoqda] = useState(false);

  const kochirish = async () => {
    setKochirilmoqda(true);
    const natija = await oldingiSmenadanKochirish();
    setKochirilmoqda(false);
    if (natija.xato) xabarBer(natija.xato, 'xato');
    else xabarBer(`${natija.qoshildi} ta moshina ko'chirildi. Endi operatorlarni tanlang.`);
  };

  // Moshinani o'chirish: yangi tasdiqlash oynasi (brauzerning confirm oynasi o'rniga)
  const moshinaniOchirish = async (id: any) => {
    const raqam = moshinaMaqotlari[id]?.raqam || 'Bu';
    const ha = await tasdiqla({
      sarlavha: `${raqam} moshinasini o'chirasizmi?`,
      matn: 'Moshina va uning rulonlari shu smenadan olib tashlanadi.',
      tasdiqMatni: "O'chirish",
      xavfli: true
    });
    if (ha) jadvalniOchirish(id);
  };

  // 1. ROLNI ANIQLASH (HUQUQLAR UCHUN)
  const [rol, setRol] = useState('');
  useEffect(() => {
    const saqlanganUser = localStorage.getItem('zavod_foydalanuvchi');
    if (saqlanganUser) {
      setRol(JSON.parse(saqlanganUser).rol);
    }
  }, []);

  // UNUTILGAN ALMASHUV ESLATMASI: soat 08:30 / 20:30 dan keyin ekranda hali oldingi smena tursa.
  // Hech narsa avtomatik almashmaydi — faqat eslatadi. Har daqiqada tekshiriladi (vaqt faqat brauzerda olinadi).
  const [eslatma, setEslatma] = useState<{ sana: string; smena: string } | null>(null);
  const [yopilganEslatma, setYopilganEslatma] = useState('');
  useEffect(() => {
    try {
      setYopilganEslatma(localStorage.getItem('_zavod_eslatma_yopilgan') || '');
    } catch {}
  }, []);
  // Eslatma joriy smenaga (bazadagi) qarab hisoblanadi
  useEffect(() => {
    if (!joriy) return;
    const tekshir = () => setEslatma(almashuvEslatmasi(joriy.sana, joriy.smena));
    tekshir();
    const t = setInterval(tekshir, 60 * 1000);
    return () => clearInterval(t);
  }, [joriy]);
  const eslatmaKaliti = eslatma ? `${eslatma.sana}_${smenaQisqa(eslatma.smena)}` : '';
  const eslatmaniYopish = () => {
    setYopilganEslatma(eslatmaKaliti);
    try {
      localStorage.setItem('_zavod_eslatma_yopilgan', eslatmaKaliti);
    } catch {}
  };

  // Arxiv smenasini hech kim o'zgartira olmaydi (server ham tekshiradi). Odatda Rulonlar'da arxiv ochilmaydi.
  const faqatKorish = rejim === 'arxiv';
  const smenaBoshqaruvchi = rol === 'admin' || rol === 'master';

  // Bir smenada bir moshina raqami ikki marta yozilsa, ikkalasi qizil bo'ladi
  const raqamlarSoni: Record<number, number> = {};
  moshinalar.forEach((m: any) => {
    const n = moshinaRaqami(moshinaMaqotlari[m.id]?.raqam);
    if (n) raqamlarSoni[n] = (raqamlarSoni[n] || 0) + 1;
  });
  const takrorlanadimi = (id: any) => {
    const n = moshinaRaqami(moshinaMaqotlari[id]?.raqam);
    return !!n && raqamlarSoni[n] > 1;
  };
  const oldingi = sana && smenaTuri ? oldingiSmena(sana, smenaTuri) : null;
  const oldingiNomi = oldingi ? `${oldingi.sana.split('-').reverse().slice(0, 2).join('.')} ${smenaQisqa(oldingi.smena)}` : '';
  const masterHuquqi = (rol === 'admin' || rol === 'master') && !faqatKorish;
  // (Kontrolchi huquqi asosan ApparatCard ichida ishlatiladi, u yog'ini komponenting ichiga uzatamiz)

  const xulosa = smenaXulosasi();

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-5">
      <SahifaSarlavhasi
        sarlavha="Rulonlar"
        izoh="Smena bo'yicha rulonlar va sifat nazorati"
        amallar={
          faqatKorish ? (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-sirt-2 text-xs font-semibold text-matn-2">
              <Ikonka nom="qulf" className="w-3.5 h-3.5" /> Arxiv
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-yaxshi-och text-xs font-semibold text-yaxshi">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" /> Avtomatik saqlanmoqda
            </span>
          )
        }
      />

      {/* Unutilgan almashuv eslatmasi (faqat smenani almashtira oladiganlarga) */}
      {eslatma && eslatmaKaliti !== yopilganEslatma && smenaBoshqaruvchi && rejim === 'joriy' && (
        <Ogohlantirish
          tur="diqqat"
          amallar={
            <>
              <Tugma kichik tur="asosiy" onClick={() => yakunlashniOchish(eslatma)}>
                O&apos;tish
              </Tugma>
              <Tugma kichik tur="shaffof" onClick={eslatmaniYopish} aria-label="Keyingi smenagacha yashirish">
                <Ikonka nom="yopish" className="w-4 h-4" />
              </Tugma>
            </>
          }
        >
          Hozir {qisqaNom(eslatma)} smenasi. Smenani almashtirish esingizdan chiqmadimi?
        </Ogohlantirish>
      )}

      {/* Tugagan smena (faqat shu masterning ekranida; kontrolchilar joriy smenada qoladi) */}
      {rejim !== 'joriy' && joriy && (
        <Ogohlantirish
          tur={rejim === 'tugagan' ? 'malumot' : 'oddiy'}
          ikonka={rejim === 'tugagan' ? 'tahrir' : 'qulf'}
          amallar={
            <Tugma kichik tur="asosiy" onClick={joriygaQaytish}>
              Joriy smenaga qaytish
              <Ikonka nom="ongga" className="w-4 h-4" />
            </Tugma>
          }
        >
          {rejim === 'tugagan' ? 'Tugagan smena' : 'Arxiv smenasi'}: {qisqaNom({ sana, smena: smenaTuri })}
        </Ogohlantirish>
      )}

      {/* Smena paneli */}
      <SmenaFormasi
        sana={sana}
        smenaTuri={smenaTuri}
        yakunlashniOchish={() => yakunlashniOchish()}
        tugmalarOchiq={smenaBoshqaruvchi && rejim === 'joriy'}
        kontrolchi={kontrolchi}
        setKontrolchi={setKontrolchi}
        master={master}
        setMaster={setMaster}
        maydonlarOchiq={smenaBoshqaruvchi && !faqatKorish}
        pastki={
          smenaBoshqaruvchi && rejim === 'joriy' && joriy ? (
            <Tugma kichik tur="shaffof" ikonka="chapga" onClick={tugaganniOchish}>
              Tugagan smena ({qisqaNom(oldingiSmena(joriy.sana, joriy.smena))})
            </Tugma>
          ) : undefined
        }
      />

      {/* Smena xulosasi */}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Korsatkich ixcham nomi="Jami kg" qiymat={kgFormat(xulosa.kg)} birlik="kg" />
        <Korsatkich ixcham nomi="Rulonlar" qiymat={xulosa.rulon} />
        <Korsatkich ixcham nomi="Moshinalar" qiymat={xulosa.moshina} />
      </div>

      {yakunlashMaqsadi && joriy && (
        <SmenaYakunlashOynasi
          joriy={joriy}
          keyingi={yakunlashMaqsadi}
          xulosa={xulosa}
          tasdiqlash={() => smenagaOtish(yakunlashMaqsadi)}
          yopish={() => setYakunlashMaqsadi(null)}
        />
      )}

      {/* Bo'sh smena: oldingi smenadan ko'chirish (birinchi moshinadan keyin yo'qoladi) */}
      {moshinalar.length === 0 && masterHuquqi && (
        <div className="bg-sirt border border-dashed border-chiziq-2 rounded-karta">
          <BoshHolat
            ikonka="rulon"
            sarlavha="Bu smenada hali moshina yo'q"
            izoh={`Moshinalarni oldingi smenadan (${oldingiNomi}) raqami, talimoti, brendi, ip va loti bilan ko'chiring — keyin faqat operatorlarni tanlaysiz.`}
            amal={
              <div className="flex flex-col sm:flex-row gap-2">
                <Tugma tur="asosiy" ikonka="yuklab" yuklanmoqda={kochirilmoqda} onClick={kochirish}>
                  {kochirilmoqda ? "Ko'chirilmoqda..." : "Oldingi smenadan ko'chirish"}
                </Tugma>
                <Tugma ikonka="qoshish" onClick={moshinaQoshish}>
                  Bo&apos;sh moshina qo&apos;shish
                </Tugma>
              </div>
            }
          />
        </div>
      )}

      {/* Moshinalar */}
      <div className="space-y-3 md:space-y-4">
        {moshinalar.map((moshina) => (
          <div key={`${sana}_${smenaTuri}_${moshina.id}`} className="bg-sirt border border-chiziq rounded-karta overflow-hidden">
            <ApparatCard
              id={moshina.id}
              initialData={moshinaMaqotlari[moshina.id] || {}}
              onDataChange={(data: any) => handleMoshinaDataChange(moshina.id, data)}
              joriySana={sana}
              rol={rol}
              readOnly={faqatKorish}
              raqamTakror={takrorlanadimi(moshina.id)}
              onOchirish={masterHuquqi ? () => moshinaniOchirish(moshina.id) : undefined}
            />
          </div>
        ))}
      </div>

      {masterHuquqi && moshinalar.length > 0 && (
        <div className="flex justify-center pt-2 pb-6">
          <Tugma ikonka="qoshish" onClick={moshinaQoshish} className="w-full sm:w-auto border-dashed">
            Yangi moshina qo&apos;shish
          </Tugma>
        </div>
      )}
    </div>
  );
}
