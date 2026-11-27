(function () {
  var CORES = {
    'Ácido': { hex: '#ef4444', soft: 'rgba(239,68,68,0.16)', icone: '🔴' },
    'Base':  { hex: '#2563eb', soft: 'rgba(37,99,235,0.16)', icone: '🔵' },
    'Sal':   { hex: '#16a34a', soft: 'rgba(22,163,74,0.16)', icone: '🟢' },
    'Óxido': { hex: '#d97706', soft: 'rgba(217,119,6,0.16)', icone: '🟠' }
  };

  var MASSAS = {
    H: [1.008, 'Hidrogênio', '#ffffff'], C: [12.011, 'Carbono', '#9ca3af'], N: [14.007, 'Nitrogênio', '#3b82f6'],
    O: [15.999, 'Oxigênio', '#ef4444'], F: [18.998, 'Flúor', '#a3e635'], Na: [22.99, 'Sódio', '#a855f7'],
    Mg: [24.305, 'Magnésio', '#22c55e'], Al: [26.982, 'Alumínio', '#cbd5e1'], Si: [28.085, 'Silício', '#eab308'],
    P: [30.974, 'Fósforo', '#f97316'], S: [32.06, 'Enxofre', '#facc15'], Cl: [35.45, 'Cloro', '#10b981'],
    K: [39.098, 'Potássio', '#8b5cf6'], Ca: [40.078, 'Cálcio', '#38bdf8'], Ti: [47.867, 'Titânio', '#94a3b8'],
    Cr: [51.996, 'Cromo', '#60a5fa'], Mn: [54.938, 'Manganês', '#f472b6'], Fe: [55.845, 'Ferro', '#ea580c'],
    Cu: [63.546, 'Cobre', '#d97706'], Zn: [65.38, 'Zinco', '#818cf8'], Ba: [137.33, 'Bário', '#34d399'],
    Pb: [207.2, 'Chumbo', '#64748b']
  };

  var XYZ_LOCAL = {
    'H2O': '3\nAgua\nO 0.000 0.000 0.117\nH 0.000 0.757 -0.469\nH 0.000 -0.757 -0.469',
    'CO2': '3\nCO2\nC 0.000 0.000 0.000\nO 1.160 0.000 0.000\nO -1.160 0.000 0.000',
    'H2SO4': '7\nH2SO4\nS 0.000 0.000 0.150\nO 0.000 1.240 0.850\nO 0.000 -1.240 0.850\nO 1.240 0.000 -0.820\nO -1.240 0.000 -0.820\nH 1.980 0.000 -0.220\nH -1.980 0.000 -0.220',
    'NaOH': '3\nNaOH\nNa -1.850 0.000 0.000\nO 0.000 0.000 0.000\nH 0.960 0.000 0.000',
    'Ca(OH)2': '5\nCa(OH)2\nCa 0.000 0.000 0.000\nO 2.100 0.000 0.000\nH 3.060 0.000 0.000\nO -2.100 0.000 0.000\nH -3.060 0.000 0.000',
    'NH4OH': '7\nNH4OH\nN -1.200 0.000 0.000\nH -1.550 0.950 0.000\nH -1.550 -0.480 0.820\nH -1.550 -0.480 -0.820\nH -0.180 0.000 0.000\nO 1.450 0.000 0.000\nH 2.410 0.000 0.000',
    'NaCl': '8\nNaCl\nNa 0.0 0.0 0.0\nCl 2.2 0.0 0.0\nCl 0.0 2.2 0.0\nNa 2.2 2.2 0.0\nCl 0.0 0.0 2.2\nNa 2.2 0.0 2.2\nNa 0.0 2.2 2.2\nCl 2.2 2.2 2.2',
    'NaClO': '3\nNaClO\nNa -2.100 0.000 0.000\nO 0.000 0.450 0.000\nCl 1.680 0.000 0.000',
    'CaCO3': '5\nCaCO3\nC 0.000 0.000 0.000\nO 1.280 0.000 0.000\nO -0.640 1.110 0.000\nO -0.640 -1.110 0.000\nCa -2.600 0.000 0.000',
    'NaHCO3': '6\nNaHCO3\nC 0.000 0.000 0.000\nO 1.250 0.250 0.000\nO -0.550 1.150 0.000\nO -0.750 -1.120 0.000\nH -1.680 -0.860 0.000\nNa 2.850 0.000 0.000',
    'BaSO4': '6\nBaSO4\nS 0.000 0.000 0.000\nO 1.200 0.850 0.000\nO 1.200 -0.850 0.000\nO -0.850 0.000 1.200\nO -0.850 0.000 -1.200\nBa -2.950 0.000 0.000',
    'SiO2': '5\nSiO2\nSi 0.000 0.000 0.000\nO 1.320 0.930 0.000\nO -1.320 0.930 0.000\nO 0.000 -0.930 1.320\nO 0.000 -0.930 -1.320',
    'TiO2': '3\nTiO2\nTi 0.000 0.000 0.000\nO 1.620 0.450 0.000\nO -1.620 0.450 0.000',
    'Cr2O3': '5\nCr2O3\nCr -1.450 0.000 0.000\nCr 1.450 0.000 0.000\nO 0.000 0.950 0.000\nO -2.750 -0.650 0.000\nO 2.750 -0.650 0.000',
    'Fe2O3': '5\nFe2O3\nFe -1.500 0.000 0.000\nFe 1.500 0.000 0.000\nO 0.000 0.920 0.000\nO -2.800 -0.650 0.000\nO 2.800 -0.650 0.000',
    'Al2O3': '5\nAl2O3\nAl -1.450 0.000 0.000\nAl 1.450 0.000 0.000\nO 0.000 0.850 0.000\nO -2.750 -0.550 0.000\nO 2.750 -0.550 0.000',
    'CaO': '2\nCaO\nCa -0.950 0.000 0.000\nO 0.950 0.000 0.000',
    'ZnO': '2\nZnO\nZn -0.920 0.000 0.000\nO 0.920 0.000 0.000',
    'HCl': '2\nHCl\nCl -0.450 0.000 0.000\nH 0.830 0.000 0.000',
    'Mg(OH)2': '5\nMg(OH)2\nMg 0.000 0.000 0.000\nO 1.920 0.000 0.000\nH 2.880 0.000 0.000\nO -1.920 0.000 0.000\nH -2.880 0.000 0.000'
  };

  var PUBCHEM_CID = {
    'C6H8O7': 311, 'CH3COOH': 176, 'C2H4O2': 176, 'H3PO4': 1004, 'C2H5OH': 702,
    'H2CO3': 767, 'C3H6O3': 612, 'C6H8O6': 54670067, 'H2O2': 784, 'NH3': 222,
    'Na2CO3': 10340, 'CaSO4': 24497, 'KCl': 4873, 'NaF': 5235, 'CuSO4': 24462
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function normFormula(f) {
    var mapa = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
    return String(f || '').replace(/[₀-₉]/g, function (c) { return mapa[c]; }).replace(/\s+/g, '');
  }

  function contarAtomos(formulaStr) {
    var f = normFormula(formulaStr).replace(/[^A-Za-z0-9()\[\]]/g, '').replace(/\[/g, '(').replace(/\]/g, ')');
    var stack = [{}], i = 0;
    while (i < f.length) {
      if (f[i] === '(') { stack.push({}); i++; }
      else if (f[i] === ')') {
        i++;
        var num = '';
        while (i < f.length && /\d/.test(f[i])) num += f[i++];
        var mult = num ? parseInt(num, 10) : 1;
        var grp = stack.pop() || {}, top = stack[stack.length - 1] || {};
        Object.keys(grp).forEach(function (k) { top[k] = (top[k] || 0) + grp[k] * mult; });
      } else if (/[A-Z]/.test(f[i])) {
        var sym = f[i++];
        if (i < f.length && /[a-z]/.test(f[i])) sym += f[i++];
        var n = '';
        while (i < f.length && /\d/.test(f[i])) n += f[i++];
        var q = n ? parseInt(n, 10) : 1;
        var cur = stack[stack.length - 1];
        cur[sym] = (cur[sym] || 0) + q;
      } else { i++; }
    }
    return stack[0] || {};
  }

  function calcularMassa(formula) {
    var atomos = contarAtomos(formula);
    var total = 0, itens = [];
    Object.keys(atomos).forEach(function (sym) {
      var info = MASSAS[sym];
      if (!info) return;
      var sub = info[0] * atomos[sym];
      total += sub;
      itens.push({ sym: sym, nome: info[1], cor: info[2], qtd: atomos[sym], sub: sub });
    });
    return { total: total, itens: itens };
  }

  function classificarPh(ph) {
    if (ph < 6.5) return { txt: 'Meio Ácido', cor: '#ef4444' };
    if (ph <= 7.5) return { txt: 'Meio Neutro', cor: '#16a34a' };
    return { txt: 'Meio Básico (Alcalino)', cor: '#2563eb' };
  }

  function embaralhar(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function carregar3Dmol() {
    if (window.$3Dmol) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://3dmol.org/build/3Dmol-min.js';
      s.onload = resolve;
      s.onerror = function () {
        var s2 = document.createElement('script');
        s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.4/3Dmol-min.js';
        s2.onload = resolve;
        s2.onerror = reject;
        document.head.appendChild(s2);
      };
      document.head.appendChild(s);
    });
  }

  function obterModelo3D(formulaLimpa) {
    var cid = PUBCHEM_CID[formulaLimpa];
    if (cid) {
      return fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/' + cid + '/SDF?record_type=3d')
        .then(function (r) { if (!r.ok) throw new Error('no3d'); return r.text(); })
        .then(function (txt) { return { formato: 'sdf', dados: txt }; })
        .catch(function () {
          if (XYZ_LOCAL[formulaLimpa]) return { formato: 'xyz', dados: XYZ_LOCAL[formulaLimpa] };
          return fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/' + cid + '/SDF')
            .then(function (r) { if (!r.ok) throw new Error('no2d'); return r.text(); })
            .then(function (txt) { return { formato: 'sdf', dados: txt }; });
        });
    }
    if (XYZ_LOCAL[formulaLimpa]) return Promise.resolve({ formato: 'xyz', dados: XYZ_LOCAL[formulaLimpa] });
    return fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/' + encodeURIComponent(formulaLimpa) + '/SDF?record_type=3d')
      .then(function (r) { if (!r.ok) throw new Error('no3d'); return r.text(); })
      .then(function (txt) { return { formato: 'sdf', dados: txt }; });
  }

  function encontrarPlaquinha(dados) {
    var path = decodeURIComponent(window.location.pathname || '');
    var qs = new URLSearchParams(window.location.search || '');
    var todas = [];
    dados.forEach(function (s) {
      (s.ocorrencias || []).forEach(function (o) {
        todas.push({ sub: s, oc: o });
      });
    });
    todas.sort(function (a, b) { return String(a.oc.codigo).localeCompare(String(b.oc.codigo)); });

    // 1. Buscar por codigo INF-GXX-PX na URL ou query
    var mCod = (path + ' ' + window.location.search).match(/INF-G\d{2}-P\d+/i);
    if (mCod) {
      var cod = mCod[0].toUpperCase();
      var idx = todas.findIndex(function (x) { return String(x.oc.codigo).toUpperCase() === cod; });
      if (idx !== -1) return { atual: todas[idx], idx: idx, todas: todas };
    }

    // 2. Buscar por slug (/substancia/slug ou ?slug=...)
    var slugParam = qs.get('slug') || qs.get('s') || (path.indexOf('/substancia/') === 0 ? path.replace('/substancia/', '').replace(/\/$/, '') : '');
    if (slugParam) {
      var idxS = todas.findIndex(function (x) { return String(x.sub.slug).toLowerCase() === slugParam.toLowerCase(); });
      if (idxS !== -1) return { atual: todas[idxS], idx: idxS, todas: todas };
    }

    return { atual: todas[0], idx: 0, todas: todas };
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('sub-pro-root');
    if (!root) return;

    fetch('/api/extras-dados')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (dados) {
        var found = encontrarPlaquinha(dados);
        if (!found.atual) {
          root.innerHTML = '<div class="sub-card" style="text-align:center;padding:32px;">Plaquinha não encontrada. <a href="/">Voltar ao início</a></div>';
          return;
        }

        var sub = found.atual.sub;
        var oc = found.atual.oc;
        var todas = found.todas;
        var idxAtual = found.idx;
        var ant = todas[(idxAtual - 1 + todas.length) % todas.length];
        var prox = todas[(idxAtual + 1) % todas.length];

        document.title = oc.codigo + ' · ' + sub.nomeIupac + ' — AQUI TEM QUÍMICA!';

        var cor = CORES[sub.classe] || { hex: '#c89b3c', soft: 'rgba(200,155,60,0.16)', icone: '🧪' };
        var ph = typeof sub.phEstimado === 'number' ? sub.phEstimado : 7.0;
        var phPct = Math.max(2, Math.min(98, (ph / 14) * 100));
        var phInfo = classificarPh(ph);
        var populares = Array.isArray(sub.nomesPopulares) && sub.nomesPopulares.length ? sub.nomesPopulares.join(' · ') : '';
        var foto = oc.fotoPlaquinha || sub.fotoPlaquinha || '';
        var gmapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + oc.lat + ',' + oc.lng + '&travelmode=walking';
        var formulaLimpa = normFormula(sub.formula);
        var massa = calcularMassa(sub.formula);

        var outrasOcorrencias = (sub.ocorrencias || []).filter(function (o) { return o.codigo !== oc.codigo; });
        var vizinhas = todas.filter(function (x) { return x.oc.zona === oc.zona && x.oc.codigo !== oc.codigo; });

        var segurancaTxt = sub.cuidadosSeguranca || sub.seguranca || sub.riscos ||
          (ph < 3 || ph > 11
            ? 'Substância corrosiva/irritante: mantenha distância segura, nunca faça misturas domésticas e observe apenas visualmente.'
            : 'Projeto estritamente observacional e educativo: não toque, não abra embalagens e nunca misture produtos de limpeza.');

        var equacaoHtml = sub.equacao
          ? '<div class="sub-info-box sub-anim-in"><div class="sub-kicker">⚗️ EQUAÇÃO QUÍMICA</div><div class="sub-eq">' + esc(sub.equacao) + '</div></div>'
          : '';

        var massaBarrasHtml = massa.itens.map(function (it) {
          var pct = massa.total > 0 ? (it.sub / massa.total) * 100 : 0;
          return '<div class="sub-bar-row">' +
            '<div class="sub-bar-lbl"><span><span class="sub-atom-dot" style="background:' + it.cor + ';"></span><strong>' + it.sym + '</strong> (' + it.nome + ') × ' + it.qtd + '</span><strong>' + pct.toFixed(1) + '%</strong></div>' +
            '<div class="sub-bar-track"><div class="sub-bar-fill" style="width:' + pct.toFixed(1) + '%;"></div></div>' +
          '</div>';
        }).join('');

        var fotoHtml = foto
          ? '<div class="sub-photo-wrap"><img src="' + esc(foto) + '" alt="Plaquinha ' + esc(oc.codigo) + ' em ' + esc(oc.zona) + '" loading="lazy" onerror="this.parentElement.style.display=\'none\'"></div>'
          : '';

        var outrasOcHtml = outrasOcorrencias.length
          ? '<div class="sub-info-box"><div class="sub-kicker">🔁 OUTROS PONTOS DESTA MESMA SUBSTÂNCIA</div><div class="sub-chip-row">' +
              outrasOcorrencias.map(function (o) {
                return '<a class="sub-mini-link" href="/plaquinha/' + encodeURIComponent(o.codigo) + '">' + esc(o.codigo) + ' · ' + esc(o.zona) + '</a>';
              }).join('') +
            '</div></div>'
          : '';

        var vizinhasHtml = vizinhas.length
          ? vizinhas.map(function (v) {
              var vc = CORES[v.sub.classe] || cor;
              return '<div class="sub-near-card">' +
                '<a href="/plaquinha/' + encodeURIComponent(v.oc.codigo) + '" class="sub-near-main">' +
                  '<span class="sub-near-code" style="color:' + vc.hex + ';">' + esc(v.oc.codigo) + ' · ' + esc(v.sub.classe.toUpperCase()) + '</span>' +
                  '<strong>' + esc(v.sub.nomeIupac) + ' <span class="sub-mono">(' + esc(v.sub.formula) + ')</span></strong>' +
                  '<small>' + esc(v.oc.localExato) + '</small>' +
                '</a>' +
                '<a href="/mapa?guiar=' + encodeURIComponent(v.oc.codigo) + '" class="btn sub-near-gps">🧭 GPS</a>' +
              '</div>';
            }).join('')
          : '<p class="sub-muted">Esta é a única plaquinha cadastrada nesta zona.</p>';

        var autoresTxt = Array.isArray(sub.autores) && sub.autores.length ? sub.autores.join(', ') : ('Grupo ' + oc.grupo + ' · 1º Ano de Informática');
        var aut = oc.autorizacao || {};

        root.innerHTML =
          '<div class="sub-breadcrumb">' +
            '<a href="/">← Catálogo</a>' +
            '<span>·</span>' +
            '<a href="/mapa">Mapa do CEFET</a>' +
            '<span>·</span>' +
            '<span>' + esc(oc.zona) + '</span>' +
          '</div>' +

          '<section class="sub-hero sub-card sub-anim-in">' +
            '<div class="sub-hero-top">' +
              '<span class="sub-badge" style="color:' + cor.hex + ';background:' + cor.soft + ';border-color:' + cor.hex + ';">' + cor.icone + ' ' + esc(sub.classe.toUpperCase()) + (sub.subtipo ? ' · ' + esc(sub.subtipo) : '') + '</span>' +
              '<span class="sub-code-pill">' + esc(oc.codigo) + '</span>' +
              '<span class="sub-ph-pill" style="border-color:' + phInfo.cor + ';">pH ≈ ' + ph.toFixed(1) + '</span>' +
            '</div>' +
            '<div class="sub-hero-main">' +
              '<div class="sub-hero-text">' +
                '<h1 class="sub-title">' + esc(sub.nomeIupac) + '</h1>' +
                (populares ? '<p class="sub-pop">Também conhecida como: ' + esc(populares) + '</p>' : '') +
                '<p class="sub-loc-line">📍 <strong>' + esc(oc.zona) + '</strong> — ' + esc(oc.localExato) + '</p>' +
              '</div>' +
              '<div class="sub-formula-box" aria-label="Fórmula química">' +
                '<span class="sub-formula-lbl">FÓRMULA</span>' +
                '<div class="sub-formula-val">' + (sub.formulaHtml || esc(sub.formula)) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="sub-actions">' +
              '<button type="button" id="sub-btn-audio" class="btn btn-primary">🔊 Ouvir ficha</button>' +
              '<a href="/mapa?guiar=' + encodeURIComponent(oc.codigo) + '" class="btn">🧭 Ir com GPS</a>' +
              '<button type="button" id="sub-btn-ia" class="btn">🤖 Perguntar à IA</button>' +
              '<button type="button" id="sub-btn-share" class="btn">🔗 Compartilhar</button>' +
            '</div>' +
          '</section>' +

          '<div class="sub-tabs-wrap" role="tablist" aria-label="Seções da substância">' +
            '<button type="button" class="sub-tab ativo" role="tab" aria-selected="true" data-tab="resumo">📖 Resumo</button>' +
            '<button type="button" class="sub-tab" role="tab" aria-selected="false" data-tab="mol3d">🧬 Molécula 3D</button>' +
            '<button type="button" class="sub-tab" role="tab" aria-selected="false" data-tab="local">📍 Local &amp; Próximas (' + vizinhas.length + ')</button>' +
            '<button type="button" class="sub-tab" role="tab" aria-selected="false" data-tab="desafio">⚡ Desafio &amp; Equipe</button>' +
          '</div>' +

          '<div class="sub-panels">' +
            // PAINEL 1: RESUMO CLEAN
            '<section class="sub-panel ativo" id="panel-resumo">' +
              '<div class="sub-grid-2">' +
                '<div class="sub-info-box sub-card">' +
                  '<div class="sub-kicker">🔬 POR QUE ESTÁ AQUI?</div>' +
                  '<p class="sub-body">' + esc(sub.porQueEstaAqui) + '</p>' +
                '</div>' +
                '<div class="sub-info-box sub-card">' +
                  '<div class="sub-kicker">📚 CLASSIFICAÇÃO QUÍMICA</div>' +
                  '<p class="sub-body">' + esc(sub.justificativa) + '</p>' +
                '</div>' +
              '</div>' +

              '<div class="sub-info-box sub-card" style="margin-top:14px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px;">' +
                  '<div class="sub-kicker" style="margin:0;">🌈 POSIÇÃO NA ESCALA DE pH (0 A 14)</div>' +
                  '<strong style="font-size:12px;color:' + phInfo.cor + ';">pH ≈ ' + ph.toFixed(1) + ' · ' + phInfo.txt + '</strong>' +
                '</div>' +
                '<div class="sub-ph-bar">' +
                  '<div class="sub-ph-marker" id="sub-ph-marker" style="left:50%;" data-alvo="' + phPct.toFixed(1) + '"></div>' +
                '</div>' +
                '<div class="sub-ph-legend"><span>0 · Ácido forte</span><span>7 · Neutro</span><span>14 · Base forte</span></div>' +
              '</div>' +

              equacaoHtml +

              '<div class="sub-grid-2" style="margin-top:14px;">' +
                '<details class="sub-acc sub-card" open>' +
                  '<summary>💡 Curiosidade Científica</summary>' +
                  '<p class="sub-body">' + esc(sub.curiosidade) + '</p>' +
                '</details>' +
                '<details class="sub-acc sub-card sub-warn" open>' +
                  '<summary>⚠️ Segurança e Boas Práticas</summary>' +
                  '<p class="sub-body">' + esc(segurancaTxt) + '</p>' +
                '</details>' +
              '</div>' +
            '</section>' +

            // PAINEL 2: MOLECULA 3D + MASSA MOLAR
            '<section class="sub-panel" id="panel-mol3d">' +
              '<div class="sub-card sub-info-box">' +
                '<div class="sub-mol-head">' +
                  '<div><div class="sub-kicker">🧬 VISUALIZADOR MOLECULAR INTERATIVO</div><h2 class="sub-h2">' + esc(sub.nomeIupac) + ' (' + esc(sub.formula) + ')</h2></div>' +
                  '<div class="sub-mol-ctrls">' +
                    '<button type="button" id="s-mol-bs" class="btn ativo">Esferas</button>' +
                    '<button type="button" id="s-mol-sp" class="btn">Nuvem</button>' +
                    '<button type="button" id="s-mol-spin" class="btn ativo">🔄 Girar</button>' +
                    '<button type="button" id="s-mol-lock" class="btn">🔓 Toque Livre</button>' +
                  '</div>' +
                '</div>' +
                '<div class="sub-mol-stage">' +
                  '<div id="sub-mol-viewport"></div>' +
                  '<div id="sub-mol-shield" class="sub-mol-shield" style="display:none;">Toque bloqueado para facilitar rolagem no celular</div>' +
                  '<div id="sub-mol-loading" class="sub-mol-loading">Carregando estrutura 3D...</div>' +
                '</div>' +
                '<div class="sub-mol-tip">Arraste para girar a molécula · Pinça/scroll para zoom · No celular, clique em <strong>Travar Toque</strong> se quiser rolar a tela por cima do 3D.</div>' +
              '</div>' +

              '<div class="sub-card sub-info-box" style="margin-top:14px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:12px;">' +
                  '<div class="sub-kicker" style="margin:0;">⚖️ MASSA MOLAR &amp; COMPOSIÇÃO ATÔMICA</div>' +
                  '<strong class="sub-mono" style="font-size:20px;color:#c89b3c;">' + (massa.total > 0 ? massa.total.toFixed(2) + ' g/mol' : esc(sub.formula)) + '</strong>' +
                '</div>' +
                (massaBarrasHtml || '<p class="sub-muted">Composição atômica disponível na Tabela Periódica.</p>') +
                '<div style="margin-top:12px;"><a href="/tabela" class="btn">⚛️ Ver elementos na Tabela Periódica →</a></div>' +
              '</div>' +
            '</section>' +

            // PAINEL 3: LOCAL, GPS & PROXIMAS
            '<section class="sub-panel" id="panel-local">' +
              '<div class="sub-card sub-info-box">' +
                '<div class="sub-kicker">📍 LOCALIZAÇÃO NO CEFET-MG CAMPUS V</div>' +
                '<h2 class="sub-h2">' + esc(oc.zona) + '</h2>' +
                '<p class="sub-body" style="margin-bottom:12px;">' + esc(oc.localExato) + '</p>' +
                fotoHtml +
                '<div class="sub-chip-row" style="margin-top:12px;">' +
                  '<a href="/mapa?guiar=' + encodeURIComponent(oc.codigo) + '" class="btn btn-primary">🧭 Navegar com GPS ao Vivo</a>' +
                  '<a href="' + gmapsUrl + '" target="_blank" rel="noopener" class="btn">🗺️ Rota no Google Maps</a>' +
                  '<a href="/mapa" class="btn">🏛️ Abrir Maquete 3D</a>' +
                '</div>' +
                '<div class="sub-meta-row">' +
                  '<span>GPS: <code>' + Number(oc.lat).toFixed(5) + ', ' + Number(oc.lng).toFixed(5) + '</code></span>' +
                  '<span>Autorização: <strong>' + (aut.aprovada !== false ? '✅ Aprovada' : '⏳ Pendente') + '</strong>' + (aut.responsavel ? ' (' + esc(aut.responsavel) + ')' : '') + '</span>' +
                '</div>' +
              '</div>' +
              outrasOcHtml +
              '<div class="sub-card sub-info-box" style="margin-top:14px;">' +
                '<div class="sub-kicker">🧭 PERTO DE VOCÊ — OUTRAS PLAQUINHAS EM ' + esc(oc.zona.toUpperCase()) + '</div>' +
                '<div class="sub-near-grid">' + vizinhasHtml + '</div>' +
              '</div>' +
            '</section>' +

            // PAINEL 4: MINI-DESAFIO + EQUIPE
            '<section class="sub-panel" id="panel-desafio">' +
              '<div class="sub-card sub-info-box">' +
                '<div class="sub-kicker">⚡ DESAFIO RELÂMPAGO DESTA PLAQUINHA</div>' +
                '<div id="sub-quiz-area"></div>' +
              '</div>' +
              '<div class="sub-card sub-info-box" style="margin-top:14px;">' +
                '<div class="sub-kicker">👥 FICHA TÉCNICA &amp; AUTORIA</div>' +
                '<div class="sub-kv-grid">' +
                  '<div><small>Grupo responsável</small><strong>' + esc(oc.grupo) + '</strong></div>' +
                  '<div><small>Código oficial</small><strong class="sub-mono">' + esc(oc.codigo) + '</strong></div>' +
                  '<div><small>Autores</small><strong>' + esc(autoresTxt) + '</strong></div>' +
                  '<div><small>Turma</small><strong>1º Ano de Informática · CEFET-MG Divinópolis</strong></div>' +
                '</div>' +
              '</div>' +
            '</section>' +
          '</div>' +

          '<nav class="sub-pager" aria-label="Navegar entre plaquinhas">' +
            '<a class="sub-card sub-pager-btn" href="/plaquinha/' + encodeURIComponent(ant.oc.codigo) + '"><small>← Plaquinha anterior</small><strong>' + esc(ant.oc.codigo) + ' · ' + esc(ant.sub.nomeIupac) + '</strong></a>' +
            '<a class="sub-card sub-pager-btn sub-pager-r" href="/plaquinha/' + encodeURIComponent(prox.oc.codigo) + '"><small>Próxima plaquinha →</small><strong>' + esc(prox.oc.codigo) + ' · ' + esc(prox.sub.nomeIupac) + '</strong></a>' +
          '</nav>';

        // Animar marcador de pH
        setTimeout(function () {
          var mk = document.getElementById('sub-ph-marker');
          if (mk) mk.style.left = mk.getAttribute('data-alvo') + '%';
        }, 120);

        // Controle das Abas + carregamento sob demanda da Molecula 3D
        var molCarregada = false;
        var molViewer = null;
        var tabs = Array.from(root.querySelectorAll('.sub-tab'));
        tabs.forEach(function (t) {
          t.onclick = function () {
            var id = t.getAttribute('data-tab');
            tabs.forEach(function (x) {
              var on = x === t;
              x.classList.toggle('ativo', on);
              x.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            root.querySelectorAll('.sub-panel').forEach(function (p) {
              p.classList.toggle('ativo', p.id === 'panel-' + id);
            });
            if (id === 'mol3d' && !molCarregada) {
              molCarregada = true;
              iniciarMol3D();
            } else if (id === 'mol3d' && molViewer) {
              setTimeout(function () { molViewer.resize(); molViewer.render(); }, 60);
            }
          };
        });

        function iniciarMol3D() {
          var vp = document.getElementById('sub-mol-viewport');
          var ld = document.getElementById('sub-mol-loading');
          Promise.all([carregar3Dmol(), obterModelo3D(formulaLimpa)]).then(function (res) {
            if (ld) ld.style.display = 'none';
            var modelo = res[1];
            var claro = document.documentElement.getAttribute('data-tema') === 'claro';
            molViewer = window.$3Dmol.createViewer(vp, { backgroundColor: claro ? '#faf3e3' : '#0e071d' });
            molViewer.addModel(modelo.dados, modelo.formato);

            var girando = true;
            var travado = false;

            function estilo(tipo) {
              if (tipo === 'sp') molViewer.setStyle({}, { sphere: { scale: 0.72, colorscheme: 'Jmol' } });
              else molViewer.setStyle({}, { stick: { radius: 0.18, colorscheme: 'Jmol' }, sphere: { scale: 0.34, colorscheme: 'Jmol' } });
              molViewer.render();
            }
            estilo('bs');
            molViewer.zoomTo();
            molViewer.spin('y', 0.75);
            molViewer.render();

            document.getElementById('s-mol-bs').onclick = function () {
              this.classList.add('ativo'); document.getElementById('s-mol-sp').classList.remove('ativo'); estilo('bs');
            };
            document.getElementById('s-mol-sp').onclick = function () {
              this.classList.add('ativo'); document.getElementById('s-mol-bs').classList.remove('ativo'); estilo('sp');
            };
            document.getElementById('s-mol-spin').onclick = function () {
              girando = !girando; this.classList.toggle('ativo', girando); molViewer.spin(girando ? 'y' : false, 0.75);
            };
            document.getElementById('s-mol-lock').onclick = function () {
              travado = !travado;
              this.classList.toggle('ativo', travado);
              this.textContent = travado ? '🔒 Toque Travado' : '🔓 Toque Livre';
              document.getElementById('sub-mol-shield').style.display = travado ? 'flex' : 'none';
            };

            window.addEventListener('atq-tema-mudou', function (ev) {
              if (!molViewer) return;
              molViewer.setBackgroundColor(ev.detail && ev.detail.tema === 'claro' ? '#faf3e3' : '#0e071d');
              molViewer.render();
            });
          }).catch(function () {
            if (ld) ld.innerHTML = 'Visualização 3D indisponível offline para <strong>' + esc(sub.formula) + '</strong>.';
          });
        }

        // Botao Ouvir Ficha
        var btnAudio = document.getElementById('sub-btn-audio');
        var falando = false;
        btnAudio.onclick = function () {
          if (!('speechSynthesis' in window)) { alert('Seu navegador não suporta leitura em voz alta.'); return; }
          if (falando) {
            window.speechSynthesis.cancel();
            falando = false;
            btnAudio.textContent = '🔊 Ouvir ficha';
            return;
          }
          window.speechSynthesis.cancel();
          var texto = 'Plaquinha ' + oc.codigo + ', em ' + oc.zona + '. Substância: ' + sub.nomeIupac + ', função ' + sub.classe + '. ' +
            (sub.porQueEstaAqui || '') + ' Classificação: ' + (sub.justificativa || '') + ' Curiosidade: ' + (sub.curiosidade || '');
          var u = new SpeechSynthesisUtterance(texto);
          u.lang = 'pt-BR';
          u.onend = u.onerror = function () { falando = false; btnAudio.textContent = '🔊 Ouvir ficha'; };
          falando = true;
          btnAudio.textContent = '⏹ Parar áudio';
          window.speechSynthesis.speak(u);
        };

        // Botao Perguntar a IA
        document.getElementById('sub-btn-ia').onclick = function () {
          if (typeof window.abrirQuimicoBotIA === 'function') window.abrirQuimicoBotIA();
          else { var f = document.getElementById('qbot-ia-fab'); if (f) f.click(); }
        };

        // Botao Compartilhar
        var btnShare = document.getElementById('sub-btn-share');
        btnShare.onclick = function () {
          var payload = { title: oc.codigo + ' · ' + sub.nomeIupac, text: 'Veja a plaquinha ' + oc.codigo + ' (' + sub.nomeIupac + ') no projeto AQUI TEM QUÍMICA!', url: window.location.href };
          if (navigator.share) { navigator.share(payload).catch(function () {}); }
          else if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(function () {
              btnShare.textContent = '✅ Link copiado!';
              setTimeout(function () { btnShare.textContent = '🔗 Compartilhar'; }, 1800);
            });
          }
        };

        // Mini-Desafio da Plaquinha (2 perguntas)
        var formulasOutras = embaralhar(Array.from(new Set(dados.map(function (s) { return s.formula; }).filter(function (f) { return f !== sub.formula; })))).slice(0, 3);
        var perguntas = [
          {
            enunciado: 'A substância "' + sub.nomeIupac + '" (' + sub.formula + ') pertence a qual função inorgânica?',
            opcoes: embaralhar(['Ácido', 'Base', 'Sal', 'Óxido']),
            correta: sub.classe,
            exp: sub.justificativa
          },
          {
            enunciado: 'Qual fórmula representa corretamente "' + sub.nomeIupac + '"?',
            opcoes: embaralhar([sub.formula].concat(formulasOutras)),
            correta: sub.formula,
            exp: sub.nomeIupac + ' tem fórmula ' + sub.formula + ' e aparece em ' + oc.zona + '.'
          }
        ];

        var qIdx = 0, qPts = 0;
        function renderQuiz() {
          var box = document.getElementById('sub-quiz-area');
          if (qIdx >= perguntas.length) {
            box.innerHTML =
              '<div class="sub-quiz-end">' +
                '<div style="font-size:26px;font-weight:800;color:#16a34a;">' + qPts + '/' + perguntas.length + ' acertos!</div>' +
                '<p class="sub-body" style="margin:6px 0 12px;">' + (qPts === perguntas.length ? 'Excelente! Você dominou esta plaquinha.' : 'Boa revisão! Você pode tentar de novo quando quiser.') + '</p>' +
                '<button type="button" id="sub-q-retry" class="btn btn-primary">Jogar novamente</button>' +
              '</div>';
            document.getElementById('sub-q-retry').onclick = function () { qIdx = 0; qPts = 0; renderQuiz(); };
            return;
          }
          var q = perguntas[qIdx];
          box.innerHTML =
            '<div style="font-size:12px;opacity:0.78;margin-bottom:6px;">Pergunta ' + (qIdx + 1) + ' de ' + perguntas.length + '</div>' +
            '<div style="font-size:16px;font-weight:700;margin-bottom:12px;">' + esc(q.enunciado) + '</div>' +
            '<div class="sub-q-opts" id="sub-q-opts"></div>' +
            '<div id="sub-q-fb" style="margin-top:10px;"></div>';

          var optsEl = document.getElementById('sub-q-opts');
          var resp = false;
          q.opcoes.forEach(function (op) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn sub-q-opt';
            b.textContent = op;
            b.onclick = function () {
              if (resp) return;
              resp = true;
              var ok = op === q.correta;
              if (ok) qPts++;
              Array.from(optsEl.children).forEach(function (x) {
                if (x.textContent === q.correta) x.classList.add('sub-opt-ok');
                else if (x === b && !ok) x.classList.add('sub-opt-err');
              });
              document.getElementById('sub-q-fb').innerHTML =
                '<div class="sub-q-feedback">' +
                  '<strong>' + (ok ? '✅ Correto! ' : '❌ Resposta certa: ' + esc(q.correta) + '. ') + '</strong>' + esc(q.exp) +
                  '<div style="margin-top:10px;"><button type="button" id="sub-q-next" class="btn btn-primary">' + (qIdx + 1 < perguntas.length ? 'Próxima →' : 'Ver resultado') + '</button></div>' +
                '</div>';
              document.getElementById('sub-q-next').onclick = function () { qIdx++; renderQuiz(); };
            };
            optsEl.appendChild(b);
          });
        }
        renderQuiz();
      })
      .catch(function (err) {
        root.innerHTML = '<div class="sub-card" style="padding:24px;">Não foi possível carregar os dados desta plaquinha (' + esc(err.message) + '). <a href="/">Voltar ao início</a></div>';
      });
  });
})();