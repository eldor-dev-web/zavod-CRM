import React from 'react';
import { cn } from './cn';

// Oq blok. sarlavha/amallar berilsa — tepada sarlavha qatori chiqadi.
export default function Karta({
  sarlavha,
  izoh,
  amallar,
  className,
  ichki = true,
  children
}: {
  sarlavha?: React.ReactNode;
  izoh?: React.ReactNode;
  amallar?: React.ReactNode;
  className?: string;
  ichki?: boolean; // ichki bo'shliq (jadval uchun false)
  children?: React.ReactNode;
}) {
  return (
    <section className={cn('bg-sirt border border-chiziq rounded-karta', className)}>
      {(sarlavha || amallar) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3.5 border-b border-chiziq">
          <div className="min-w-0">
            {sarlavha && <h2 className="text-base font-semibold text-matn">{sarlavha}</h2>}
            {izoh && <p className="text-sm text-matn-2 mt-0.5">{izoh}</p>}
          </div>
          {amallar && <div className="flex flex-wrap items-center gap-2">{amallar}</div>}
        </header>
      )}
      <div className={ichki ? 'p-4 md:p-5' : ''}>{children}</div>
    </section>
  );
}
