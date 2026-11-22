import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BazaSinxron from "@/components/BazaSinxron";
import UiQatlami from "@/components/ui/UiQatlami";

// Inter: lotin (o', g'), kengaytirilgan lotin va kirill harflari; jadvaldagi raqamlar tekis turadi
const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Zavod CRM",
  description: "To'quv sexi boshqaruv tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={inter.variable}>
      <body className="flex h-screen bg-fon text-matn font-sans">
        {/* PostgreSQL baza bilan avtomatik sinxronizatsiya */}
        <BazaSinxron />
        {/* Tasdiqlash oynalari va xabarlar (toast) — butun ilova uchun bitta */}
        <UiQatlami />

        {/* Chap tomonda menyu */}
        <Sidebar />
        
        {/* O'ng tomonda asosiy oyna */}
        <main className="flex-1 p-0 md:p-8 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </body>
    </html>
  );
}