// Yapay zekâ katmanı: Gemini veya Anthropic üzerinden soru üretimi + çıkmış soru analizi.
// API anahtarı yalnızca tarayıcının localStorage'ında tutulur.

const AI = (() => {
  const VARSAYILAN = { saglayici: "gemini", model: "gemini-2.5-flash", key: "" };

  function ayarOku() {
    try { return { ...VARSAYILAN, ...JSON.parse(localStorage.getItem("kpss_ai") || "{}") }; }
    catch { return { ...VARSAYILAN }; }
  }
  function ayarYaz(a) { localStorage.setItem("kpss_ai", JSON.stringify(a)); }

  function varsayilanModel(saglayici) {
    return saglayici === "anthropic" ? "claude-sonnet-5" : "gemini-2.5-flash";
  }

  async function cagir(prompt) {
    const a = ayarOku();
    if (!a.key) throw new Error("Önce Ayarlar sekmesinden API anahtarını gir.");
    const model = a.model || varsayilanModel(a.saglayici);

    if (a.saglayici === "anthropic") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": a.key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: "user", content: prompt }] })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Anthropic hatası: " + r.status);
      return d.content.map(p => p.text || "").join("");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(a.key)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9 } })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || "Gemini hatası: " + r.status);
    const c = d.candidates?.[0];
    if (!c) throw new Error("Model boş yanıt döndü.");
    return (c.content?.parts || []).map(p => p.text || "").join("");
  }

  function jsonAyikla(metin) {
    let t = metin.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const bas = t.indexOf("["), son = t.lastIndexOf("]");
    if (bas === -1 || son === -1) throw new Error("Model geçerli JSON döndürmedi.");
    return JSON.parse(t.slice(bas, son + 1));
  }

  const SEMA = `Çıktı SADECE geçerli bir JSON dizisi olsun; açıklama, başlık, markdown kod bloğu ekleme.
Her eleman şu alanlara sahip olmalı:
{"ders":"Türkçe|Matematik|Tarih|Coğrafya|Vatandaşlık","konu":"kısa konu adı","zorluk":2 veya 3,"soru":"soru metni","secenekler":["A","B","C","D","E"],"dogru":0-4 arası doğru seçeneğin indeksi,"cozum":"2-3 cümlelik çözüm"}
Kurallar:
- Her soruda tam 5 seçenek olacak.
- Doğru cevabın yeri rastgele dağılsın; hep aynı indeks olmasın.
- Çeldiriciler tipik hatalara dayansın (işlem hatası, kavram karıştırma), rastgele olmasın.
- Matematik sorularının cevabını adım adım hesapla ve doğrulukdan emin ol; "cozum" alanında çözümü göster.
- ÖSYM üslubu: net, tek doğru cevaplı, tartışmaya açık olmayan sorular.
- Türkçe yazım kurallarına uy.`;

  function uretPrompt({ ders, konu, zorluk, adet }) {
    return `Sen KPSS Genel Yetenek-Genel Kültür soru yazarısın. ÖSYM'nin çıkmış sorularının kalıbına birebir uyan, ${zorluk === "zor" ? "zor" : "orta"} seviyede ${adet} adet yeni soru yaz.
Ders: ${ders}
Konu: ${konu || "dersin sık çıkan konularından karışık"}
${SEMA}`;
  }

  function benzerPrompt({ metin, adet }) {
    return `Aşağıda KPSS'de çıkmış sorular var. Önce her birinin hangi konudan ve hangi soru kalıbından geldiğini kendi içinde belirle, sonra AYNI kalıpta ama farklı veri ve bağlamda ${adet} yeni soru yaz. Kopyalama, ezber tekrarı yapma; zorluk seviyesini orijinaliyle aynı ya da bir tık üstünde tut.

ÇIKMIŞ SORULAR:
${metin}

${SEMA}`;
  }

  function analizPrompt(metin) {
    return `Aşağıdaki KPSS çıkmış sorularını bir sınav koçu gibi analiz et. Türkçe, sade ve maddeler hâlinde yaz. Şu başlıkları kullan:

1) KONU DAĞILIMI — her sorunun dersi ve alt konusu.
2) SORU KALIPLARI — ÖSYM'nin bu konuda hangi kalıpları kullandığı.
3) ÇELDİRİCİ MANTIĞI — adayların hangi tuzaklara düştüğü.
4) ÇALIŞMA PLANI — bu sorulara bakarak önce hangi konuların çalışılması gerektiği.
5) TAHMİN — bu tarzda çıkması muhtemel 3 konu.

SORULAR:
${metin}`;
  }

  function dogrula(liste) {
    const dersler = ["Türkçe", "Matematik", "Tarih", "Coğrafya", "Vatandaşlık"];
    return liste.filter(s =>
      s && typeof s.soru === "string" && s.soru.trim().length > 10 &&
      Array.isArray(s.secenekler) && s.secenekler.length === 5 &&
      s.secenekler.every(x => typeof x === "string" && x.trim()) &&
      Number.isInteger(s.dogru) && s.dogru >= 0 && s.dogru <= 4
    ).map((s, i) => ({
      id: "AI" + Date.now().toString(36) + i,
      ders: dersler.includes(s.ders) ? s.ders : "Genel",
      konu: (s.konu || "Karışık").toString().slice(0, 60),
      zorluk: s.zorluk === 2 ? 2 : 3,
      soru: s.soru.trim(),
      secenekler: s.secenekler.map(x => x.trim()),
      dogru: s.dogru,
      cozum: (s.cozum || "").toString().trim(),
      uretilen: true
    }));
  }

  return {
    ayarOku, ayarYaz, varsayilanModel,
    analiz: metin => cagir(analizPrompt(metin)),
    uret: async opt => dogrula(jsonAyikla(await cagir(uretPrompt(opt)))),
    benzer: async opt => dogrula(jsonAyikla(await cagir(benzerPrompt(opt))))
  };
})();
