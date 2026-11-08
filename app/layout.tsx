import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
    <html lang="uz">
      <body className="flex h-screen bg-gray-100 text-gray-900">
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