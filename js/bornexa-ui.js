/* BORNEXA UI — toasts + modales (remplacent alert/confirm/prompt natifs).
   API : BX.toast(msg,type) · BX.alert(msg,title) · BX.confirm(msg,opts) · BX.prompt(msg,opts)
   confirm → Promise<bool> · prompt → Promise<string|null> · alert → Promise<void>
   Aucune dépendance. Injecte son propre CSS une seule fois. */
(function () {
  'use strict';
  var CSS =
  '.bx-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(8px);background:#0B1E3C;color:#fff;padding:11px 20px;border-radius:999px;font-weight:600;font-size:.88rem;font-family:inherit;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;transition:.25s;z-index:10001;max-width:90vw;text-align:center}'+
  '.bx-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}'+
  '.bx-toast.ok{background:#166534}.bx-toast.err{background:#B91C1C}'+
  '.bx-ov{position:fixed;inset:0;background:rgba(8,12,20,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:18px;z-index:10000;opacity:0;transition:opacity .18s}'+
  '.bx-ov.show{opacity:1}'+
  '.bx-modal{background:#fff;border-radius:16px;max-width:440px;width:100%;padding:22px 22px 18px;box-shadow:0 24px 60px rgba(0,0,0,.35);transform:translateY(8px) scale(.98);transition:transform .18s;font-family:inherit}'+
  '.bx-ov.show .bx-modal{transform:none}'+
  '.bx-mh{font-size:1.05rem;font-weight:800;color:#0B1E3C;margin-bottom:8px}'+
  '.bx-mb{font-size:.9rem;color:#334155;line-height:1.55;white-space:pre-line;margin-bottom:14px}'+
  '.bx-in{width:100%;font-family:inherit;font-size:16px;padding:11px 13px;border:1.5px solid #E2E8F0;border-radius:10px;color:#0F172A;margin-bottom:16px;outline:none}'+
  '.bx-in:focus{border-color:#00C896;box-shadow:0 0 0 3px rgba(0,200,150,.15)}'+
  'textarea.bx-in{resize:vertical;min-height:96px}'+
  '.bx-ma{display:flex;gap:10px;justify-content:flex-end}'+
  '.bx-btn{font-family:inherit;font-size:.9rem;font-weight:700;padding:10px 18px;border-radius:10px;border:none;cursor:pointer}'+
  '.bx-cancel{background:#F1F5F9;color:#334155}.bx-cancel:hover{background:#E2E8F0}'+
  '.bx-ok{background:#00C896;color:#0B1E3C}.bx-ok:hover{background:#009E76;color:#fff}'+
  '.bx-ok.bx-danger{background:#DC2626;color:#fff}.bx-ok.bx-danger:hover{background:#B91C1C}';

  function ensureStyle() {
    if (document.getElementById('bx-ui-style')) return;
    var s = document.createElement('style'); s.id = 'bx-ui-style'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function (c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function toast(msg, type) {
    ensureStyle();
    var t = document.createElement('div');
    t.className = 'bx-toast' + (type === 'err' ? ' err' : type === 'ok' ? ' ok' : '');
    t.textContent = msg; document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); }, 280); }, 2200);
  }

  function modal(o) {
    ensureStyle();
    return new Promise(function (resolve) {
      var ov = document.createElement('div'); ov.className = 'bx-ov';
      var inHtml = '';
      if (o.input) inHtml = o.multiline
        ? '<textarea class="bx-in" placeholder="' + esc(o.placeholder) + '"></textarea>'
        : '<input class="bx-in" type="text" placeholder="' + esc(o.placeholder) + '">';
      ov.innerHTML = '<div class="bx-modal" role="dialog" aria-modal="true">'
        + (o.title ? '<div class="bx-mh">' + esc(o.title) + '</div>' : '')
        + (o.message ? '<div class="bx-mb">' + esc(o.message) + '</div>' : '')
        + inHtml
        + '<div class="bx-ma">'
        + (o.cancelText === null ? '' : '<button class="bx-btn bx-cancel">' + esc(o.cancelText || 'Annuler') + '</button>')
        + '<button class="bx-btn bx-ok' + (o.danger ? ' bx-danger' : '') + '">' + esc(o.okText || 'OK') + '</button>'
        + '</div></div>';
      document.body.appendChild(ov);
      var inp = ov.querySelector('.bx-in');
      if (inp) { if (o.inputValue != null) inp.value = o.inputValue; setTimeout(function(){ inp.focus(); inp.select && inp.select(); }, 40); }
      var done = false;
      function close(val) { if (done) return; done = true; document.removeEventListener('keydown', onKey); ov.classList.remove('show'); setTimeout(function(){ ov.remove(); }, 200); resolve(val); }
      function onKey(e) {
        if (e.key === 'Escape') close(o.input ? null : false);
        else if (e.key === 'Enter' && (!inp || !o.multiline)) close(o.input ? (inp ? inp.value : '') : true);
      }
      ov.querySelector('.bx-ok').addEventListener('click', function(){ close(o.input ? (inp ? inp.value : '') : true); });
      var c = ov.querySelector('.bx-cancel'); if (c) c.addEventListener('click', function(){ close(o.input ? null : false); });
      ov.addEventListener('click', function(e){ if (e.target === ov) close(o.input ? null : false); });
      document.addEventListener('keydown', onKey);
      requestAnimationFrame(function(){ ov.classList.add('show'); });
    });
  }

  window.BX = {
    toast: toast,
    alert: function (msg, title) { return modal({ title: title || 'Information', message: msg, cancelText: null, okText: 'OK' }); },
    confirm: function (msg, opts) { opts = opts || {}; return modal({ title: opts.title || 'Confirmation', message: msg, okText: opts.okText || 'Confirmer', cancelText: opts.cancelText || 'Annuler', danger: opts.danger }); },
    prompt: function (msg, opts) { opts = opts || {}; return modal({ title: opts.title || '', message: msg, input: true, inputValue: opts.default || '', placeholder: opts.placeholder || '', multiline: opts.multiline, okText: opts.okText || 'OK', cancelText: opts.cancelText || 'Annuler' }); }
  };
})();
