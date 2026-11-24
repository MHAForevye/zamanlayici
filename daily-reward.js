'use strict';
/* Günlük kristal görevi: kimlik ve tüm ödül hesapları sunucu tarafındadır. */
(function (g) {
  const API = 'https://mikroklimakontrolmerkezi.forevye.workers.dev/api/timer-reward';
  const KEY = 'zamanlayici-kristal-hesap-v1';
  const TARGETS = [60, 300, 600, 900, 1800, 2700, 3600, 7200, 10800, 14400];
  const LABELS = ['1 dk', '5 dk', '10 dk', '15 dk', '30 dk', '45 dk', '1 sa', '2 sa', '3 sa', '4 sa'];
  const COLORS = ['#F2C66D', '#E78A68', '#D96C76', '#B77CCB', '#7F8FE2', '#59A9C7', '#54B8A0', '#91B75B', '#D1A34F', '#E58B4A'];
  let creds = load(), task = null, sessionId = '', runningMode = '', pulseBusy = false, statusText = '', spinBusy = false;
  const $ = s => document.querySelector(s);
  const fmt = n => {
    n = Math.max(0, Math.floor(Number(n) || 0));
    const h = Math.floor(n / 3600), m = Math.floor(n % 3600 / 60), s = n % 60;
    return h ? `${h} sa ${m} dk` : m ? `${m} dk${s ? ` ${s} sn` : ''}` : `${s} sn`;
  };
  const crystals = n => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  function load() { try { const c = JSON.parse(localStorage.getItem(KEY) || 'null'); return valid(c); } catch (_) { return null; } }
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
  async function api(path, body = {}) {
    if (!creds) throw Object.assign(new Error('Önce kristal hesabını bağla.'), { code: 'no_account' });
    const r = await fetch(API + path, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${creds.id}.${creds.token}` },
      body: JSON.stringify(body)
    });
    const d = await r.json().catch(() => ({}));
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
      <div class="dr-layout"><div class="dr-wheel-col"><button type="button" id="dr-spin" class="dr-wheel-button" aria-label="Günlük kristal çarkını çevir" disabled>${wheelSvg()}<span class="dr-pointer" aria-hidden="true">◆</span></button><div id="dr-wheel-caption" class="dr-wheel-caption">Hesabını bağla, sonra çarkı çevir</div></div>
        <div class="dr-info"><div id="dr-account-status" class="dr-account-status">Kristal hesabı bağlanmadı.</div>
          <div id="dr-linkbox" class="dr-linkbox"><label for="dr-credential">Kristal hesap yedeği</label><textarea id="dr-credential" rows="2" autocomplete="off" spellcheck="false" placeholder="ID.ANAHTAR veya hesap yedek metni"></textarea><button type="button" id="dr-link" class="dr-action">Hesabı bağla</button><p class="dr-help">Mağaza / Hava hesabındaki “Yedeğimi kopyala” metnini yapıştır. Anahtar yalnızca bu cihazda saklanır.</p></div>
          <div id="dr-task" class="dr-task" hidden><div class="dr-target"><span>BUGÜNKÜ HEDEF</span><b id="dr-target-value">—</b></div><div class="dr-reward"><span>TAMAMLAMA ÖDÜLÜ</span><b id="dr-reward-value">—</b></div><div class="dr-progress"><div id="dr-progress-fill"></div></div><div class="dr-progress-meta"><span id="dr-progress-text">0 / 0</span><span id="dr-percent">0%</span></div><p id="dr-message" class="dr-message">Süreyi tamamladığında ödül hesabına aktarılır.</p><button type="button" id="dr-disconnect" class="dr-text-button">Hesabı ayır</button></div>
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
    const linked = !!creds;
    $('#dr-linkbox').hidden = linked;
    $('#dr-account-status').textContent = linked ? `Kristal hesabı bağlandı · ID ${creds.id}` : 'Ödül almak için mevcut kristal hesabını bağla.';
    $('#dr-disconnect').hidden = !linked;
    $('#dr-spin').disabled = !linked || !task || task.spun || spinBusy;
    $('#dr-wheel-caption').textContent = !linked ? 'Önce kristal hesabını bağla' : spinBusy ? 'Çark dönüyor…' : !task || !task.spun ? 'ÇARKI ÇEVİR' : `Bugünkü hedef: ${fmt(task.targetSeconds)}`;
    const box = $('#dr-task'); box.hidden = !linked || !task || !task.spun;
    if (box.hidden) {
      $('#dr-spin').classList.toggle('is-spun', false);
      message(statusText || (linked ? 'Bugünkü hakkın hazır. Çarkı bir kez çevir.' : 'Hesap bağlandığında günlük çark açılır.'));
      return;
    }
    $('#dr-spin').classList.add('is-spun'); rotateTo(task.targetSeconds, false);
    $('#dr-target-value').textContent = fmt(task.targetSeconds);
    $('#dr-reward-value').textContent = '+' + crystals(task.reward) + ' ◈';
    const done = Math.min(task.targetSeconds, task.creditedSeconds || 0), pct = Math.min(100, task.targetSeconds ? done / task.targetSeconds * 100 : 0);
    $('#dr-progress-fill').style.width = pct + '%';
    $('#dr-progress-text').textContent = `${fmt(done)} / ${fmt(task.targetSeconds)}`;
    $('#dr-percent').textContent = Math.floor(pct) + '%';
    $('#dr-message').textContent = task.paid ? `Görev tamamlandı. +${crystals(task.reward)} kristal hesabına eklendi.` : pct >= 100 ? 'Hedefe ulaştın. Zamanlayıcı oturumunu bitirerek ödülünü al.' : 'Kronometre, geri sayım veya Aralık modunda ölçtüğün çalışma süresi burada birikir. Mola süresi sayılmaz.';
    message(statusText);
  }
  async function refresh() {
    if (!creds) { task = null; render(); return; }
    try { const d = await api('/state'); task = d.task; message('Hesap ve günlük görev eşitlendi.'); }
    catch (e) { message(e.status === 401 ? 'Hesap anahtarı doğrulanamadı. Yedek metninle yeniden bağlan.' : e.message); if (e.status === 401) task = null; }
    render();
  }
  async function link() {
    const input = $('#dr-credential'), c = parse(input && input.value);
    if (!c) return message('Hesap yedeği tanınmadı. ID.ANAHTAR veya tam yedek metnini yapıştır.');
    const old = creds; creds = c;
    const b = $('#dr-link'); if (b) { b.disabled = true; b.textContent = 'Doğrulanıyor…'; }
    try {
      const d = await api('/state'); localStorage.setItem(KEY, JSON.stringify(c)); task = d.task;
      if (input) input.value = ''; message('Kristal hesabın güvenli biçimde bağlandı.');
      if (runningMode && task && task.spun && !task.paid) startSegment(runningMode);
    } catch (e) { creds = old; message(e.status === 401 ? 'Bu hesap bilgileri geçersiz.' : e.message); }
    finally { if (b) { b.disabled = false; b.textContent = 'Hesabı bağla'; } render(); }
  }
  async function spin() {
    if (!creds || spinBusy) return;
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
    if (!creds || !task || !task.spun || task.paid || sessionId) return;
    try {
      const d = await api('/start', { mode: runningMode }); sessionId = d.sessionId; task = d.task; render();
    } catch (e) {
      if (e.code === 'already_running') message('Bu kristal hesabında başka bir Zamanlayıcı oturumu açık. Diğer oturumu durdur veya sayfayı yenile.');
      else if (e.code !== 'goal_done') message(e.message);
    }
  }
  async function stopSegment() {
    const id = sessionId; sessionId = ''; runningMode = '';
    if (!id || !creds) return;
    try { const d = await api('/stop', { sessionId: id }); task = d.task; render(); }
    catch (e) { message('Bağlantı kısa süreli kesildi; sunucu oturumu güvenli zaman aşımıyla kapatacak.'); }
  }
  async function completeTask() {
    const id = sessionId; sessionId = ''; runningMode = '';
    if (!creds) return;
    try {
      const d = await api('/complete', { sessionId: id }); task = d.task;
      if (d.awarded > 0) message(`Tebrikler! +${crystals(d.awarded)} kristal bakiyene eklendi.`);
      else if (task && task.paid) message(`Günlük hedef tamamlandı. +${crystals(task.reward)} kristal hesabına eklendi.`);
      else message(task && task.spun ? `Süre kaydedildi: ${fmt(task.creditedSeconds)} / ${fmt(task.targetSeconds)}.` : 'Günlük görev bulunamadı.');
      render();
    } catch (e) { message('Ödül doğrulanamadı. İnternet bağlantısı geldiğinde tekrar dene; görev ilerlemen sunucuda korunur.'); }
  }
  async function pulse() {
    if (!sessionId || !creds || pulseBusy) return;
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
      const b = e.target.closest('#dr-link,#dr-spin,#dr-disconnect'); if (!b) return;
      if (b.id === 'dr-link') link();
      else if (b.id === 'dr-spin') spin();
      else if (b.id === 'dr-disconnect') {
        if (confirm('Kristal hesabı bu cihazdan ayrılsın mı? Sunucudaki bakiye ve görev geçmişi silinmez.')) {
          stopSegment(); creds = null; task = null; localStorage.removeItem(KEY); message('Kristal hesabı bu cihazdan ayrıldı.'); render();
        }
      }
    });
    // Mağaza/Hava uygulamasından gelen #hesap= aktarımı; anahtar adres çubuğunda bırakılmaz.
    const m = /(?:^#|&)hesap=([^&]+)/.exec(location.hash);
    if (m) {
      let c = null; try { c = parse(decodeURIComponent(m[1])); } catch (_) {}
      try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
      if (c) { creds = c; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (_) {} }
    }
    render();
    if (creds) refresh();
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
