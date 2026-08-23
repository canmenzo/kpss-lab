# KPSS Lab

Orta–zor seviye KPSS çalışma uygulaması. Tek bir HTML dosyası; kurulum, sunucu, hesap yok. `index.html`'e çift tıkla, çalışıyor.

## Ne yapıyor

**Deneme Sınavı** — Ders ve zorluk filtresi, süreli sayaç, soru paleti (cevaplı / işaretli / boş), sonunda doğru–yanlış–boş, başarı yüzdesi, ders bazlı tablo ve zayıf konu listesi. Her soru için çözüm.

**Konu Çalışması** — Süre yok. Şıkka basar basmaz doğru cevap ve çözüm açılır.

**Yanlışlarım** — Yanlış yaptığın sorular havuza düşer, tekrar tekrar karşına gelir. Doğru yapınca havuzdan çıkar.

**İstatistik** — Toplam çözülen soru, genel başarı, ders bazlı grafik, en çok yanlış yapılan 10 konu. Tarayıcıda saklanır.

**AI Lab** — Asıl fark burada:
- *Çıkmış soru analizi:* Çıkmış soruları yapıştır → konu dağılımı, ÖSYM'nin kullandığı soru kalıpları, çeldirici mantığı, çalışma planı ve tahmin çıkarır.
- *Benzer soru üretimi:* Aynı soruları verip "bunlara benzer soru üret" dersin; kalıbı koruyup verileri değiştirerek yeni sorular yazar.
- *Konudan üretim:* Ders + konu + zorluk + adet seçip sıfırdan soru ürettirirsin.

Üretilen sorular soru bankasına eklenir; denemelerde ve konu çalışmasında normal sorular gibi çıkar. JSON olarak dışa aktarılabilir.

## Kurulum

1. Depoyu indir, `index.html`'i tarayıcıda aç. Soru bankası hazır, AI olmadan da çalışır.
2. AI Lab için: **Ayarlar** sekmesi → sağlayıcı seç → API anahtarını yapıştır → Kaydet.
   - Google Gemini (ücretsiz katman yeterli): https://aistudio.google.com/apikey — model `gemini-2.5-flash`
   - Anthropic: https://console.anthropic.com — model `claude-sonnet-5`

Anahtar sadece tarayıcının `localStorage`ında durur, hiçbir sunucuya gönderilmez.

> `file://` ile açtığında bazı tarayıcılar API isteğini engelleyebilir. Olursa klasörde `python -m http.server 8000` çalıştırıp `http://localhost:8000` adresinden aç.

## Kısayollar

`A` `B` `C` `D` `E` şık işaretler · `←` `→` soru değiştirir.

## Soru eklemek

`data/sorular.js` içine aynı formatta yeni nesne ekle:

```js
{id:"T13", ders:"Türkçe", konu:"Noktalama", zorluk:3,
 soru:"...", secenekler:["A","B","C","D","E"], dogru:2, cozum:"..."}
```

`dogru` alanı doğru şıkkın indeksidir (0 = A). `zorluk`: 2 = orta, 3 = zor.

## Dosyalar

| Dosya | İş |
|---|---|
| `index.html` | ekranlar |
| `style.css` | tema |
| `app.js` | sınav akışı, istatistik, localStorage |
| `ai.js` | Gemini/Anthropic çağrıları ve promptlar |
| `data/sorular.js` | çekirdek soru bankası (50 soru) |
