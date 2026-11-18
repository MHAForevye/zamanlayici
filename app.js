'use strict';
const $ = s => document.querySelector(s), KEY = 'zamanlayici-v1';
const DEF = { digit:'#e8fbff', accent:'#22d3ee', bg1:'#0f172a', bg2:'#1e1b4b', angle:135, dim:0, blur:0, size:16, weight:600, spacing:2, glow:20, font:'Orbitron', pos:'cc', ms:true, sound:true, zen:false, img:'' };
const THEMES = [
  ['Gece neon', { digit:'#e8fbff', accent:'#22d3ee', bg1:'#0f172a', bg2:'#1e1b4b', font:'Orbitron', glow:24 }],
  ['Retro LED', { digit:'#ff3b30', accent:'#ff3b30', bg1:'#0a0000', bg2:'#1a0505', font:'Share Tech Mono', glow:30, weight:400 }],
  ['Gün batımı', { digit:'#fff7ed', accent:'#fb923c', bg1:'#7c2d12', bg2:'#be185d', font:'Bebas Neue', glow:14, weight:400, angle:160 }],
  ['Okyanus', { digit:'#ecfeff', accent:'#67e8f9', bg1:'#083344', bg2:'#0e7490', font:'Inter', glow:0, weight:200, angle:180 }],
  ['Orman', { digit:'#f0fdf4', accent:'#86efac', bg1:'#052e16', bg2:'#166534', font:'JetBrains Mono', glow:8, weight:300, angle:150 }],
  ['Kâğıt', { digit:'#1c1917', accent:'#b45309', bg1:'#f5f0e6', bg2:'#e7dfcf', font:'Playfair Display', glow:0, weight:600, angle:180 }],
  ['Galaksi', { digit:'#faf5ff', accent:'#c084fc', bg1:'#1e1b4b', bg2:'#581c87', font:'Orbitron', glow:30, weight:500, angle:120 }],
  ['Siyah beyaz', { digit:'#ffffff', accent:'#ffffff', bg1:'#000000', bg2:'#161616', font:'Inter', glow:0, weight:100, angle:180 }]
];
const FIELDS = [
  ['Renkler'], ['digit','color','Rakam'], ['accent','color','Vurgu (düğme, parıltı)'], ['bg1','color','Arka plan 1'], ['bg2','color','Arka plan 2'], ['angle','range','Gradyan açısı',0,360,1],
  ['Duvar kağıdı'], ['dim','range','Karartma',0,85,1], ['blur','range','Bulanıklık',0,24,1],
  ['Rakamlar'], ['size','range','Boyut',6,30,1], ['weight','range','Kalınlık',100,900,100], ['spacing','range','Harf aralığı',-4,16,1], ['glow','range','Parıltı',0,60,1]
];
const FONTS = ['Orbitron','Share Tech Mono','Bebas Neue','JetBrains Mono','Inter','Playfair Display'];
const POS = { tl:'Sol üst', tc:'Üst orta', tr:'Sağ üst', cl:'Sol orta', cc:'Orta', cr:'Sağ orta', bl:'Sol alt', bc:'Alt orta', br:'Sağ alt' };
let S;
try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { S = { ...DEF }; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { alert('Kayıt alanı doldu. Duvar kağıdını küçük bir görselle değiştir.'); } };

function apply() {
  const r = document.documentElement.style, A = { h:{l:'flex-start',c:'center',r:'flex-end'}, v:{t:'flex-start',c:'center',b:'flex-end'} };
  r.setProperty('--digit', S.digit); r.setProperty('--accent', S.accent); r.setProperty('--size', S.size); r.setProperty('--w', S.weight); r.setProperty('--sp', S.spacing); r.setProperty('--glow', S.glow);
  r.setProperty('--font', `'${S.font}', ui-monospace, monospace`);
  $('#bg').style.background = S.img ? `center/cover url(${S.img})` : `linear-gradient(${S.angle}deg,${S.bg1},${S.bg2})`;
  $('#bg').style.filter = `blur(${S.blur}px)`; $('#shade').style.background = `rgba(0,0,0,${S.dim / 100})`;
  const st = $('#stage').style; st.justifyContent = A.v[S.pos[0]]; st.alignItems = A.h[S.pos[1]]; st.textAlign = { l:'left', c:'center', r:'right' }[S.pos[1]];
  document.body.classList.toggle('zen', S.zen); tick();
}

/* ---------- Zaman mantığı ---------- */
let mode = 'sw', run = false, base = 0, t0 = 0, dur = 300000, raf = 0, laps = [], lastN = 0;
const el = () => base + (run ? performance.now() - t0 : 0), p2 = n => String(n).padStart(2, '0');
function fmt(ms) {
  ms = Math.max(0, Math.floor(ms)); const h = ms / 36e5 | 0, m = ms / 6e4 % 60 | 0, s = ms / 1e3 % 60 | 0, c = ms % 1e3 / 10 | 0;
  return (h ? h + ':' : '') + p2(m) + ':' + p2(s) + (S.ms ? '.' + p2(c) : '');
}
function tick() {
  let v = el(); if (mode === 'cd') { v = dur - v; if (v <= 0) { v = 0; finish(); } if (!S.ms) v = Math.ceil(v / 1000) * 1000; }
  const t = fmt(v), c = $('#clock'); if (c.textContent !== t) c.textContent = t;
  const n = Math.max(8, t.length); if (n !== lastN) { lastN = n; document.documentElement.style.setProperty('--n', n); }
  if (run) { document.title = t + ' · Zamanlayıcı'; raf = requestAnimationFrame(tick); }
}
function ui() { $('#go').textContent = run ? 'Duraklat' : el() > 0 ? 'Devam' : 'Başlat'; $('#lap').hidden = mode !== 'sw'; document.body.classList.toggle('run', run); }
function toggle() {
  if (mode === 'cd' && !run && dur - el() <= 0) reset();
  if (run) { base = el(); run = false; cancelAnimationFrame(raf); } else { t0 = performance.now(); run = true; $('#clock').classList.remove('done'); raf = requestAnimationFrame(tick); }
  ui(); tick();
}
function reset() { run = false; cancelAnimationFrame(raf); base = 0; laps = []; $('#laps').innerHTML = ''; $('#clock').classList.remove('done'); document.title = 'Zamanlayıcı'; ui(); tick(); }
function lap() {
  if (mode !== 'sw' || !run) return; const v = el(), prev = laps.length ? laps[0].t : 0; laps.unshift({ t: v });
  $('#laps').insertAdjacentHTML('afterbegin', `<li><span>Tur ${laps.length}</span><b>${fmt(v - prev)}</b><i>${fmt(v)}</i></li>`);
}
function finish() {
  run = false; base = dur; cancelAnimationFrame(raf); $('#clock').classList.add('done'); document.title = 'Süre bitti'; ui();
  if (S.sound) try { const a = new AudioContext(); [0, .35, .7].forEach(d => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(.2, a.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + d + .28); o.start(a.currentTime + d); o.stop(a.currentTime + d + .3); }); } catch (_) {}
}
function setDur() { if (run) return; dur = ((+$('#th').value || 0) * 3600 + (+$('#tm').value || 0) * 60 + (+$('#ts').value || 0)) * 1000 || 1000; reset(); }
function setMode(m) { mode = m; reset(); document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); $('#cdset').hidden = m !== 'cd'; if (m === 'cd') setDur(); }

document.querySelectorAll('#modes button').forEach(b => b.onclick = () => setMode(b.dataset.m));
$('#go').onclick = toggle; $('#rst').onclick = reset; $('#lap').onclick = lap;
['#th', '#tm', '#ts'].forEach(s => $(s).oninput = setDur);
$('#presets').innerHTML = [1, 5, 10, 25, 45].map(m => `<button data-m="${m}">${m} dk</button>`).join('');
$('#presets').onclick = e => { const m = e.target.dataset.m; if (!m) return; $('#th').value = 0; $('#tm').value = m; $('#ts').value = 0; setDur(); };
$('#fs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
$('#gear').onclick = () => $('#panel').hidden = !$('#panel').hidden;
addEventListener('keydown', e => {
  if (/INPUT|SELECT/.test(e.target.tagName)) return; const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); toggle(); } else if (k === 'l') lap(); else if (k === 'r') reset(); else if (k === 'f') $('#fs').click(); else if (k === 'escape') $('#panel').hidden = true;
});
let actT; const act = () => { document.body.classList.add('act'); clearTimeout(actT); actT = setTimeout(() => document.body.classList.remove('act'), 2500); };
['pointermove', 'pointerdown', 'keydown'].forEach(ev => addEventListener(ev, act));

/* ---------- Özelleştirme paneli ---------- */
function build() {
  let h = '<h3>Hazır temalar</h3><div class="chips">' + THEMES.map((t, i) => `<button data-t="${i}" style="background:linear-gradient(135deg,${t[1].bg1},${t[1].bg2});color:${t[1].digit}">${t[0]}</button>`).join('') + '</div>';
  for (const f of FIELDS) {
    if (f.length === 1) { h += `<h3>${f[0]}</h3>`; if (f[0] === 'Duvar kağıdı') h += '<div class="row"><button id="up">Görsel yükle</button><button id="noimg">Kaldır</button></div><input id="file" type="file" accept="image/*" hidden>'; continue; }
    const [k, t, l, a, b, s] = f;
    h += t === 'color' ? `<label>${l}<input type="color" data-k="${k}"></label>` : `<label>${l}<input type="range" data-k="${k}" min="${a}" max="${b}" step="${s}"><output></output></label>`;
  }
  h += '<label>Yazı tipi<select data-k="font">' + FONTS.map(f => `<option>${f}</option>`).join('') + '</select></label>';
  h += '<label>Konum<select data-k="pos">' + Object.entries(POS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('') + '</select></label>';
  h += '<h3>Davranış</h3><label>Salise göster<input type="checkbox" data-k="ms"></label><label>Bitince ses çal<input type="checkbox" data-k="sound"></label><label>Çalışırken arayüzü gizle<input type="checkbox" data-k="zen"></label>';
  h += '<h3>Ayarlar</h3><div class="row"><button id="exp">Dışa aktar</button><button id="imp">İçe aktar</button><button id="def">Sıfırla</button></div><input id="jf" type="file" accept=".json" hidden>';
  $('#pbody').innerHTML = h; fill();
}
function fill() {
  document.querySelectorAll('#pbody [data-k]').forEach(i => { const v = S[i.dataset.k]; i.type === 'checkbox' ? i.checked = v : i.value = v; if (i.type === 'range') i.nextElementSibling.textContent = v; });
}
$('#panel').addEventListener('input', e => {
  const i = e.target, k = i.dataset.k; if (!k) return;
  S[k] = i.type === 'checkbox' ? i.checked : i.type === 'range' ? +i.value : i.value; if (i.type === 'range') i.nextElementSibling.textContent = i.value; apply(); save();
});
$('#panel').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.t) { Object.assign(S, THEMES[b.dataset.t][1], { img: '' }); fill(); apply(); save(); }
  else if (b.id === 'up') $('#file').click();
  else if (b.id === 'noimg') { S.img = ''; apply(); save(); }
  else if (b.id === 'def') { S = { ...DEF }; fill(); apply(); save(); }
  else if (b.id === 'imp') $('#jf').click();
  else if (b.id === 'exp') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'zamanlayici-tema.json'; a.click(); }
});
$('#panel').addEventListener('change', e => {
  const f = e.target.files?.[0]; if (!f) return;
  if (e.target.id === 'file') {                                  // görseli küçültüp kaydet: localStorage sınırını aşmasın
    const im = new Image(); im.onload = () => { const k = Math.min(1, 1920 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); S.img = c.toDataURL('image/jpeg', .8); apply(); save(); }; im.src = URL.createObjectURL(f);
  } else if (e.target.id === 'jf') f.text().then(t => { try { const j = JSON.parse(t); for (const k in DEF) if (k in j && typeof j[k] === typeof DEF[k]) S[k] = j[k]; fill(); apply(); save(); } catch (_) { alert('Geçersiz ayar dosyası.'); } });
  e.target.value = '';
});
build(); apply(); ui();
