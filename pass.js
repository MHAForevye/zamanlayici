'use strict';
/* Zamanlayıcı üyelik: kodu sunucuda doğrular, planı (plus / premium) süresi dolana kadar saklar.
   Mağazadan alınan kod Forevye sunucusunda (Cloudflare Worker) kontrol edilir. */
(function (g) {
  const API = 'https://mikroklimakontrolmerkezi.forevye.workers.dev/api/zamanlayici/', MARKET = 'https://mhaforevye.github.io/market/';
  const KP = 'zamanlayici-pass', KD = 'zamanlayici-dev', RANK = { free: 0, plus: 1, premium: 2 }, DAY = 864e5, MAXP = 5;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
  let list = [];
  try { const j = JSON.parse(ls.get(KP) || '{}'); if (Array.isArray(j.list)) list = j.list.filter(x => x && typeof x.c === 'string' && RANK[x.p] > 0 && Number.isFinite(x.e) && Number.isFinite(x.v)).slice(0, MAXP); } catch (_) {}
  const store = () => ls.set(KP, JSON.stringify({ list }));
  const prune = () => { const n = Date.now(); list = list.filter(x => x.e > n).sort((a, b) => b.e - a.e).slice(0, MAXP); };
  prune();
  const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  function device() {                                          // bu cihaza özel rastgele kimlik (kod en fazla 2 cihaza bağlanır)
    let d = ls.get(KD);
    if (!/^[a-f0-9]{32}$/.test(d || '')) { const a = new Uint8Array(16); crypto.getRandomValues(a); d = [...a].map(b => b.toString(16).padStart(2, '0')).join(''); ls.set(KD, d); }
    return d;
  }
  const best = () => list.filter(x => x.e > Date.now()).sort((a, b) => RANK[b.p] - RANK[a.p] || b.e - a.e)[0];
  const plan = () => (best() || { p: 'free' }).p;
  const expiry = () => (best() || { e: 0 }).e;
  const has = l => RANK[plan()] >= RANK[l];
  let sig = plan() + '|' + expiry();
  const emit = () => { const s = plan() + '|' + expiry(); if (s !== sig) { sig = s; g.dispatchEvent(new Event('zp:change')); } };
  async function call(path, code) {                            // ağ/sunucu hatası ile kod hatasını ayır
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 12000);
    try {
      const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, app: 'zamanlayici', device: device(), v: 1 }), signal: ac.signal, cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (r.ok && j && j.ok === true && RANK[j.plan] > 0 && Number.isFinite(+j.expiresAt)) return { ok: true, plan: j.plan, exp: +j.expiresAt };
      if (r.status >= 500 || !j || typeof j.error !== 'string') return { ok: false, net: true, error: 'net' };
      return { ok: false, error: j.error };
    } catch (_) { return { ok: false, net: true, error: 'net' }; } finally { clearTimeout(t); }
  }
  async function redeem(raw) {
    const c = norm(raw); if (c.length !== 13) return { ok: false, error: 'invalid_code' };
    const r = await call('redeem', c); if (!r.ok) return r;
    const e = { c, p: r.plan, e: r.exp, v: Date.now() }, i = list.findIndex(x => x.c === c);
    if (i < 0) list.push(e); else list[i] = e;
    prune(); store(); emit(); return r;
  }
  async function verify(force) {                               // günde bir; ağ yoksa son bilinen durum korunur
    for (const x of list.filter(x => x.e > Date.now() && (force || Date.now() - x.v > DAY))) {
      const r = await call('verify', x.c);
      if (r.ok) { x.p = r.plan; x.e = r.exp; x.v = Date.now(); }
      else if (['expired', 'invalid_code', 'wrong_app'].includes(r.error)) x.e = 0;
    }
    prune(); store(); emit();
  }
  setInterval(() => { prune(); emit(); }, 3e4);
  g.ZP = { plan, has, expiry, redeem, verify, norm, MARKET };
})(window);
