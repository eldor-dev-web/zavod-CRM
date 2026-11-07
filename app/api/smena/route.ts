import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; 


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sana, smena, kontrolchi, master, moshinalar = [] } = body;

    const prismaMoshinalar = moshinalar.map((m: any) => ({
      raqam: m.raqam || "",
      talimoti: m.talimoti || "",
      brend: m.brend || "",
      ip: m.ip || "",
      lot: m.lot || "",
      operator: m.operator || "",
      operatorId: m.operatorId ? String(m.operatorId) : "",
      rulonlar: {
        create: (m.rulonlar || []).map((r: any, index: number) => {
          let kgVal = null;
          if (r.kg && String(r.kg).trim() !== "") {
            const parsed = parseFloat(String(r.kg).replace(',', '.'));
            if (!isNaN(parsed)) kgVal = parsed;
          }
          
          return {
            tartibRaqam: index + 1,
            kg: kgVal,
            vaqt: r.vaqt || "",
            patlak: r.nuqsonlar?.["Patlak"] || "",
            lycXato: r.nuqsonlar?.["Lyc xato"] || "",
            ignaSiniq: r.nuqsonlar?.["Igna siniq"] || "",
            yogIzi: r.nuqsonlar?.["Yog' izi"] || "",
            kumas: r.nuqsonlar?.["Kumas"] || ""
          };
        })
      }
    }));

    const mavjudSmena = await prisma.smena.findFirst({
      where: { sana: sana, smenaTuri: smena }
    });

    let natija;
    if (mavjudSmena) {
      natija = await prisma.smena.update({
        where: { id: mavjudSmena.id },
        data: {
          kontrolchi: kontrolchi || '',
          master: master || '',
          moshinalar: { deleteMany: {}, create: prismaMoshinalar }
        }
      });
    } else {
      natija = await prisma.smena.create({
        data: {
          sana: sana,
          smenaTuri: smena,
          kontrolchi: kontrolchi || '',
          master: master || '',
          moshinalar: { create: prismaMoshinalar }
        }
      });
    }
    return NextResponse.json(natija, { status: 200 });
  } catch (error) {
    console.error("Smena saqlashda xato:", error);
    return NextResponse.json({ error: "Smena saqlanmadi" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sana = searchParams.get('sana');
    const smena = searchParams.get('smena');

    if (!sana || !smena) {
      return NextResponse.json({ error: "Sana va smena tanlanmagan" }, { status: 400 });
    }

    const topilganSmena = await prisma.smena.findFirst({
      where: { sana: sana, smenaTuri: smena },
      include: {
        moshinalar: { include: { rulonlar: true } }
      }
    });

    let frontendSmena = null;
    if (topilganSmena) {
       frontendSmena = {
         ...topilganSmena,
         moshinalar: topilganSmena.moshinalar.map((m: any) => ({
           ...m,
           id: m.id,
           rulonlar: m.rulonlar.map((r: any) => ({
             kg: r.kg !== null ? String(r.kg) : "",
             vaqt: r.vaqt || "",
             nuqsonlar: {
               "Patlak": r.patlak || "",
               "Lyc xato": r.lycXato || "",
               "Igna siniq": r.ignaSiniq || "",
               "Yog' izi": r.yogIzi || "",
               "Kumas": r.kumas || ""
             }
           }))
         }))
       };
    }
    return NextResponse.json({ smena: frontendSmena || null }, { status: 200 });
  } catch (error) {
    console.error("Smenani yuklashda xato:", error);
    return NextResponse.json({ error: "Smenani yuklashda xato" }, { status: 500 });
  }
}