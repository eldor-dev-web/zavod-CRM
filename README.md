# 🏭 Zavod CRM - Ishlab chiqarishni boshqarish tizimi

Zavod CRM — bu to'qimachilik va ishlab chiqarish korxonalari uchun maxsus ishlab chiqilgan, bulutli texnologiyalarga asoslangan zamonaviy boshqaruv tizimi (SaaS). Bu dastur smenalarni boshqarish, mahsulot (rulon) og'irliklarini hisoblash, xodimlar ishbay maoshini chiqarish va brak (yaroqsiz) mahsulotlarni avtomatlashtirilgan tarzda nazorat qilish uchun mo'ljallangan.

## 🚀 Asosiy Imkoniyatlar (Features)

- **Smenalar nazorati (Shift Management):** Kunduzgi va tungi smenalarni, master hamda kontrolchilarni ro'yxatga olish.
- **Rulonlar hisobi:** Har bir apparat (moshina) va operator kesimida to'qilgan rulonlar og'irligini (kg) real vaqt rejimida kiritish va umumiy hisob-kitob qilish.
- **Brak va nuqsonlar nazorati (Quality Control):** Igna sinishi, Lyc xatosi, Yog' izi kabi nuqsonlarni qayd etish. M'eyordan ortiqcha braklar uchun jarimalarni avtomat hisoblash.
- **Oylik maosh tizimi:** Operatorlarning to'qigan mahsulotiga qarab ishbay oyliklarini chiqarish va jarimalarni ushlab qolish.
- **Gibrid tezkorlik (SWR):** Ma'lumotlar bir vaqtning o'zida ham LocalStorage'da (0 soniyada yuklanish uchun), ham Neon bulutli bazasida saqlanadi. Internetsiz holatda ham qotib qolmaydi.
- **Darajali kirish (Role-based Access):** Admin, Master va Kontrolchilar uchun alohida huquqlar va himoyalangan interfeys.

## 🛠 Texnologiyalar (Tech Stack)

Dastur eng zamonaviy va tezkor veb-texnologiyalar asosida qurilgan:

- **Frontend:** React 18, Next.js 14 (App Router)
- **Backend/API:** Next.js Route Handlers
- **Ma'lumotlar bazasi:** PostgreSQL (Neon Serverless DB)
- **ORM:** Prisma
- **Dizayn & UI:** Tailwind CSS
- **Til:** TypeScript

## 📦 O'rnatish va Ishga tushirish (Local Setup)

Loyiha nusxasini o'z kompyuteringizda ishga tushirish uchun quyidagi qadamlarni bajaring:

**1. Loyihani yuklab olish va kutubxonalarni o'rnatish:**
```bash
git clone [https://github.com/eldor-dev-web/zavod-crm.git](https://github.com/eldor-dev-web/zavod-crm.git)
cd zavod-crm
npm install