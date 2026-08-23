// KPSS Lab - uygulama mantığı
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const HARF = ["A", "B", "C", "D", "E"];
const ZOR_AD = { 1: "Kolay", 2: "Orta", 3: "Zor", 4: "Çok Zor" };
const KOTA = { "Türkçe": .25, "Matematik": .25, "Tarih": .225, "Coğrafya": .15, "Vatandaşlık": .125 };
const SRS_GUN = [0, 1, 3, 7, 16, 35];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));

const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const yaz = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const bugun = () => new Date().toISOString().slice(0, 10);

let uretilen = oku("kpss_uretilen", []);
let istat = oku("kpss_istat", {});          // { soruId: {d, y} }
let yanlisHavuzu = oku("kpss_yanlis", []);
let srs = oku("kpss_srs", {});              // { soruId: {n: seviye, t: sonraki zaman} }
let gecmis = oku("kpss_gecmis", []);
let gunluk = oku("kpss_gunluk", {});
let gizli = oku("kpss_gizli", []);
let tercih = { net: "yok", hedef: 20, tema: "koyu", ...oku("kpss_tercih", {}) };

const tumBanka = () => [...window.SORU_BANKASI, ...uretilen];
const banka = () => tumBanka().filter(s => !gizli.includes(s.id));
const dersler = () => [...new Set(banka().map(s => s.ders))];
const karistir = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);

let S = null;      // aktif sınav
let SONUC = null;  // son sonuç (inceleme filtresi için)

/* ---------------- ekran yönetimi ---------------- */
function ekranGoster(id) {
  if (S && id !== "sinav" && !S.bitti) {
    if (!confirm("Sınavdan çıkılsın mı? Cevapların kaydedilmez.")) return;
    clearInterval(S.timer); S = null;
  }
  $$(".ekran").forEach(e => e.classList.toggle("aktif", e.id === id));
  $$("nav button[data-ekran]").forEach(b => b.classList.toggle("aktif", b.dataset.ekran === id));
  if (id === "istatistik") istatistikCiz();
  if (id === "ev") evTazele();
  if (id === "ai") aiTazele();
  window.scrollTo(0, 0);
}
$$("nav button[data-ekran]").forEach(b => b.onclick = () => ekranGoster(b.dataset.ekran));

/* ---------------- tema ---------------- */
function temaUygula() {
  document.body.dataset.tema = tercih.tema;
  $("#tema-btn").textContent = tercih.tema === "koyu" ? "Açık tema" : "Koyu tema";
}
$("#tema-btn").onclick = () => {
  tercih.tema = tercih.tema === "koyu" ? "acik" : "koyu";
  yaz("kpss_tercih", tercih); temaUygula();
};

/* ---------------- zorluk seçicileri ---------------- */
function zorlukKur(sel) {
  $(sel).innerHTML = [1, 2, 3, 4].map(z =>
    `<label><input type="checkbox" value="${z}" checked> ${ZOR_AD[z]}</label>`).join("");
}
const zorlukOku = sel => $$(sel + " input:checked").map(i => +i.value);

/* ---------------- ana sayfa ---------------- */
function secenekDoldur(el, liste, ilk) {
  const eski = el.value;
  el.innerHTML = (ilk ? `<option value="">${ilk}</option>` : "") +
    liste.map(x => `<option>${esc(x)}</option>`).join("");
  if (eski && [...el.options].some(o => o.value === eski)) el.value = eski;
}
function seriHesapla() {
  let n = 0, g = new Date();
  while (gunluk[g.toISOString().slice(0, 10)] > 0) { n++; g.setDate(g.getDate() - 1); }
  return n;
}
const tekrarBekleyen = () => banka().filter(s => srs[s.id] && srs[s.id].t <= Date.now());

function evTazele() {
  const d = dersler();
  secenekDoldur($("#ev-ders"), d, "Tüm dersler");
  secenekDoldur($("#calis-ders"), d, "");
  secenekDoldur($("#ai-ders"), d, "");
  konuTazele();
  $("#oz-bugun").textContent = gunluk[bugun()] || 0;
  $("#oz-seri").textContent = seriHesapla();
  $("#oz-tekrar").textContent = tekrarBekleyen().length;
  $("#oz-yanlis").textContent = yanlisHavuzu.length;
  $("#oz-banka").textContent = banka().length;
  $("#tekrar-sayi").textContent = tekrarBekleyen().length;
  $("#yanlis-sayi").textContent = yanlisHavuzu.length;
  $("#uretilen-sayi").textContent = uretilen.length;
  $("#gizli-sayi").textContent = gizli.length;
}
function konuTazele() {
  const ders = $("#calis-ders").value;
  secenekDoldur($("#calis-konu"), [...new Set(banka().filter(s => s.ders === ders).map(s => s.konu))].sort(), "Tüm konular");
}
$("#calis-ders").onchange = konuTazele;

$("#btn-deneme").onclick = () => {
  const ders = $("#ev-ders").value, zor = zorlukOku("#ev-zorluk"), adet = +$("#ev-adet").value;
  if (!zor.length) return alert("En az bir zorluk seviyesi seç.");
  const havuz = banka().filter(s => (!ders || s.ders === ders) && zor.includes(s.zorluk));
  if (!havuz.length) return alert("Bu filtreye uyan soru yok. AI Lab'den üretebilirsin.");
  baslat("deneme", karistir(havuz).slice(0, adet), +$("#ev-sure").value, ders || "Karışık");
};

$("#btn-format").onclick = () => {
  const adet = +$("#fmt-adet").value, zor = zorlukOku("#fmt-zorluk");
  if (!zor.length) return alert("En az bir zorluk seviyesi seç.");
  const havuz = banka().filter(s => zor.includes(s.zorluk));
  let secilen = [], eksik = 0;
  for (const [ders, oran] of Object.entries(KOTA)) {
    const hedef = Math.round(adet * oran);
    const grup = karistir(havuz.filter(s => s.ders === ders));
    secilen = secilen.concat(grup.slice(0, hedef));
    eksik += Math.max(0, hedef - grup.length);
  }
  if (eksik) {
    const yedek = karistir(havuz.filter(s => !secilen.includes(s)));
    secilen = secilen.concat(yedek.slice(0, eksik));
  }
  if (!secilen.length) return alert("Seçilen zorlukta soru yok.");
  if (secilen.length < adet) alert(`Bankada bu filtreye uyan ${secilen.length} soru var; deneme o kadar soruyla başlıyor. AI Lab'den soru üreterek bankayı büyütebilirsin.`);
  baslat("deneme", karistir(secilen), Math.round(secilen.length * 13 / 12), "KPSS Formatı");
};

$("#btn-calis").onclick = () => {
  const ders = $("#calis-ders").value, konu = $("#calis-konu").value, zor = zorlukOku("#calis-zorluk");
  if (!zor.length) return alert("En az bir zorluk seviyesi seç.");
  const havuz = banka().filter(s => s.ders === ders && (!konu || s.konu === konu) && zor.includes(s.zorluk));
  if (!havuz.length) return alert("Bu filtreye uyan soru yok. AI Lab'den üretebilirsin.");
  baslat("calis", karistir(havuz), 0, ders + (konu ? " · " + konu : ""));
};

$("#btn-tekrar").onclick = () => {
  const havuz = tekrarBekleyen();
  if (!havuz.length) return alert("Şu an tekrar zamanı gelen soru yok. Deneme çözdükçe burası dolar.");
  baslat("calis", karistir(havuz), 0, "Akıllı Tekrar");
};

$("#btn-yanlis").onclick = () => {
  const havuz = banka().filter(s => yanlisHavuzu.includes(s.id));
  if (!havuz.length) return alert("Yanlış havuzun boş. Önce bir deneme çöz.");
  baslat("calis", karistir(havuz), 0, "Yanlışlarım");
};

/* ---------------- sınav ---------------- */
function baslat(mod, sorular, sureDk, baslik) {
  S = {
    mod, sorular, idx: 0, cevap: {}, isaret: {}, sure: {}, bitti: false,
    timer: null, kalan: sureDk * 60, basla: Date.now(), acilis: Date.now(), baslik
  };
  $("#sinav-mod").textContent = mod === "deneme" ? "Deneme" : "Çalışma";
  $("#sinav-ders").textContent = baslik;
  $("#soru-toplam").textContent = sorular.length;
  $("#btn-bitir").textContent = mod === "deneme" ? "Sınavı Bitir" : "Bitir ve Değerlendir";

  if (sureDk > 0) {
    sayacYaz();
    S.timer = setInterval(() => {
      S.kalan--; sayacYaz();
      if (S.kalan <= 0) { clearInterval(S.timer); alert("Süre doldu."); bitir(); }
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
function sureIsle() {
  const q = S.sorular[S.idx];
  S.sure[q.id] = (S.sure[q.id] || 0) + (Date.now() - S.acilis);
  S.acilis = Date.now();
}
function git(i) { sureIsle(); S.idx = i; soruGoster(); }

function soruGoster() {
  const q = S.sorular[S.idx];
  $("#soru-idx").textContent = S.idx + 1;
  $("#soru-konu").textContent = q.ders + " · " + q.konu;
  const zEl = $("#soru-zorluk");
  zEl.textContent = ZOR_AD[q.zorluk]; zEl.dataset.z = q.zorluk;
  $("#soru-metin").textContent = q.soru;

  const verilen = S.cevap[q.id];
  const acik = S.mod === "calis" && verilen !== undefined;

  $("#secenekler").innerHTML = q.secenekler.map((m, i) => {
    let sinif = "secenek";
    if (acik) {
      if (i === q.dogru) sinif += " dogru";
      else if (i === verilen) sinif += " yanlis";
    } else if (i === verilen) sinif += " secili";
    return `<button class="${sinif}" data-i="${i}"><b>${HARF[i]}</b><span>${esc(m)}</span></button>`;
  }).join("");
  $$("#secenekler .secenek").forEach(b => b.onclick = () => cevapla(+b.dataset.i));

  const cz = $("#cozum");
  if (acik && q.cozum) { cz.hidden = false; cz.innerHTML = `<b>Doğru cevap: ${HARF[q.dogru]}</b>\n${esc(q.cozum)}`; }
  else cz.hidden = true;

  $("#ipucu").hidden = true;
  $("#ai-aciklama").hidden = true;
  $("#btn-ipucu").hidden = !q.ipucu;
  $("#btn-ai-acikla").hidden = !(S.mod === "calis" && acik);
  $("#btn-isaret").textContent = S.isaret[q.id] ? "İşareti kaldır" : "Sonra bak";
  $("#btn-onceki").disabled = S.idx === 0;
  $("#btn-sonraki").textContent = S.idx === S.sorular.length - 1 ? "Bitir" : "Sonraki →";
  $("#ilerleme-bar").style.width = (Object.values(S.cevap).filter(v => v !== undefined).length / S.sorular.length * 100) + "%";
  paletCiz();
}

function cevapla(i) {
  const q = S.sorular[S.idx];
  if (S.mod === "calis") {
    if (S.cevap[q.id] !== undefined) return;   // çalışma modunda cevap kilitlenir
    S.cevap[q.id] = i;
    kaydet(q, i === q.dogru);
  } else {
    S.cevap[q.id] = S.cevap[q.id] === i ? undefined : i;  // aynı şıkka basınca iptal
  }
  soruGoster();
}

function gunlukArtir() {
  const g = bugun();
  gunluk[g] = (gunluk[g] || 0) + 1;
  yaz("kpss_gunluk", gunluk);
}
function kaydet(q, dogruMu) {
  const r = istat[q.id] || { d: 0, y: 0 };
  dogruMu ? r.d++ : r.y++;
  istat[q.id] = r; yaz("kpss_istat", istat);

  const s = srs[q.id] || { n: 0, t: 0 };
  s.n = dogruMu ? Math.min(s.n + 1, SRS_GUN.length - 1) : 0;
  s.t = Date.now() + (dogruMu ? SRS_GUN[s.n] * 864e5 : 6e5);  // yanlışta 10 dakika sonra
  srs[q.id] = s; yaz("kpss_srs", srs);

  const ix = yanlisHavuzu.indexOf(q.id);
  if (dogruMu) { if (ix > -1) yanlisHavuzu.splice(ix, 1); }
  else if (ix === -1) yanlisHavuzu.push(q.id);
  yaz("kpss_yanlis", yanlisHavuzu);

  gunlukArtir();
}

function paletCiz() {
  $("#palet").innerHTML = S.sorular.map((q, i) => {
    const c = [];
    if (S.cevap[q.id] !== undefined) c.push("cevap");
    if (S.isaret[q.id]) c.push("isaret");
    if (i === S.idx) c.push("simdi");
    return `<button class="${c.join(" ")}" data-i="${i}">${i + 1}</button>`;
  }).join("");
  $$("#palet button").forEach(b => b.onclick = () => git(+b.dataset.i));
}

$("#btn-onceki").onclick = () => { if (S.idx > 0) git(S.idx - 1); };
$("#btn-sonraki").onclick = () => { S.idx < S.sorular.length - 1 ? git(S.idx + 1) : bitir(); };
$("#btn-isaret").onclick = () => { const q = S.sorular[S.idx]; S.isaret[q.id] = !S.isaret[q.id]; soruGoster(); };
$("#btn-ipucu").onclick = () => {
  const el = $("#ipucu");
  el.innerHTML = `<b>Püf noktası</b>\n${esc(S.sorular[S.idx].ipucu)}`;
  el.hidden = false;
};
$("#btn-bildir").onclick = () => {
  const q = S.sorular[S.idx];
  if (!confirm("Bu soru hatalı olarak işaretlenip bankadan gizlensin mi? Ayarlar'dan geri getirebilirsin.")) return;
  gizli.push(q.id); yaz("kpss_gizli", gizli);
  S.sorular.splice(S.idx, 1);
  if (!S.sorular.length) { alert("Sınavda soru kalmadı."); S.bitti = true; clearInterval(S.timer); S = null; return ekranGoster("ev"); }
  if (S.idx >= S.sorular.length) S.idx = S.sorular.length - 1;
  $("#soru-toplam").textContent = S.sorular.length;
  soruGoster();
};
$("#btn-ai-acikla").onclick = async () => {
  const q = S.sorular[S.idx], el = $("#ai-aciklama");
  el.hidden = false; el.innerHTML = "<b>AI</b>\nAçıklama hazırlanıyor...";
  try { el.innerHTML = "<b>AI açıklaması</b>\n" + esc(await AI.acikla(q)); }
  catch (e) { el.innerHTML = "<b>AI</b>\n" + esc(e.message); }
};
$("#btn-bitir").onclick = () => {
  const bos = S.sorular.filter(q => S.cevap[q.id] === undefined).length;
  if (bos && !confirm(`${bos} soru boş. Yine de bitirilsin mi?`)) return;
  bitir();
};
document.addEventListener("keydown", e => {
  if (!S || S.bitti || !$("#sinav").classList.contains("aktif")) return;
  if (/^(input|textarea|select)$/i.test(e.target.tagName)) return;
  const i = "abcde".indexOf(e.key.toLowerCase());
  if (i > -1) cevapla(i);
  if (e.key === "ArrowRight") $("#btn-sonraki").click();
  if (e.key === "ArrowLeft") $("#btn-onceki").click();
});

/* ---------------- sonuç ---------------- */
function donut(yuzde) {
  const c = 2 * Math.PI * 52;
  return `<svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Başarı %${yuzde}">
    <circle cx="70" cy="70" r="52" fill="none" stroke="var(--yuzey2)" stroke-width="14"/>
    <circle cx="70" cy="70" r="52" fill="none" stroke="var(--vurgu)" stroke-width="14" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - yuzde / 100)}" transform="rotate(-90 70 70)"/>
    <text x="70" y="66" text-anchor="middle" font-size="30" font-weight="700" fill="var(--metin)">%${yuzde}</text>
    <text x="70" y="88" text-anchor="middle" font-size="12" fill="var(--soluk)">başarı</text>
  </svg>`;
}

function bitir() {
  sureIsle();
  clearInterval(S.timer);
  S.bitti = true;
  if (S.mod === "deneme") S.sorular.forEach(q => {
    if (S.cevap[q.id] !== undefined) kaydet(q, S.cevap[q.id] === q.dogru);
  });

  const sorular = S.sorular, cevap = S.cevap, sure = S.sure;
  const d = sorular.filter(q => cevap[q.id] === q.dogru).length;
  const y = sorular.filter(q => cevap[q.id] !== undefined && cevap[q.id] !== q.dogru).length;
  const b = sorular.length - d - y;
  const yuzde = Math.round(d / sorular.length * 100);
  const net = tercih.net === "dortbir" ? d - y / 4 : d;
  const gecenSn = Math.round((Date.now() - S.basla) / 1000);

  gecmis.push({ t: Date.now(), ad: S.baslik, mod: S.mod, d, y, b, net, toplam: sorular.length, sure: gecenSn });
  if (gecmis.length > 100) gecmis = gecmis.slice(-100);
  yaz("kpss_gecmis", gecmis);

  $("#donut").innerHTML = donut(yuzde);
  $("#skor").innerHTML = `
    <div class="iyi"><strong>${d}</strong><small>doğru</small></div>
    <div class="kotu"><strong>${y}</strong><small>yanlış</small></div>
    <div><strong>${b}</strong><small>boş</small></div>
    <div><strong>${net % 1 ? net.toFixed(2) : net}</strong><small>net</small></div>
    <div><strong>${Math.floor(gecenSn / 60)}dk</strong><small>süre</small></div>`;

  const gruplar = {};
  sorular.forEach(q => {
    const g = gruplar[q.ders] || (gruplar[q.ders] = { d: 0, t: 0 });
    g.t++; if (cevap[q.id] === q.dogru) g.d++;
  });
  $("#ders-tablo").innerHTML = tabloCiz(gruplar, "Ders");

  const zayif = {};
  sorular.forEach(q => {
    if (cevap[q.id] === q.dogru) return;
    const k = q.ders + " · " + q.konu;
    zayif[k] = (zayif[k] || 0) + 1;
  });
  const zSira = Object.entries(zayif).sort((a, c) => c[1] - a[1]);
  $("#zayif").innerHTML = zSira.length
    ? "<ul>" + zSira.map(([k, v]) => `<li>${esc(k)} — <b>${v}</b> soru</li>`).join("") + "</ul>"
    : "<p class='bos-uyari'>Hiç yanlışın yok. Zorluk seviyesini yükseltmeyi dene.</p>";

  const toplamSn = Object.values(sure).reduce((a, c) => a + c, 0) / 1000;
  const ortSn = Math.round(toplamSn / sorular.length);
  const konuSure = {};
  sorular.forEach(q => {
    const k = q.ders + " · " + q.konu;
    const o = konuSure[k] || (konuSure[k] = { ms: 0, n: 0 });
    o.ms += sure[q.id] || 0; o.n++;
  });
  const yavas = Object.entries(konuSure).map(([k, o]) => [k, Math.round(o.ms / o.n / 1000)])
    .sort((a, c) => c[1] - a[1]).slice(0, 5);
  $("#sure-analiz").innerHTML =
    `<p class="rakam">Soru başına ortalama <span>${ortSn}</span> saniye${tercih.net === "yok" ? "" : ""} · gerçek KPSS'de ortalama 65 saniyedir.</p>` +
    (yavas.length ? "<ul>" + yavas.map(([k, sn]) => `<li>${esc(k)} — soru başına <b>${sn} sn</b></li>`).join("") + "</ul>" : "");

  SONUC = { sorular, cevap, sure };
  incelemeCiz("hepsi");
  $$(".filtre .mini").forEach(x => x.classList.toggle("aktif", x.dataset.fil === "hepsi"));
  $("#ai-yorum").hidden = true;
  $("#btn-yanlislari-coz").hidden = !(y > 0);

  S = null;
  ekranGoster("sonuc");
}

function incelemeCiz(filtre) {
  const { sorular, cevap, sure } = SONUC;
  const liste = sorular.filter(q => {
    const v = cevap[q.id];
    if (filtre === "yanlis") return v !== undefined && v !== q.dogru;
    if (filtre === "bos") return v === undefined;
    if (filtre === "dogru") return v === q.dogru;
    return true;
  });
  $("#inceleme").innerHTML = liste.length ? liste.map(q => {
    const v = cevap[q.id];
    const sonuc = v === undefined ? "bos" : v === q.dogru ? "dogru" : "yanlis";
    const rozet = { bos: "Boş", dogru: "Doğru", yanlis: "Yanlış" }[sonuc];
    const sn = Math.round((sure[q.id] || 0) / 1000);
    return `<details data-sonuc="${sonuc}">
      <summary>${sorular.indexOf(q) + 1}. ${rozet} — ${esc(q.ders)} · ${esc(q.konu)} · ${ZOR_AD[q.zorluk]} · ${sn} sn</summary>
      <div class="soru-metin">${esc(q.soru)}</div>
      <div class="secenekler">${q.secenekler.map((m, j) =>
        `<div class="secenek ${j === q.dogru ? "dogru" : j === v ? "yanlis" : ""}"><b>${HARF[j]}</b><span>${esc(m)}</span></div>`).join("")}</div>
      ${q.cozum ? `<div class="cozum"><b>Çözüm</b>\n${esc(q.cozum)}</div>` : ""}
      ${q.ipucu ? `<div class="ipucu-kutu"><b>Püf noktası</b>\n${esc(q.ipucu)}</div>` : ""}
    </details>`;
  }).join("") : "<p class='bos-uyari'>Bu filtrede soru yok.</p>";
}
$$(".filtre .mini").forEach(b => b.onclick = () => {
  $$(".filtre .mini").forEach(x => x.classList.remove("aktif"));
  b.classList.add("aktif");
  incelemeCiz(b.dataset.fil);
});
$("#btn-ev").onclick = () => ekranGoster("ev");
$("#btn-yanlislari-coz").onclick = () => {
  const havuz = SONUC.sorular.filter(q => SONUC.cevap[q.id] !== q.dogru);
  if (!havuz.length) return;
  baslat("calis", karistir(havuz), 0, "Bu denemenin yanlışları");
};
$("#btn-ai-yorum").onclick = async () => {
  const el = $("#ai-yorum");
  el.hidden = false; el.innerHTML = "<b>AI</b>\nYorum hazırlanıyor...";
  try { el.innerHTML = "<b>AI yorumu</b>\n" + esc(await AI.yorum(sonucOzeti())); }
  catch (e) { el.innerHTML = "<b>AI</b>\n" + esc(e.message); }
};
function sonucOzeti() {
  const { sorular, cevap, sure } = SONUC;
  const satir = sorular.map(q => {
    const v = cevap[q.id];
    return `${q.ders}/${q.konu} (${ZOR_AD[q.zorluk]}): ${v === undefined ? "boş" : v === q.dogru ? "doğru" : "yanlış"}, ${Math.round((sure[q.id] || 0) / 1000)} sn`;
  });
  return `Toplam ${sorular.length} soru.\n` + satir.join("\n");
}

function tabloCiz(gruplar, baslik) {
  const satir = Object.entries(gruplar).sort((a, b) => (a[1].d / a[1].t) - (b[1].d / b[1].t));
  if (!satir.length) return "<p class='bos-uyari'>Henüz veri yok.</p>";
  return `<table><tr><th>${baslik}</th><th>Doğru</th><th>Başarı</th><th></th></tr>` +
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
  const bugunSayi = gunluk[bugun()] || 0;
  $("#genel-skor").innerHTML = `
    <div><strong>${top}</strong><small>çözülen soru</small></div>
    <div class="iyi"><strong>${topD}</strong><small>doğru</small></div>
    <div class="kotu"><strong>${topY}</strong><small>yanlış</small></div>
    <div><strong>%${top ? Math.round(topD / top * 100) : 0}</strong><small>genel başarı</small></div>
    <div><strong>${bugunSayi}/${tercih.hedef}</strong><small>günlük hedef</small></div>
    <div><strong>${seriHesapla()}</strong><small>gün seri</small></div>`;

  $("#grafik").innerHTML = grafikCiz();

  const idx = Object.fromEntries(tumBanka().map(s => [s.id, s]));
  const dersG = {}, konuG = {}, zorG = {};
  kayit.forEach(([id, r]) => {
    const q = idx[id]; if (!q) return;
    const g = dersG[q.ders] || (dersG[q.ders] = { d: 0, t: 0 });
    g.d += r.d; g.t += r.d + r.y;
    const z = zorG[ZOR_AD[q.zorluk]] || (zorG[ZOR_AD[q.zorluk]] = { d: 0, t: 0 });
    z.d += r.d; z.t += r.d + r.y;
    const k = q.ders + " · " + q.konu;
    konuG[k] = (konuG[k] || 0) + r.y;
  });
  $("#ist-ders").innerHTML = tabloCiz(dersG, "Ders");
  $("#ist-zorluk").innerHTML = tabloCiz(zorG, "Seviye");

  const zSira = zayifKonular();
  $("#ist-konu").innerHTML = zSira.length
    ? "<ul>" + zSira.map(([k, v]) => `<li>${esc(k)} — <b>${v}</b> yanlış</li>`).join("") + "</ul>"
    : "<p class='bos-uyari'>Kayıtlı yanlış yok.</p>";

  const son = gecmis.slice(-10).reverse();
  $("#ist-gecmis").innerHTML = son.length
    ? `<table><tr><th>Tarih</th><th>Deneme</th><th>D/Y/B</th><th>Net</th><th>Süre</th></tr>` +
      son.map(g => `<tr><td>${new Date(g.t).toLocaleDateString("tr-TR")}</td><td>${esc(g.ad)}</td>
        <td>${g.d}/${g.y}/${g.b}</td><td>${g.net % 1 ? g.net.toFixed(2) : g.net}</td>
        <td>${Math.floor(g.sure / 60)} dk</td></tr>`).join("") + "</table>"
    : "<p class='bos-uyari'>Henüz deneme çözmedin.</p>";
}
function zayifKonular() {
  const idx = Object.fromEntries(tumBanka().map(s => [s.id, s]));
  const konuG = {};
  Object.entries(istat).forEach(([id, r]) => {
    const q = idx[id]; if (!q || !r.y) return;
    const k = q.ders + " · " + q.konu;
    konuG[k] = (konuG[k] || 0) + r.y;
  });
  return Object.entries(konuG).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

function grafikCiz() {
  const veri = gecmis.filter(g => g.toplam >= 5).slice(-12);
  if (veri.length < 2) return "<p class='bos-uyari'>Gelişim grafiği için en az 2 deneme gerekiyor.</p>";
  const W = 640, H = 200, P = 30;
  const nokta = veri.map((g, i) => {
    const x = P + i * (W - 2 * P) / (veri.length - 1);
    const yz = Math.round(g.d / g.toplam * 100);
    return [x, H - P - (yz / 100) * (H - 2 * P), yz];
  });
  const cizgi = nokta.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    ${[0, 25, 50, 75, 100].map(v => {
      const y = H - P - (v / 100) * (H - 2 * P);
      return `<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" stroke="var(--cizgi)" stroke-width="1"/>
              <text x="4" y="${y + 4}" font-size="10" fill="var(--soluk)">${v}</text>`;
    }).join("")}
    <polyline points="${cizgi}" fill="none" stroke="var(--vurgu)" stroke-width="2.5" stroke-linejoin="round"/>
    ${nokta.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--vurgu)"><title>%${p[2]}</title></circle>`).join("")}
  </svg>`;
}

$("#btn-sifirla").onclick = () => {
  if (!confirm("Tüm istatistikler, geçmiş, tekrar planı ve yanlış havuzu silinsin mi? Üretilen sorular kalır.")) return;
  istat = {}; yanlisHavuzu = []; srs = {}; gecmis = []; gunluk = {};
  ["kpss_istat", "kpss_yanlis", "kpss_srs", "kpss_gecmis", "kpss_gunluk"].forEach((k, i) =>
    yaz(k, [istat, yanlisHavuzu, srs, gecmis, gunluk][i]));
  istatistikCiz(); evTazele();
};
$("#btn-ai-koc").onclick = async () => {
  const el = $("#ai-koc");
  el.hidden = false; el.innerHTML = "<b>AI</b>\nPlan hazırlanıyor...";
  try { el.innerHTML = "<b>AI koç planı</b>\n" + esc(await AI.koc(kocOzeti())); }
  catch (e) { el.innerHTML = "<b>AI</b>\n" + esc(e.message); }
};
function kocOzeti() {
  const idx = Object.fromEntries(tumBanka().map(s => [s.id, s]));
  const dersG = {};
  Object.entries(istat).forEach(([id, r]) => {
    const q = idx[id]; if (!q) return;
    const g = dersG[q.ders] || (dersG[q.ders] = { d: 0, t: 0 });
    g.d += r.d; g.t += r.d + r.y;
  });
  const ders = Object.entries(dersG).map(([k, g]) => `${k}: %${Math.round(g.d / g.t * 100)} (${g.t} soru)`).join("\n");
  const zayif = zayifKonular().map(([k, v]) => `${k}: ${v} yanlış`).join("\n");
  const son = gecmis.slice(-5).map(g => `${new Date(g.t).toLocaleDateString("tr-TR")} ${g.ad}: ${g.d}D/${g.y}Y/${g.b}B, ${Math.floor(g.sure / 60)} dk`).join("\n");
  return `DERS BAZLI BAŞARI:\n${ders || "veri yok"}\n\nEN ÇOK YANLIŞ KONULAR:\n${zayif || "veri yok"}\n\nSON DENEMELER:\n${son || "veri yok"}\n\nGünlük hedefi: ${tercih.hedef} soru. Günlük seri: ${seriHesapla()} gün.`;
}

/* ---------------- AI Lab ---------------- */
function aiTazele() {
  const z = zayifKonular();
  $("#zayif-ozet").textContent = z.length
    ? "Hedeflenecek konular: " + z.slice(0, 3).map(x => x[0]).join(", ")
    : "Henüz yeterli veri yok; önce birkaç deneme çöz.";
}
function durum(el, mesaj, tip = "") { el.className = "durum " + tip; el.textContent = mesaj; }

async function aiCalistir(isim, fn) {
  const dEl = $("#ai-durum");
  $$("#ai button").forEach(b => b.disabled = true);
  durum(dEl, isim + "... (10-30 saniye sürebilir)");
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
    `${i + 1}. [${s.ders} · ${s.konu} · ${ZOR_AD[s.zorluk]}] ${s.soru}\n` +
    s.secenekler.map((m, j) => `   ${HARF[j]}) ${m}`).join("\n") +
    `\n   → Doğru: ${HARF[s.dogru]}\n   Çözüm: ${s.cozum}` +
    (s.ipucu ? `\n   Püf noktası: ${s.ipucu}` : "")).join("\n\n");
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
  sorulariEkle(await AI.benzer({ metin, adet: +$("#ai-benzer-adet").value }), dEl);
});
$("#btn-uret").onclick = () => aiCalistir("Sorular üretiliyor", async dEl => {
  sorulariEkle(await AI.uret({
    ders: $("#ai-ders").value,
    konu: $("#ai-konu").value.trim(),
    zorluk: +$("#ai-zorluk").value,
    adet: +$("#ai-adet").value
  }), dEl);
});
$("#btn-zayif-uret").onclick = () => aiCalistir("Zayıf konulardan soru üretiliyor", async dEl => {
  const z = zayifKonular().slice(0, 3);
  if (!z.length) throw new Error("Önce birkaç deneme çöz ki zayıf konuların belirlensin.");
  const [ders, konu] = z[0][0].split(" · ");
  sorulariEkle(await AI.uret({ ders, konu: z.map(x => x[0].split(" · ")[1]).join(", "), zorluk: 3, adet: 5 }), dEl);
});
$("#btn-uretilen-indir").onclick = () => indir(uretilen, "kpss-uretilen-sorular.json");
$("#btn-uretilen-sil").onclick = () => {
  if (!confirm("Üretilen tüm sorular silinsin mi?")) return;
  uretilen = []; yaz("kpss_uretilen", uretilen); evTazele();
  durum($("#ai-durum"), "Üretilen sorular silindi.", "ok");
};

function indir(veri, ad) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(veri, null, 1)], { type: "application/json" }));
  a.download = ad; a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------------- ayarlar ---------------- */
function ayarYukle() {
  const a = AI.ayarOku();
  $("#ay-saglayici").value = a.saglayici;
  $("#ay-model").value = a.model;
  $("#ay-key").value = a.key;
  $("#ay-net").value = tercih.net;
  $("#ay-hedef").value = tercih.hedef;
}
$("#ay-saglayici").onchange = e => $("#ay-model").value = AI.varsayilanModel(e.target.value);
$("#btn-ayar-kaydet").onclick = () => {
  const saglayici = $("#ay-saglayici").value;
  AI.ayarYaz({ saglayici, model: $("#ay-model").value.trim() || AI.varsayilanModel(saglayici), key: $("#ay-key").value.trim() });
  durum($("#ayar-durum"), "Kaydedildi.", "ok");
};
$("#btn-tercih-kaydet").onclick = () => {
  tercih.net = $("#ay-net").value;
  tercih.hedef = +$("#ay-hedef").value;
  yaz("kpss_tercih", tercih);
  durum($("#tercih-durum"), "Kaydedildi.", "ok");
};
$("#btn-yedek-al").onclick = () => indir({
  surum: 2, tarih: new Date().toISOString(),
  uretilen, istat, yanlisHavuzu, srs, gecmis, gunluk, gizli, tercih
}, "kpss-lab-yedek.json");
$("#btn-yedek-yukle").onclick = () => $("#yedek-dosya").click();
$("#yedek-dosya").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const v = JSON.parse(fr.result);
      if (!v || typeof v !== "object") throw new Error("Geçersiz dosya");
      uretilen = v.uretilen || []; istat = v.istat || {}; yanlisHavuzu = v.yanlisHavuzu || [];
      srs = v.srs || {}; gecmis = v.gecmis || []; gunluk = v.gunluk || {}; gizli = v.gizli || [];
      tercih = { ...tercih, ...(v.tercih || {}) };
      [["kpss_uretilen", uretilen], ["kpss_istat", istat], ["kpss_yanlis", yanlisHavuzu], ["kpss_srs", srs],
       ["kpss_gecmis", gecmis], ["kpss_gunluk", gunluk], ["kpss_gizli", gizli], ["kpss_tercih", tercih]]
        .forEach(([k, val]) => yaz(k, val));
      temaUygula(); ayarYukle(); evTazele();
      durum($("#veri-durum"), "Yedek yüklendi.", "ok");
    } catch (err) { durum($("#veri-durum"), "Yedek okunamadı: " + err.message, "hata"); }
    e.target.value = "";
  };
  fr.readAsText(f);
};
$("#btn-gizli-geri").onclick = () => {
  if (!gizli.length) return durum($("#veri-durum"), "Gizlenmiş soru yok.");
  gizli = []; yaz("kpss_gizli", gizli); evTazele();
  durum($("#veri-durum"), "Gizlenen sorular geri getirildi.", "ok");
};

/* ---------------- başlangıç ---------------- */
["#ev-zorluk", "#fmt-zorluk", "#calis-zorluk"].forEach(zorlukKur);
temaUygula();
evTazele();
ayarYukle();
aiTazele();
