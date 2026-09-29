# 🎓 KPSS Lab

> Genel Yetenek – Genel Kültür çalışma uygulaması. **Kurulum yok, sunucu yok, hesap yok.** `index.html`'e çift tıkla, çalışıyor.
>
> 🌐 **Canlı sürüm:** https://canmenzo.com/kpss-lab/ (indirmeden kullan, telefona da kurulur)

<p align="left">
  <img alt="soru" src="https://img.shields.io/badge/soru%20bankas%C4%B1-275-2ea44f?style=flat-square">
  <img alt="kart" src="https://img.shields.io/badge/tekrar%20kart%C4%B1-109-8a63d2?style=flat-square">
  <img alt="konu" src="https://img.shields.io/badge/alt%20konu-106-0969da?style=flat-square">
  <img alt="bagimlilik" src="https://img.shields.io/badge/ba%C4%9F%C4%B1ml%C4%B1l%C4%B1k-0-lightgrey?style=flat-square">
  <img alt="pwa" src="https://img.shields.io/badge/PWA-telefona%20kurulur-orange?style=flat-square">
</p>

---

## 📚 İçerik

**275 soru**, hepsi detaylı çözümlü ve püf noktalı:

| 📖 Ders | Soru |
|---|---|
| 🔤 Türkçe | 70 |
| ➗ Matematik | 70 |
| 🏛️ Tarih | 60 |
| 🌍 Coğrafya | 50 |
| ⚖️ Vatandaşlık | 25 |
| **Toplam** | **275** |

**106 alt konu**, dört zorluk seviyesi: 🟢 Kolay · 🟡 Orta · 🟠 Zor · 🔴 Çok Zor.
Aralarında **tablo, grafik ve şema okuma** soruları da var (gerçek sınavdaki gibi).

Her soruda iki ayrı kutu:

- 🧩 **Çözüm**: cevabın neden doğru, diğer şıkların neden yanlış olduğu, adım adım.
- 💡 **Püf noktası**: o soru tipini bir daha gördüğünde işine yarayacak kalıcı taktik, kısayol ya da ezber formülü.

---

## 🏃 Çalışma modları

| Mod | Ne yapar |
|---|---|
| 📝 **Deneme Sınavı** | Ders + zorluk + soru sayısı + süre seçersin. Sayaç, soru paleti, işaretleme, ilerleme çubuğu. |
| 🎯 **KPSS Formatı** | Gerçek sınavın ders dağılımıyla karma deneme (Türkçe %25, Matematik %25, Tarih %22,5, Coğrafya %15, Vatandaşlık %12,5). 30 / 60 / 120 soru, süre otomatik. |
| 📖 **Konu Çalışması** | Süresiz. Şıkkı işaretler işaretlemez doğru cevap, çözüm ve püf noktası açılır. |
| 🔁 **Akıllı Tekrar** | Aralıklı tekrar: doğru yaptıkça soru 1 → 3 → 7 → 16 → 35 gün sonra tekrar karşına çıkar, yanlışta baştan başlar. |
| ❌ **Yanlışlarım** | Bir kez bile doğru yapamadığın sorular. Doğru yapınca havuzdan düşer. |
| ⚡ **Hızlı Tekrar Kartları** | 109 kart, 7 deste: Deyimler, Atasözleri, Yazım Kuralları, Tarih Yılları, Coğrafya Enleri, Anayasa Sayıları, Matematik Formülleri. Bildim / bilmedim ile ilerler. |
| ⏱️ **Tempo modu** | Deneme ve formatta açılır: soru başına 65 saniye (gerçek KPSS temposu). Yavaş kaldığında uyarır. |

⌨️ Sınav sırasında: `A`–`E` şık seçer, `←` `→` soru değiştirir. Cevaplamadan önce püf noktası alabilir, hatalı bulduğun soruyu bankadan gizleyebilirsin.

---

## 📊 Sonuç ve istatistik

- ✅ Doğru / yanlış / boş / net + başarı halkası
- 📈 Ders bazlı başarı tablosu ve zayıf konu listesi
- ⏳ **Süre analizi**: soru başına ortalama saniye ve en çok vakit yediğin konular (gerçek KPSS'de ortalama 65 sn)
- 🔍 Soru soru inceleme; yalnız yanlışları / boşları filtreleme
- 📉 Gelişim grafiği (son 12 deneme), zorluk seviyesine göre başarı, son denemeler tablosu
- 🔥 Günlük soru hedefi ve **günlük seri** takibi
- 🎉 Konfeti, ses efektleri ve sayaç animasyonları (Ayarlar'dan kapatılabilir)

---

## 🧮 Hedef Puan Hesaplayıcı

Genel Yetenek ve Genel Kültür netini gir (ya da **son denemenin netleriyle doldur**), kaba KPSS P3 puanını gösterir:

- 🎯 Hedef puanın için kaç net gerektiğini söyler
- 📋 Net – puan tablosu
- 🧠 Formül açık: `puan ≈ 39 + 0,5 × toplam net` (geçmiş yıl tablolarına oturtulmuş doğrusal yaklaşım, ±3-4 puan)

---

## 🤖 AI Lab

Ayarlar'dan bir API anahtarı girilince açılan kısım:

| Özellik | Ne yapar |
|---|---|
| 🔬 **Çıkmış soru analizi** | Soruları yapıştır; konu dağılımı, ÖSYM'nin kullandığı soru kalıpları, çeldirici mantığı, püf noktaları ve çalışma planı çıkarır. |
| 🧬 **Benzer soru üretimi** | Aynı kalıpta, farklı veriyle yeni sorular yazar. |
| ✍️ **Konudan üretim** | Ders + konu + zorluk + adet seçip sıfırdan soru ürettirirsin. |
| 🎯 **Zayıf konularımdan üret** | İstatistiklerine bakıp en çok yanlış yaptığın konulardan hedefli soru üretir. |
| 👩‍🏫 **Soruyu bana açıkla** | Anlamadığın soruyu özel ders gibi adım adım anlattırır. |
| 🧭 **AI koç** | Deneme geçmişine bakıp gün gün çalışma planı ve sınav taktiği yazar. |

Üretilen sorular çözümü ve püf noktasıyla birlikte bankaya eklenir, 💾 JSON olarak dışa aktarılabilir.

---

## 🚀 Kurulum

1. https://canmenzo.com/kpss-lab/ adresini aç ya da depoyu indirip `index.html`'i tarayıcıda aç. **275 soru hazır; AI olmadan da tam çalışır.**
2. AI Lab için ⚙️ **Ayarlar** → sağlayıcı seç → API anahtarını yapıştır → Kaydet.
   - 🟦 **Google Gemini** (ücretsiz katman yeterli): https://aistudio.google.com/apikey, model `gemini-2.5-flash`
   - 🟧 **Anthropic**: https://console.anthropic.com, model `claude-sonnet-5`

🔒 Anahtar yalnızca tarayıcının `localStorage`ında durur, hiçbir sunucuya gönderilmez.

> ⚠️ `file://` ile açtığında bazı tarayıcılar API isteğini engelleyebilir. Olursa klasörde `python -m http.server 8000` çalıştırıp `http://localhost:8000` adresinden aç.

### 📱 Telefona kurma

Bir adresten (https://canmenzo.com/kpss-lab/ ya da localhost) açıldığında PWA olarak kurulur: Chrome → ⋮ → **"Uygulamayı yükle"**. Kendi ikonuyla, tam ekran açılır ve **internet olmadan** da soru çözersin.

---

## ⚙️ Ayarlar

- 🧾 **Puanlama**: yanlış doğruyu götürmesin / 4 yanlış 1 doğruyu götürsün
- 🎯 **Günlük soru hedefi**
- 🔊 **Ses efektleri** ve 🎊 **animasyon / konfeti** açık-kapalı
- 🌗 **Açık / koyu tema** (sağ üstteki düğme)
- 💾 **Yedek indir / yedekten yükle**: tüm ilerlemeni başka bilgisayara taşı
- 👁️ **Gizlenen soruları geri getir**

---

## ➕ Soru eklemek

İlgili ders dosyasına (`data/turkce.js`, `data/matematik.js`, …) aynı formatta yeni nesne ekle:

```js
{id:"T36", ders:"Türkçe", konu:"Noktalama", zorluk:3,
 soru:"...",
 secenekler:["A","B","C","D","E"],
 dogru:2,
 cozum:"Neden bu cevap doğru, diğerleri neden yanlış...",
 ipucu:"Bu soru tipini bir daha gördüğünde işine yarayacak taktik..."}
```

- `dogru` → doğru şıkkın indeksi (0 = A)
- `zorluk` → 1 kolay, 2 orta, 3 zor, 4 çok zor
- `id` → benzersiz olmalı

Tekrar kartı eklemek için `data/kartlar.js`:

```js
{id:"D21", kategori:"Deyimler", on:"Göz yummak", arka:"Bir kusuru görmezden gelmek."}
```

---

## 🗂️ Dosyalar

| Dosya | İş |
|---|---|
| `index.html` | 🖼️ ekranlar |
| `style.css` | 🎨 tema (koyu + açık) |
| `app.js` | 🧠 sınav akışı, istatistik, tekrar algoritması, puan hesaplayıcı, localStorage |
| `ai.js` | 🤖 Gemini / Anthropic çağrıları ve promptlar |
| `efekt.js` | 🎉 ses, konfeti, sayaç animasyonları |
| `data/*.js` | 📚 ders ders soru bankası + tekrar kartları |
| `manifest.json`, `sw.js` | 📱 PWA (kurulum + çevrimdışı) |

---

## 📄 Lisans

Henüz lisans dosyası yok.

---

<p align="center"><sub>🇹🇷 Bir arkadaş için yazıldı. Kolay gelsin. 🍀</sub></p>
