import React from 'react';

// Sahifa sarlavhasi: nom + izoh + o'ngda amallar.
// Telefonda menyu tugmasi (☰) uchun joyni umumiy qolip (layout) beradi.
export default function SahifaSarlavhasi({ sarlavha, izoh, amallar }: { sarlavha: React.ReactNode; izoh?: React.ReactNode; amallar?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5 md:mb-6 min-h-10">
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-matn leading-tight">{sarlavha}</h1>
        {izoh && <p className="mt-1 text-sm text-matn-2">{izoh}</p>}
      </div>
      {amallar && <div className="flex flex-wrap items-center gap-2">{amallar}</div>}
    </div>
  );
}
