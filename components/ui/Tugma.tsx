import React from 'react';
import Ikonka, { type IkonkaNomi } from './Ikonka';
import { cn } from './cn';

type Tur = 'asosiy' | 'ikkinchi' | 'shaffof' | 'xavfli';

const TURLAR: Record<Tur, string> = {
  asosiy: 'bg-asosiy text-white hover:bg-asosiy-toq',
  ikkinchi: 'bg-sirt text-matn border border-chiziq-2 hover:bg-sirt-2',
  shaffof: 'bg-transparent text-matn-2 hover:bg-sirt-2 hover:text-matn',
  xavfli: 'bg-xato-fon text-white hover:bg-xato'
};

// Tugma: telefonda 44 px (barmoq uchun), kompyuterda 40 px. "kichik": 36/32 px.
export default function Tugma({
  tur = 'ikkinchi',
  kichik = false,
  ikonka,
  yuklanmoqda = false,
  toliq = false,
  className,
  children,
  disabled,
  type = 'button',
  ...qolgan
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tur?: Tur;
  kichik?: boolean;
  ikonka?: IkonkaNomi;
  yuklanmoqda?: boolean;
  toliq?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || yuklanmoqda}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-boshqaruv font-semibold transition-colors select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-asosiy/40 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]',
        kichik ? 'h-9 md:h-8 px-3 text-sm' : 'h-11 md:h-10 px-4 text-sm',
        toliq && 'w-full',
        TURLAR[tur],
        className
      )}
      {...qolgan}
    >
      {yuklanmoqda ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
      ) : (
        ikonka && <Ikonka nom={ikonka} className={kichik ? 'w-4 h-4' : 'w-[18px] h-[18px]'} />
      )}
      {children}
    </button>
  );
}
