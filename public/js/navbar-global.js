(function () {
  var pathAtual = window.location.pathname.toLowerCase();

  var ABAS = [
    { href: '/',            label: 'Início',       match: function (p) { return p === '/' || p === '/index.html'; } },
    { href: '/classes',     label: '4 Classes',    match: function (p) { return p.indexOf('/classes') === 0; } },
    { href: '/mapa',        label: 'Mapa & GPS',   match: function (p) { return p.indexOf('/mapa') === 0; } },
    { href: '/laboratorio', label: 'Lab Virtual',  match: function (p) { return p.indexOf('/laboratorio') === 0; } },
    { href: '/tabela',      label: 'Tabela',       match: function (p) { return p.indexOf('/tabela') === 0; } }
  ];

  var st = document.createElement('style');
  st.id = 'atq-global-nav-css';
  st.textContent =
    '#atq-global-header{position:sticky;top:0;z-index:9980;width:100%;padding:10px 16px!important;backdrop-filter:blur(14px);}' +
    '.atq-nav-wrap{max-width:1260px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;}' +
    '.atq-brand{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;}' +
    '.atq-brand-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;background:linear-gradient(135deg,#4a2c6d,#7c4dff);color:#f5d37a;border:1px solid #f5d37a;box-shadow:0 0 14px rgba(192,132,252,0.35);flex-shrink:0;}' +
    '[data-tema="claro"] .atq-brand-icon{background:linear-gradient(135deg,#c89b3c,#9a6d08);color:#fff;border-color:#8a6208;box-shadow:0 4px 12px rgba(184,134,11,0.28);}' +
    '.atq-brand-txt{display:flex;flex-direction:column;line-height:1.15;}' +
    '.atq-brand-txt strong{font-family:"Playfair Display",Georgia,serif;font-size:16px;white-space:nowrap;color:#f7f3ff;}' +
    '[data-tema="claro"] .atq-brand-txt strong{color:#8a6208!important;}' +
    '.atq-brand-txt small{font-size:11px;white-space:nowrap;color:#c3b7dc;font-weight:600;}' +
    '[data-tema="claro"] .atq-brand-txt small{color:#5c5040!important;}' +
    '.atq-nav-links{display:flex;align-items:center;gap:6px;flex-wrap:nowrap;}' +
    '.atq-nav-link{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:999px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:13px;font-weight:700;white-space:nowrap;text-decoration:none;color:#f7f3ff;background:transparent;border:1px solid transparent;cursor:pointer;transition:all 0.18s ease;}' +
    '.atq-nav-link:hover{background:rgba(192,132,252,0.16);border-color:rgba(245,211,122,0.45);}' +
    '.atq-nav-link.ativo{background:linear-gradient(135deg,#6d4aa3,#9333ea)!important;color:#fff!important;border-color:#f5d37a!important;box-shadow:0 0 14px rgba(168,85,247,0.45);}' +
    '[data-tema="claro"] .atq-nav-link{color:#2b2319!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important;}' +
    '[data-tema="claro"] .atq-nav-link:hover{background:#faf3e3!important;border-color:rgba(184,134,11,0.42)!important;color:#8a6208!important;}' +
    '[data-tema="claro"] .atq-nav-link.ativo{background:linear-gradient(135deg,#c89b3c,#9a6d08)!important;color:#fff!important;border-color:#8a6208!important;box-shadow:0 4px 12px rgba(184,134,11,0.28)!important;}' +
    '.atq-nav-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}' +
    '.atq-nav-ia{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:999px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:12px;font-weight:800;white-space:nowrap;cursor:pointer;background:linear-gradient(135deg,#4a2c6d,#9333ea);color:#fff;border:1px solid #f5d37a;box-shadow:0 0 14px rgba(192,132,252,0.45);}' +
    '[data-tema="claro"] .atq-nav-ia{background:linear-gradient(135deg,#c89b3c,#9a6d08)!important;color:#fff!important;border-color:#8a6208!important;box-shadow:0 4px 12px rgba(184,134,11,0.3)!important;}' +
    '.atq-nav-burger{display:none;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;border:1px solid rgba(200,162,77,0.45);background:rgba(255,255,255,0.08);color:inherit;font-size:18px;cursor:pointer;}' +
    '[data-tema="claro"] h1 span,[data-tema="claro"] .gradient-text{background:none!important;-webkit-background-clip:initial!important;-webkit-text-fill-color:#9a6d08!important;color:#9a6d08!important;}' +
    '[data-tema="claro"] .badge,[data-tema="claro"] .pill,[data-tema="claro"] .tag{background:#faf3e3!important;color:#7c5605!important;border-color:rgba(184,134,11,0.35)!important;}' +
    '@media(max-width:980px){' +
      '.atq-nav-burger{display:inline-flex;}' +
      '.atq-nav-links{display:none;position:absolute;top:100%;left:0;right:0;flex-direction:column;align-items:stretch;padding:10px 16px 14px;background:#140b24;border-bottom:1px solid #c8a24d;box-shadow:0 16px 32px rgba(0,0,0,0.45);}' +
      '[data-tema="claro"] .atq-nav-links{background:#ffffff;border-bottom:1.5px solid #c89b3c;box-shadow:0 12px 28px rgba(138,98,8,0.14);}' +
      '.atq-nav-links.aberto{display:flex;}' +
      '.atq-nav-link{justify-content:flex-start;padding:10px 14px;border-radius:10px;}' +
    '}' +
    '@media(max-width:520px){.atq-brand-txt small{display:none;}.atq-nav-ia span.txt-ia{display:none;}}' +
    '@media print{#atq-global-header{display:none!important;}}';
  document.head.appendChild(st);

  function construirHeader() {
    var hdr = document.querySelector('header');
    if (!hdr) {
      hdr = document.createElement('header');
      document.body.insertBefore(hdr, document.body.firstChild);
    }
    hdr.id = 'atq-global-header';

    var linksHtml = ABAS.map(function (a) {
      var cls = a.match(pathAtual) ? 'atq-nav-link ativo' : 'atq-nav-link';
      return '<a href="' + a.href + '" class="' + cls + '">' + a.label + '</a>';
    }).join('');

    var isClaro = document.documentElement.getAttribute('data-tema') === 'claro';
    hdr.innerHTML =
      '<div class="atq-nav-wrap">' +
        '<a href="/" class="atq-brand">' +
          '<span class="atq-brand-icon">⚗️</span>' +
          '<span class="atq-brand-txt"><strong>AQUI TEM QUÍMICA!</strong><small>1º INF · CEFET-MG Divinópolis</small></span>' +
        '</a>' +
        '<nav class="atq-nav-links" id="atq-nav-menu" aria-label="Navegação principal">' + linksHtml + '</nav>' +
        '<div class="atq-nav-actions">' +
          '<button type="button" class="atq-nav-ia" id="atq-nav-ia-btn" title="Abrir QuímicoBot IA">🤖 <span class="txt-ia">QuímicoBot IA</span></button>' +
          '<button type="button" id="atq-tema-toggle">' + (isClaro ? '✨ Modo Neon' : '☀️ Branco & Dourado') + '</button>' +
          '<button type="button" class="atq-nav-burger" id="atq-nav-burger" aria-label="Abrir menu">☰</button>' +
        '</div>' +
      '</div>';

    var burger = document.getElementById('atq-nav-burger');
    var menu = document.getElementById('atq-nav-menu');
    burger.onclick = function () { menu.classList.toggle('aberto'); };

    document.getElementById('atq-nav-ia-btn').onclick = function () {
      if (typeof window.abrirQuimicoBotIA === 'function') window.abrirQuimicoBotIA();
      else {
        var fab = document.getElementById('qbot-ia-fab');
        if (fab) fab.click();
      }
    };

    var toggle = document.getElementById('atq-tema-toggle');
    toggle.onclick = function () {
      var claro = document.documentElement.getAttribute('data-tema') === 'claro';
      var novo = claro ? 'neon' : 'claro';
      if (novo === 'claro') document.documentElement.setAttribute('data-tema', 'claro');
      else document.documentElement.removeAttribute('data-tema');
      try { localStorage.setItem('atq_tema_visual_v1', novo); } catch (e) {}
      toggle.innerHTML = novo === 'claro' ? '✨ Modo Neon' : '☀️ Branco & Dourado';
      window.dispatchEvent(new CustomEvent('atq-tema-mudou', { detail: { tema: novo } }));
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', construirHeader);
  else construirHeader();
})();