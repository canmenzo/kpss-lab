// Yapay zekâ katmanı: Gemini veya Anthropic üzerinden soru üretimi, analiz, açıklama ve koçluk.
// API anahtarı yalnızca tarayıcının localStorage'ında tutulur.

const AI = (() => {
  const VARSAYILAN = { saglayici: "gemini", model: "gemini-2.5-flash", key: "" };
  const SEVIYE = { 1: "kolay", 2: "orta", 3: "zor", 4: "çok zor (ayırt edici)" };

  function ayarOku() {
    try { return { ...VARSAYILAN, ...JSON.parse(localStorage.getItem("kpss_ai") || "{}") }; }
    catch { return { ...VARSAYILAN }; }
  }
  const ayarYaz = a => localStorage.setItem("kpss_ai", JSON.stringify(a));
  const varsayilanModel = s => (s === "anthropic" ? "claude-sonnet-5" : "gemini-2.5-flash");
  const hazirMi = () => !!ayarOku().key;

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
        body: JSON.stringify({ model, max_tokens: 8000, messages: [{ role: "user", content: prompt }] })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || "Anthropic hatası: " + r.status);
      return d.content.map(p => p.text || "").join("");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(a.key)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 8000 } })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error?.message || "Gemini hatası: " + r.status);
    const c = d.candidates?.[0];
    if (!c) throw new Error("Model boş yanıt döndü.");
    return (c.content?.parts || []).map(p => p.text || "").join("");
  }

  function jsonAyikla(metin) {
    const t = metin.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const bas = t.indexOf("["), son = t.lastIndexOf("]");
    if (bas === -1 || son === -1) throw new Error("Model geçerli JSON döndürmedi, tekrar dene.");
    return JSON.parse(t.slice(bas, son + 1));
  }

  const SEMA = `Çıktı SADECE geçerli bir JSON dizisi olsun; açıklama, başlık ya da markdown kod bloğu ekleme.
Her eleman şu alanlara sahip olacak:
{"ders":"Türkçe|Matematik|Tarih|Coğrafya|Vatandaşlık","konu":"kısa konu adı","zorluk":1-4 arası tam sayı (1 kolay, 2 orta, 3 zor, 4 çok zor),"soru":"soru metni","secenekler":["A","B","C","D","E"],"dogru":doğru seçeneğin 0-4 arası indeksi,"cozum":"neden bu cevap doğru, diğerleri neden yanlış - 3-5 cümle, adım adım","ipucu":"bu soru tipini bir daha gördüğünde işine yarayacak kalıcı püf noktası, kısayol veya ezber formülü - 1-2 cümle"}
Kurallar:
- Her soruda tam 5 seçenek olacak.
- Doğru cevabın indeksi sorular arasında rastgele dağılsın; hep aynı olmasın.
- Çeldiriciler adayların gerçekte yaptığı hatalara dayansın (işlem hatası, kavram karıştırma, tarih karıştırma), rastgele olmasın.
- Matematik sorularında sonucu adım adım hesapla ve doğruluğundan emin ol; şıklardan biri mutlaka doğru sonuç olsun.
- "cozum" alanı yalnızca sonucu söylemesin; yöntemi anlatsın ve varsa tuzağı belirtsin.
- "ipucu" alanı o soruya özel değil, o SORU TİPİNE dair genellenebilir bir taktik olsun.
- ÖSYM üslubu: net, tek doğru cevaplı, tartışmaya açık olmayan sorular. Türkçe yazım kurallarına uy.`;

  const uretPrompt = ({ ders, konu, zorluk, adet }) =>
    `Sen KPSS Genel Yetenek-Genel Kültür soru yazarısın. ÖSYM'nin çıkmış sorularının kalıbına uyan, ${SEVIYE[zorluk] || "zor"} seviyede ${adet} adet yeni soru yaz.
Ders: ${ders}
Konu: ${konu || "dersin sık çıkan konularından karışık"}
${SEMA}`;

  const benzerPrompt = ({ metin, adet }) =>
    `Aşağıda KPSS'de çıkmış sorular var. Önce her birinin hangi konudan ve hangi soru kalıbından geldiğini kendi içinde belirle, sonra AYNI kalıpta ama farklı veri ve bağlamda ${adet} yeni soru yaz. Kopyalama; zorluk seviyesini orijinaliyle aynı ya da bir tık üstünde tut.

ÇIKMIŞ SORULAR:
${metin}

${SEMA}`;

  const analizPrompt = metin =>
    `Aşağıdaki KPSS çıkmış sorularını bir sınav koçu gibi analiz et. Türkçe, sade ve maddeler hâlinde yaz. Şu başlıkları kullan:

1) KONU DAĞILIMI — her sorunun dersi ve alt konusu.
2) SORU KALIPLARI — ÖSYM'nin bu konularda kullandığı kalıplar.
3) ÇELDİRİCİ MANTIĞI — adayların hangi tuzaklara düştüğü.
4) PÜF NOKTALARI — bu soru tiplerini hızlı çözmenin yolları.
5) ÇALIŞMA PLANI — önce hangi konuların çalışılması gerektiği.
6) TAHMİN — bu tarzda çıkması muhtemel 3 konu.

SORULAR:
${metin}`;

  const aciklaPrompt = q =>
    `Bir KPSS öğrencisi aşağıdaki soruyu anlamadı. Ona özel ders veriyormuş gibi, sıfırdan ve adım adım anlat. Kısa tut (en fazla 200 kelime), maddeler kullan. Sırasıyla: (1) soru ne istiyor, (2) çözüm adımları, (3) diğer şıklar neden yanlış, (4) bu tipi bir daha gördüğünde ne yapmalı.

SORU: ${q.soru}
ŞIKLAR: ${q.secenekler.map((s, i) => "ABCDE"[i] + ") " + s).join(" | ")}
DOĞRU CEVAP: ${"ABCDE"[q.dogru]}) ${q.secenekler[q.dogru]}
KONU: ${q.ders} - ${q.konu}`;

  const kocPrompt = ozet =>
    `Sen bir KPSS çalışma koçusun. Aşağıda öğrencinin gerçek deneme istatistikleri var. Bu verilere bakarak Türkçe, somut ve uygulanabilir bir plan yaz. Genel geçer motivasyon cümleleri kurma, sadece verideki zayıflıklara odaklan.
Şu başlıkları kullan: (1) DURUM TESPİTİ, (2) ÖNCELİKLİ 3 KONU ve nedeni, (3) BU HAFTANIN PLANI (gün gün, kaç soru), (4) SINAV TAKTİĞİ (süre yönetimi ve boş bırakma stratejisi).

VERİLER:
${ozet}`;

  const yorumPrompt = ozet =>
    `Bir KPSS öğrencisi deneme çözdü. Sonucunu kısa (en fazla 150 kelime), net ve yol gösterici biçimde yorumla: neyi iyi yapmış, hangi konuda kanaması var, bir sonraki çalışmada ne yapmalı. Abartılı övgü veya azarlama yok.

DENEME SONUCU:
${ozet}`;

  function dogrula(liste) {
    const dersler = ["Türkçe", "Matematik", "Tarih", "Coğrafya", "Vatandaşlık"];
    return liste.filter(s =>
      s && typeof s.soru === "string" && s.soru.trim().length > 10 &&
      Array.isArray(s.secenekler) && s.secenekler.length === 5 &&
      s.secenekler.every(x => typeof x === "string" && x.trim()) &&
      new Set(s.secenekler.map(x => x.trim())).size === 5 &&
      Number.isInteger(s.dogru) && s.dogru >= 0 && s.dogru <= 4
    ).map((s, i) => ({
      id: "AI" + Date.now().toString(36) + i,
      ders: dersler.includes(s.ders) ? s.ders : "Genel",
      konu: (s.konu || "Karışık").toString().slice(0, 60),
      zorluk: [1, 2, 3, 4].includes(s.zorluk) ? s.zorluk : 3,
      soru: s.soru.trim(),
      secenekler: s.secenekler.map(x => x.trim()),
      dogru: s.dogru,
      cozum: (s.cozum || "").toString().trim(),
      ipucu: (s.ipucu || "").toString().trim(),
      uretilen: true
    }));
  }

  return {
    ayarOku, ayarYaz, varsayilanModel, hazirMi,
    analiz: metin => cagir(analizPrompt(metin)),
    acikla: q => cagir(aciklaPrompt(q)),
    koc: ozet => cagir(kocPrompt(ozet)),
    yorum: ozet => cagir(yorumPrompt(ozet)),
    uret: async opt => dogrula(jsonAyikla(await cagir(uretPrompt(opt)))),
    benzer: async opt => dogrula(jsonAyikla(await cagir(benzerPrompt(opt))))
  };
})();
