(function () {
  var CORES = {
    'Ácido': { hex: '#ef4444', soft: 'rgba(239,68,68,0.16)', icone: '🔴' },
    'Base':  { hex: '#2563eb', soft: 'rgba(37,99,235,0.16)', icone: '🔵' },
    'Sal':   { hex: '#16a34a', soft: 'rgba(22,163,74,0.16)', icone: '🟢' },
    'Óxido': { hex: '#d97706', soft: 'rgba(217,119,6,0.16)', icone: '🟠' }
  };

  var state = {
    todas: [],
    filtradas: [],
    visitadas: new Set(),
    classe: 'Todas',
    zona: 'Todas',
    grupo: 'Todos',
    status: 'todas',
    ordem: 'codigo',
    busca: '',
    visao: 'grade'
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function corClasse(c) {
    return CORES[c] || { hex: '#c89b3c', soft: 'rgba(200,155,60,0.16)', icone: '🧪' };
  }

  function corPh(ph) {
    if (ph < 6.5) return '#ef4444';
    if (ph <= 7.5) return '#16a34a';
    return '#2563eb';
  }

  function lerVisitadas() {
    try {
      var arr = JSON.parse(localStorage.getItem('atq_plaquinhas_visitadas_v1') || '[]');
      return new Set((Array.isArray(arr) ? arr : []).map(function (c) { return String(c).toUpperCase(); }));
    } catch (e) {
      return new Set();
    }
  }

  function abrirPrevia(p) {
    var old = document.getElementById('pl-quick-modal');
    if (old) old.remove();

    var cor = corClasse(p.classe);
    var phPct = Math.max(2, Math.min(98, (p.ph / 14) * 100));
    var visitada = state.visitadas.has(p.codigo);
    var gmaps = 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng + '&travelmode=walking';

    var bg = document.createElement('div');
    bg.id = 'pl-quick-modal';
    bg.className = 'pl-modal-bg';
    bg.innerHTML =
      '<div class="pl-modal-box" role="dialog" aria-modal="true" aria-label="Prévia da plaquinha ' + esc(p.codigo) + '">' +
        '<div class="pl-modal-top">' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">' +
            '<span class="pl-badge" style="color:' + cor.hex + ';background:' + cor.soft + ';border-color:' + cor.hex + ';">' + cor.icone + ' ' + esc(p.classe.toUpperCase()) + '</span>' +
            '<span class="pl-code-pill">' + esc(p.codigo) + '</span>' +
            (visitada ? '<span class="pl-stamp-ok">✓ No Passaporte</span>' : '<span class="pl-stamp-pend">🔒 Não escaneada</span>') +
          '</div>' +
          '<button type="button" id="pl-modal-close" class="btn" style="padding:5px 10px;">✕</button>' +
        '</div>' +
        '<div class="pl-modal-head">' +
          '<div>' +
            '<h2 style="margin:6px 0 3px;font-size:24px;">' + esc(p.nomeIupac) + '</h2>' +
            '<div style="font-size:13px;opacity:0.85;">📍 <strong>' + esc(p.zona) + '</strong> — ' + esc(p.localExato) + ' · Grupo ' + esc(p.grupo) + '</div>' +
          '</div>' +
          '<div class="pl-modal-formula">' + (p.formulaHtml || esc(p.formula)) + '</div>' +
        '</div>' +
        (p.foto ? '<div class="pl-modal-photo"><img src="' + esc(p.foto) + '" alt="Plaquinha ' + esc(p.codigo) + '" onerror="this.parentElement.style.display=\'none\'"></div>' : '') +
        '<div class="pl-ph-wrap">' +
          '<div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:5px;"><span>Escala de pH (0–14)</span><strong style="color:' + corPh(p.ph) + ';">pH ≈ ' + p.ph.toFixed(1) + '</strong></div>' +
          '<div class="pl-ph-bar"><div class="pl-ph-dot" style="left:' + phPct.toFixed(1) + '%;"></div></div>' +
        '</div>' +
        '<div class="pl-modal-sec"><strong>🔬 Por que está aqui:</strong><p>' + esc(p.porQueEstaAqui) + '</p></div>' +
        '<div class="pl-modal-sec"><strong>📚 Classificação:</strong><p>' + esc(p.justificativa) + '</p></div>' +
        (p.curiosidade ? '<div class="pl-modal-sec"><strong>💡 Curiosidade:</strong><p>' + esc(p.curiosidade) + '</p></div>' : '') +
        '<div class="pl-modal-actions">' +
          '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" class="btn btn-primary" style="flex:1;text-align:center;text-decoration:none;">Abrir Ficha Completa →</a>' +
          '<a href="/mapa?guiar=' + encodeURIComponent(p.codigo) + '" class="btn" style="text-decoration:none;">🧭 GPS no Mapa</a>' +
          '<a href="' + gmaps + '" target="_blank" rel="noopener" class="btn" style="text-decoration:none;">🗺️ Google Maps</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(bg);
    document.getElementById('pl-modal-close').onclick = function () { bg.remove(); };
    bg.addEventListener('click', function (ev) { if (ev.target === bg) bg.remove(); });
  }

  function cardHtml(p, idx) {
    var cor = corClasse(p.classe);
    var vis = state.visitadas.has(p.codigo);
    var delay = Math.min(idx * 22, 240);
    var resumo = String(p.porQueEstaAqui || '');
    if (resumo.length > 130) resumo = resumo.slice(0, 127) + '...';

    return '<article class="pl-card card atq-glow-card atq-visivel" style="animation-delay:' + delay + 'ms;">' +
      '<div class="pl-card-accent" style="background:' + cor.hex + ';"></div>' +
      '<div class="pl-card-top">' +
        '<span class="pl-code-pill">' + esc(p.codigo) + '</span>' +
        '<span class="pl-badge" style="color:' + cor.hex + ';background:' + cor.soft + ';border-color:' + cor.hex + ';">' + cor.icone + ' ' + esc(p.classe) + '</span>' +
        (vis ? '<span class="pl-stamp-ok" title="Já registrada no Passaporte">✓</span>' : '') +
      '</div>' +
      '<div class="pl-card-mid">' +
        '<div class="pl-title-row">' +
          '<h3 class="pl-card-title">' + esc(p.nomeIupac) + '</h3>' +
          '<span class="pl-formula-chip">' + (p.formulaHtml || esc(p.formula)) + '</span>' +
        '</div>' +
        '<div class="pl-loc-box">' +
          '<span class="pl-zone-tag">📍 ' + esc(p.zona) + '</span>' +
          '<span class="pl-meta-mini">Grupo ' + esc(p.grupo) + ' · pH ≈ ' + p.ph.toFixed(1) + '</span>' +
        '</div>' +
        '<div class="pl-exact">' + esc(p.localExato) + '</div>' +
        '<p class="pl-desc">' + esc(resumo) + '</p>' +
      '</div>' +
      '<div class="pl-card-foot">' +
        '<button type="button" class="btn pl-btn-prev" data-cod="' + esc(p.codigo) + '">👁️ Prévia</button>' +
        '<a href="/mapa?guiar=' + encodeURIComponent(p.codigo) + '" class="btn pl-btn-gps">🧭 GPS</a>' +
        '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" class="btn btn-primary pl-btn-go">Ficha →</a>' +
      '</div>' +
    '</article>';
  }

  function linhaCompactaHtml(p) {
    var cor = corClasse(p.classe);
    var vis = state.visitadas.has(p.codigo);
    return '<div class="pl-row-item card atq-visivel">' +
      '<div class="pl-row-left">' +
        '<span class="pl-code-pill">' + esc(p.codigo) + '</span>' +
        '<span class="pl-badge" style="color:' + cor.hex + ';background:' + cor.soft + ';border-color:' + cor.hex + ';">' + esc(p.classe) + '</span>' +
        '<div>' +
          '<strong style="font-size:14.5px;">' + esc(p.nomeIupac) + '</strong> ' +
          '<span class="pl-mono-inline">(' + (p.formulaHtml || esc(p.formula)) + ')</span> ' +
          (vis ? '<span class="pl-stamp-ok" style="margin-left:4px;">✓</span>' : '') +
          '<div style="font-size:12px;opacity:0.82;">📍 ' + esc(p.zona) + ' — ' + esc(p.localExato) + ' · pH ≈ ' + p.ph.toFixed(1) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pl-row-right">' +
        '<button type="button" class="btn pl-btn-prev" data-cod="' + esc(p.codigo) + '">👁️</button>' +
        '<a href="/mapa?guiar=' + encodeURIComponent(p.codigo) + '" class="btn">🧭 GPS</a>' +
        '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" class="btn btn-primary">Ficha →</a>' +
      '</div>' +
    '</div>';
  }

  function renderLista() {
    var container = document.getElementById('pl-container');
    var totalVis = state.filtradas.length;
    var totalAll = state.todas.length;
    document.getElementById('pl-contador').textContent = 'Mostrando ' + totalVis + ' de ' + totalAll + ' plaquinhas';

    var temFiltro = state.classe !== 'Todas' || state.zona !== 'Todas' || state.grupo !== 'Todos' || state.status !== 'todas' || state.busca.trim() !== '';
    document.getElementById('pl-btn-limpar').style.display = temFiltro ? 'inline-flex' : 'none';

    if (totalVis === 0) {
      container.innerHTML =
        '<div class="card pl-empty">' +
          '<div style="font-size:34px;margin-bottom:8px;">🔎</div>' +
          '<h3 style="margin:0 0 6px;">Nenhuma plaquinha encontrada</h3>' +
          '<p style="margin:0 0 14px;font-size:13px;opacity:0.82;">Tente limpar os filtros ou buscar por outro código, zona ou fórmula.</p>' +
          '<button type="button" id="pl-empty-reset" class="btn btn-primary">Mostrar todas as 38 plaquinhas</button>' +
        '</div>';
      document.getElementById('pl-empty-reset').onclick = limparFiltros;
      return;
    }

    if (state.visao === 'lista') {
      container.innerHTML = '<div class="pl-list-wrap">' + state.filtradas.map(linhaCompactaHtml).join('') + '</div>';
    } else if (state.visao === 'zonas') {
      var porZona = {};
      state.filtradas.forEach(function (p) {
        if (!porZona[p.zona]) porZona[p.zona] = [];
        porZona[p.zona].push(p);
      });
      container.innerHTML = Object.keys(porZona).sort().map(function (z) {
        var itens = porZona[z];
        var okZona = itens.filter(function (x) { return state.visitadas.has(x.codigo); }).length;
        return '<section class="pl-zone-group">' +
          '<div class="pl-zone-header">' +
            '<div><h2>📍 ' + esc(z) + '</h2><small>' + itens.length + ' plaquinha(s) · ' + okZona + ' no Passaporte</small></div>' +
            '<a href="/mapa" class="btn" style="font-size:12px;text-decoration:none;">Ver no Mapa →</a>' +
          '</div>' +
          '<div class="pl-grid">' + itens.map(cardHtml).join('') + '</div>' +
        '</section>';
      }).join('');
    } else {
      container.innerHTML = '<div class="pl-grid">' + state.filtradas.map(cardHtml).join('') + '</div>';
    }

    container.querySelectorAll('.pl-btn-prev').forEach(function (btn) {
      btn.onclick = function () {
        var cod = btn.getAttribute('data-cod');
        var item = state.todas.find(function (x) { return x.codigo === cod; });
        if (item) abrirPrevia(item);
      };
    });
  }

  function aplicarFiltros() {
    var q = state.busca.trim().toLowerCase();
    var lista = state.todas.filter(function (p) {
      if (state.classe !== 'Todas' && p.classe !== state.classe) return false;
      if (state.zona !== 'Todas' && p.zona !== state.zona) return false;
      if (state.grupo !== 'Todos' && p.grupo !== state.grupo) return false;
      if (state.status === 'visitadas' && !state.visitadas.has(p.codigo)) return false;
      if (state.status === 'pendentes' && state.visitadas.has(p.codigo)) return false;
      if (q && p.buscaBlob.indexOf(q) === -1) return false;
      return true;
    });

    if (state.ordem === 'codigo') lista.sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });
    else if (state.ordem === 'zona') lista.sort(function (a, b) { return a.zona.localeCompare(b.zona) || a.codigo.localeCompare(b.codigo); });
    else if (state.ordem === 'nome') lista.sort(function (a, b) { return a.nomeIupac.localeCompare(b.nomeIupac); });
    else if (state.ordem === 'ph-asc') lista.sort(function (a, b) { return a.ph - b.ph; });
    else if (state.ordem === 'ph-desc') lista.sort(function (a, b) { return b.ph - a.ph; });

    state.filtradas = lista;
    renderLista();
  }

  function limparFiltros() {
    state.classe = 'Todas';
    state.zona = 'Todas';
    state.grupo = 'Todos';
    state.status = 'todas';
    state.ordem = 'codigo';
    state.busca = '';
    document.getElementById('pl-busca').value = '';
    document.getElementById('pl-zona').value = 'Todas';
    document.getElementById('pl-grupo').value = 'Todos';
    document.getElementById('pl-status').value = 'todas';
    document.getElementById('pl-ordem').value = 'codigo';
    document.querySelectorAll('.pl-chip-classe').forEach(function (b) {
      b.classList.toggle('ativo', b.getAttribute('data-classe') === 'Todas');
    });
    aplicarFiltros();
  }

  function atualizarStatsTopo() {
    var total = state.todas.length;
    var vis = state.todas.filter(function (p) { return state.visitadas.has(p.codigo); }).length;
    var pct = total ? Math.round((vis / total) * 100) : 0;
    document.getElementById('pl-stat-total').textContent = total;
    document.getElementById('pl-stat-vis').textContent = vis + '/' + total + ' (' + pct + '%)';
    document.getElementById('pl-prog-fill').style.width = pct + '%';

    var counts = { 'Todas': total, 'Ácido': 0, 'Base': 0, 'Sal': 0, 'Óxido': 0 };
    state.todas.forEach(function (p) { if (counts[p.classe] != null) counts[p.classe]++; });
    document.querySelectorAll('.pl-chip-classe').forEach(function (b) {
      var c = b.getAttribute('data-classe');
      var span = b.querySelector('.pl-c-num');
      if (span && counts[c] != null) span.textContent = counts[c];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    state.visitadas = lerVisitadas();

    fetch('/api/extras-dados')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (dados) {
        var lista = [];
        dados.forEach(function (s) {
          (s.ocorrencias || []).forEach(function (o) {
            var cod = String(o.codigo).toUpperCase();
            var ph = typeof s.phEstimado === 'number' ? s.phEstimado : 7.0;
            lista.push({
              codigo: cod,
              zona: o.zona,
              localExato: o.localExato,
              grupo: o.grupo,
              lat: Number(o.lat) || -20.172405,
              lng: Number(o.lng) || -44.909991,
              foto: o.fotoPlaquinha || s.fotoPlaquinha || '',
              nomeIupac: s.nomeIupac,
              formula: s.formula,
              formulaHtml: s.formulaHtml || s.formula,
              classe: s.classe,
              ph: ph,
              porQueEstaAqui: s.porQueEstaAqui || '',
              justificativa: s.justificativa || '',
              curiosidade: s.curiosidade || '',
              buscaBlob: (cod + ' ' + s.nomeIupac + ' ' + s.formula + ' ' + s.classe + ' ' + o.zona + ' ' + o.localExato + ' ' + o.grupo + ' ' + (s.nomesPopulares || []).join(' ')).toLowerCase()
            });
          });
        });
        lista.sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });
        state.todas = lista;

        var zonas = Array.from(new Set(lista.map(function (p) { return p.zona; }))).sort();
        document.getElementById('pl-zona').innerHTML = '<option value="Todas">Todas as ' + zonas.length + ' zonas</option>' +
          zonas.map(function (z) { return '<option value="' + esc(z) + '">📍 ' + esc(z) + '</option>'; }).join('');

        var grupos = Array.from(new Set(lista.map(function (p) { return p.grupo; }))).sort();
        document.getElementById('pl-grupo').innerHTML = '<option value="Todos">Todos os grupos</option>' +
          grupos.map(function (g) { return '<option value="' + esc(g) + '">Grupo ' + esc(g) + '</option>'; }).join('');

        atualizarStatsTopo();
        aplicarFiltros();
      })
      .catch(function (err) {
        document.getElementById('pl-container').innerHTML = '<div class="card pl-empty">Erro ao carregar plaquinhas: ' + esc(err.message) + '</div>';
      });

    document.querySelectorAll('.pl-chip-classe').forEach(function (b) {
      b.onclick = function () {
        state.classe = b.getAttribute('data-classe');
        document.querySelectorAll('.pl-chip-classe').forEach(function (x) { x.classList.toggle('ativo', x === b); });
        aplicarFiltros();
      };
    });

    document.querySelectorAll('.pl-visao-btn').forEach(function (b) {
      b.onclick = function () {
        state.visao = b.getAttribute('data-visao');
        document.querySelectorAll('.pl-visao-btn').forEach(function (x) { x.classList.toggle('ativo', x === b); });
        renderLista();
      };
    });

    document.getElementById('pl-busca').oninput = function (e) { state.busca = e.target.value; aplicarFiltros(); };
    document.getElementById('pl-zona').onchange = function (e) { state.zona = e.target.value; aplicarFiltros(); };
    document.getElementById('pl-grupo').onchange = function (e) { state.grupo = e.target.value; aplicarFiltros(); };
    document.getElementById('pl-status').onchange = function (e) { state.status = e.target.value; aplicarFiltros(); };
    document.getElementById('pl-ordem').onchange = function (e) { state.ordem = e.target.value; aplicarFiltros(); };
    document.getElementById('pl-btn-limpar').onclick = limparFiltros;

    document.getElementById('pl-btn-random').onclick = function () {
      var base = state.filtradas.length ? state.filtradas : state.todas;
      if (!base.length) return;
      var escolhida = base[Math.floor(Math.random() * base.length)];
      abrirPrevia(escolhida);
    };
  });
})();