import { useState, useEffect, useRef, useCallback } from 'react';

export function useRulonlar() {
  const [moshinalar, setMoshinalar] = useState<any[]>([]);
  const [sana, setSana] = useState('');
  const [smenaTuri, setSmenaTuri] = useState('');
  const [kontrolchi, setKontrolchi] = useState('');
  const [master, setMaster] = useState('');
  const [moshinaMaqotlari, setMoshinaMaqotlari] = useState<Record<number, any>>({});
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const isFirstSave = useRef(true); 

  const dataRef = useRef({ sana, smenaTuri, kontrolchi, master, moshinaMaqotlari });
  dataRef.current = { sana, smenaTuri, kontrolchi, master, moshinaMaqotlari };

  // 🚀 YANGI: Sanani avtomat "bugun"ga sakratish o'rniga, oxirgi tanlangan xotirani o'qiymiz
  useEffect(() => {
    const saqlanganSana = localStorage.getItem('zavod_oxirgi_sana');
    const saqlanganSmena = localStorage.getItem('zavod_oxirgi_smena');
    
    if (saqlanganSana) {
      setSana(saqlanganSana);
    } else {
      setSana(new Date().toISOString().split('T')[0]);
    }

    if (saqlanganSmena) {
      setSmenaTuri(saqlanganSmena);
    } else {
      setSmenaTuri('DEN (Kunduzgi)');
    }
    
    setIsInitialized(true);
  }, []);

  // 🚀 YANGI: Qo'lda qaysi sana/smena tanlansa, shuni "xotiraga" mixlab qo'yamiz
  useEffect(() => {
    if (sana) localStorage.setItem('zavod_oxirgi_sana', sana);
  }, [sana]);

  useEffect(() => {
    if (smenaTuri) localStorage.setItem('zavod_oxirgi_smena', smenaTuri);
  }, [smenaTuri]);

  // QOLGAN BARCHA KODLAR O'ZGARISHSIZ QOLDI
  useEffect(() => {
    if (!sana || !smenaTuri || !isInitialized) return;

    const localKey = `zavod_smena_${sana}_${smenaTuri}`;
    const localDataStr = localStorage.getItem(localKey);
    let localDataMavjud = false;

    if (localDataStr) {
      try {
        const parsed = JSON.parse(localDataStr);
        if (parsed && parsed.kontrolchi !== undefined) {
          setKontrolchi(parsed.kontrolchi || '');
          setMaster(parsed.master || '');
          if (parsed.moshinalar && parsed.moshinalar.length > 0) {
            const yangiMoshinalar: any[] = [];
            const yangiMaqotlar: Record<number, any> = {};
            parsed.moshinalar.forEach((m: any, index: number) => {
              const id = m.id || Date.now() + index;
              yangiMoshinalar.push({ id });
              yangiMaqotlar[id] = m;
            });
            setMoshinalar(yangiMoshinalar);
            setMoshinaMaqotlari(yangiMaqotlar);
          } else {
            // Agar moshinalar yo'q bo'lsa, tozalash kerak (yangi kunga o'tganda eski ma'lumot qolib ketmasligi uchun)
            setMoshinalar([]);
            setMoshinaMaqotlari({});
          }
          localDataMavjud = true;
          setIsLoaded(true); 
        }
      } catch (e) { console.log(e) }
    } else {
      // Localda bu kun uchun hech nima yo'q bo'lsa tozalash
      setKontrolchi('');
      setMaster('');
      setMoshinalar([]);
      setMoshinaMaqotlari({});
    }

    const bazadanOqish = async () => {
      if (!localDataMavjud) setIsLoaded(false); 

      try {
        const res = await fetch(`/api/smena?sana=${sana}&smena=${encodeURIComponent(smenaTuri)}&t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.smena) {
            setKontrolchi(data.smena.kontrolchi || '');
            setMaster(data.smena.master || '');
            
            if (data.smena.moshinalar && data.smena.moshinalar.length > 0) {
              const yangiMoshinalar: any[] = [];
              const yangiMaqotlar: Record<number, any> = {};
              
              data.smena.moshinalar.forEach((m: any, index: number) => {
                const id = m.id || Date.now() + index; 
                yangiMoshinalar.push({ id });
                yangiMaqotlar[id] = m;
              });
              
              setMoshinalar(yangiMoshinalar);
              setMoshinaMaqotlari(yangiMaqotlar);

              localStorage.setItem(localKey, JSON.stringify({
                  sana, smenaTuri, kontrolchi: data.smena.kontrolchi, master: data.smena.master, moshinalar: data.smena.moshinalar
              }));
            }
          }
        }
      } catch (e) {
        console.error("Neon DB dan o'qishda xatolik:", e);
      } finally {
        setIsLoaded(true);
        setTimeout(() => { isFirstSave.current = false; }, 300); 
      }
    };
    
    bazadanOqish();
  }, [sana, smenaTuri, isInitialized]);

  const bazagaSaqlash = useCallback(async (currentData: typeof dataRef.current) => {
    if (!currentData.sana) return;
    try {
      const payload = {
        sana: currentData.sana,
        smena: currentData.smenaTuri,
        kontrolchi: currentData.kontrolchi,
        master: currentData.master,
        moshinalar: Object.values(currentData.moshinaMaqotlari)
      };

      localStorage.setItem(`zavod_smena_${currentData.sana}_${currentData.smenaTuri}`, JSON.stringify(payload));

      await fetch('/api/smena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        keepalive: true
      });
    } catch (error) {
      console.error("Bazaga saqlashda xato:", error);
    }
  }, []);

  useEffect(() => {
    if (!sana || !isLoaded) return;

    if (isFirstSave.current) return; 

    const taymer = setTimeout(() => {
      bazagaSaqlash({ sana, smenaTuri, kontrolchi, master, moshinaMaqotlari });
    }, 1500); 

    return () => clearTimeout(taymer);
  }, [sana, smenaTuri, kontrolchi, master, moshinaMaqotlari, isLoaded, bazagaSaqlash]);

  useEffect(() => {
    if (!sana || !isInitialized) return;
    const joriyYilOy = sana.slice(0, 7);
    const kun = Number(sana.split('-')[2]);
    const ishchilarBazasi = JSON.parse(localStorage.getItem(`zavod_ishchilar_${joriyYilOy}`) || localStorage.getItem('zavod_ishchilar_bazasi') || '[]');

    const meyyorlar = JSON.parse(localStorage.getItem('zavod_brak_meyyori') || '{"igna": 0, "lux": 0}');
    const ignaMeyyor = Number(meyyorlar.igna) || 0;
    const luxMeyyor = Number(meyyorlar.lux) || 0;

    const joriyBraklar: Record<string, { igna: number, lux: number }> = {};
    
    Object.values(moshinaMaqotlari).forEach((mData: any) => {
      let opId = mData.operatorId;
      if (!opId && mData.operator) {
        const topilganIshchi = ishchilarBazasi.find((x: any) => x.ism?.toLowerCase().trim() === String(mData.operator).toLowerCase().trim());
        if (topilganIshchi) opId = topilganIshchi.id;
      }
      
      if (opId && mData.rulonlar && Array.isArray(mData.rulonlar)) {
        let moshinaIgna = 0, moshinaLux = 0;
        
        mData.rulonlar.forEach((rulon: any) => {
          if (rulon.nuqsonlar) {
            const ignaKiritilgan = Number(rulon.nuqsonlar["Igna siniq"] || 0);
            const luxKiritilgan = Number(rulon.nuqsonlar["Lyc xato"] || 0);
            
            const haqiqiyIgna = ignaKiritilgan >= ignaMeyyor ? ignaKiritilgan : 0;
            const haqiqiyLux = luxKiritilgan >= luxMeyyor ? luxKiritilgan : 0;

            moshinaIgna += haqiqiyIgna;
            moshinaLux += haqiqiyLux;
          }
        });

        if (moshinaIgna > 0 || moshinaLux > 0) {
          const kalit = `${opId}_${kun}`;
          if (!joriyBraklar[kalit]) joriyBraklar[kalit] = { igna: 0, lux: 0 };
          joriyBraklar[kalit].igna += moshinaIgna;
          joriyBraklar[kalit].lux += moshinaLux;
        }
      }
    });

    const shadowKey = `zavod_brak_shadow_${sana}_${smenaTuri}`;
    const oldingiBraklar = JSON.parse(localStorage.getItem(shadowKey) || '{}');
    const brakXotiraNomi = `zavod_brak_jadval_${joriyYilOy}`;
    const brakTable = JSON.parse(localStorage.getItem(brakXotiraNomi) || '{}');

    Object.keys(oldingiBraklar).forEach(kalit => {
      if (brakTable[kalit]) {
        brakTable[kalit].igna = Math.max(0, (Number(brakTable[kalit].igna) || 0) - (oldingiBraklar[kalit].igna || 0));
        brakTable[kalit].lux = Math.max(0, (Number(brakTable[kalit].lux) || 0) - (oldingiBraklar[kalit].lux || 0));
      }
    });

    Object.keys(joriyBraklar).forEach(kalit => {
      if (!brakTable[kalit]) brakTable[kalit] = { igna: '', lux: '' };
      brakTable[kalit].igna = (Number(brakTable[kalit].igna) || 0) + joriyBraklar[kalit].igna;
      brakTable[kalit].lux = (Number(brakTable[kalit].lux) || 0) + joriyBraklar[kalit].lux;
    });

    localStorage.setItem(brakXotiraNomi, JSON.stringify(brakTable));
    localStorage.setItem(shadowKey, JSON.stringify(joriyBraklar));

    window.dispatchEvent(new Event('braklar_yangilandi'));

  }, [moshinaMaqotlari, sana, smenaTuri, isInitialized]);

  const moshinaQoshish = () => {
    const newId = Date.now();
    setMoshinalar(prev => [...prev, { id: newId }]);
    setMoshinaMaqotlari(prev => ({
      ...prev,
      [newId]: { id: newId, raqam: '', talimoti: '', ip: '', lot: '', brend: '', operator: '', operatorId: null, rulonlar: [] }
    }));
  };
  
  const jadvalniOchirish = (idToRemove: number) => {
    if (window.confirm("Ushbu moshina jadvalini o'chirib yubormoqchimisiz?")) {
      setMoshinalar(prev => prev.filter(m => m.id !== idToRemove));
      setMoshinaMaqotlari(prev => { const yangi = { ...prev }; delete yangi[idToRemove]; return yangi; });
    }
  };

  const handleMoshinaDataChange = (id: number, data: any) => setMoshinaMaqotlari(prev => ({ ...prev, [id]: data }));

  const yangiSmenagaOtish = () => {
    if (smenaTuri.includes('DEN')) { setSmenaTuri('NOCH (Tungi)'); } 
    else {
      const joriySana = new Date(sana); joriySana.setDate(joriySana.getDate() + 1);
      setSana(joriySana.toISOString().split('T')[0]); setSmenaTuri('DEN (Kunduzgi)');
    }
  };

  return {
    moshinalar, sana, setSana, smenaTuri, setSmenaTuri, kontrolchi, setKontrolchi, master, setMaster,
    moshinaMaqotlari, moshinaQoshish, jadvalniOchirish, handleMoshinaDataChange, yangiSmenagaOtish,
    isLoaded 
  };
}