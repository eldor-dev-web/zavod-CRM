import React from 'react';
import { tungimi } from '@/lib/smena';
import { Ikonka, Maydon } from '@/components/ui';

// Smena paneli: sana (o'zgarmaydi — joriy smenadan keladi), smena belgisi (bosilsa yakunlash oynasi),
// kontrolchi va master. Pastda qo'shimcha amallar (masalan, "Tugagan smena") uchun joy.
export default function SmenaFormasi({
  sana,
  smenaTuri,
  yakunlashniOchish,
  tugmalarOchiq,
  kontrolchi,
  setKontrolchi,
  master,
  setMaster,
  maydonlarOchiq = true,
  pastki
}: {
  sana: string;
  smenaTuri: string;
  yakunlashniOchish: () => void;
  tugmalarOchiq: boolean;
  kontrolchi: string;
  setKontrolchi: (v: string) => void;
  master: string;
  setMaster: (v: string) => void;
  maydonlarOchiq?: boolean;
  pastki?: React.ReactNode;
}) {
  const tun = tungimi(smenaTuri || '');

  return (
    <section className="bg-sirt border border-chiziq rounded-karta p-4 md:p-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <span className="block mb-1.5 text-sm font-semibold text-matn-2">Sana</span>
          <div className="h-11 md:h-10 px-3 rounded-boshqaruv bg-sirt-2 border border-chiziq flex items-center gap-2 text-base md:text-sm font-semibold text-matn tabular-nums">
            <Ikonka nom="kalendar" className="w-4 h-4 text-matn-3" />
            {sana ? sana.split('-').reverse().join('.') : '...'}
          </div>
        </div>

        <div>
          <span className="block mb-1.5 text-sm font-semibold text-matn-2">Smena</span>
          <button
            type="button"
            disabled={!tugmalarOchiq}
            onClick={yakunlashniOchish}
            title={tugmalarOchiq ? 'Smenani yakunlash' : undefined}
            className={`w-full h-11 md:h-10 px-3 rounded-boshqaruv flex items-center justify-between gap-2 text-sm font-semibold transition disabled:cursor-default ${
              tun ? 'bg-noch text-white' : 'bg-den-och text-diqqat border border-amber-200'
            } ${tugmalarOchiq ? 'hover:brightness-95 active:scale-[0.98]' : ''}`}
          >
            <span className="flex items-center gap-2">
              <Ikonka nom={tun ? 'oy' : 'quyosh'} className="w-[18px] h-[18px]" />
              {tun ? 'NOCH' : 'DEN'}
            </span>
            {tugmalarOchiq && <Ikonka nom="almashtirish" className="w-4 h-4 opacity-70" />}
          </button>
        </div>

        <Maydon
          yorliq="Kontrolchi"
          value={kontrolchi}
          disabled={!maydonlarOchiq}
          onChange={(e) => setKontrolchi(e.target.value)}
          placeholder="Kontrolchi ismi"
        />
        <Maydon yorliq="Master" value={master} disabled={!maydonlarOchiq} onChange={(e) => setMaster(e.target.value)} placeholder="Master ismi" />
      </div>

      {pastki && <div className="mt-4 pt-4 border-t border-chiziq flex flex-wrap items-center gap-2">{pastki}</div>}
    </section>
  );
}

