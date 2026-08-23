// Küçük ödül katmanı: hafif ses, konfeti ve bildirim balonu.
// Uzun çalışma seanslarında yormasın diye kısa, düşük kontrastlı ve kapatılabilir tutuldu.

const Efekt = (() => {
  let ayar = { ses: true, animasyon: true };
  const azHareket = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const kur = a => { ayar = { ...ayar, ...a }; };

  /* ---------- ses (dosya yok, WebAudio ile üretiliyor) ---------- */
  let ac = null;
  function ctx() {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); }
    if (ac && ac.state === "suspended") ac.resume();
    return ac;
  }
  function nota(frekans, sure, gecikme = 0, tip = "sine", ses = 0.05) {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = tip; o.frequency.value = frekans;
    const t = c.currentTime + gecikme;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(ses, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + sure + 0.02);
  }
  function cal(ad) {
    if (!ayar.ses) return;
    try {
      if (ad === "dogru") { nota(659.3, .12); nota(987.8, .16, .08); }
      else if (ad === "yanlis") { nota(196, .16, 0, "triangle", .04); }
      else if (ad === "bitis") { [523.3, 659.3, 784, 1046.5].forEach((f, i) => nota(f, .22, i * .09, "sine", .045)); }
      else if (ad === "kart") { nota(784, .09, 0, "sine", .04); }
      else if (ad === "sec") { nota(523.3, .05, 0, "sine", .022); }
      else if (ad === "rozet") { [784, 1046.5, 1318.5].forEach((f, i) => nota(f, .18, i * .07, "sine", .05)); }
    } catch { /* ses açılamazsa sessizce devam */ }
  }

  /* ---------- konfeti ---------- */
  let tuval = null;
  function konfeti(yogunluk = 1) {
    if (!ayar.animasyon || azHareket()) return;
    if (!tuval) {
      tuval = document.createElement("canvas");
      tuval.className = "konfeti-tuval";
      document.body.appendChild(tuval);
    }
    const c = tuval, x = c.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    c.style.display = "block";
    x.setTransform(dpr, 0, 0, dpr, 0, 0);

    const renk = ["#4f8cff", "#2ecc8f", "#f5b942", "#a97bff", "#ff8fa3"];
    const n = Math.round(70 * yogunluk);
    const p = Array.from({ length: n }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * innerWidth * .5,
      y: innerHeight * .28 + (Math.random() - .5) * 60,
      vx: (Math.random() - .5) * 7,
      vy: Math.random() * -8 - 3,
      g: .22 + Math.random() * .12,
      en: 5 + Math.random() * 5,
      boy: 8 + Math.random() * 7,
      aci: Math.random() * Math.PI,
      hiz: (Math.random() - .5) * .25,
      renk: renk[(Math.random() * renk.length) | 0]
    }));

    const bas = performance.now(), sure = 1900;
    (function kare(t) {
      const gecen = t - bas;
      x.clearRect(0, 0, innerWidth, innerHeight);
      p.forEach(o => {
        o.vy += o.g; o.x += o.vx; o.y += o.vy; o.aci += o.hiz;
        x.save();
        x.translate(o.x, o.y); x.rotate(o.aci);
        x.globalAlpha = Math.max(0, 1 - gecen / sure);
        x.fillStyle = o.renk;
        x.fillRect(-o.en / 2, -o.boy / 2, o.en, o.boy);
        x.restore();
      });
      if (gecen < sure) requestAnimationFrame(kare);
      else { x.clearRect(0, 0, innerWidth, innerHeight); c.style.display = "none"; }
    })(bas);
  }

  /* ---------- bildirim balonu ---------- */
  let balonKap = null;
  function balon(mesaj, tip = "") {
    if (!balonKap) {
      balonKap = document.createElement("div");
      balonKap.className = "balon-kap";
      document.body.appendChild(balonKap);
    }
    const b = document.createElement("div");
    b.className = "balon " + tip;
    b.textContent = mesaj;
    balonKap.appendChild(b);
    setTimeout(() => { b.classList.add("cikis"); setTimeout(() => b.remove(), 350); }, 2600);
  }

  /* ---------- sayı sayacı ---------- */
  function sayacAnimasyon(el, hedef, sure = 650, sonEk = "") {
    if (!ayar.animasyon || azHareket()) { el.textContent = hedef + sonEk; return; }
    const bas = performance.now(), baslangic = 0;
    (function kare(t) {
      const o = Math.min(1, (t - bas) / sure);
      const yumusak = 1 - Math.pow(1 - o, 3);
      const d = baslangic + (hedef - baslangic) * yumusak;
      el.textContent = (Number.isInteger(hedef) ? Math.round(d) : d.toFixed(1)) + sonEk;
      if (o < 1) requestAnimationFrame(kare);
    })(bas);
  }

  return { kur, cal, konfeti, balon, sayacAnimasyon, azHareket };
})();
