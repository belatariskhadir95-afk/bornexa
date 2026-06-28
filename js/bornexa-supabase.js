/* === BORNEXA · Synchronisation Supabase (offline-first) ===
 * Se branche PAR-DESSUS js/bornexa-sync.js (ne le modifie pas).
 * - Login obligatoire (email/mot de passe) via Supabase Auth.
 * - Pull cloud + merge (last-write-wins par `updated`), push debouncé.
 * - 100% rétro-compatible : sans config ou hors-ligne, les outils
 *   continuent de fonctionner en localStorage seul.
 * Charge-le APRÈS bornexa-sync.js et supabase-config.js.
 */
(function () {
  'use strict';

  var CFG = window.BORNEXA_SUPABASE || {};
  if (!CFG.url || !CFG.anonKey || CFG.url.indexOf('VOTRE') !== -1 || CFG.anonKey.indexOf('VOTRE') !== -1) {
    console.info('[BORNEXA] Supabase non configuré → mode local seul.');
    return;
  }
  if (!window.Bornexa) { console.warn('[BORNEXA] bornexa-sync.js manquant.'); return; }

  var CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  var sb = null, session = null, applyingRemote = false, pushTimer = null, channel = null;
  var myEmail = '';
  var IS_HUB = /bornexa-hub/.test(location.pathname);

  function stamp(d) { // copie du dossier + qui/quand (sans toucher au store local ni à `updated`)
    var c = {}; for (var k in d) { if (Object.prototype.hasOwnProperty.call(d, k)) c[k] = d[k]; }
    c._lastEditor = myEmail; c._lastEditAt = Date.now(); return c;
  }

  /* ---------- chargement de supabase-js ---------- */
  (function load() {
    var s = document.createElement('script');
    s.src = CDN; s.async = true;
    s.onload = init;
    s.onerror = function () { console.warn('[BORNEXA] supabase-js non chargé → mode local seul.'); };
    document.head.appendChild(s);
  })();

  function init() {
    sb = window.supabase.createClient(CFG.url, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    sb.auth.getSession().then(function (r) {
      session = r.data.session;
      myEmail = (session && session.user && session.user.email) || '';
      session ? onAuthed() : showLogin();
      sb.auth.onAuthStateChange(function (_e, s) {
        var was = !!session; session = s;
        myEmail = (s && s.user && s.user.email) || '';
        if (s && !was) { hideLogin(); onAuthed(); }
        if (!s && was) { showLogin(); }
      });
    });
  }

  /* ---------- une fois connecté ---------- */
  function onAuthed() {
    badge('☁︎ Connexion…', '#64748B');
    hookMutations();
    pullAll().then(pushAll).then(function () { syncedBadge(); subscribe(); })
      .catch(function (e) { console.warn(e); badge('⚠︎ Erreur sync', '#F59E0B'); });
    window.addEventListener('online', function () { badge('☁︎ Reconnexion…', '#64748B'); pushAll(); });
    window.addEventListener('offline', function () { badge('⌁ Hors-ligne', '#94A3B8'); });
  }

  /* ---------- PULL : cloud → local (merge) ---------- */
  function pullAll() {
    return sb.from('dossiers').select('id,data,updated_at').then(function (res) {
      if (res.error) throw res.error;
      var local = window.Bornexa.exportAll().dossiers || {};
      var merged = {};
      Object.keys(local).forEach(function (k) { merged[k] = local[k]; });
      (res.data || []).forEach(function (row) {
        var cloud = row.data || {}; cloud.id = row.id;
        var loc = merged[row.id];
        if (!loc || (cloud.updated || 0) > (loc.updated || 0)) merged[row.id] = cloud;
      });
      applyingRemote = true;
      window.Bornexa.importAll({ schema: 'bornexa-backup-v1', dossiers: merged }, 'replace');
      applyingRemote = false;
      document.dispatchEvent(new CustomEvent('bornexa:synced', { detail: { count: (res.data || []).length } }));
    });
  }

  /* ---------- PUSH : local → cloud (upsert) ---------- */
  function pushAll() { // synchro complète (init + reconnexion)
    var dossiers = window.Bornexa.exportAll().dossiers || {};
    var rows = Object.keys(dossiers).map(function (k) { var d = dossiers[k]; return { id: d.id, data: stamp(d) }; });
    if (!rows.length) return Promise.resolve();
    return sb.from('dossiers').upsert(rows, { onConflict: 'id' }).then(function (res) {
      if (res.error) throw res.error;
    });
  }
  function pushOne(id) { // léger : un seul dossier (le cas courant)
    var d = (window.Bornexa.exportAll().dossiers || {})[id];
    if (!d) return Promise.resolve();
    return sb.from('dossiers').upsert([{ id: d.id, data: stamp(d) }], { onConflict: 'id' }).then(function (res) {
      if (res.error) throw res.error;
    });
  }

  function schedulePush() {
    if (applyingRemote) return;
    badge('☁︎ Sauvegarde…', '#64748B');
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      if (!navigator.onLine) { badge('⌁ Hors-ligne (sauvé localement)', '#94A3B8'); return; }
      var cur = window.Bornexa.currentId();
      var p = cur ? pushOne(cur) : pushAll();
      p.then(function () { syncedBadge(); })
        .catch(function (e) { console.warn(e); badge('⚠︎ Erreur sync', '#F59E0B'); });
    }, 1200);
  }

  /* ---------- on intercepte les écritures de Bornexa ---------- */
  function hookMutations() {
    ['put', 'create', 'rename', 'duplicate', 'importDossier', 'importAll'].forEach(function (m) {
      var orig = window.Bornexa[m];
      if (typeof orig !== 'function' || orig.__bxWrapped) return;
      window.Bornexa[m] = function () { var r = orig.apply(window.Bornexa, arguments); schedulePush(); return r; };
      window.Bornexa[m].__bxWrapped = true;
    });
    // suppression : on retire aussi la ligne dans le cloud
    var del = window.Bornexa.del;
    if (del && !del.__bxWrapped) {
      window.Bornexa.del = function (id) {
        var r = del.apply(window.Bornexa, arguments);
        if (sb && navigator.onLine && id) sb.from('dossiers').delete().eq('id', id).then(function () {}, function () {});
        return r;
      };
      window.Bornexa.del.__bxWrapped = true;
    }
  }

  /* ---------- temps réel (autres techniciens) ---------- */
  function subscribe() {
    try {
      channel = sb.channel('dossiers-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dossiers' }, function (payload) {
          var row = payload['new'] || payload['old'] || {};
          var data = row.data || {};
          var editor = data._lastEditor || '';
          if (editor && editor === myEmail) return; // ma propre modif (écho) → on ignore
          // on rapatrie en silence (sans toucher au formulaire ouvert)
          pullAll().then(function () { syncedBadge(); }).catch(function () {});
          // si un collègue modifie LE dossier que je consulte dans un outil → bannière
          if (!IS_HUB && row.id && row.id === window.Bornexa.currentId()) {
            showReloadBanner(editor);
          }
        }).subscribe();
    } catch (e) { /* le temps réel est optionnel */ }
  }

  /* ---------- UI : bannière "modifié par un collègue" ---------- */
  function showReloadBanner(editor) {
    var ex = document.getElementById('bx-reload'); if (ex) ex.remove();
    var who = editor ? editor.split('@')[0] : 'un collègue';
    var b = document.createElement('div');
    b.id = 'bx-reload';
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99997;background:#F59E0B;color:#0B1E3C;font:600 14px system-ui,sans-serif;padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:14px;box-shadow:0 2px 10px rgba(0,0,0,.2)';
    b.innerHTML =
      '<span>⟳ Ce dossier vient d\'être modifié par <strong>' + who + '</strong>.</span>' +
      '<button id="bx-reload-go" style="background:#0B1E3C;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer">Recharger</button>' +
      '<button id="bx-reload-x" style="background:transparent;border:none;color:#0B1E3C;font-size:18px;cursor:pointer;line-height:1" title="Ignorer">×</button>';
    document.body.appendChild(b);
    document.getElementById('bx-reload-go').onclick = function () { location.reload(); };
    document.getElementById('bx-reload-x').onclick = function () { b.remove(); };
  }

  /* ---------- UI : overlay de login ---------- */
  function showLogin() {
    if (document.getElementById('bx-login')) return;
    var o = document.createElement('div');
    o.id = 'bx-login';
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#0B1E3C;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    o.innerHTML =
      '<form id="bx-login-f" style="background:#fff;padding:32px 28px;border-radius:16px;width:320px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.4)">' +
        '<div style="font-weight:800;font-size:1.2rem;color:#0B1E3C;margin-bottom:4px">BORNEXA</div>' +
        '<div style="color:#64748B;font-size:.9rem;margin-bottom:18px">Connexion à vos dossiers</div>' +
        '<input id="bx-email" type="email" required placeholder="E-mail" autocomplete="username" style="width:100%;padding:11px 13px;margin-bottom:10px;border:1px solid #E2E8F0;border-radius:10px;font-size:1rem;box-sizing:border-box">' +
        '<input id="bx-pass" type="password" required placeholder="Mot de passe" autocomplete="current-password" style="width:100%;padding:11px 13px;margin-bottom:14px;border:1px solid #E2E8F0;border-radius:10px;font-size:1rem;box-sizing:border-box">' +
        '<button type="submit" style="width:100%;padding:12px;background:#00C896;color:#0B1E3C;border:none;border-radius:10px;font-weight:700;font-size:1rem;cursor:pointer">Se connecter</button>' +
        '<div id="bx-err" style="color:#DC2626;font-size:.85rem;margin-top:10px;min-height:1em"></div>' +
      '</form>';
    document.body.appendChild(o);
    document.getElementById('bx-login-f').addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = o.querySelector('button'); btn.disabled = true; btn.textContent = 'Connexion…';
      sb.auth.signInWithPassword({
        email: document.getElementById('bx-email').value.trim(),
        password: document.getElementById('bx-pass').value
      }).then(function (r) {
        btn.disabled = false; btn.textContent = 'Se connecter';
        if (r.error) document.getElementById('bx-err').textContent = 'E-mail ou mot de passe incorrect.';
      });
    });
  }
  function hideLogin() { var o = document.getElementById('bx-login'); if (o) o.remove(); }

  /* ---------- UI : pastille "synchronisé (+ dernier éditeur)" ---------- */
  function syncedBadge() {
    var cur = window.Bornexa.currentId();
    var d = cur ? (window.Bornexa.exportAll().dossiers || {})[cur] : null;
    var suffix = (d && d._lastEditor && d._lastEditor !== myEmail) ? ' · modifié par ' + d._lastEditor.split('@')[0] : '';
    badge('☁︎ Synchronisé' + suffix, '#00C896');
  }

  /* ---------- UI : pastille de statut ---------- */
  function badge(text, color) {
    var b = document.getElementById('bx-badge');
    if (!b) {
      b = document.createElement('div'); b.id = 'bx-badge';
      b.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:99998;background:#fff;border:1px solid #E2E8F0;border-radius:999px;padding:6px 12px;font:600 12px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.12);cursor:pointer;user-select:none;';
      b.title = 'Cliquer pour se déconnecter';
      b.addEventListener('click', function () {
        if (confirm('Se déconnecter de BORNEXA ?')) { if (channel) try { sb.removeChannel(channel); } catch (e) {} sb.auth.signOut(); }
      });
      document.body.appendChild(b);
    }
    b.innerHTML = '<span style="color:' + color + '">●</span> ' + text;
  }
})();
