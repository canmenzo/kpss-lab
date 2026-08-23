# KPSS Lab

KPSS Genel Yetenek – Genel Kültür çalışma uygulaması. Kurulum yok, sunucu yok, hesap yok: `index.html`'e çift tıkla, çalışıyor.

## İçerik

**150 soru**, hepsi detaylı çözümlü ve püf noktalı:

| Ders | Soru |
|---|---|
| Türkçe | 35 |
| Matematik | 35 |
| Tarih | 30 |
| Coğrafya | 25 |
| Vatandaşlık | 25 |

87 farklı alt konu. Dört zorluk seviyesi: **Kolay · Orta · Zor · Çok Zor**. Her soruda iki ayrı kutu vardır:
- **Çözüm** — cevabın neden doğru, diğer şıkların neden yanlış olduğu, adım adım.
- **Püf noktası** — o soru tipini bir daha gördüğünde işine yarayacak kalıcı taktik, kısayol ya da ezber formülü.

## Çalışma modları

| Mod | Ne yapar |
|---|---|
| **Deneme Sınavı** | Ders + zorluk + soru sayısı + süre seçersin. Sayaç, soru paleti, işaretleme, ilerleme çubuğu. |
| **KPSS Formatı** | Gerçek sınavın ders dağılımıyla karma deneme (Türkçe %25, Matematik %25, Tarih %22,5, Coğrafya %15, Vatandaşlık %12,5). 30/60/120 soru, süre otomatik. |
| **Konu Çalışması** | Süresiz. Şıkkı işaretler işaretlemez doğru cevap, çözüm ve püf noktası açılır. |
| **Akıllı Tekrar** | Aralıklı tekrar (spaced repetition): doğru yaptıkça soru 1 → 3 → 7 → 16 → 35 gün sonra tekrar karşına çıkar, yanlışta baştan başlar. |
| **Yanlışlarım** | Bir kez bile doğru yapamadığın sorular. Doğru yapınca havuzdan düşer. |

Sınav sırasında: `A`–`E` şık seçer, `←` `→` soru değiştirir. Cevaplamadan önce **püf noktası** alabilir, hatalı bulduğun soruyu **bankadan gizleyebilirsin**.

## Sonuç ve istatistik

- Doğru / yanlış / boş / net + başarı halkası
- Ders bazlı başarı tablosu, zayıf konu listesi
- **Süre analizi**: soru başına ortalama saniye ve en çok vakit yediğin konular (gerçek KPSS'de ortalama 65 sn)
- Soru soru inceleme; yalnız yanlışları / boşları filtreleme
- Gelişim grafiği (son 12 deneme), zorluk seviyesine göre başarı, son denemeler tablosu
- Günlük soru hedefi ve **günlük seri** takibi

## AI Lab

Ayarlar'dan bir API anahtarı girilince açılan kısım:

- **Çıkmış soru analizi** — soruları yapıştır; konu dağılımı, ÖSYM'nin kullandığı soru kalıpları, çeldirici mantığı, püf noktaları ve çalışma planı çıkarır.
- **Benzer soru üretimi** — aynı kalıpta, farklı veriyle yeni sorular yazar.
- **Konudan üretim** — ders + konu + zorluk + adet seçip sıfırdan soru ürettirirsin.
- **Zayıf konularımdan üret** — istatistiklerine bakıp en çok yanlış yaptığın konulardan hedefli soru üretir.
- **Soruyu bana açıkla** — anlamadığın soruyu özel ders gibi adım adım anlattırır.
- **AI koç** — deneme geçmişine bakıp gün gün çalışma planı ve sınav taktiği yazar.

Üretilen sorular çözümü ve püf noktasıyla birlikte bankaya eklenir, JSON olarak dışa aktarılabilir.

## Kurulum

1. Depoyu indir, `index.html`'i tarayıcıda aç. 150 soru hazır; AI olmadan da tam çalışır.
2. AI Lab için **Ayarlar** → sağlayıcı seç → API anahtarını yapıştır → Kaydet.
   - Google Gemini (ücretsiz katman yeterli): https://aistudio.google.com/apikey — model `gemini-2.5-flash`
   - Anthropic: https://console.anthropic.com — model `claude-sonnet-5`

Anahtar yalnızca tarayıcının `localStorage`ında durur, hiçbir sunucuya gönderilmez.

> `file://` ile açtığında bazı tarayıcılar API isteğini engelleyebilir. Olursa klasörde `python -m http.server 8000` çalıştırıp `http://localhost:8000` adresinden aç.

## Ayarlar

- **Puanlama**: yanlış doğruyu götürmesin / 4 yanlış 1 doğruyu götürsün
- **Günlük soru hedefi**
- **Açık / koyu tema** (sağ üstteki düğme)
- **Yedek indir / yedekten yükle** — tüm ilerlemeni başka bilgisayara taşı
- **Gizlenen soruları geri getir**

## Soru eklemek

İlgili ders dosyasına (`data/turkce.js`, `data/matematik.js`, …) aynı formatta yeni nesne ekle:

```js
{id:"T36", ders:"Türkçe", konu:"Noktalama", zorluk:3,
 soru:"...",
 secenekler:["A","B","C","D","E"],
 dogru:2,
 cozum:"Neden bu cevap doğru, diğerleri neden yanlış...",
 ipucu:"Bu soru tipini bir daha gördüğünde işine yarayacak taktik..."}
```

`dogru` doğru şıkkın indeksidir (0 = A). `zorluk`: 1 kolay, 2 orta, 3 zor, 4 çok zor. `id` benzersiz olmalı.

## Dosyalar

| Dosya | İş |
|---|---|
| `index.html` | ekranlar |
| `style.css` | tema (koyu + açık) |
| `app.js` | sınav akışı, istatistik, tekrar algoritması, localStorage |
| `ai.js` | Gemini/Anthropic çağrıları ve promptlar |
| `data/*.js` | ders ders soru bankası |
