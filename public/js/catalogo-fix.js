(function () {
  var path = window.location.pathname.toLowerCase();
  var CORES = {
    'Ácido': '#ef4444', 'Base': '#2563eb', 'Sal': '#16a34a', 'Óxido': '#d97706'
  };

  function renderCatalogoHome() {
    if (path !== '/' && path !== '/index.html') return;
    if (document.getElementById('atq-catalogo-pro')) return;

    fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
      if (!Array.isArray(dados) || dados.length === 0) return;

      // Garantir que nenhuma secao de catalogo original fique invisivel
      document.querySelectorAll('.atq-reveal').forEach(function (el) { el.classList.add('atq-visivel'); });

      var sec = document.createElement('section');
      sec.id = 'atq-catalogo-pro';
      sec.className = 'atq-glow-card atq-visivel';
      sec.style.cssText = 'max-width:1120px;margin:26px auto;padding:22px;border-radius:18px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;';

      var zonas = Array.from(new Set(dados.flatMap(function (s) { return (s.ocorrencias || []).map(function (o) { return o.zona; }); })));
      var zOpts = '<option value="Todas">Todas as 9 zonas</option>' + zonas.map(function (z) { return '<option value="' + z + '">📍 ' + z + '</option>'; }).join('');

      sec.innerHTML =
        '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:14px;">' +
          '<div>' +
            '<div style="font-size:11px;font-weight:800;letter-spacing:0.08em;color:#c89b3c;">CATÁLOGO COMPLETO DO CAMPUS</div>' +
            '<h2 style="margin:2px 0 4px;font-size:24px;">🧪 25 Substâncias &amp; 38 Plaquinhas</h2>' +
            '<p style="margin:0;font-size:13px;opacity:0.84;">Filtre por classe química, zona da escola ou busque pelo código, nome ou fórmula.</p>' +
          '</div>' +
          '<span id="atq-cat-count" style="font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;border:1px solid rgba(200,155,60,0.45);"></span>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px;">' +
          '<button type="button" class="btn ativo atq-cf" data-c="Todas">Todas (25)</button>' +
          '<button type="button" class="btn atq-cf" data-c="Ácido">🔴 Ácidos</button>' +
          '<button type="button" class="btn atq-cf" data-c="Base">🔵 Bases</button>' +
          '<button type="button" class="btn atq-cf" data-c="Sal">🟢 Sais</button>' +
          '<button type="button" class="btn atq-cf" data-c="Óxido">🟠 Óxidos</button>' +
          '<select id="atq-cat-zona" style="padding:8px 11px;border-radius:10px;font-size:13px;">' + zOpts + '</select>' +
          '<input type="search" id="atq-cat-busca" placeholder="Buscar fórmula, nome ou código..." style="flex:1;min-width:190px;padding:8px 12px;border-radius:10px;font-size:13px;">' +
        '</div>' +
        '<div id="atq-cat-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:14px;"></div>';

      var rootExtras = document.getElementById('atq-extras-root');
      if (rootExtras && rootExtras.parentNode) rootExtras.parentNode.insertBefore(sec, rootExtras);
      else (document.querySelector('main') || document.body).appendChild(sec);

      var classeSel = 'Todas', zonaSel = 'Todas', buscaTxt = '';

      function desenhar() {
        var q = buscaTxt.trim().toLowerCase();
        var lista = dados.filter(function (s) {
          if (classeSel !== 'Todas' && s.classe !== classeSel) return false;
          if (zonaSel !== 'Todas' && !(s.ocorrencias || []).some(function (o) { return o.zona === zonaSel; })) return false;
          if (q) {
            var blob = (s.nomeIupac + ' ' + s.formula + ' ' + s.classe + ' ' + (s.nomesPopulares || []).join(' ') + ' ' +
              (s.ocorrencias || []).map(function (o) { return o.codigo + ' ' + o.zona + ' ' + o.localExato; }).join(' ')).toLowerCase();
            if (blob.indexOf(q) === -1) return false;
          }
          return true;
        });

        document.getElementById('atq-cat-count').textContent = lista.length + ' de ' + dados.length + ' substâncias';
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
              '<p style="margin:0 0 10px;font-size:12.5px;line-height:1.45;opacity:0.88;">' + String(s.porQueEstaAqui || '').slice(0, 155) + (String(s.porQueEstaAqui || '').length > 155 ? '...' : '') + '</p>' +
              '<div style="margin-bottom:6px;">' + chipsPlacas + '</div>' +
            '</div>' +
            (primeira ? '<div style="display:flex;gap:7px;flex-wrap:wrap;padding-top:8px;border-top:1px solid rgba(200,155,60,0.22);">' +
              '<a href="/plaquinha/' + encodeURIComponent(primeira.codigo) + '" class="btn btn-primary" style="flex:1;text-align:center;text-decoration:none;padding:7px 10px;font-size:12px;">Abrir Ficha →</a>' +
              '<a href="/mapa?guiar=' + encodeURIComponent(primeira.codigo) + '" class="btn" style="text-decoration:none;padding:7px 10px;font-size:12px;">🧭 GPS</a>' +
            '</div>' : '') +
          '</article>';
        }).join('');
      }

      Array.from(sec.querySelectorAll('.atq-cf')).forEach(function (b) {
        b.onclick = function () {
          classeSel = b.getAttribute('data-c');
          Array.from(sec.querySelectorAll('.atq-cf')).forEach(function (x) { x.classList.toggle('ativo', x === b); });
          desenhar();
        };
      });
      document.getElementById('atq-cat-zona').onchange = function (e) { zonaSel = e.target.value; desenhar(); };
      document.getElementById('atq-cat-busca').oninput = function (e) { buscaTxt = e.target.value; desenhar(); };
      desenhar();
    }).catch(function () {});
  }

  // Fallback automatico para paginas /plaquinha/ caso o template original nao renderize
  function verificarPlaquinha() {
    var m = decodeURIComponent(window.location.pathname + ' ' + window.location.search).match(/INF-G\d{2}-P\d+/i);
    if (!m) return;
    var cod = m[0].toUpperCase();

    setTimeout(function () {
      var main = document.querySelector('main') || document.body;
      var textoLimpo = (main.innerText || '').replace(/\s+/g, ' ').trim();
      var temNome = textoLimpo.toUpperCase().indexOf(cod) !== -1 && textoLimpo.length > 260;
      if (temNome) return;

      fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
        var sub = null, oc = null;
        dados.forEach(function (s) {
          (s.ocorrencias || []).forEach(function (o) {
            if (String(o.codigo).toUpperCase() === cod) { sub = s; oc = o; }
          });
        });
        if (!sub || !oc || document.getElementById('atq-ficha-fallback')) return;

        var cor = CORES[sub.classe] || '#c89b3c';
        var card = document.createElement('section');
        card.id = 'atq-ficha-fallback';
        card.className = 'card atq-visivel';
        card.style.cssText = 'max-width:960px;margin:22px auto;padding:24px;border-radius:18px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;';
        card.innerHTML =
          '<span style="display:inline-block;padding:4px 11px;border-radius:999px;font-size:12px;font-weight:800;border:1px solid ' + cor + ';color:' + cor + ';">' + oc.codigo + ' • ' + sub.classe.toUpperCase() + '</span>' +
          '<h1 style="margin:10px 0 4px;font-size:30px;">' + sub.nomeIupac + ' <span style="font-family:\'JetBrains Mono\',monospace;color:#c89b3c;">(' + (sub.formulaHtml || sub.formula) + ')</span></h1>' +
          '<div style="font-size:14px;opacity:0.86;margin-bottom:16px;">📍 <strong>' + oc.zona + '</strong> — ' + oc.localExato + ' • Grupo ' + oc.grupo + ' • pH ≈ ' + (typeof sub.phEstimado === 'number' ? sub.phEstimado.toFixed(1) : '7.0') + '</div>' +
          '<div style="display:grid;gap:12px;">' +
            '<div><strong>Classificação química:</strong> ' + (sub.justificativa || '') + '</div>' +
            '<div><strong>Por que está aqui:</strong> ' + (sub.porQueEstaAqui || '') + '</div>' +
            '<div><strong>Curiosidade:</strong> ' + (sub.curiosidade || '') + '</div>' +
          '</div>';
        main.insertBefore(card, main.firstChild);
      }).catch(function () {});
    }, 900);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(renderCatalogoHome, 350);
    verificarPlaquinha();
  });
})();