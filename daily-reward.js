'use strict';
/* Günlük kristal görevi: FOREVYE ID uygulama oturumu kullanır.
   Banka hesabı, FOREVYE ID kullanıcı kimliğiyle Nexus Banka'da sunucu tarafında otomatik bulunur.
   Kristal ödülü doğrudan Banka'nın crystal_holdings cüzdanına aktarılır. Yedek anahtar yoktur. */
(function (g) {
  const API = 'https://mikroklimakontrolmerkezi.forevye.workers.dev';
  const APP = 'zamanlayici';
  const SESSION_KEY = 'zamanlayici-forevye-id-session-v1';
  const PENDING_KEY = 'zamanlayici-forevye-id-pkce-v1';
  const TARGETS = [60, 300, 600, 900, 1800, 2700, 3600, 7200, 10800, 14400];
  const LABELS = ['1 dk', '5 dk', '10 dk', '15 dk', '30 dk', '45 dk', '1 sa', '2 sa', '3 sa', '4 sa'];
  const COLORS = ['#F2C66D', '#E78A68', '#D96C76', '#B77CCB', '#7F8FE2', '#59A9C7', '#54B8A0', '#91B75B', '#D1A34F', '#E58B4A'];
  let session = loadSession(), task = null, sessionId = '', runningMode = '', pulseBusy = false, statusText = '', spinBusy = false, user = null;
  const $ = s => document.querySelector(s);
  const te = new TextEncoder();
  const fmt = n => {
    n = Math.max(0, Math.floor(Number(n) || 0));
    const h = Math.floor(n / 3600), m = Math.floor(n % 3600 / 60), s = n % 60;
    return h ? `${h} sa ${m} dk` : m ? `${m} dk${s ? ` ${s} sn` : ''}` : `${s} sn`;
  };
  const crystals = n => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  function loadSession() { try { const x = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); return x && typeof x.accessToken === 'string' && typeof x.refreshToken === 'string' ? x : null; } catch (_) { return null; } }
  function saveSession(x) { session = x; try { localStorage.setItem(SESSION_KEY, JSON.stringify(x)); } catch (_) {} }
  function clearSession() { session = null; user = null; task = null; try { localStorage.removeItem(SESSION_KEY); } catch (_) {} }
  const b64u = bytes => { let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const randomToken = n => b64u(crypto.getRandomValues(new Uint8Array(n)));
  async function challenge(verifier) { return b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(verifier)))); }
  function redirectUri() { return location.origin + location.pathname; }
  async function identityPost(path, body) {
    const r = await fetch(API + path, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.message || d.err || 'FOREVYE ID bağlantısı kurulamadı.'), { status: r.status, code: d.code || 'identity_error' });
    return d;
  }
  async function getIdSiteUrl() {
    const r = await fetch(API + '/identity/client-config', { cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.idUrl) throw new Error(d.message || 'FOREVYE ID web adresi alınamadı.');
    const u = new URL(d.idUrl);
    if (u.protocol !== 'https:') throw new Error('FOREVYE ID adresi güvenli HTTPS olmalı.');
    return u.href.endsWith('/') ? u.href : u.href + '/';
  }
  async function startLogin() {
    try {
      const idSite = await getIdSiteUrl();
      const verifier = randomToken(32), state = randomToken(24), redirect = redirectUri();
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ verifier, state, redirect, at: Date.now() }));
      const q = new URLSearchParams({ app: APP, redirect, state, challenge: await challenge(verifier) });
      location.assign(idSite + '#/baglan?' + q.toString());
    } catch (e) { message('FOREVYE ID girişi başlatılamadı: ' + e.message); }
  }
  async function handleCallback() {
    const q = new URLSearchParams(location.search), code = q.get('code'), returnedState = q.get('state');
    if (!code) return false;
    let p = null; try { p = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); } catch (_) {}
    if (!p || !returnedState || returnedState !== p.state || Date.now() - p.at > 5 * 60e3) {
      history.replaceState(null, '', location.pathname + location.hash);
      message('FOREVYE ID dönüşü doğrulanamadı. Yeniden giriş başlat.');
      return true;
    }
    try {
      const d = await identityPost('/identity/token/exchange', { code, verifier: p.verifier, app: APP, redirect: p.redirect });
      if (!d.accessToken || !d.refreshToken || !d.user || !d.user.userId) throw new Error('FOREVYE ID oturumu eksik yanıt verdi.');
      saveSession({ accessToken: d.accessToken, refreshToken: d.refreshToken, expiresAt: Date.now() + 25 * 60e3, user: d.user });
      user = d.user;
      message('FOREVYE ID tanındı. Nexus Banka hesabın otomatik tanınıyor…');
    } catch (e) { message(e.message); }
    finally {
      sessionStorage.removeItem(PENDING_KEY);
      history.replaceState(null, '', location.pathname + location.hash);
    }
    return true;
  }
  async function ensureAccess(force = false) {
    if (!session || !session.refreshToken) throw Object.assign(new Error('FOREVYE ID oturumu açılmalı.'), { status: 401, code: 'id_session_required' });
    if (!force && session.accessToken && Date.now() < (session.expiresAt || 0) - 30e3) return session.accessToken;
    const d = await identityPost('/identity/app/refresh', { refreshToken: session.refreshToken });
    if (!d.accessToken || !d.refreshToken) throw Object.assign(new Error('FOREVYE ID oturumu sona erdi. Yeniden giriş yap.'), { status: 401, code: 'id_session_expired' });
    saveSession({ ...session, accessToken: d.accessToken, refreshToken: d.refreshToken, expiresAt: Date.now() + 25 * 60e3 });
    return session.accessToken;
  }
  async function api(path, body = {}, retry = true) {
    const token = await ensureAccess();
    const r = await fetch(API + '/api/timer-reward' + path, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 && retry && session && session.refreshToken) { await ensureAccess(true); return api(path, body, false); }
    if (!r.ok || d.ok !== true) throw Object.assign(new Error(d.err || d.message || 'İşlem tamamlanamadı.'), { status: r.status, code: d.code || 'request_failed' });
    return d;
  }
  function wheelSvg() {
    const cx = 110, cy = 110, r = 103;
    const polar = (a, rad) => { const q = a * Math.PI / 180; return [cx + Math.cos(q) * rad, cy + Math.sin(q) * rad]; };
    let pieces = '';
    for (let i = 0; i < TARGETS.length; i++) {
      const a0 = -108 + i * 36, a1 = a0 + 36, p0 = polar(a0, r), p1 = polar(a1, r), mid = a0 + 18, pt = polar(mid, 67);
      pieces += `<path d="M${cx} ${cy} L${p0[0].toFixed(2)} ${p0[1].toFixed(2)} A${r} ${r} 0 0 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} Z" fill="${COLORS[i]}" stroke="#111820" stroke-width="1.7"/>`;
      pieces += `<text x="${pt[0].toFixed(2)}" y="${pt[1].toFixed(2)}" fill="#111820" font-size="10" font-weight="800" text-anchor="middle" dominant-baseline="middle">${LABELS[i]}</text>`;
    }
    return `<svg id="dr-wheel-svg" viewBox="0 0 220 220" role="img" aria-label="Günlük süre ve kristal çarkı"><circle cx="110" cy="110" r="108" fill="#101820" stroke="#d5b56c" stroke-width="2"/><g id="dr-wheel-rotator">${pieces}</g><circle cx="110" cy="110" r="18" fill="#101820" stroke="#f2d28a" stroke-width="3"/><circle cx="110" cy="110" r="5" fill="#f2d28a"/></svg>`;
  }
  function panelHtml() {
    return `<section class="dr-card" id="dr-card">
      <div class="dr-head"><div><span class="dr-kicker">GÜNLÜK GÖREV</span><h3>Kristal çarkı</h3><p class="need">Her gün bir kez çevir. Seçilen süreyi Zamanlayıcı'da tamamla, kristallerin hesabına otomatik eklensin.</p></div><span class="dr-chip">1 HAK / GÜN</span></div>
      <div class="dr-layout"><div class="dr-wheel-col"><button type="button" id="dr-spin" class="dr-wheel-button" aria-label="Günlük kristal çarkını çevir" disabled>${wheelSvg()}<span class="dr-pointer" aria-hidden="true">◆</span></button><div id="dr-wheel-caption" class="dr-wheel-caption">FOREVYE ID ile giriş yap</div></div>
        <div class="dr-info"><div id="dr-account-status" class="dr-account-status">FOREVYE ID oturumu bekleniyor.</div>
          <div id="dr-loginbox" class="dr-linkbox"><button type="button" id="dr-id-login" class="dr-action">FOREVYE ID ile giriş yap</button><p class="dr-help">FOREVYE ID hesabın Nexus Banka hesabını otomatik tanır. Kristal ödülleri doğrudan banka cüzdanına aktarılır; yedek ID, gizli anahtar veya kopyala-yapıştır gerekmez.</p></div>
          <div id="dr-task" class="dr-task" hidden><div class="dr-target"><span>BUGÜNKÜ HEDEF</span><b id="dr-target-value">—</b></div><div class="dr-reward"><span>TAMAMLAMA ÖDÜLÜ</span><b id="dr-reward-value">—</b></div><div class="dr-progress"><div id="dr-progress-fill"></div></div><div class="dr-progress-meta"><span id="dr-progress-text">0 / 0</span><span id="dr-percent">0%</span></div><p id="dr-message" class="dr-message">Süreyi tamamladığında ödül hesabına aktarılır.</p><button type="button" id="dr-disconnect" class="dr-text-button">FOREVYE ID oturumunu kapat</button></div>
        </div></div>
      <p id="dr-status" class="dr-status" role="status" aria-live="polite"></p>
    </section>`;
  }
  function rotateTo(seconds, animate) {
    const i = TARGETS.indexOf(Number(seconds)); if (i < 0) return;
    const el = $('#dr-wheel-rotator'); if (!el) return;
    const deg = 1440 - i * 36;
    el.style.transition = animate ? 'transform 4.8s cubic-bezier(.12,.72,.09,1)' : 'none';
    el.style.transform = `rotate(${deg}deg)`;
  }
  function message(t) { statusText = t || ''; const e = $('#dr-status'); if (e) e.textContent = statusText; }
  function render() {
    const card = $('#dr-card'); if (!card) return;
    const logged = !!session;
    $('#dr-loginbox').hidden = logged;
    $('#dr-account-status').textContent = logged ? `FOREVYE ID tanındı · ${user?.username || session.user?.username || 'Banka Kristal cüzdanı bağlı'}` : 'FOREVYE ID, Nexus Banka hesabını otomatik tanır. Ödüller doğrudan bankadaki Kristal cüzdanına yatırılır.';
    $('#dr-disconnect').hidden = !logged;
    $('#dr-spin').disabled = !logged || !task || task.spun || spinBusy;
    $('#dr-wheel-caption').textContent = !logged ? 'FOREVYE ID ile giriş yap' : spinBusy ? 'Çark dönüyor…' : !task || !task.spun ? 'ÇARKI ÇEVİR' : `Bugünkü hedef: ${fmt(task.targetSeconds)}`;
    const box = $('#dr-task'); box.hidden = !logged || !task || !task.spun;
    if (box.hidden) {
      $('#dr-spin').classList.toggle('is-spun', false);
      return;
    }
    $('#dr-spin').classList.add('is-spun'); rotateTo(task.targetSeconds, false);
    $('#dr-target-value').textContent = fmt(task.targetSeconds);
    $('#dr-reward-value').textContent = '+' + crystals(task.reward) + ' ◈';
    const done = Math.min(task.targetSeconds, task.creditedSeconds || 0), pct = Math.min(100, task.targetSeconds ? done / task.targetSeconds * 100 : 0);
    $('#dr-progress-fill').style.width = pct + '%';
    $('#dr-progress-text').textContent = `${fmt(done)} / ${fmt(task.targetSeconds)}`;
    $('#dr-percent').textContent = Math.floor(pct) + '%';
    $('#dr-message').textContent = task.paid ? `Görev tamamlandı. +${crystals(task.reward)} kristal hesabına eklendi.` : pct >= 100 ? 'Hedef tamamlandı. Ödül hesabına aktarılıyor.' : 'Kronometre, geri sayım veya Aralık modunda ölçtüğün çalışma süresi burada birikir. Mola süresi sayılmaz.';
    message(statusText);
  }
  async function refresh() {
    if (!session) { task = null; render(); return; }
    try {
      const d = await api('/state'); task = d.task;
      if (!user) user = session.user || null;
      message('FOREVYE ID ve Nexus Banka hesabın otomatik bağlandı.');
    } catch (e) {
      if (e.code === 'bank_account_not_found') {
        task = null;
        message('Banka hesabı otomatik eşleştirilemedi. Banka hesabının doğrulanmış e-posta bilgisiyle FOREVYE ID kimliği eşleştirilemiyor.');
      } else if (e.status === 401) { clearSession(); task = null; message('FOREVYE ID oturumunun süresi doldu. Yeniden giriş yap.'); }
      else message(e.message);
    }
    render();
  }
  async function spin() {
    if (!session || spinBusy) return;
    spinBusy = true; render(); message('Günlük hakkın sunucuda kontrol ediliyor…');
    try {
      const d = await api('/spin'); task = d.task; rotateTo(task.targetSeconds, true);
      message(d.repeated ? 'Bugünkü çark hakkın daha önce kullanılmış.' : 'Çark dönüyor…');
      await new Promise(resolve => setTimeout(resolve, 4900));
      message(d.repeated ? 'Bugünkü çark hakkın daha önce kullanılmış.' : 'Çark durdu! Bugünkü hedefin belirlendi.');
      if (runningMode && !task.paid) startSegment(runningMode);
    } catch (e) { message(e.message); }
    finally { spinBusy = false; render(); }
  }
  async function startSegment(mode) {
    runningMode = mode || 'stopwatch';
    if (!session || !task || !task.spun || task.paid || sessionId) return;
    try { const d = await api('/start', { mode: runningMode }); sessionId = d.sessionId; task = d.task; render(); }
    catch (e) { if (e.code === 'already_running') message('Bu FOREVYE ID hesabında başka bir Zamanlayıcı oturumu çalışıyor. Diğer oturumu durdur veya sayfayı yenile.'); else if (e.code !== 'goal_done') message(e.message); }
  }
  async function stopSegment() {
    const id = sessionId; sessionId = ''; runningMode = '';
    if (!id || !session) return;
    try { const d = await api('/stop', { sessionId: id }); task = d.task; render(); }
    catch (_) { message('Bağlantı kısa süreli kesildi; sunucu oturumu güvenli zaman aşımıyla kapatacak.'); }
  }
  async function completeTask() {
    const id = sessionId; sessionId = ''; runningMode = '';
    if (!session) return;
    try {
      const d = await api('/complete', { sessionId: id }); task = d.task;
      if (d.awarded > 0) message(`Tebrikler! +${crystals(d.awarded)} kristal bakiyene eklendi.`);
      else if (task && task.paid) message(`Günlük hedef tamamlandı. +${crystals(task.reward)} kristal hesabına eklendi.`);
      else message(task && task.spun ? `Süre kaydedildi: ${fmt(task.creditedSeconds)} / ${fmt(task.targetSeconds)}.` : 'Günlük görev bulunamadı.');
      render();
    } catch (_) { message('Ödül doğrulanamadı. İnternet bağlantısı geldiğinde tekrar dene; görev ilerlemen sunucuda korunur.'); }
  }
  async function pulse() {
    if (!sessionId || !session || pulseBusy) return;
    pulseBusy = true; const id = sessionId;
    try {
      const d = await api('/pulse', { sessionId: id }); task = d.task;
      if (d.awarded > 0) message(`Tebrikler! Hedef tamamlandı, +${crystals(d.awarded)} kristal hesabına eklendi.`);
      if (!d.active) { sessionId = ''; if (runningMode && task && !task.paid && task.creditedSeconds < task.targetSeconds) startSegment(runningMode); }
      render();
    } catch (_) { /* ağ kesilirse sonraki heartbeat tekrar dener */ }
    finally { pulseBusy = false; }
  }
  async function disconnect() {
    if (!session) return;
    if (!confirm('FOREVYE ID oturumu bu cihazdan kapatılsın mı? Kristal hesabın ve bakiyen ayrılmaz.')) return;
    try { await identityPost('/identity/app/revoke', { refreshToken: session.refreshToken }); } catch (_) {}
    clearSession(); message('FOREVYE ID oturumu bu cihazdan kapatıldı. Kristal hesabın ve bakiyen korunuyor.'); render();
  }
  function init() {
    document.addEventListener('click', e => {
      const b = e.target.closest('#dr-id-login,#dr-spin,#dr-disconnect'); if (!b) return;
      if (b.id === 'dr-id-login') startLogin();
      else if (b.id === 'dr-spin') spin();
      else if (b.id === 'dr-disconnect') disconnect();
    });
    handleCallback().then(() => { session = loadSession(); user = session && session.user || user; render(); if (session) refresh(); });
    setInterval(pulse, 20000);
  }
  g.DailyReward = {
    panelHtml, init, startSegment, stopSegment, completeTask,
    onVisibility(running, mode, phase) {
      if (!running) return;
      if (mode === 'iv' && phase % 2 === 1) return;
      const currentMode = mode === 'iv' ? 'interval-work' : mode === 'cd' ? 'countdown' : 'stopwatch';
      runningMode = currentMode;
      if (!session) return;
      if (!sessionId) startSegment(currentMode); else pulse();
    },
    refresh
  };
})(window);
