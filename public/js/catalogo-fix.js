(function () {
  var path = window.location.pathname.toLowerCase();
  var CORES = {
    'Ácido': '#ef4444', 'Base': '#2563eb', 'Sal': '#16a34a', 'Óxido': '#d97706'
  };

  function injetarEstilos() {
    if (document.getElementById('atq-cat-drawer-css')) return;
    var st = document.createElement('style');
    st.id = 'atq-cat-drawer-css';
    st.textContent =
      '#atq-catalogo-pro{max-width:1120px;margin:22px auto;border-radius:18px;overflow:hidden;font-family:"Plus Jakarta Sans",system-ui,sans-serif;}' +
      '.atq-cat-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 22px;background:transparent;border:0;color:inherit;text-align:left;cursor:pointer;}' +
      '.atq-cat-trigger:hover{background:rgba(192,132,252,0.08);}' +
      '[data-tema="claro"] .atq-cat-trigger:hover{background:rgba(200,155,60,0.08);}' +
      '.atq-cat-kicker{font-size:11px;font-weight:800;letter-spacing:0.08em;color:#c89b3c;margin-bottom:3px;}' +
      '.atq-cat-title{margin:0;font-size:clamp(20px,3vw,26px);font-family:"Playfair Display",Georgia,serif;}' +
      '.atq-cat-sub{margin:4px 0 0;font-size:13px;opacity:0.84;}' +
      '.atq-cat-pill{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;padding:9px 15px;border-radius:999px;font-size:12.5px;font-weight:800;background:linear-gradient(135deg,#6d4aa3,#9333ea);color:#fff;border:1px solid #f5d37a;box-shadow:0 0 16px rgba(168,85,247,0.38);white-space:nowrap;transition:transform 0.2s ease;}' +
      '[data-tema="claro"] .atq-cat-pill{background:linear-gradient(135deg,#c89b3c,#9a6d08);color:#fff;border-color:#8a6208;box-shadow:0 4px 14px rgba(184,134,11,0.28);}' +
      '#atq-cat-drawer{display:none;padding:0 22px 22px;border-top:1px solid rgba(200,162,77,0.24);animation:atqCatFade 0.28s ease;}' +
      '#atq-cat-drawer.aberto{display:block;}' +
      '@keyframes atqCatFade{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}' +
      '@media(max-width:640px){.atq-cat-trigger{flex-direction:column;align-items:flex-start;padding:16px;}#atq-cat-drawer{padding:0 14px 16px;}}';
    document.head.appendChild(st);
  }

  function localizarSecaoAntiga() {
    var secoes = document.querySelectorAll('main section, body > section');
    for (var i = 0; i < secoes.length; i++) {
      var s = secoes[i];
      if (s.id === 'atq-catalogo-pro') continue;
      var h = s.querySelector('h1, h2, h3');
      if (h && /cat[aá]logo interativo de plaquinhas/i.test(h.textContent || '')) {
        return s;
      }
    }
    return null;
  }

  function renderCatalogoHome() {
    if (path !== '/' && path !== '/index.html') return;
    if (document.getElementById('atq-catalogo-pro')) return;
    injetarEstilos();

    var secaoAntiga = localizarSecaoAntiga();
    var sec = document.createElement('section');
    sec.id = 'atq-catalogo-pro';
    sec.className = 'card atq-glow-card atq-visivel';

    sec.innerHTML =
      '<button type="button" class="atq-cat-trigger" id="atq-cat-toggle" aria-expanded="false" aria-controls="atq-cat-drawer">' +
        '<div>' +
          '<div class="atq-cat-kicker">ACERVO DIGITAL · PADRÃO INF-GXX-PX</div>' +
          '<h2 class="atq-cat-title">Catálogo Interativo de Plaquinhas</h2>' +
          '<p class="atq-cat-sub">25 substâncias e 38 plaquinhas nas 9 zonas do CEFET — clique para abrir, filtrar ou traçar rota GPS.</p>' +
        '</div>' +
        '<span class="atq-cat-pill" id="atq-cat-pill">Abrir Catálogo ▾</span>' +
      '</button>' +
      '<div id="atq-cat-drawer">' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:16px 0 14px;">' +
          '<button type="button" class="btn ativo atq-cf" data-c="Todas">Todas (25)</button>' +
          '<button type="button" class="btn atq-cf" data-c="Ácido">🔴 Ácidos</button>' +
          '<button type="button" class="btn atq-cf" data-c="Base">🔵 Bases</button>' +
          '<button type="button" class="btn atq-cf" data-c="Sal">🟢 Sais</button>' +
          '<button type="button" class="btn atq-cf" data-c="Óxido">🟠 Óxidos</button>' +
          '<select id="atq-cat-zona" style="padding:8px 11px;border-radius:10px;font-size:13px;"><option value="Todas">Todas as 9 zonas</option></select>' +
          '<input type="search" id="atq-cat-busca" placeholder="Buscar fórmula, nome ou código..." style="flex:1;min-width:185px;padding:8px 12px;border-radius:10px;font-size:13px;">' +
          '<span id="atq-cat-count" style="font-size:12px;font-weight:800;padding:6px 11px;border-radius:999px;border:1px solid rgba(200,155,60,0.45);"></span>' +
        '</div>' +
        '<div id="atq-cat-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px;">' +
          '<div style="grid-column:1/-1;padding:18px;text-align:center;opacity:0.8;">Carregando catálogo...</div>' +
        '</div>' +
      '</div>';

    if (secaoAntiga && secaoAntiga.parentNode) {
      secaoAntiga.parentNode.insertBefore(sec, secaoAntiga);
      secaoAntiga.style.display = 'none';
      secaoAntiga.setAttribute('aria-hidden', 'true');
    } else {
      var rootExtras = document.getElementById('atq-extras-root');
      if (rootExtras && rootExtras.parentNode) rootExtras.parentNode.insertBefore(sec, rootExtras);
      else (document.querySelector('main') || document.body).appendChild(sec);
    }

    var aberto = false;
    var dadosCarregados = null;
    var classeSel = 'Todas', zonaSel = 'Todas', buscaTxt = '';

    var trigger = document.getElementById('atq-cat-toggle');
    var drawer = document.getElementById('atq-cat-drawer');
    var pill = document.getElementById('atq-cat-pill');

    function desenhar() {
      if (!dadosCarregados) return;
      var q = buscaTxt.trim().toLowerCase();
      var lista = dadosCarregados.filter(function (s) {
        if (classeSel !== 'Todas' && s.classe !== classeSel) return false;
        if (zonaSel !== 'Todas' && !(s.ocorrencias || []).some(function (o) { return o.zona === zonaSel; })) return false;
        if (q) {
          var blob = (s.nomeIupac + ' ' + s.formula + ' ' + s.classe + ' ' + (s.nomesPopulares || []).join(' ') + ' ' +
            (s.ocorrencias || []).map(function (o) { return o.codigo + ' ' + o.zona + ' ' + o.localExato; }).join(' ')).toLowerCase();
          if (blob.indexOf(q) === -1) return false;
        }
        return true;
      });

      document.getElementById('atq-cat-count').textContent = lista.length + ' de ' + dadosCarregados.length + ' substâncias';
      var grid = document.getElementById('atq-cat-grid');
      if (lista.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;padding:24px;text-align:center;opacity:0.8;">Nenhuma substância encontrada para esse filtro.</div>';
        return;
      }

      grid.innerHTML = lista.map(function (s) {
        var cor = CORES[s.classe] || '#c89b3c';
        var ocs = s.ocorrencias || [];
        var primeira = ocs[0];
        var phTxt = typeof s.phEstimado === 'number' ? 'pH ≈ ' + s.phEstimado.toFixed(1) : '';
        var chipsPlacas = ocs.map(function (o) {
          return '<a href="/plaquinha/' + encodeURIComponent(o.codigo) + '" style="display:inline-block;padding:3px 8px;border-radius:7px;font-size:11px;font-weight:700;text-decoration:none;border:1px solid rgba(200,155,60,0.4);margin:2px 4px 2px 0;">' + o.codigo + ' · ' + o.zona + '</a>';
        }).join('');

        return '<article class="card atq-glow-card atq-visivel" style="padding:15px;border-radius:15px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px;">' +
              '<span style="font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px;border:1px solid ' + cor + ';color:' + cor + ';">' + s.classe.toUpperCase() + '</span>' +
              '<span style="font-size:11px;opacity:0.8;font-family:\'JetBrains Mono\',monospace;">' + phTxt + '</span>' +
            '</div>' +
            '<h3 style="margin:0 0 3px;font-size:18px;">' + s.nomeIupac + '</h3>' +
            '<div style="font-family:\'JetBrains Mono\',monospace;font-size:14px;font-weight:700;color:#c89b3c;margin-bottom:8px;">' + (s.formulaHtml || s.formula) + '</div>' +
            '<p style="margin:0 0 10px;font-size:12.5px;line-height:1.45;opacity:0.88;">' + String(s.porQueEstaAqui || '').slice(0, 150) + (String(s.porQueEstaAqui || '').length > 150 ? '...' : '') + '</p>' +
            '<div style="margin-bottom:6px;">' + chipsPlacas + '</div>' +
          '</div>' +
          (primeira ? '<div style="display:flex;gap:7px;flex-wrap:wrap;padding-top:8px;border-top:1px solid rgba(200,155,60,0.22);">' +
            '<a href="/plaquinha/' + encodeURIComponent(primeira.codigo) + '" class="btn btn-primary" style="flex:1;text-align:center;text-decoration:none;padding:7px 10px;font-size:12px;">Abrir Ficha →</a>' +
            '<a href="/mapa?guiar=' + encodeURIComponent(primeira.codigo) + '" class="btn" style="text-decoration:none;padding:7px 10px;font-size:12px;">🧭 GPS</a>' +
          '</div>' : '') +
        '</article>';
      }).join('');
    }

    function garantirDados() {
      if (dadosCarregados) { desenhar(); return; }
      fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
        if (!Array.isArray(dados)) return;
        dadosCarregados = dados;
        var zonas = Array.from(new Set(dados.flatMap(function (s) { return (s.ocorrencias || []).map(function (o) { return o.zona; }); })));
        var selZ = document.getElementById('atq-cat-zona');
        selZ.innerHTML = '<option value="Todas">Todas as 9 zonas</option>' +
          zonas.map(function (z) { return '<option value="' + z + '">📍 ' + z + '</option>'; }).join('');
        desenhar();
      }).catch(function () {
        document.getElementById('atq-cat-grid').innerHTML = '<div style="grid-column:1/-1;padding:18px;text-align:center;">Erro ao carregar o catálogo.</div>';
      });
    }

    function definirAberto(estado, rolar) {
      aberto = estado;
      drawer.classList.toggle('aberto', aberto);
      trigger.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      pill.textContent = aberto ? 'Recolher ▴' : 'Abrir Catálogo ▾';
      if (aberto) {
        garantirDados();
        if (rolar) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    trigger.onclick = function () { definirAberto(!aberto, false); };

    Array.from(sec.querySelectorAll('.atq-cf')).forEach(function (b) {
      b.onclick = function () {
        classeSel = b.getAttribute('data-c');
        Array.from(sec.querySelectorAll('.atq-cf')).forEach(function (x) { x.classList.toggle('ativo', x === b); });
        desenhar();
      };
    });
    document.getElementById('atq-cat-zona').onchange = function (e) { zonaSel = e.target.value; desenhar(); };
    document.getElementById('atq-cat-busca').oninput = function (e) { buscaTxt = e.target.value; desenhar(); };

    // Conectar o botao "Ver Catalogo Completo" do topo da home para abrir o catalogo automaticamente
    document.querySelectorAll('a, button').forEach(function (el) {
      if (el.closest('#atq-catalogo-pro')) return;
      var txt = (el.textContent || '').trim();
      var href = el.getAttribute('href') || '';
      if (/ver cat[aá]logo/i.test(txt) || href === '#catalogo') {
        el.addEventListener('click', function (ev) {
          ev.preventDefault();
          definirAberto(true, true);
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(renderCatalogoHome, 250);
  });
})();