'use strict';
/* Günlük kristal görevi: kimlik ve tüm ödül hesapları sunucu tarafındadır. */
(function (g) {
  const API_BASE = 'https://mikroklimakontrolmerkezi.forevye.workers.dev';
  const API = API_BASE + '/api/timer-reward';
  const ID_API = API_BASE;
  const ID_URL = 'https://mhaforevye.github.io/forevye-id/';
  const APP_ID = 'zamanlayici';
  const REDIRECT = new URL('./', location.href).href;
  const KEY = 'zamanlayici-forevye-id-v1';
  const LEGACY_KEY = 'zamanlayici-kristal-hesap-v1';
  const TARGETS = [60, 300, 600, 900, 1800, 2700, 3600, 7200, 10800, 14400];
  const LABELS = ['1 dk', '5 dk', '10 dk', '15 dk', '30 dk', '45 dk', '1 sa', '2 sa', '3 sa', '4 sa'];
  const COLORS = ['#F2C66D', '#E78A68', '#D96C76', '#B77CCB', '#7F8FE2', '#59A9C7', '#54B8A0', '#91B75B', '#D1A34F', '#E58B4A'];
  let idSession = loadId(), legacyCreds = loadLegacy(), idUser = idSession && idSession.user || null, walletLinked = false;
  let task = null, sessionId = '', runningMode = '', pulseBusy = false, statusText = '', spinBusy = false, authBusy = false;
  const $ = s => document.querySelector(s);
  const fmt = n => {
    n = Math.max(0, Math.floor(Number(n) || 0));
    const h = Math.floor(n / 3600), m = Math.floor(n % 3600 / 60), s = n % 60;
    return h ? `${h} sa ${m} dk` : m ? `${m} dk${s ? ` ${s} sn` : ''}` : `${s} sn`;
  };
  const crystals = n => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  function loadId() {
    try {
      const x = JSON.parse(localStorage.getItem(KEY) || 'null');
      return x && /^[A-Za-z0-9_-]{30,64}$/.test(x.accessToken || '') ? x : null;
    } catch (_) { return null; }
  }
  function loadLegacy() {
    try {
      const c = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
      return valid(c);
    } catch (_) { return null; }
  }
  function valid(c) {
    if (!c) return null;
    const id = String(c.id || ''), token = String(c.token || '');
    return /^\d{8}$/.test(id) && /^[A-Za-z0-9_-]{20,64}$/.test(token) ? { id, token } : null;
  }
  function parse(raw) {
    const v = String(raw || '').trim();
    let m = /^(\d{8})\.([A-Za-z0-9_-]{20,64})$/.exec(v);
    if (m) return valid({ id: m[1], token: m[2] });
    try {
      const o = JSON.parse(v);
      if (o && o.kr) return valid(o.kr);
      if (o && o.id && o.token) return valid(o);
    } catch (_) {}
    return null;
  }
  const b64u = bytes => {
    let bin = ''; bytes.forEach(x => bin += String.fromCharCode(x));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  function randomToken(n = 48) {
    const b = new Uint8Array(n); crypto.getRandomValues(b); return b64u(b);
  }
  async function sha256b64(value) {
    return b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
  }
  async function startIdLogin() {
    if (authBusy) return;
    authBusy = true; message('FOREVYE ID güvenli oturumu açılıyor…');
    try {
      const verifier = randomToken(48), state = randomToken(24), challenge = await sha256b64(verifier);
      sessionStorage.setItem('dr.id.pkce', JSON.stringify({ verifier, state, redirect: REDIRECT, created: Date.now() }));
      const q = new URLSearchParams({ app: APP_ID, redirect: REDIRECT, state, challenge });
      location.href = ID_URL + '#/baglan?' + q.toString();
    } catch (_) { authBusy = false; message('Güvenli giriş başlatılamadı. Tarayıcını güncelle ve tekrar dene.'); }
  }
  async function exchangeIdCode() {
    const q = new URLSearchParams(location.search), code = q.get('code'), state = q.get('state');
    if (!code && !state) return false;
    try {
      const pending = JSON.parse(sessionStorage.getItem('dr.id.pkce') || 'null');
      if (!pending || !code || !state || state !== pending.state || Date.now() - pending.created > 10 * 60e3) throw new Error('Giriş bağlantısının süresi dolmuş. Tekrar giriş yap.');
      const r = await fetch(ID_API + '/identity/token/exchange', {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, verifier: pending.verifier, app: APP_ID, redirect: pending.redirect })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.accessToken || !d.refreshToken || !d.user) throw new Error(d.message || 'FOREVYE ID oturumu doğrulanamadı.');
      idSession = { accessToken: d.accessToken, refreshToken: d.refreshToken, user: d.user };
      idUser = d.user;
      localStorage.setItem(KEY, JSON.stringify(idSession));
      sessionStorage.removeItem('dr.id.pkce');
      history.replaceState(null, '', location.pathname + location.hash);
      return true;
    } catch (e) {
      sessionStorage.removeItem('dr.id.pkce');
      history.replaceState(null, '', location.pathname + location.hash);
      message(e.message || 'FOREVYE ID bağlantısı tamamlanamadı.');
      return false;
    }
  }
  async function refreshIdToken() {
    if (!idSession || !idSession.refreshToken) return false;
    try {
      const r = await fetch(ID_API + '/identity/app/refresh', {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: idSession.refreshToken })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.accessToken || !d.refreshToken) {
        if ([400, 401, 403, 404].includes(r.status)) { idSession = null; localStorage.removeItem(KEY); }
        return false;
      }
      idSession = { accessToken: d.accessToken, refreshToken: d.refreshToken, user: idSession.user || null };
      idUser = idSession.user || idUser;
      localStorage.setItem(KEY, JSON.stringify(idSession));
      return true;
    } catch (_) { return false; }
  }
  async function api(path, body = {}, retry = true) {
    const token = idSession && idSession.accessToken;
    if (!token && !legacyCreds) throw Object.assign(new Error('FOREVYE ID ile giriş yap.'), { code: 'no_account' });
    const headers = { 'Content-Type': 'application/json' };
    headers.Authorization = token ? `Bearer ${token}` : `Bearer ${legacyCreds.id}.${legacyCreds.token}`;
    const r = await fetch(API + path, { method: 'POST', cache: 'no-store', headers, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (r.status === 401 && token && retry && await refreshIdToken()) return api(path, body, false);
    if (!r.ok || d.ok !== true) throw Object.assign(new Error(d.err || d.message || d.error || 'İşlem tamamlanamadı.'), { status: r.status, code: d.code || 'request_failed' });
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
      <div class="dr-head"><div><span class="dr-kicker">GÜNLÜK GÖREV</span><h3>Kristal çarkı</h3><p class="need">Günde bir kez çevir. Seçilen süreyi tamamla, ödülün bağlı Kristal hesabına otomatik yatsın.</p></div><span class="dr-chip">1 HAK / GÜN</span></div>
      <div class="dr-layout"><div class="dr-wheel-col"><button type="button" id="dr-spin" class="dr-wheel-button" aria-label="Günlük kristal çarkını çevir" disabled>${wheelSvg()}<span class="dr-pointer" aria-hidden="true">◆</span></button><div id="dr-wheel-caption" class="dr-wheel-caption">FOREVYE ID ile devam et</div></div>
        <div class="dr-info"><div id="dr-account-status" class="dr-account-status">FOREVYE ID oturumu bekleniyor.</div>
          <div id="dr-idbox" class="dr-idbox"><button type="button" id="dr-id-login" class="dr-action">FOREVYE ID ile giriş yap</button><p class="dr-help">FOREVYE ID hesabınla güvenli şekilde tanın. Daha önce giriş yaptıysan tekrar parola girmen gerekmez.</p></div>
          <div id="dr-linkbox" class="dr-linkbox" hidden><p class="dr-link-title">Kristal hesabını bir kez eşleştir</p><p class="dr-help">Bu FOREVYE ID hesabında kayıtlı bir Kristal hesabı bulamadık. Mevcut hesabını bir kez bağla; sonraki girişlerinde otomatik tanınacaksın.</p><label for="dr-credential">Mevcut Kristal hesap yedeği</label><textarea id="dr-credential" rows="2" autocomplete="off" spellcheck="false" placeholder="ID.ANAHTAR veya hesap yedek metni"></textarea><button type="button" id="dr-link" class="dr-action">Hesabı bir kez eşleştir</button></div>
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
    const signed = !!idSession || !!legacyCreds;
    $('#dr-idbox').hidden = signed;
    $('#dr-linkbox').hidden = !signed || walletLinked;
    $('#dr-account-status').textContent = signed
      ? (walletLinked ? `FOREVYE ID bağlı${idUser && idUser.username ? ' · ' + idUser.username : ''} · Kristal hesabı hazır` : 'FOREVYE ID tanındı · Kristal hesabı bir kez eşleştirilmeli.')
      : 'Günlük kristal ödülü için FOREVYE ID hesabınla giriş yap.';
    $('#dr-disconnect').hidden = !signed;
    $('#dr-spin').disabled = !signed || !walletLinked || !task || task.spun || spinBusy;
    $('#dr-wheel-caption').textContent = !signed ? 'FOREVYE ID İLE GİRİŞ' : !walletLinked ? 'ÖNCE KRİSTAL HESABINI EŞLEŞTİR' : spinBusy ? 'Çark dönüyor…' : !task || !task.spun ? 'ÇARKI ÇEVİR' : `Bugünkü hedef: ${fmt(task.targetSeconds)}`;
    const box = $('#dr-task'); box.hidden = !signed || !walletLinked || !task || !task.spun;
    if (box.hidden) {
      $('#dr-spin').classList.toggle('is-spun', false);
      message(statusText || (!signed ? 'FOREVYE ID oturumunu açtığında hesabın otomatik tanınır.' : !walletLinked ? 'Kristal hesabını bir kez eşleştir; sonraki girişlerde otomatik bağlanır.' : 'Bugünkü hakkın hazır. Çarkı bir kez çevir.'));
      return;
    }
    $('#dr-spin').classList.add('is-spun'); rotateTo(task.targetSeconds, false);
    $('#dr-target-value').textContent = fmt(task.targetSeconds);
    $('#dr-reward-value').textContent = '+' + crystals(task.reward) + ' ◈';
    const done = Math.min(task.targetSeconds, task.creditedSeconds || 0), pct = Math.min(100, task.targetSeconds ? done / task.targetSeconds * 100 : 0);
    $('#dr-progress-fill').style.width = pct + '%';
    $('#dr-progress-text').textContent = `${fmt(done)} / ${fmt(task.targetSeconds)}`;
    $('#dr-percent').textContent = Math.floor(pct) + '%';
    $('#dr-message').textContent = task.paid ? `Görev tamamlandı. +${crystals(task.reward)} kristal hesabına eklendi.` : pct >= 100 ? 'Hedefe ulaştın. Ödülün sunucu tarafından işleniyor.' : 'Kronometre, geri sayım veya Aralık modunda ölçtüğün çalışma süresi burada birikir. Mola süresi sayılmaz.';
    message(statusText);
  }
  async function refresh() {
    if (!idSession && !legacyCreds) { task = null; walletLinked = false; render(); return; }
    try {
      if (!idSession && legacyCreds) {
        walletLinked = true;
      } else {
        const link = await api('/link/status');
        walletLinked = !!link.linked;
        if (!walletLinked && legacyCreds && idSession) {
          await api('/link', { hesap: `${legacyCreds.id}.${legacyCreds.token}` });
          walletLinked = true;
          legacyCreds = null; localStorage.removeItem(LEGACY_KEY);
        }
      }
      if (!walletLinked) { task = null; message('FOREVYE ID hesabın tanındı. Kristal hesabını bir kez eşleştirmen yeterli.'); render(); return; }
      const d = await api('/state'); task = d.task; message('FOREVYE ID ve Kristal hesabın eşitlendi.');
    } catch (e) {
      if (e.status === 401) {
        idSession = null; localStorage.removeItem(KEY); walletLinked = false; task = null;
        message('FOREVYE ID oturumunun süresi doldu. Yeniden giriş yap.');
      } else message(e.message);
    }
    render();
  }
  async function linkWallet() {
    const input = $('#dr-credential'), c = parse(input && input.value);
    if (!c) return message('Kristal hesap yedeği tanınmadı. Bilgiyi kontrol et.');
    const b = $('#dr-link'); if (b) { b.disabled = true; b.textContent = 'Eşleştiriliyor…'; }
    try {
      const d = await api('/link', { hesap: `${c.id}.${c.token}` });
      walletLinked = !!d.linked; legacyCreds = null; localStorage.removeItem(LEGACY_KEY);
      if (input) input.value = '';
      const state = await api('/state'); task = state.task;
      message('Kristal hesabın FOREVYE ID hesabına güvenli biçimde eşleştirildi. Bundan sonra otomatik tanınacaksın.');
    } catch (e) { message(e.message || 'Hesap eşleştirilemedi.'); }
    finally { if (b) { b.disabled = false; b.textContent = 'Hesabı bir kez eşleştir'; } render(); }
  }
  async function spin() {
    if ((!idSession && !legacyCreds) || !walletLinked || spinBusy) return;
    spinBusy = true; render(); message('Günlük hakkın sunucuda kontrol ediliyor…');
    try {
      const d = await api('/spin'); task = d.task;
      rotateTo(task.targetSeconds, true);
      message(d.repeated ? 'Bugünkü çark hakkın daha önce kullanılmış.' : 'Çark dönüyor…');
      await new Promise(resolve => setTimeout(resolve, 4900));
      message(d.repeated ? 'Bugünkü çark hakkın daha önce kullanılmış.' : 'Çark durdu! Bugünkü hedefin belirlendi.');
      if (runningMode && !task.paid) startSegment(runningMode);
    } catch (e) { message(e.message); }
    finally { spinBusy = false; render(); }
  }
  async function startSegment(mode) {
    runningMode = mode || 'stopwatch';
    if ((!idSession && !legacyCreds) || !walletLinked || !task || !task.spun || task.paid || sessionId) return;
    try {
      const d = await api('/start', { mode: runningMode }); sessionId = d.sessionId; task = d.task; render();
    } catch (e) {
      if (e.code === 'already_running') message('Bu kristal hesabında başka bir Zamanlayıcı oturumu açık. Diğer oturumu durdur veya sayfayı yenile.');
      else if (e.code !== 'goal_done') message(e.message);
    }
  }
  async function stopSegment() {
    const id = sessionId; sessionId = ''; runningMode = '';
    if (!id || (!idSession && !legacyCreds)) return;
    try { const d = await api('/stop', { sessionId: id }); task = d.task; render(); }
    catch (e) { message('Bağlantı kısa süreli kesildi; sunucu oturumu güvenli zaman aşımıyla kapatacak.'); }
  }
  async function completeTask() {
    const id = sessionId; sessionId = ''; runningMode = '';
    if (!idSession && !legacyCreds) return;
    try {
      const d = await api('/complete', { sessionId: id }); task = d.task;
      if (d.awarded > 0) message(`Tebrikler! +${crystals(d.awarded)} kristal bakiyene eklendi.`);
      else if (task && task.paid) message(`Günlük hedef tamamlandı. +${crystals(task.reward)} kristal hesabına eklendi.`);
      else message(task && task.spun ? `Süre kaydedildi: ${fmt(task.creditedSeconds)} / ${fmt(task.targetSeconds)}.` : 'Günlük görev bulunamadı.');
      render();
    } catch (e) { message('Ödül doğrulanamadı. İnternet bağlantısı geldiğinde tekrar dene; görev ilerlemen sunucuda korunur.'); }
  }
  async function pulse() {
    if (!sessionId || (!idSession && !legacyCreds) || pulseBusy) return;
    pulseBusy = true; const id = sessionId;
    try {
      const d = await api('/pulse', { sessionId: id }); task = d.task;
      if (d.awarded > 0) message(`Tebrikler! Hedef tamamlandı, +${crystals(d.awarded)} kristal hesabına eklendi.`);
      if (!d.active) { sessionId = ''; if (runningMode && task && !task.paid && task.creditedSeconds < task.targetSeconds) startSegment(runningMode); }
      render();
    } catch (_) { /* Ağ kesilirse sunucu heartbeat aralığını sınırlar; istemci sonraki turda tekrar dener. */ }
    finally { pulseBusy = false; }
  }
  function init() {
    document.addEventListener('click', e => {
      const b = e.target.closest('#dr-id-login,#dr-link,#dr-spin,#dr-disconnect'); if (!b) return;
      if (b.id === 'dr-id-login') startIdLogin();
      else if (b.id === 'dr-link') linkWallet();
      else if (b.id === 'dr-spin') spin();
      else if (b.id === 'dr-disconnect') {
        if (confirm('FOREVYE ID oturumu bu cihazdaki Zamanlayıcı’dan kapatılsın mı? Kristal hesabı eşleştirmesi ve bakiye silinmez.')) {
          if (idSession && idSession.refreshToken) fetch(ID_API + '/identity/app/revoke', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: idSession.refreshToken }) }).catch(() => {});
          idSession = null; idUser = null; task = null; walletLinked = false;
          localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY); legacyCreds = null; message('FOREVYE ID oturumu bu cihazdan kapatıldı.'); render();
        }
      }
    });
    // Eski Mağaza/Hava hesap aktarım bağlantılarını da güvenli biçimde devral.
    const legacyHash = /(?:^#|&)hesap=([^&]+)/.exec(location.hash);
    if (legacyHash) {
      try {
        const imported = parse(decodeURIComponent(legacyHash[1]));
        if (imported) {
          legacyCreds = imported;
          localStorage.setItem(LEGACY_KEY, JSON.stringify(imported));
        }
      } catch (_) {}
      try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
    }
    (async () => {
      await exchangeIdCode();
      render();
      if (idSession || legacyCreds) await refresh();
    })();
    setInterval(pulse, 20000);
  }
  g.DailyReward = {
    panelHtml, init, startSegment, stopSegment, completeTask,
    onVisibility(running, mode, phase) {
      if (!running) return;
      if (mode === 'iv' && phase % 2 === 1) return;
      const currentMode = mode === 'iv' ? 'interval-work' : mode === 'cd' ? 'countdown' : 'stopwatch';
      runningMode = currentMode;
      if (!sessionId) startSegment(currentMode);
      else pulse();
    },
    refresh
  };
})(window);
