'use strict';
const $ = s => document.querySelector(s), KEY = 'zamanlayici-v1';
const DEF = { digit:'#e8fbff', accent:'#22d3ee', bg1:'#0f172a', bg2:'#1e1b4b', angle:135, dim:0, blur:0, size:16, weight:600, spacing:2, glow:20, font:'Orbitron', pos:'cc', ms:true, sound:true, zen:false, wheel:false, casino:false, ctheme:'klasik', img:'', cgo:'#22d3ee', clap:'#22d3ee', crst:'#22d3ee', ctab:'#22d3ee', cpre:'#22d3ee', bs:'line', saved:[], tone:'bip', rep:0, notify:false, ivw:25, ivb:5, ivn:4 };
const mk = (n, d, a, b1, b2, font, w, g, ang, b, bs) => [n, { digit:d, accent:a, bg1:b1, bg2:b2, font, weight:w, glow:g, angle:ang, dim:0, blur:0, cgo:b[0], clap:b[1], crst:b[2], ctab:b[3], cpre:b[4], bs }];
const THEMES = [
  mk('Obsidyen', '#f3e7c9', '#c9a45c', '#0b0b0d', '#1c1812', 'Cormorant Garamond', 300, 8, 160, ['#c9a45c', '#8a7545', '#8a7545', '#c9a45c', '#6b5a38'], 'line'),
  mk('Gece mavisi', '#e6edf7', '#7aa2d6', '#0a1220', '#1b2b4a', 'Inter', 200, 0, 180, ['#7aa2d6', '#4a6a9a', '#4a6a9a', '#7aa2d6', '#35507a'], 'fill'),
  mk('Fildişi', '#2b2a26', '#1f4d3a', '#f6f1e6', '#e4dcc8', 'Playfair Display', 500, 0, 180, ['#1f4d3a', '#8c7b5a', '#8c7b5a', '#1f4d3a', '#b8aa86'], 'fill'),
  mk('Bordo', '#f6e9e4', '#d9a79a', '#2a0a12', '#5a1729', 'Playfair Display', 400, 6, 160, ['#d9a79a', '#9b4558', '#9b4558', '#d9a79a', '#7a2a3d'], 'fill'),
  mk('Grafit', '#f2f2f0', '#e4e4e0', '#101113', '#2b2d31', 'Montserrat', 200, 0, 180, ['#e4e4e0', '#7a7d84', '#7a7d84', '#e4e4e0', '#53565c'], 'line'),
  mk('Zümrüt', '#e4f1ea', '#6fb59a', '#06201a', '#103f34', 'Cormorant Garamond', 400, 10, 150, ['#6fb59a', '#3f7d68', '#3f7d68', '#6fb59a', '#2f6252'], 'fill'),
  mk('Kum ve bakır', '#3a2a20', '#b0643a', '#f0e4cf', '#d9c09b', 'Cormorant Garamond', 600, 0, 170, ['#b0643a', '#7d5a3f', '#7d5a3f', '#b0643a', '#a58763'], 'fill'),
  mk('Sis', '#1e293b', '#475569', '#f1f5f9', '#cbd5e1', 'Montserrat', 200, 0, 180, ['#475569', '#64748b', '#64748b', '#475569', '#94a3b8'], 'line')
];
Object.assign(DEF, THEMES[0][1]);
const FIELDS = [
  ['Renkler'], ['digit','color','Rakam'], ['accent','color','Parıltı'], ['bg1','color','Arka plan 1'], ['bg2','color','Arka plan 2'], ['angle','range','Gradyan açısı',0,360,1],
  ['Düğmeler'], ['cgo','color','Başlat / Devam'], ['clap','color','Tur'], ['crst','color','Sıfırla'], ['ctab','color','Mod sekmeleri'], ['cpre','color','Hazır süreler'],
  ['Duvar kağıdı'], ['dim','range','Karartma',0,85,1], ['blur','range','Bulanıklık',0,24,1],
  ['Rakamlar'], ['size','range','Boyut',6,30,1], ['weight','range','Kalınlık',100,900,100], ['spacing','range','Harf aralığı',-4,16,1], ['glow','range','Parıltı',0,60,1]
];
const FONTS = ['Cormorant Garamond','Playfair Display','Montserrat','Inter','Orbitron','Share Tech Mono','Bebas Neue','JetBrains Mono'];
const POS = { tl:'Sol üst', tc:'Üst orta', tr:'Sağ üst', cl:'Sol orta', cc:'Orta', cr:'Sağ orta', bl:'Sol alt', bc:'Alt orta', br:'Sağ alt' };
const TONES = ['bip', 'zil', 'melodi', 'alarm'], REPS = [0, 2, 3, 5, 10, 999];
const cl = (v, lo, hi, d) => Number.isInteger(v) && v >= lo && v <= hi ? v : d;
function sane() {                                              // kayıtlı / içe aktarılan değerleri güvenli aralığa çek
  S.saved = Array.isArray(S.saved) ? S.saved.filter(n => Number.isInteger(n) && n > 0 && n <= 359999).slice(0, 20) : [];
  if (!REPS.includes(S.rep)) S.rep = 0; if (!TONES.includes(S.tone)) S.tone = 'bip';
  S.ivw = cl(S.ivw, 1, 180, 25); S.ivb = cl(S.ivb, 1, 60, 5); S.ivn = cl(S.ivn, 1, 20, 4);
}
let S;
try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { S = { ...DEF }; }
sane();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { alert('Kayıt alanı doldu. Duvar kağıdını küçük bir görselle değiştir.'); } };

const wOn = () => S.wheel && ZP.has('plus'), cOn = () => S.casino && ZP.has('premium'), cd = () => mode === 'cd' || mode === 'iv';   // kilitli özellik açık olsa bile plan yoksa çalışmaz
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
const ink = h => lum(h) > .45 ? '#111' : '#fff';           // düğme rengine göre okunaklı yazı rengi
function apply() {
  const r = document.documentElement.style, A = { h:{l:'flex-start',c:'center',r:'flex-end'}, v:{t:'flex-start',c:'center',b:'flex-end'} };
  r.setProperty('--t-acc', ink(S.accent)); r.setProperty('--digit', S.digit); r.setProperty('--accent', S.accent); r.setProperty('--size', S.size); r.setProperty('--w', S.weight); r.setProperty('--sp', S.spacing); r.setProperty('--glow', S.glow);
  for (const k of ['go', 'lap', 'rst', 'tab', 'pre']) { r.setProperty('--c-' + k, S['c' + k]); r.setProperty('--t-' + k, ink(S['c' + k])); }
  document.body.dataset.bs = S.bs;
  r.setProperty('--font', `'${S.font}', ui-monospace, monospace`);
  $('#bg').style.background = S.img ? `center/cover url(${S.img})` : `linear-gradient(${S.angle}deg,${S.bg1},${S.bg2})`;
  $('#bg').style.filter = `blur(${S.blur}px)`; $('#shade').style.background = `rgba(0,0,0,${S.dim / 100})`;
  const st = $('#stage').style; st.setProperty('--av', A.v[S.pos[0]]); st.setProperty('--ah', A.h[S.pos[1]]); st.textAlign = { l:'left', c:'center', r:'right' }[S.pos[1]];
  document.body.classList.toggle('zen', S.zen);
  const th = ZP.has('premium') && CTHEMES[S.ctheme] ? S.ctheme : 'klasik';
  if (cw.th !== th) { cw.th = th; buildCasino(); }
  $('#nums').hidden = wOn() || cOn(); $('#wheel').hidden = !(wOn() && !cOn()); $('#cwheel').hidden = !cOn(); layout(); syncWheel(); rndUi(); tick();
}

/* ---------- Zaman mantığı ---------- */
let mode = 'sw', run = false, base = 0, t0 = 0, dur = 300000, raf = 0, laps = [], lastN = 0, ph = 0, rn = 1;
const ivLen = p => (p % 2 ? S.ivb : S.ivw) * 6e4;
const el = () => base + (run ? performance.now() - t0 : 0), p2 = n => String(n).padStart(2, '0');
function fmt(ms) {
  ms = Math.max(0, Math.floor(ms)); const h = ms / 36e5 | 0, m = ms / 6e4 % 60 | 0, s = ms / 1e3 % 60 | 0, c = ms % 1e3 / 10 | 0;
  return (h ? h + ':' : '') + p2(m) + ':' + p2(s) + (S.ms ? '.' + p2(c) : '');
}
function tick() {
  let v = el(); if (cd()) { v = dur - v; if (v <= 0) { v = 0; if (run) finish(); } if (!S.ms) v = Math.ceil(v / 1000) * 1000; }
  const t = fmt(v), c = $('#clock'); if (c.textContent !== t) c.textContent = t;
  const n = Math.max(8, t.length); if (n !== lastN) { lastN = n; document.documentElement.style.setProperty('--n', n); }
  if (run) { document.title = t + ' · Zamanlayıcı'; raf = requestAnimationFrame(tick); }
}
function ui() { $('#go').textContent = run ? 'Duraklat' : el() > 0 ? 'Devam' : 'Başlat'; $('#lap').hidden = mode !== 'sw'; $('#lapx').hidden = mode !== 'sw' || !laps.length; document.body.classList.toggle('run', run); wake(run); }
function toggle() {
  if (cd() && !run && dur - el() <= 0) reset();
  if (run) { base = el(); run = false; cancelAnimationFrame(raf); clearTimeout(ft); } else { audio(); t0 = performance.now(); run = true; arm(); $('#clock').classList.remove('done'); raf = requestAnimationFrame(tick); }
  ui(); tick();
}
function reset() { ph = 0; rn = 1; if (mode === 'iv') dur = ivLen(0); rndUi(); run = false; cancelAnimationFrame(raf); clearTimeout(ft); base = 0; laps = []; $('#laps').innerHTML = ''; $('#clock').classList.remove('done'); document.title = 'Zamanlayıcı'; ui(); tick(); }
function lap() {
  if (mode !== 'sw' || !run) return; const v = el(), prev = laps.length ? laps[0].t : 0; laps.unshift({ t: v }); $('#lapx').hidden = false;
  $('#laps').insertAdjacentHTML('afterbegin', `<li><span>Tur ${laps.length}</span><b>${fmt(v - prev)}</b><i>${fmt(v)}</i></li>`);
}
function sound(kind, force) {                                  // kind: bip (ücretsiz) | zil, melodi, alarm (Plus) | chime (aşama geçişi)
  if (!S.sound && !force) return;
  try {
    const a = audio(), n = (f, d, l, type = 'sine', v = .2) => { const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + d; o.type = type; o.frequency.value = f; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + l); o.start(t); o.stop(t + l + .02); };
    if (kind === 'chime') { n(660, 0, .25); n(880, .18, .3); }
    else if (kind === 'zil') [0, .6, 1.2].forEach(d => { n(1318, d, .9, 'sine', .25); n(2637, d, .5, 'sine', .08); });
    else if (kind === 'melodi') [523, 659, 784, 1047].forEach((f, i) => n(f, i * .22, .45, 'triangle', .25));
    else if (kind === 'alarm') for (let i = 0; i < 8; i++) n(i % 2 ? 740 : 988, i * .25, .2, 'square', .12);
    else [0, .35, .7].forEach(d => n(880, d, .28));
  } catch (_) {}
}
const tone = () => ZP.has('plus') && TONES.includes(S.tone) ? S.tone : 'bip';
function notify(body) {                                        // Premium: uygulama arka plandayken bildirim
  if (!S.notify || !ZP.has('premium') || !document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
  const o = { body, icon: 'icons/icon-192.png', tag: 'zamanlayici' };
  if (navigator.serviceWorker?.controller) navigator.serviceWorker.ready.then(r => r.showNotification('Zamanlayıcı', o)).catch(() => {});
  else try { new Notification('Zamanlayıcı', o); } catch (_) {}
}
function rndUi() {                                             // aşama / tekrar göstergesi
  const r = $('#rnd'); let t = '';
  if (mode === 'iv') { t = `${ph % 2 ? 'Mola' : 'Çalışma'} · ${(ph >> 1) + 1}/${S.ivn}`; document.body.dataset.ph = ph % 2 ? 'break' : 'work'; }
  else { delete document.body.dataset.ph; if (mode === 'cd' && ZP.has('plus') && S.rep > 1) t = `Tekrar ${rn}/${S.rep > 99 ? '∞' : S.rep}`; }
  r.textContent = t; r.hidden = !t;
}
function finish() {
  const iv = mode === 'iv' && ph < 2 * S.ivn - 2, rp = mode === 'cd' && ZP.has('plus') && S.rep > 1 && rn < S.rep;
  if (iv || rp) {                                              // sıradaki aşamaya / tekrara kesintisiz geç
    cancelAnimationFrame(raf); if (iv) { ph++; dur = ivLen(ph); } else rn++;
    base = 0; t0 = performance.now(); arm(); rndUi(); sound('chime'); navigator.vibrate?.(200);
    notify(iv ? (ph % 2 ? 'Mola başladı' : 'Çalışma başladı') : 'Süre bitti, tekrar başlıyor'); return;
  }
  run = false; base = dur; cancelAnimationFrame(raf); $('#clock').classList.add('done'); document.title = 'Süre bitti'; ui();
  navigator.vibrate?.([300, 150, 300, 150, 300]); sound(tone()); notify('Süre bitti');
}
function setDur() { if (run) return; if (mode === 'iv') return reset(); dur = ((+$('#th').value || 0) * 3600 + (+$('#tm').value || 0) * 60 + (+$('#ts').value || 0)) * 1000 || 1000; reset(); }
function setMode(m) { mode = m; reset(); document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $('#cdset').hidden = m !== 'cd'; $('#ivset').hidden = m !== 'iv'; layout(); if (m === 'cd') { setDur(); syncWheel(); } }

document.querySelectorAll('#modes button').forEach(b => b.onclick = () => { if (b.dataset.m === 'iv' && !need('premium')) return; setMode(b.dataset.m); });
$('#go').onclick = toggle; $('#rst').onclick = reset; $('#lap').onclick = lap;
['#th', '#tm', '#ts'].forEach(s => $(s).oninput = setDur);
const savedMax = () => ZP.has('premium') ? 20 : 5;
const svLabel = t => t >= 3600 ? `${t / 3600 | 0}:${p2(t % 3600 / 60 | 0)}:${p2(t % 60)}` : `${p2(t / 60 | 0)}:${p2(t % 60)}`;
function renderPresets() {                                     // hazır süreler + (Plus) kayıtlı süreler
  const plus = ZP.has('plus');
  $('#presets').innerHTML = [1, 5, 10, 25, 45].map(m => `<button data-s="${m * 60}">${m} dk</button>`).join('')
    + (plus ? S.saved.slice(0, savedMax()).map(t => `<button data-s="${t}">${svLabel(t)}</button>`).join('') : '')
    + `<button id="psave" class="${plus ? '' : 'locked'}" title="Bu süreyi kaydet (Plus)" aria-label="Bu süreyi kaydet">+</button>`;
}
function saveCur() {
  if (!need('plus')) return;
  const t = Math.round(dur / 1000); if (!(t > 0) || S.saved.includes(t) || [1, 5, 10, 25, 45].some(m => m * 60 === t)) return;
  if (S.saved.length >= savedMax()) return hint(ZP.has('premium') ? 'En fazla 20 süre kaydedilebilir. Panelden birini sil.' : 'Plus’ta en fazla 5 süre kaydedilir. Premium’da 20. Panelden birini silebilirsin.');
  S.saved = [...S.saved, t]; save(); renderPresets(); rebuild();
}
renderPresets();
$('#presets').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'psave') return saveCur();
  const t = +b.dataset.s; if (!t) return;
  $('#th').value = t / 3600 | 0; $('#tm').value = t % 3600 / 60 | 0; $('#ts').value = t % 60; setDur(); syncWheel();
};
$('#lapx').onclick = async () => {                             // Plus: tur listesini panoya kopyala
  if (!need('plus')) return;
  const rows = laps.slice().reverse().map((l, i, a) => [i + 1, fmt(l.t - (i ? a[i - 1].t : 0)), fmt(l.t)]), txt = 'Tur\tTur süresi\tToplam\n' + rows.map(r => r.join('\t')).join('\n'), b = $('#lapx');
  try { await navigator.clipboard.writeText(txt); b.textContent = 'Kopyalandı ✓'; setTimeout(() => b.textContent = 'Turları kopyala', 1600); }
  catch (_) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt.replace(/\t/g, ',')], { type: 'text/csv' })); a.download = 'turlar.csv'; a.click(); }
};
const IV = [['iw', 'ivw', 1, 180], ['ib', 'ivb', 1, 60], ['ir', 'ivn', 1, 20]];
const ivFill = () => IV.forEach(([id, k]) => $('#' + id).value = S[k]);
IV.forEach(([id, k, lo, hi]) => $('#' + id).oninput = () => { const v = Math.round(+$('#' + id).value); if (!(v >= lo && v <= hi)) return; S[k] = v; save(); setDur(); });
const de = document.documentElement, rfs = de.requestFullscreen || de.webkitRequestFullscreen, xfs = document.exitFullscreen || document.webkitExitFullscreen;
const fsOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement); let pseudoFs = false;   // iPhone gerçek tam ekranı desteklemez: aynı sade görünümü uygularız
function fsUi() {                                              // tam ekranda sade görünüm
  const f = fsOn() || pseudoFs, b = $('#fs');
  document.body.classList.toggle('fs', f); if (f) $('#panel').hidden = true;
  b.title = f ? 'Tam ekrandan çık (F)' : 'Tam ekran (F)'; b.setAttribute('aria-label', f ? 'Tam ekrandan çık' : 'Tam ekran'); layout();
}
$('#fs').onclick = () => {
  if (fsOn()) xfs.call(document);
  else if (pseudoFs) { pseudoFs = false; fsUi(); }
  else { const soft = () => { pseudoFs = true; fsUi(); }; if (!rfs) return soft(); try { const r = rfs.call(de); r?.catch?.(soft); } catch (_) { soft(); } }
};
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, fsUi));
$('#gear').onclick = () => $('#panel').hidden = !$('#panel').hidden;
new MutationObserver(() => document.body.classList.toggle('pn', !$('#panel').hidden)).observe($('#panel'), { attributes: true, attributeFilter: ['hidden'] });
addEventListener('pointerdown', e => {                         // dikey telefonda alttan açılan panel: dışına dokununca kapansın
  if (!$('#panel').hidden && !e.target.closest('#panel,#gear') && matchMedia('(max-width:640px) and (orientation:portrait)').matches) $('#panel').hidden = true;
});
addEventListener('keydown', e => {
  if (e.key === 'Escape') { $('#panel').hidden = true; $('#a2h').hidden = true; if (pseudoFs) { pseudoFs = false; fsUi(); } return; }
  if (/INPUT|SELECT/.test(e.target.tagName)) return; const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); toggle(); } else if (k === 'l') lap(); else if (k === 'r') reset(); else if (k === 'f') $('#fs').click();
});
let actT; const act = () => { document.body.classList.add('act'); clearTimeout(actT); actT = setTimeout(() => document.body.classList.remove('act'), 2500); };
['pointermove', 'pointerdown', 'keydown'].forEach(ev => addEventListener(ev, act));

/* ---------- Mobil / tablet uyumu ---------- */
function layout() {                                            // ekran boyutu + yöne göre düzen sınıfları
  const w = innerWidth, h = innerHeight, land = w > h, short = land && h <= 560, wide = land && w / h >= 1.2;
  document.body.classList.toggle('short', short);
  document.body.classList.toggle('two', mode === 'cd' && (short || (wide && (wOn() || cOn()))));
}
addEventListener('resize', layout); addEventListener('orientationchange', () => setTimeout(layout, 120));
let actx, wl, ft;
const audio = () => {                                          // iOS: ses ancak kullanıcı dokunuşuyla açılır, başlatırken hazırla
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (_) {}
  return actx;
};
async function wake(on) {                                      // sayaç çalışırken ekran kararmasın
  try {
    if (on && 'wakeLock' in navigator && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => wl = null); }
    else if (!on && wl) { await wl.release(); wl = null; }
  } catch (_) { wl = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && run) wake(true); });
function arm() {                                               // sekme arka plandayken de süre bitince haber ver
  clearTimeout(ft); if (!cd()) return;
  ft = setTimeout(() => { if (run && dur - el() <= 0) tick(); }, Math.max(0, dur - el()) + 30);
}

/* ---------- Rulet zaman seçici ---------- */
const WH = 40, WCOLS = [['th', 'sa', 99], ['tm', 'dk', 59], ['ts', 'sn', 59]];
const wIdx = u => Math.max(0, Math.min(u.children.length - 1, Math.round(u.scrollTop / WH)));
function buildWheel() {
  $('#wheel').innerHTML = '<i class="band"></i>' + WCOLS.map(([id, l, mx]) =>
    `<div class="wcol"><ul tabindex="0" data-id="${id}" role="spinbutton" aria-label="${l}">${Array.from({ length: mx + 1 }, (_, i) => `<li>${p2(i)}</li>`).join('')}</ul><small>${l}</small></div>`).join('');
}
function mark(u) {                                              // ortadaki değeri vurgula
  const i = wIdx(u); if (u._i === i) return;
  u.children[u._i]?.classList.remove('sel'); u.children[i].classList.add('sel'); u._i = i;
}
function syncWheel() {                                          // sayı kutularındaki değeri ruletlere yansıt
  if (!wOn() && !cOn()) return;
  const t = (+$('#th').value || 0) * 3600 + (+$('#tm').value || 0) * 60 + (+$('#ts').value || 0);
  $('#th').value = Math.min(99, t / 3600 | 0); $('#tm').value = t % 3600 / 60 | 0; $('#ts').value = t % 60;
  document.querySelectorAll('#wheel ul').forEach(u => { u.scrollTop = $('#' + u.dataset.id).value * WH; mark(u); });
  syncCasino();
}
function commitWheel(u) {
  if (run) return syncWheel();                                  // çalışırken süre değişmesin
  const inp = $('#' + u.dataset.id), i = wIdx(u);
  if (+inp.value !== i) { inp.value = i; setDur(); }
}
$('#wheel').addEventListener('scroll', e => {
  const u = e.target; if (u.tagName !== 'UL') return;
  mark(u); clearTimeout(u._t); u._t = setTimeout(() => commitWheel(u), 90);
}, true);
$('#wheel').addEventListener('click', e => {                    // bir değere tıklayınca ortaya getir
  const li = e.target.closest('li'); if (!li) return;
  li.parentNode.scrollTo({ top: [...li.parentNode.children].indexOf(li) * WH, behavior: 'smooth' });
});
$('#wheel').addEventListener('keydown', e => {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  e.preventDefault(); const u = e.target; u.scrollTo({ top: (wIdx(u) + (e.key === 'ArrowDown' ? 1 : -1)) * WH, behavior: 'smooth' });
});

/* ---------- Casino çarkı (Plus) ---------- */
const cw = { a: 0, cf: 'tm', raf: 0, busy: false, drag: null }, CL = { th: 'sa', tm: 'dk', ts: 'sn' };
const polar = (r, a) => [150 + r * Math.sin(a * Math.PI / 180), 150 - r * Math.cos(a * Math.PI / 180)];
const cVal = a => ((Math.round(-a / 6) % 60) + 60) % 60;       // işaretçinin (üst) altındaki cep
const CTHEMES = {                                              // 3 hazır çark teması
  klasik:   ['Klasik',   { a:'#c0392b', b:'#141414', z:'#0b7a3b', zt:'#fff', w1:'#8a5a33', w2:'#2b190d', g:'#c9a45c', tr1:'#33333a', tr2:'#1b1b20', hub:'#3a2a14', val:'#f3e7c9' }],
  kraliyet: ['Kraliyet', { a:'#6d28d9', b:'#0f0a24', z:'#d4a82a', zt:'#111', w1:'#3b2f86', w2:'#0d0a26', g:'#e5c76b', tr1:'#2a2640', tr2:'#16132b', hub:'#1d1745', val:'#f1e6ff' }],
  buz:      ['Buz',      { a:'#2b8fb5', b:'#0b1f2e', z:'#0e7490', zt:'#fff', w1:'#a9b8c9', w2:'#3b4a5c', g:'#e2e8f0', tr1:'#2b3a4a', tr2:'#16222e', hub:'#1e2f40', val:'#e8f6ff' }]
};
function buildCasino() {
  const t = (CTHEMES[cw.th] || CTHEMES.klasik)[1]; let w = '';
  for (let i = 0; i < 60; i++) {
    const a0 = (i - .5) * 6, a1 = (i + .5) * 6, [x0, y0] = polar(124, a0), [x1, y1] = polar(124, a1), [x2, y2] = polar(72, a1), [x3, y3] = polar(72, a0);
    w += `<path d="M${x0} ${y0}A124 124 0 0 1 ${x1} ${y1}L${x2} ${y2}A72 72 0 0 0 ${x3} ${y3}Z" fill="${i === 0 ? t.z : i % 2 ? t.a : t.b}" stroke="${t.g}" stroke-width=".6"/>` +
         `<text x="150" y="44" transform="rotate(${i * 6} 150 150)" text-anchor="middle" dominant-baseline="central" font-size="8.5" font-weight="600" fill="${i === 0 ? t.zt : '#fff'}" font-family="Inter,system-ui,sans-serif">${i}</text>`;
  }
  $('#cwheel').innerHTML = `<div id="cfields">${Object.entries(CL).map(([f, l]) => `<button data-f="${f}"><b></b> ${l}</button>`).join('')}</div>
<svg id="cwsvg" viewBox="0 0 300 300" tabindex="0" role="slider" aria-label="Casino çarkı">
<defs><radialGradient id="cwood" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="${t.w1}"/><stop offset="1" stop-color="${t.w2}"/></radialGradient>
<radialGradient id="ctrack" cx="50%" cy="50%" r="50%"><stop offset=".9" stop-color="${t.tr1}"/><stop offset="1" stop-color="${t.tr2}"/></radialGradient>
<radialGradient id="cball" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#9a9a9a"/></radialGradient></defs>
<circle cx="150" cy="150" r="148" fill="url(#cwood)" stroke="${t.g}" stroke-width="2"/>
<circle cx="150" cy="150" r="138" fill="url(#ctrack)" stroke="${t.g}" stroke-width="1.5"/>
<g id="cwrot">${w}<circle cx="150" cy="150" r="72" fill="${t.hub}" stroke="${t.g}" stroke-width="2"/>${[0, 90].map(a => `<line x1="150" y1="84" x2="150" y2="216" transform="rotate(${a} 150 150)" stroke="${t.g}" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>
<circle cx="150" cy="150" r="124" fill="none" stroke="${t.g}" stroke-width="1.5"/>
<polygon points="150,22 141,4 159,4" fill="${t.g}" stroke="rgba(0,0,0,.5)"/>
<circle id="cwb" r="4.6" fill="url(#cball)" stroke="rgba(0,0,0,.3)" stroke-width=".5"/>
<circle cx="150" cy="150" r="44" fill="#0d0d0f" stroke="${t.g}" stroke-width="2"/>
<text id="cwval" x="150" y="148" text-anchor="middle" dominant-baseline="central" font-size="34" font-weight="700" fill="${t.val}" style="font-family:var(--font)">00</text>
<text id="cwlab" x="150" y="177" text-anchor="middle" font-size="11" fill="${t.g}" font-family="Inter,system-ui,sans-serif">dk</text></svg>
<button id="cspin">Çevir</button>`;
  setA(cw.a, true); placeBall(); cFields();
}
function placeBall(a = 0, r = 116) { const [x, y] = polar(r, a), b = $('#cwb'); b.setAttribute('cx', x); b.setAttribute('cy', y); }
function cFields() {
  document.querySelectorAll('#cfields button').forEach(b => { b.firstElementChild.textContent = p2($('#' + b.dataset.f).value); b.classList.toggle('on', b.dataset.f === cw.cf); });
  $('#cwlab').textContent = CL[cw.cf];
}
function setA(a, silent) {                                     // çarkı döndür; sessizse süreye yazma
  cw.a = a; $('#cwrot').setAttribute('transform', `rotate(${a} 150 150)`);
  const v = cVal(a), inp = $('#' + cw.cf); $('#cwval').textContent = p2(v);
  if (!silent && !run && +inp.value !== v) { inp.value = v; setDur(); cFields(); }
}
function animC(to, dur, ball, silent) {
  cancelAnimationFrame(cw.raf); const from = cw.a, t0 = performance.now(), B = ball ? 360 * (5 + (Math.random() * 3 | 0)) : 0; cw.busy = !silent;
  const step = n => {
    const t = Math.min(1, (n - t0) / dur), e = 1 - (1 - t) ** (ball ? 4 : 3);
    setA(from + (to - from) * e, silent);
    ball ? placeBall(-B * e, 130 - 14 * Math.min(1, Math.max(0, (t - .7) / .3)) ** 2) : placeBall();   // top çarkın tersine döner, sonunda cebe düşer
    if (t < 1) cw.raf = requestAnimationFrame(step); else { cw.busy = false; if (!silent) cFields(); }
  };
  cw.raf = requestAnimationFrame(step);
}
function syncCasino() {                                        // sayı kutularındaki değeri çarka yansıt
  cFields(); if (cw.drag || cw.busy) return;
  const v = (+$('#' + cw.cf).value || 0) % 60, base = -v * 6, k = Math.round((cw.a - base) / 360);
  animC(base + k * 360, 450, false, true);
}
const cA = e => { const r = $('#cwsvg').getBoundingClientRect(); return Math.atan2(e.clientX - r.left - r.width / 2, -(e.clientY - r.top - r.height / 2)) * 180 / Math.PI; };
const stopC = () => { cancelAnimationFrame(cw.raf); cw.busy = false; placeBall(); };
$('#cwheel').addEventListener('pointerdown', e => {
  if (run || !e.target.closest('#cwsvg')) return;
  stopC(); $('#cwsvg').setPointerCapture(e.pointerId); cw.drag = { a: cA(e), t: performance.now(), v: 0 };
});
$('#cwheel').addEventListener('pointermove', e => {
  const d = cw.drag; if (!d) return; const a = cA(e), n = performance.now(), da = (a - d.a + 540) % 360 - 180;
  d.v = .7 * d.v + .3 * da / Math.max(1, n - d.t); d.a = a; d.t = n; setA(cw.a + da);
});
const cEnd = () => {                                           // bırakınca ivmeyle kayıp en yakın cebe oturur
  const d = cw.drag; if (!d) return; cw.drag = null;
  animC(Math.round((cw.a + d.v * 220) / 6) * 6, 500 + Math.min(1500, Math.abs(d.v) * 900));
};
$('#cwheel').addEventListener('pointerup', cEnd); $('#cwheel').addEventListener('pointercancel', cEnd);
$('#cwheel').addEventListener('click', e => {
  if (run) return; const f = e.target.closest('#cfields button');
  if (f) { stopC(); cw.cf = f.dataset.f; syncCasino(); }
  else if (e.target.closest('#cspin')) { stopC(); animC(Math.round(cw.a / 6) * 6 + 360 * (4 + (Math.random() * 3 | 0)) + (Math.random() * 60 | 0) * 6, 5500, true); }
});
$('#cwheel').addEventListener('keydown', e => {
  if (run || !e.target.closest('#cwsvg') || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
  e.preventDefault(); stopC(); animC(Math.round(cw.a / 6) * 6 + (e.key === 'ArrowUp' ? -6 : 6), 150);
});

/* ---------- Özelleştirme paneli ---------- */
function build() {
  const sel = (k, o, d = '') => `<label>${o[0]}<select data-k="${k}"${d}>${o[1]}</select></label>`;
  const lk = l => ZP.has(l) ? '' : ' disabled', note = l => ZP.has(l) ? '' : `<p class="need">🔒 ${l === 'plus' ? 'Plus' : 'Premium'} kodu gerekir.</p>`;
  let h = passHtml() + '<section><h3>Hazır temalar</h3><div class="chips">' + THEMES.map((t, i) => `<button data-t="${i}" style="background:linear-gradient(135deg,${t[1].bg1},${t[1].bg2});color:${t[1].digit}"><span class="sw" style="font-family:'${t[1].font}',serif;font-weight:${t[1].weight}">12:34</span><small>${t[0]}</small></button>`).join('') + '</div></section><section>';
  for (const f of FIELDS) {
    if (f.length === 1) {
      h += `</section><section><h3>${f[0]}</h3>`;
      if (f[0] === 'Duvar kağıdı') h += '<div class="row"><button id="up">Görsel yükle</button><button id="noimg">Kaldır</button></div><input id="file" type="file" accept="image/*" hidden>';
      if (f[0] === 'Düğmeler') h += sel('bs', ['Stil', '<option value="fill">Dolu</option><option value="line">Çizgili</option><option value="glass">Cam</option>']);
      continue;
    }
    const [k, t, l, a, b, s] = f;
    h += t === 'color' ? `<label>${l}<input type="color" data-k="${k}"></label>` : `<label>${l}<input type="range" data-k="${k}" min="${a}" max="${b}" step="${s}"><output></output></label>`;
  }
  h += sel('font', ['Yazı tipi', FONTS.map(f => `<option>${f}</option>`).join('')]) + sel('pos', ['Konum', Object.entries(POS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')]);
  h += '</section><section><h3>Davranış</h3><label>Salise göster<input type="checkbox" data-k="ms"></label><label>Bitince ses çal<input type="checkbox" data-k="sound"></label><label>Çalışırken arayüzü gizle<input type="checkbox" data-k="zen"></label></section>';
  h += `<section><h3>Zaman seçimi <span class="plus">PLUS</span></h3><label>Kaydırmalı rulet ile süre seç<input type="checkbox" data-k="wheel"${lk('plus')}></label>${note('plus')}</section>`;
  h += '<section><h3>Alarm ve tekrar <span class="plus">PLUS</span></h3>' + sel('tone', ['Alarm sesi', '<option value="bip">Bip</option><option value="zil">Zil</option><option value="melodi">Melodi</option><option value="alarm">Alarm</option>'], lk('plus'))
    + `<label>Dinle<button id="ptone"${lk('plus')}>Dene</button></label>` + sel('rep', ['Geri sayımı tekrarla', REPS.map(n => `<option value="${n}">${n ? n > 99 ? 'Sonsuz' : n + ' kez' : 'Kapalı'}</option>`).join('')], lk('plus')) + note('plus') + '</section>';
  h += '<section><h3>Kayıtlı süreler <span class="plus">PLUS</span></h3>'
    + (S.saved.length ? S.saved.slice(0, savedMax()).map((t, i) => `<label>${svLabel(t)}<button data-del="${i}"${lk('plus')}>Sil</button></label>`).join('') : '<p class="need">Geri sayımda “+” düğmesiyle o anki süreyi kaydedersin. Plus’ta 5, Premium’da 20 süre saklanır.</p>')
    + note('plus') + '</section>';
  h += '<section><h3>Casino çarkı <span class="plus prem">PREMIUM</span></h3>' + `<label>Casino çarkı ile süre seç<input type="checkbox" data-k="casino"${lk('premium')}></label>` + sel('ctheme', ['Çark rengi', Object.entries(CTHEMES).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')], lk('premium')) + note('premium') + '</section>';
  h += `<section><h3>Aralık ve bildirim <span class="plus prem">PREMIUM</span></h3><p class="need">Üstteki “Aralık” sekmesi: çalışma ve mola turları (ör. 25 dk + 5 dk × 4).</p><label>Süre bitince bildirim gönder<input type="checkbox" data-k="notify"${lk('premium')}></label><p class="need">Uygulama arka plandayken haber verir; uygulama kapalıysa bildirim gelmez.</p>${note('premium')}</section>`;
  h += '<section><h3>Ayarlar</h3><div class="row"><button id="exp">Dışa aktar</button><button id="imp">İçe aktar</button><button id="def">Sıfırla</button></div><input id="jf" type="file" accept=".json" hidden></section>';
  $('#pbody').innerHTML = h.replace('<section></section>', ''); fill(); passRender();
}
function rebuild() { const y = $('#pbody').scrollTop; build(); $('#pbody').scrollTop = y; }
function fill() {
  document.querySelectorAll('#pbody [data-k]').forEach(i => { const v = S[i.dataset.k]; i.type === 'checkbox' ? i.checked = v : i.value = v; if (i.type === 'range') i.nextElementSibling.textContent = v; });
  ivFill();
}
$('#panel').addEventListener('input', e => {
  const i = e.target, k = i.dataset.k; if (!k) return;
  S[k] = i.type === 'checkbox' ? i.checked : i.type === 'range' || typeof DEF[k] === 'number' ? +i.value : i.value; if (i.type === 'range') i.nextElementSibling.textContent = i.value; sane(); apply(); save(); if (k === 'notify' && S.notify) askNotif();
});
$('#panel').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'pclose') $('#panel').hidden = true;
  else if (b.dataset.t) { Object.assign(S, THEMES[b.dataset.t][1], { img: '' }); fill(); apply(); save(); }
  else if (b.id === 'up') $('#file').click();
  else if (b.id === 'noimg') { S.img = ''; apply(); save(); }
  else if (b.id === 'def') { S = { ...DEF, saved: S.saved }; fill(); apply(); renderPresets(); save(); }
  else if (b.id === 'predeem') doRedeem();
  else if (b.id === 'ptone') sound(tone(), true);
  else if (b.dataset.del !== undefined) { S.saved = S.saved.filter((_, j) => j !== +b.dataset.del); save(); renderPresets(); rebuild(); }
  else if (b.id === 'imp') $('#jf').click();
  else if (b.id === 'exp') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'zamanlayici-tema.json'; a.click(); }
});
$('#panel').addEventListener('change', e => {
  const f = e.target.files?.[0]; if (!f) return;
  if (e.target.id === 'file') {                                  // görseli küçültüp kaydet: localStorage sınırını aşmasın
    const im = new Image(); im.onload = () => { const k = Math.min(1, 1920 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); S.img = c.toDataURL('image/jpeg', .8); apply(); save(); }; im.src = URL.createObjectURL(f);
  } else if (e.target.id === 'jf') f.text().then(t => { try { const j = JSON.parse(t); for (const k in DEF) if (k in j && typeof j[k] === typeof DEF[k]) S[k] = j[k]; sane(); fill(); apply(); renderPresets(); save(); } catch (_) { alert('Geçersiz ayar dosyası.'); } });
  e.target.value = '';
});
/* ---------- Üyelik (Plus / Premium) ---------- */
let pmsg = '';
const ERR = { invalid_code: 'Kod geçersiz. Harfleri kontrol et.', used: 'Bu kod en fazla 2 cihazda kullanılabilir; limit dolu.', expired: 'Bu kodun süresi dolmuş.', wrong_app: 'Bu kod Zamanlayıcı için değil.', rate_limited: 'Çok fazla deneme. Biraz sonra tekrar dene.', net: 'Sunucuya ulaşılamadı. İnternetini kontrol edip tekrar dene.' };
const leftTxt = ms => { const d = ms / 864e5 | 0, h = ms % 864e5 / 36e5 | 0, m = Math.max(1, Math.ceil(ms % 36e5 / 6e4)); return d ? `${d} gün ${h} sa` : h ? `${h} sa ${m} dk` : `${m} dk`; };
const passHtml = () => `<section id="passbox"><h3>Üyelik</h3><div id="pstat"></div><div class="row"><input id="pcode" placeholder="ABCD-EFGH-JKLMN" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" aria-label="Plus veya Premium kodu"><button id="predeem">Kodu gir</button></div><div id="pmsg" role="status"></div><a href="${ZP.MARKET}" target="_blank" rel="noopener">Forevye Mağaza’dan kod al</a></section>`;
function passRender() {
  const s = $('#pstat'); if (!s) return; const p = ZP.plan();
  s.innerHTML = p === 'free' ? 'Ücretsiz sürüm' : `<span class="plus${p === 'premium' ? ' prem' : ''}">${p.toUpperCase()}</span> ${leftTxt(ZP.expiry() - Date.now())} kaldı`;
  $('#pmsg').textContent = pmsg;
}
function hint(t) { pmsg = t; $('#panel').hidden = false; passRender(); $('#passbox')?.scrollIntoView({ block: 'nearest' }); }
function need(l) {                                             // kilitli özelliğe dokunulunca kod girişini göster
  if (ZP.has(l)) return true;
  hint(`Bu özellik ${l === 'plus' ? 'Plus' : 'Premium'} gerektirir. Kodunu aşağıya gir.`); setTimeout(() => $('#pcode')?.focus({ preventScroll: true }), 50); return false;
}
async function doRedeem() {
  const b = $('#predeem'); b.disabled = true; pmsg = 'Kontrol ediliyor…'; passRender();
  const r = await ZP.redeem($('#pcode').value);
  pmsg = r.ok ? `${r.plan === 'premium' ? 'Premium' : 'Plus'} etkinleşti. Bitiş: ${new Date(r.exp).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}` : (ERR[r.error] || ERR.net);
  const nb = $('#predeem'); if (nb) nb.disabled = false; passRender();
}
function askNotif() {
  if (!('Notification' in window)) { S.notify = false; save(); fill(); return hint('Bu tarayıcı bildirimi desteklemiyor.'); }
  Notification.requestPermission().then(p => { if (p !== 'granted') { S.notify = false; save(); fill(); hint('Bildirim izni verilmedi.'); } }).catch(() => {});
}
$('#panel').addEventListener('input', e => { if (e.target.id === 'pcode') e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); });
$('#panel').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'pcode') doRedeem(); });
const lockUi = () => { $('#modes [data-m=iv]').classList.toggle('locked', !ZP.has('premium')); $('#lapx').classList.toggle('locked', !ZP.has('plus')); };
addEventListener('zp:change', () => { if (mode === 'iv' && !ZP.has('premium')) setMode('sw'); rebuild(); renderPresets(); lockUi(); apply(); });
setInterval(passRender, 6e4);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ZP.verify(); });
build(); buildWheel(); lockUi(); apply(); ui(); ZP.verify();

/* ---------- Ana ekrana ekle ---------- */
const A2 = { done: 'zamanlayici-a2done', last: 'zamanlayici-a2last', first: 5e3, every: 12e4, snooze: 3e5, stay: 12e3 };
const lsGet = k => { try { return localStorage.getItem(k); } catch (_) { return null; } }, lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || lsGet(A2.done) === '1';
const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), isAnd = /android/i.test(navigator.userAgent);
let dip = null, a2tm;
const a2sync = () => { $('#a2').hidden = installed(); };
function a2next(ms) { clearTimeout(a2tm); if (!installed()) a2tm = setTimeout(a2show, ms); }
function a2hide(snooze) { $('#a2b').classList.remove('show'); a2next(snooze ? A2.snooze : A2.every); }
function a2show() {                                            // eklenene kadar arada bir bildirim gibi düşer
  if (installed()) return a2sync();
  if (run || document.hidden || document.body.classList.contains('fs') || !$('#a2h').hidden) return a2next(3e4);
  $('#a2b').classList.add('show'); lsSet(A2.last, Date.now());
  clearTimeout(a2tm); a2tm = setTimeout(() => a2hide(), A2.stay);
}
function a2help() {                                            // tarayıcı doğrudan kurulum sunmuyorsa adımları göster
  const L = isiOS ? ['Alttaki <b>Paylaş</b> düğmesine dokun (kare ve yukarı ok simgesi).', 'Listeyi kaydırıp <b>Ana Ekrana Ekle</b>’yi seç.', 'Sağ üstteki <b>Ekle</b>’ye dokun.']
    : isAnd ? ['Tarayıcının sağ üstündeki <b>⋮</b> menüsünü aç.', '<b>Ana ekrana ekle</b> ya da <b>Uygulamayı yükle</b>’ye dokun.', '<b>Ekle</b>’yi onayla.']
    : ['Adres çubuğunun sağındaki <b>yükle</b> simgesine tıkla ya da tarayıcı menüsünden <b>Uygulamayı yükle</b>’yi seç.', 'Açılan pencerede <b>Yükle</b>’yi onayla.'];
  $('#a2s').innerHTML = L.map(x => `<li>${x}</li>`).join(''); $('#a2h').hidden = false; $('#a2ok').focus();
}
async function a2add() {
  a2hide();
  if (!dip) return a2help();
  const p = dip; dip = null;
  try { p.prompt(); if ((await p.userChoice).outcome === 'accepted') { lsSet(A2.done, '1'); a2sync(); } } catch (_) { a2help(); }
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); dip = e; });
addEventListener('appinstalled', () => { dip = null; lsSet(A2.done, '1'); $('#a2b').classList.remove('show'); clearTimeout(a2tm); a2sync(); });
$('#a2').onclick = a2add; $('#a2add').onclick = a2add; $('#a2x').onclick = () => a2hide(true);
$('#a2h').addEventListener('click', e => { if (e.target.id === 'a2h' || e.target.id === 'a2ok') $('#a2h').hidden = true; });
a2sync(); a2next(Math.max(A2.first, A2.every - (Date.now() - (+lsGet(A2.last) || 0))));
if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
