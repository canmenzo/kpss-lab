// KPSS Lab - uygulama mantığı
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const HARF = ["A", "B", "C", "D", "E"];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));

const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const yaz = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let uretilen = oku("kpss_uretilen", []);
let istat = oku("kpss_istat", {});      // { soruId: {d:doğru, y:yanlış} }
let yanlisHavuzu = oku("kpss_yanlis", []); // soruId listesi

const banka = () => [...window.SORU_BANKASI, ...uretilen];
const dersler = () => [...new Set(banka().map(s => s.ders))];
const karistir = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

let S = null; // aktif sınav durumu

/* ---------------- ekran yönetimi ---------------- */
function ekranGoster(id) {
  if (S && id !== "sinav" && !S.bitti && !confirm("Sınavdan çıkılsın mı? Cevaplar kaydedilmez.")) return;
  if (S && id !== "sinav" && !S.bitti) { clearInterval(S.timer); S = null; }
  $$(".ekran").forEach(e => e.classList.toggle("aktif", e.id === id));
  $$("nav button").forEach(b => b.classList.toggle("aktif", b.dataset.ekran === id));
  if (id === "istatistik") istatistikCiz();
  if (id === "ev") evTazele();
  window.scrollTo(0, 0);
}
$$("nav button").forEach(b => b.onclick = () => ekranGoster(b.dataset.ekran));

/* ---------------- ana sayfa ---------------- */
function secenekDoldur(el, liste, ilk) {
  el.innerHTML = (ilk ? `<option value="">${ilk}</option>` : "") +
    liste.map(x => `<option>${esc(x)}</option>`).join("");
}
function evTazele() {
  const d = dersler();
  [["#ev-ders", "Tüm dersler"], ["#calis-ders", ""], ["#ai-ders", ""]].forEach(([sel, ilk]) => {
    const el = $(sel), eski = el.value;
    secenekDoldur(el, d, ilk);
    if (eski && [...el.options].some(o => o.value === eski)) el.value = eski;
  });
  konuTazele();
  $("#yanlis-sayi").textContent = yanlisHavuzu.length;
  $("#uretilen-sayi").textContent = uretilen.length;
}
function konuTazele() {
  const ders = $("#calis-ders").value;
  const konular = [...new Set(banka().filter(s => s.ders === ders).map(s => s.konu))];
  secenekDoldur($("#calis-konu"), konular, "Tüm konular");
}
$("#calis-ders").onchange = konuTazele;

$("#btn-deneme").onclick = () => {
  const ders = $("#ev-ders").value, zor = +$("#ev-zorluk").value, adet = +$("#ev-adet").value;
  let havuz = banka().filter(s => (!ders || s.ders === ders) && (!zor || s.zorluk === zor));
  if (!havuz.length) return alert("Bu filtreye uyan soru yok.");
  baslat("deneme", karistir(havuz).slice(0, adet), +$("#ev-sure").value, ders || "Karışık");
};

$("#btn-calis").onclick = () => {
  const ders = $("#calis-ders").value, konu = $("#calis-konu").value;
  const havuz = banka().filter(s => s.ders === ders && (!konu || s.konu === konu));
  if (!havuz.length) return alert("Bu konuda soru yok. AI Lab'den üretebilirsin.");
  baslat("calis", karistir(havuz), 0, ders + (konu ? " · " + konu : ""));
};

$("#btn-yanlis").onclick = () => {
  const havuz = banka().filter(s => yanlisHavuzu.includes(s.id));
  if (!havuz.length) return alert("Yanlış havuzun boş. Önce bir deneme çöz.");
  baslat("calis", karistir(havuz), 0, "Yanlışlarım");
};

/* ---------------- sınav ---------------- */
function baslat(mod, sorular, sureDk, baslik) {
  S = { mod, sorular, idx: 0, cevap: {}, isaret: {}, bitti: false, timer: null, kalan: sureDk * 60, basla: Date.now() };
  $("#sinav-mod").textContent = mod === "deneme" ? "Deneme" : "Çalışma";
  $("#sinav-ders").textContent = baslik;
  $("#soru-toplam").textContent = sorular.length;
  $("#btn-bitir").textContent = mod === "deneme" ? "Sınavı Bitir" : "Bitir ve Değerlendir";

  clearInterval(S.timer);
  if (sureDk > 0) {
    sayacYaz();
    S.timer = setInterval(() => {
      S.kalan--; sayacYaz();
      if (S.kalan <= 0) { clearInterval(S.timer); bitir(); }
    }, 1000);
  } else $("#sayac").textContent = "";

  ekranGoster("sinav");
  soruGoster();
}
function sayacYaz() {
  const m = String(Math.floor(S.kalan / 60)).padStart(2, "0"), s = String(S.kalan % 60).padStart(2, "0");
  const el = $("#sayac"); el.textContent = `${m}:${s}`;
  el.classList.toggle("kritik", S.kalan <= 60);
}

function soruGoster() {
  const q = S.sorular[S.idx];
  $("#soru-idx").textContent = S.idx + 1;
  $("#soru-konu").textContent = q.ders + " · " + q.konu;
  $("#soru-zorluk").textContent = q.zorluk === 3 ? "zor" : "orta";
  $("#soru-metin").textContent = q.soru;

  const verilen = S.cevap[q.id];
  const gosterCevap = S.mod === "calis" && verilen !== undefined;

  $("#secenekler").innerHTML = q.secenekler.map((m, i) => {
    let sinif = "secenek";
    if (gosterCevap) {
      if (i === q.dogru) sinif += " dogru";
      else if (i === verilen) sinif += " yanlis";
    } else if (i === verilen) sinif += " secili";
    return `<button class="${sinif}" data-i="${i}"><b>${HARF[i]}</b><span>${esc(m)}</span></button>`;
  }).join("");
  $$("#secenekler .secenek").forEach(b => b.onclick = () => cevapla(+b.dataset.i));

  const cz = $("#cozum");
  if (gosterCevap && q.cozum) { cz.hidden = false; cz.innerHTML = `<b>Doğru cevap: ${HARF[q.dogru]}</b><br>${esc(q.cozum)}`; }
  else cz.hidden = true;

  $("#btn-isaret").textContent = S.isaret[q.id] ? "İşareti kaldır" : "Sonra bak";
  $("#btn-onceki").disabled = S.idx === 0;
  $("#btn-sonraki").textContent = S.idx === S.sorular.length - 1 ? "Son soru" : "Sonraki →";
  paletCiz();
}

function cevapla(i) {
  const q = S.sorular[S.idx];
  if (S.mod === "calis") {
    if (S.cevap[q.id] !== undefined) return; // çalışma modunda cevap kilitlenir
    S.cevap[q.id] = i;
    kaydet(q, i === q.dogru);
  } else {
    S.cevap[q.id] = S.cevap[q.id] === i ? undefined : i; // aynı şıkka basınca iptal
  }
  soruGoster();
}

function kaydet(q, dogruMu) {
  const r = istat[q.id] || { d: 0, y: 0 };
  dogruMu ? r.d++ : r.y++;
  istat[q.id] = r; yaz("kpss_istat", istat);
  const ix = yanlisHavuzu.indexOf(q.id);
  if (dogruMu) { if (ix > -1) yanlisHavuzu.splice(ix, 1); }
  else if (ix === -1) yanlisHavuzu.push(q.id);
  yaz("kpss_yanlis", yanlisHavuzu);
}

function paletCiz() {
  $("#palet").innerHTML = S.sorular.map((q, i) => {
    const c = [];
    if (S.cevap[q.id] !== undefined) c.push("cevap");
    if (S.isaret[q.id]) c.push("isaret");
    if (i === S.idx) c.push("simdi");
    return `<button class="${c.join(" ")}" data-i="${i}">${i + 1}</button>`;
  }).join("");
  $$("#palet button").forEach(b => b.onclick = () => { S.idx = +b.dataset.i; soruGoster(); });
}

$("#btn-onceki").onclick = () => { if (S.idx > 0) { S.idx--; soruGoster(); } };
$("#btn-sonraki").onclick = () => {
  if (S.idx < S.sorular.length - 1) { S.idx++; soruGoster(); } else bitir();
};
$("#btn-isaret").onclick = () => {
  const q = S.sorular[S.idx];
  S.isaret[q.id] = !S.isaret[q.id];
  soruGoster();
};
$("#btn-bitir").onclick = () => {
  const bos = S.sorular.filter(q => S.cevap[q.id] === undefined).length;
  if (bos && !confirm(`${bos} soru boş. Yine de bitirilsin mi?`)) return;
  bitir();
};
document.addEventListener("keydown", e => {
  if (!S || S.bitti || !$("#sinav").classList.contains("aktif")) return;
  const i = "abcde".indexOf(e.key.toLowerCase());
  if (i > -1) cevapla(i);
  if (e.key === "ArrowRight") $("#btn-sonraki").click();
  if (e.key === "ArrowLeft") $("#btn-onceki").click();
});

/* ---------------- sonuç ---------------- */
function bitir() {
  clearInterval(S.timer);
  S.bitti = true;
  if (S.mod === "deneme") S.sorular.forEach(q => {
    if (S.cevap[q.id] !== undefined) kaydet(q, S.cevap[q.id] === q.dogru);
  });

  const d = S.sorular.filter(q => S.cevap[q.id] === q.dogru).length;
  const y = S.sorular.filter(q => S.cevap[q.id] !== undefined && S.cevap[q.id] !== q.dogru).length;
  const b = S.sorular.length - d - y;
  const yuzde = Math.round(d / S.sorular.length * 100);
  const dk = Math.round((Date.now() - S.basla) / 60000);

  $("#skor").innerHTML = `
    <div class="iyi"><strong>${d}</strong><small>doğru</small></div>
    <div class="kotu"><strong>${y}</strong><small>yanlış</small></div>
    <div><strong>${b}</strong><small>boş</small></div>
    <div><strong>%${yuzde}</strong><small>başarı</small></div>
    <div><strong>${dk}</strong><small>dakika</small></div>`;

  const gruplar = {};
  S.sorular.forEach(q => {
    const g = gruplar[q.ders] || (gruplar[q.ders] = { d: 0, t: 0 });
    g.t++; if (S.cevap[q.id] === q.dogru) g.d++;
  });
  $("#ders-tablo").innerHTML = tabloCiz(gruplar);

  const zayif = {};
  S.sorular.forEach(q => {
    if (S.cevap[q.id] === q.dogru) return;
    const k = q.ders + " · " + q.konu;
    zayif[k] = (zayif[k] || 0) + 1;
  });
  const zSira = Object.entries(zayif).sort((a, c) => c[1] - a[1]);
  $("#zayif").innerHTML = zSira.length
    ? "<ul>" + zSira.map(([k, v]) => `<li>${esc(k)} — <b>${v}</b> soru</li>`).join("") + "</ul>"
    : "<p class='aciklama'>Hiç yanlışın yok. Zorluk seviyesini yükselt.</p>";

  $("#inceleme").innerHTML = S.sorular.map((q, i) => {
    const v = S.cevap[q.id];
    const sonuc = v === undefined ? "bos" : v === q.dogru ? "dogru" : "yanlis";
    const rozet = { bos: "Boş", dogru: "Doğru", yanlis: "Yanlış" }[sonuc];
    return `<details data-sonuc="${sonuc}">
      <summary>${i + 1}. ${rozet} — ${esc(q.ders)} · ${esc(q.konu)}</summary>
      <div class="soru-metin">${esc(q.soru)}</div>
      <div class="secenekler">${q.secenekler.map((m, j) =>
        `<div class="secenek ${j === q.dogru ? "dogru" : j === v ? "yanlis" : ""}"><b>${HARF[j]}</b><span>${esc(m)}</span></div>`).join("")}</div>
      ${q.cozum ? `<div class="cozum"><b>Çözüm</b><br>${esc(q.cozum)}</div>` : ""}
    </details>`;
  }).join("");

  S = null;
  ekranGoster("sonuc");
}
$("#btn-ev").onclick = () => ekranGoster("ev");

function tabloCiz(gruplar) {
  const satir = Object.entries(gruplar).sort((a, b) => (a[1].d / a[1].t) - (b[1].d / b[1].t));
  return `<table><tr><th>Ders</th><th>Doğru</th><th>Başarı</th><th></th></tr>` +
    satir.map(([k, g]) => {
      const p = Math.round(g.d / g.t * 100);
      return `<tr><td>${esc(k)}</td><td>${g.d}/${g.t}</td><td>%${p}</td>
        <td><div class="bar"><i style="width:${p}%"></i></div></td></tr>`;
    }).join("") + "</table>";
}

/* ---------------- istatistik ---------------- */
function istatistikCiz() {
  const kayit = Object.entries(istat);
  const topD = kayit.reduce((t, [, r]) => t + r.d, 0);
  const topY = kayit.reduce((t, [, r]) => t + r.y, 0);
  const top = topD + topY;
  $("#genel-skor").innerHTML = `
    <div><strong>${top}</strong><small>çözülen soru</small></div>
    <div class="iyi"><strong>${topD}</strong><small>doğru</small></div>
    <div class="kotu"><strong>${topY}</strong><small>yanlış</small></div>
    <div><strong>%${top ? Math.round(topD / top * 100) : 0}</strong><small>genel başarı</small></div>
    <div><strong>${yanlisHavuzu.length}</strong><small>tekrar bekleyen</small></div>`;

  const idx = Object.fromEntries(banka().map(s => [s.id, s]));
  const dersG = {}, konuG = {};
  kayit.forEach(([id, r]) => {
    const q = idx[id]; if (!q) return;
    const g = dersG[q.ders] || (dersG[q.ders] = { d: 0, t: 0 });
    g.d += r.d; g.t += r.d + r.y;
    const k = q.ders + " · " + q.konu;
    konuG[k] = (konuG[k] || 0) + r.y;
  });
  $("#ist-ders").innerHTML = Object.keys(dersG).length ? tabloCiz(dersG)
    : "<p class='aciklama'>Henüz veri yok. Bir deneme çöz.</p>";

  const zSira = Object.entries(konuG).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
  $("#ist-konu").innerHTML = zSira.length
    ? "<ul>" + zSira.map(([k, v]) => `<li>${esc(k)} — <b>${v}</b> yanlış</li>`).join("") + "</ul>"
    : "<p class='aciklama'>Kayıtlı yanlış yok.</p>";
}
$("#btn-sifirla").onclick = () => {
  if (!confirm("Tüm istatistikler ve yanlış havuzu silinsin mi?")) return;
  istat = {}; yanlisHavuzu = [];
  yaz("kpss_istat", istat); yaz("kpss_yanlis", yanlisHavuzu);
  istatistikCiz(); evTazele();
};

/* ---------------- AI Lab ---------------- */
function durum(el, mesaj, tip = "") { el.className = "durum " + tip; el.textContent = mesaj; }

async function aiCalistir(isim, fn) {
  const dEl = $("#ai-durum");
  $$("#ai button").forEach(b => b.disabled = true);
  durum(dEl, isim + "...");
  try { await fn(dEl); }
  catch (e) { durum(dEl, "Hata: " + e.message, "hata"); }
  finally { $$("#ai button").forEach(b => b.disabled = false); }
}

function sorulariEkle(yeni, dEl) {
  if (!yeni.length) throw new Error("Model kullanılabilir soru üretmedi, tekrar dene.");
  uretilen = [...uretilen, ...yeni];
  yaz("kpss_uretilen", uretilen);
  evTazele();
  durum(dEl, `${yeni.length} soru üretildi ve bankaya eklendi.`, "ok");
  $("#ai-cikti").textContent = yeni.map((s, i) =>
    `${i + 1}. [${s.ders} · ${s.konu}] ${s.soru}\n` +
    s.secenekler.map((m, j) => `   ${HARF[j]}) ${m}`).join("\n") +
    `\n   → Doğru: ${HARF[s.dogru]} — ${s.cozum}`).join("\n\n");
}

$("#btn-analiz").onclick = () => aiCalistir("Sorular analiz ediliyor", async dEl => {
  const metin = $("#ai-metin").value.trim();
  if (metin.length < 30) throw new Error("Analiz için önce soruları yapıştır.");
  $("#ai-cikti").textContent = await AI.analiz(metin);
  durum(dEl, "Analiz hazır.", "ok");
});

$("#btn-benzer").onclick = () => aiCalistir("Benzer sorular üretiliyor", async dEl => {
  const metin = $("#ai-metin").value.trim();
  if (metin.length < 30) throw new Error("Önce çıkmış soruları yapıştır.");
  sorulariEkle(await AI.benzer({ metin, adet: 5 }), dEl);
});

$("#btn-uret").onclick = () => aiCalistir("Sorular üretiliyor", async dEl => {
  sorulariEkle(await AI.uret({
    ders: $("#ai-ders").value,
    konu: $("#ai-konu").value.trim(),
    zorluk: $("#ai-zorluk").value,
    adet: +$("#ai-adet").value
  }), dEl);
});

$("#btn-uretilen-indir").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(uretilen, null, 1)], { type: "application/json" }));
  a.download = "kpss-uretilen-sorular.json";
  a.click();
  URL.revokeObjectURL(a.href);
};
$("#btn-uretilen-sil").onclick = () => {
  if (!confirm("Üretilen tüm sorular silinsin mi?")) return;
  uretilen = []; yaz("kpss_uretilen", uretilen); evTazele();
  durum($("#ai-durum"), "Üretilen sorular silindi.", "ok");
};

/* ---------------- ayarlar ---------------- */
function ayarYukle() {
  const a = AI.ayarOku();
  $("#ay-saglayici").value = a.saglayici;
  $("#ay-model").value = a.model;
  $("#ay-key").value = a.key;
}
$("#ay-saglayici").onchange = e => $("#ay-model").value = AI.varsayilanModel(e.target.value);
$("#btn-ayar-kaydet").onclick = () => {
  const saglayici = $("#ay-saglayici").value;
  AI.ayarYaz({ saglayici, model: $("#ay-model").value.trim() || AI.varsayilanModel(saglayici), key: $("#ay-key").value.trim() });
  durum($("#ayar-durum"), "Kaydedildi.", "ok");
};

evTazele();
ayarYukle();
