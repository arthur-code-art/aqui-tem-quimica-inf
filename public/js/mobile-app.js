(function () {
  function lerVisitadas() {
    try {
      var arr = JSON.parse(localStorage.getItem('atq_plaquinhas_visitadas_v1') || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function atualizarContadores() {
    var qtd = lerVisitadas().length;
    var pct = Math.min(100, Math.round((qtd / 38) * 100));
    var b = document.getElementById('atq-dock-badge');
    if (b) b.textContent = String(qtd);
    var mhTxt = document.getElementById('mh-pass-txt');
    if (mhTxt) mhTxt.textContent = qtd + ' de 38 QR Codes (' + pct + '%)';
    var mhFill = document.getElementById('mh-prog-fill');
    if (mhFill) mhFill.style.width = pct + '%';
  }

  function ajustarIconeTema() {
    var btn = document.getElementById('atq-tema-toggle');
    if (!btn) return;
    var ehMob = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    var claro = document.documentElement.getAttribute('data-tema') === 'claro';
    if (ehMob) {
      btn.innerHTML = claro ? '✨' : '☀️';
      btn.title = claro ? 'Modo Neon' : 'Modo Claro';
    } else {
      btn.innerHTML = claro ? '✨ Modo Neon' : '☀️ Branco & Dourado';
    }
  }

  function montarDockMobile() {
    if (document.getElementById('atq-mob-dock')) return;
    var p = window.location.pathname.toLowerCase();
    var isHome = p === '/' || p === '/index.html';
    var isPlacas = p.indexOf('/plaquinha') === 0 || p.indexOf('/substancia') === 0;
    var isMapa = p.indexOf('/mapa') === 0;

    var dock = document.createElement('nav');
    dock.id = 'atq-mob-dock';
    dock.setAttribute('aria-label', 'Navegação mobile');
    dock.innerHTML =
      '<a href="/" class="atq-dock-item ' + (isHome ? 'ativo' : '') + '"><span class="atq-di-ic">🏠</span><span>Início</span></a>' +
      '<a href="/plaquinhas" class="atq-dock-item ' + (isPlacas ? 'ativo' : '') + '"><span class="atq-di-ic">🧪</span><span>Placas</span></a>' +
      '<button type="button" id="atq-dock-qr-btn" class="atq-dock-item atq-dock-qr" aria-label="Escanear QR Code"><span class="atq-di-ic">📷</span></button>' +
      '<a href="/mapa" class="atq-dock-item ' + (isMapa ? 'ativo' : '') + '"><span class="atq-di-ic">🗺️</span><span>Mapa</span></a>' +
      '<button type="button" id="atq-dock-pass-btn" class="atq-dock-item" aria-label="Abrir Passaporte">' +
        '<span class="atq-dock-badge" id="atq-dock-badge">0</span>' +
        '<span class="atq-di-ic">🎫</span><span>Passaporte</span>' +
      '</button>';

    document.body.appendChild(dock);

    document.getElementById('atq-dock-qr-btn').onclick = function () {
      var f = document.getElementById('atq-qr-fab');
      if (f) f.click();
    };
    document.getElementById('atq-dock-pass-btn').onclick = function () {
      var pBtn = document.getElementById('atq-progresso-bar');
      if (pBtn) pBtn.click();
    };
  }

  // Tela inicial clean exclusiva para celular (invisivel no desktop via CSS)
  function montarHomeMobile() {
    var p = window.location.pathname.toLowerCase();
    if (p !== '/' && p !== '/index.html') return;
    if (document.getElementById('atq-mob-home')) return;

    document.body.classList.add('atq-has-mob-home');

    var sec = document.createElement('div');
    sec.id = 'atq-mob-home';
    sec.className = 'atq-mob-only';
    sec.innerHTML =
      '<div class="mh-top">' +
        '<div class="mh-kicker">CEFET-MG Divinópolis · 1º INF</div>' +
        '<h1 class="mh-title">A Química no Campus</h1>' +
        '<p class="mh-sub">Escaneie as 38 plaquinhas nas 9 zonas da escola e complete seu Passaporte.</p>' +
      '</div>' +

      '<div class="mh-search-wrap">' +
        '<input type="search" id="mh-search" placeholder="🔍 Buscar plaquinha, fórmula ou zona...">' +
        '<div id="mh-results"></div>' +
      '</div>' +

      '<div class="mh-hero-card">' +
        '<button type="button" id="mh-scan-btn" class="mh-scan-btn">📷 Escanear QR Code da Plaquinha</button>' +
        '<div class="mh-pass-row" id="mh-pass-open">' +
          '<div style="flex:1;">' +
            '<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;">' +
              '<span>🎫 Passaporte Químico</span>' +
              '<span id="mh-pass-txt">0 de 38 QR Codes (0%)</span>' +
            '</div>' +
            '<div class="mh-prog-bar"><div class="mh-prog-fill" id="mh-prog-fill" style="width:0%;"></div></div>' +
          '</div>' +
          '<span style="font-size:16px;opacity:0.7;">›</span>' +
        '</div>' +
      '</div>' +

      '<div class="mh-grid">' +
        '<a href="/plaquinhas" class="mh-tile"><span class="mh-tile-ic">🧪</span><strong>Plaquinhas</strong><span>Ver todas as 38</span></a>' +
        '<a href="/mapa" class="mh-tile"><span class="mh-tile-ic">🧭</span><strong>Mapa &amp; GPS</strong><span>3D e rota a pé</span></a>' +
        '<a href="/classes" class="mh-tile"><span class="mh-tile-ic">📚</span><strong>4 Classes</strong><span>Ácido, Base, Sal, Óxido</span></a>' +
        '<a href="/tabela" class="mh-tile"><span class="mh-tile-ic">⚛️</span><strong>Tabela &amp; Massa</strong><span>Elementos do CEFET</span></a>' +
      '</div>' +

      '<div class="mh-quick-row">' +
        '<a href="/laboratorio" class="mh-pill-btn">⚗️ Lab Virtual</a>' +
        '<button type="button" id="mh-ia-btn" class="mh-pill-btn">🤖 QuímicoBot IA</button>' +
      '</div>' +

      '<button type="button" id="mh-toggle-full" class="mh-toggle-full">Ver extras (Escala pH, Quiz e Simulador) ▾</button>' +

      '<div class="mh-safety"><strong>Segurança:</strong> projeto observacional. Nunca misture produtos domésticos como água sanitária com vinagre ou amônia.</div>';

    var mainEl = document.querySelector('main');
    if (mainEl && mainEl.parentNode) mainEl.parentNode.insertBefore(sec, mainEl);
    else document.body.appendChild(sec);

    document.getElementById('mh-scan-btn').onclick = function () {
      var f = document.getElementById('atq-qr-fab');
      if (f) f.click();
    };
    document.getElementById('mh-pass-open').onclick = function () {
      var pBtn = document.getElementById('atq-progresso-bar');
      if (pBtn) pBtn.click();
    };
    document.getElementById('mh-ia-btn').onclick = function () {
      if (typeof window.abrirQuimicoBotIA === 'function') window.abrirQuimicoBotIA();
      else { var f = document.getElementById('qbot-ia-fab'); if (f) f.click(); }
    };
    document.getElementById('mh-toggle-full').onclick = function () {
      var aberto = document.body.classList.toggle('atq-mob-full-home');
      this.textContent = aberto ? 'Ocultar extras ▴' : 'Ver extras (Escala pH, Quiz e Simulador) ▾';
    };

    // Busca instantanea na home mobile
    var cacheLista = null;
    var inp = document.getElementById('mh-search');
    var resBox = document.getElementById('mh-results');

    function carregarBusca() {
      if (cacheLista) return Promise.resolve(cacheLista);
      return fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
        cacheLista = [];
        dados.forEach(function (s) {
          (s.ocorrencias || []).forEach(function (o) {
            cacheLista.push({
              codigo: o.codigo, zona: o.zona, nome: s.nomeIupac, formula: s.formula,
              blob: (o.codigo + ' ' + s.nomeIupac + ' ' + s.formula + ' ' + s.classe + ' ' + o.zona + ' ' + o.localExato + ' ' + (s.nomesPopulares || []).join(' ')).toLowerCase()
            });
          });
        });
        return cacheLista;
      }).catch(function () { return []; });
    }

    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      if (q.length < 2) { resBox.style.display = 'none'; resBox.innerHTML = ''; return; }
      carregarBusca().then(function (lista) {
        var hits = lista.filter(function (x) { return x.blob.indexOf(q) !== -1; }).slice(0, 6);
        resBox.style.display = 'block';
        if (!hits.length) {
          resBox.innerHTML = '<div style="padding:12px;font-size:12.5px;opacity:0.75;text-align:center;">Nenhuma plaquinha encontrada.</div>';
          return;
        }
        resBox.innerHTML = hits.map(function (h) {
          return '<a href="/plaquinha/' + encodeURIComponent(h.codigo) + '" class="mh-res-item">' +
            '<div><div class="mh-res-code">' + esc(h.codigo) + ' · ' + esc(h.formula) + '</div><div style="font-size:13.5px;font-weight:700;">' + esc(h.nome) + '</div><div style="font-size:11.5px;opacity:0.75;">📍 ' + esc(h.zona) + '</div></div>' +
            '<span style="font-size:16px;opacity:0.65;">›</span>' +
          '</a>';
        }).join('');
      });
    });
  }

  // Recolher filtros avancados em /plaquinhas e /mapa somente no celular
  function enxugarSubpaginasMobile() {
    var p = window.location.pathname.toLowerCase();

    if (p.indexOf('/plaquinhas') === 0) {
      var gridF = document.querySelector('.pl-controls-grid');
      if (gridF && !document.getElementById('atq-mob-pl-flt')) {
        gridF.classList.add('mob-fechado');
        var b = document.createElement('button');
        b.type = 'button';
        b.id = 'atq-mob-pl-flt';
        b.className = 'atq-mob-only atq-mob-mini-toggle';
        b.textContent = '⚙️ Mais filtros (Zona, Grupo, Ordem) ▾';
        b.onclick = function () {
          var fechado = gridF.classList.toggle('mob-fechado');
          b.textContent = fechado ? '⚙️ Mais filtros (Zona, Grupo, Ordem) ▾' : '⚙️ Ocultar filtros ▴';
        };
        gridF.parentNode.insertBefore(b, gridF.nextSibling);
      }
    }

    if (p.indexOf('/mapa') === 0) {
      var grupos = document.querySelectorAll('.toolbar .grupo');
      if (grupos.length >= 2 && !document.getElementById('atq-mob-map-flt')) {
        var gFiltros = grupos[1];
        gFiltros.classList.add('mob-fechado');
        var bm = document.createElement('button');
        bm.type = 'button';
        bm.id = 'atq-mob-map-flt';
        bm.className = 'atq-mob-only atq-mob-mini-toggle';
        bm.textContent = '🔍 Filtrar plaquinhas no mapa ▾';
        bm.onclick = function () {
          var fechado = gFiltros.classList.toggle('mob-fechado');
          bm.textContent = fechado ? '🔍 Filtrar plaquinhas no mapa ▾' : '🔍 Ocultar filtros ▴';
        };
        gFiltros.parentNode.insertBefore(bm, gFiltros);
      }

      var tabSec = document.querySelector('.tabela-sec');
      if (tabSec && !document.getElementById('atq-mob-tab-btn')) {
        tabSec.classList.add('mob-fechado');
        var bt = document.createElement('button');
        bt.type = 'button';
        bt.id = 'atq-mob-tab-btn';
        bt.className = 'atq-mob-only atq-mob-mini-toggle';
        bt.style.marginTop = '10px';
        bt.textContent = '📋 Ver tabela das 38 plaquinhas ▾';
        bt.onclick = function () {
          var fechado = tabSec.classList.toggle('mob-fechado');
          bt.textContent = fechado ? '📋 Ver tabela das 38 plaquinhas ▾' : '📋 Recolher tabela ▴';
        };
        var wrap = tabSec.querySelector('.tabela-wrap');
        if (wrap) tabSec.insertBefore(bt, wrap);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    montarHomeMobile();
    montarDockMobile();
    enxugarSubpaginasMobile();
    atualizarContadores();
    setTimeout(atualizarContadores, 500);
    setTimeout(ajustarIconeTema, 150);
    setTimeout(ajustarIconeTema, 700);
  });

  window.addEventListener('resize', ajustarIconeTema);
  window.addEventListener('atq-tema-mudou', function () {
    setTimeout(ajustarIconeTema, 20);
  });
})();

/* ATQ_MOB_4FUNC_JS_INICIO */
(function () {
  var DEFS = [
    { key: 'acidos', label: 'Ácidos', cor: '#ef4444', rx: /\b[áa]cidos\b/i },
    { key: 'bases',  label: 'Bases',  cor: '#2563eb', rx: /\bbases\b|\bhidr[óo]xidos\b/i },
    { key: 'sais',   label: 'Sais',   cor: '#16a34a', rx: /\bsais\b/i },
    { key: 'oxidos', label: 'Óxidos', cor: '#d97706', rx: /\b[óo]xidos\b/i }
  ];

  function montarCarrossel4Funcoes() {
    var p = window.location.pathname.toLowerCase();
    if (p.indexOf('/classes') !== 0 && p !== '/' && p !== '/index.html') return;
    if (document.querySelector('.atq-mob-func-bar')) return;

    var raiz = document.querySelector('main') || document.body;
    var titulos = Array.from(raiz.querySelectorAll('h2, h3, h4')).filter(function (el) {
      if (el.closest('#atq-mob-home, #atq-catalogo-pro, #atq-extras-root, #atq-escala-ph, #atq-quiz, #atq-simulador, #qbot-ia-root')) return false;
      var txt = (el.textContent || '').trim();
      return txt.length > 0 && txt.length < 48;
    });

    var achados = [null, null, null, null];
    titulos.forEach(function (h) {
      var txt = (h.textContent || '').trim();
      var matches = [];
      DEFS.forEach(function (d, idx) {
        if (d.rx.test(txt)) matches.push(idx);
      });
      if (matches.length === 1 && !achados[matches[0]]) {
        achados[matches[0]] = h;
      }
    });

    if (achados.some(function (x) { return !x; })) return;

    // Encontrar o container comum mais proximo dos 4 cartoes
    var lca = achados[0].parentElement;
    while (lca && lca !== document.body) {
      if (achados.every(function (h) { return lca.contains(h); })) break;
      lca = lca.parentElement;
    }
    if (!lca) return;

    var cards = achados.map(function (h) {
      var cur = h;
      while (cur.parentElement && cur.parentElement !== lca) cur = cur.parentElement;
      return cur;
    });

    if (new Set(cards).size !== 4) return;

    var atual = 0;
    var hash = decodeURIComponent(window.location.hash || '').toLowerCase();
    DEFS.forEach(function (d, i) {
      if (hash.indexOf(d.key) !== -1) atual = i;
    });

    var bar = document.createElement('div');
    bar.className = 'atq-mob-func-bar';
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', 'Escolher função inorgânica');
    bar.innerHTML = DEFS.map(function (d, i) {
      return '<button type="button" class="atq-mob-func-btn" role="tab" data-idx="' + i + '" style="--fn-cor:' + d.cor + ';">' +
        '<span class="atq-mob-func-dot" style="background:' + d.cor + ';"></span>' +
        '<span>' + d.label + '</span>' +
      '</button>';
    }).join('');

    var pager = document.createElement('div');
    pager.className = 'atq-mob-func-pager';
    pager.innerHTML =
      '<button type="button" class="atq-mob-func-nav" id="atq-fn-prev">← Anterior</button>' +
      '<span class="atq-mob-func-pos" id="atq-fn-pos">1 / 4 · Ácidos</span>' +
      '<button type="button" class="atq-mob-func-nav" id="atq-fn-next">Próxima →</button>';

    cards[0].parentNode.insertBefore(bar, cards[0]);
    cards[3].parentNode.insertBefore(pager, cards[3].nextSibling);

    function mostrar(idx, rolarTopo) {
      atual = (idx + 4) % 4;
      cards.forEach(function (c, i) {
        var ativo = i === atual;
        c.classList.toggle('atq-mob-func-hidden', !ativo);
        c.classList.toggle('atq-mob-func-active', ativo);
      });

      Array.from(bar.querySelectorAll('.atq-mob-func-btn')).forEach(function (b, i) {
        var on = i === atual;
        b.classList.toggle('ativo', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      var posEl = document.getElementById('atq-fn-pos');
      if (posEl) posEl.textContent = (atual + 1) + ' / 4 · ' + DEFS[atual].label;

      // Aciona o Guardiao de Contraste WCAG no cartao recem-exibido
      var ping = document.createElement('span');
      ping.style.display = 'none';
      cards[atual].appendChild(ping);
      setTimeout(function () { if (ping.parentNode) ping.remove(); }, 30);

      if (rolarTopo) {
        bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    Array.from(bar.querySelectorAll('.atq-mob-func-btn')).forEach(function (b) {
      b.onclick = function () { mostrar(Number(b.getAttribute('data-idx')), false); };
    });
    document.getElementById('atq-fn-prev').onclick = function () { mostrar(atual - 1, true); };
    document.getElementById('atq-fn-next').onclick = function () { mostrar(atual + 1, true); };

    window.addEventListener('hashchange', function () {
      var h = decodeURIComponent(window.location.hash || '').toLowerCase();
      DEFS.forEach(function (d, i) {
        if (h.indexOf(d.key) !== -1) mostrar(i, false);
      });
    });

    mostrar(atual, false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    montarCarrossel4Funcoes();
    setTimeout(montarCarrossel4Funcoes, 500);
  });
})();
/* ATQ_MOB_4FUNC_JS_FIM */
