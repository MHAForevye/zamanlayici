'use strict';
const $ = s => document.querySelector(s), KEY = 'zamanlayici-v1';
const DEF = { digit:'#e8fbff', accent:'#22d3ee', bg1:'#0f172a', bg2:'#1e1b4b', angle:135, dim:0, blur:0, size:16, weight:600, spacing:2, glow:20, font:'Orbitron', pos:'cc', ms:true, sound:true, zen:false, img:'', cgo:'#22d3ee', clap:'#22d3ee', crst:'#22d3ee', ctab:'#22d3ee', cpre:'#22d3ee', bs:'line' };
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
let S;
try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { S = { ...DEF }; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { alert('Kayıt alanı doldu. Duvar kağıdını küçük bir görselle değiştir.'); } };

const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
const ink = h => lum(h) > .45 ? '#111' : '#fff';           // düğme rengine göre okunaklı yazı rengi
function apply() {
  const r = document.documentElement.style, A = { h:{l:'flex-start',c:'center',r:'flex-end'}, v:{t:'flex-start',c:'center',b:'flex-end'} };
  r.setProperty('--digit', S.digit); r.setProperty('--accent', S.accent); r.setProperty('--size', S.size); r.setProperty('--w', S.weight); r.setProperty('--sp', S.spacing); r.setProperty('--glow', S.glow);
  for (const k of ['go', 'lap', 'rst', 'tab', 'pre']) { r.setProperty('--c-' + k, S['c' + k]); r.setProperty('--t-' + k, ink(S['c' + k])); }
  document.body.dataset.bs = S.bs;
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
  if (e.key === 'Escape') { $('#panel').hidden = true; return; }
  if (/INPUT|SELECT/.test(e.target.tagName)) return; const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); toggle(); } else if (k === 'l') lap(); else if (k === 'r') reset(); else if (k === 'f') $('#fs').click();
});
let actT; const act = () => { document.body.classList.add('act'); clearTimeout(actT); actT = setTimeout(() => document.body.classList.remove('act'), 2500); };
['pointermove', 'pointerdown', 'keydown'].forEach(ev => addEventListener(ev, act));

/* ---------- Özelleştirme paneli ---------- */
function build() {
  const sel = (k, o) => `<label>${o[0]}<select data-k="${k}">${o[1]}</select></label>`;
  let h = '<section><h3>Hazır temalar</h3><div class="chips">' + THEMES.map((t, i) => `<button data-t="${i}" style="background:linear-gradient(135deg,${t[1].bg1},${t[1].bg2});color:${t[1].digit}"><span class="sw" style="font-family:'${t[1].font}',serif;font-weight:${t[1].weight}">12:34</span><small>${t[0]}</small></button>`).join('') + '</div></section><section>';
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
  h += '<section><h3>Ayarlar</h3><div class="row"><button id="exp">Dışa aktar</button><button id="imp">İçe aktar</button><button id="def">Sıfırla</button></div><input id="jf" type="file" accept=".json" hidden></section>';
  $('#pbody').innerHTML = h.replace('<section></section>', ''); fill();
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
  if (b.id === 'pclose') $('#panel').hidden = true;
  else if (b.dataset.t) { Object.assign(S, THEMES[b.dataset.t][1], { img: '' }); fill(); apply(); save(); }
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
