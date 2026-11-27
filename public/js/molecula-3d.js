(function () {
  var urlTxt = decodeURIComponent(window.location.pathname + ' ' + window.location.search);
  var m = urlTxt.match(/INF-G\d{2}-P\d+/i);
  if (!m) return;
  var codAtual = m[0].toUpperCase();

  function normFormula(f) {
    var mapa = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
    return String(f || '').replace(/[₀-₉]/g, function (c) { return mapa[c]; }).replace(/\s+/g, '');
  }

  // Geometrias 3D XYZ integradas para carregamento instantaneo (inclusive cristais/sais/oxidos)
  var XYZ_LOCAL = {
    'H2O': '3\nAgua\nO 0.000 0.000 0.117\nH 0.000 0.757 -0.469\nH 0.000 -0.757 -0.469',
    'CO2': '3\nDioxido de carbono\nC 0.000 0.000 0.000\nO 1.160 0.000 0.000\nO -1.160 0.000 0.000',
    'H2SO4': '7\nAcido sulfurico\nS 0.000 0.000 0.150\nO 0.000 1.240 0.850\nO 0.000 -1.240 0.850\nO 1.240 0.000 -0.820\nO -1.240 0.000 -0.820\nH 1.980 0.000 -0.220\nH -1.980 0.000 -0.220',
    'NaOH': '3\nHidroxido de sodio\nNa -1.850 0.000 0.000\nO 0.000 0.000 0.000\nH 0.960 0.000 0.000',
    'Ca(OH)2': '5\nHidroxido de calcio\nCa 0.000 0.000 0.000\nO 2.100 0.000 0.000\nH 3.060 0.000 0.000\nO -2.100 0.000 0.000\nH -3.060 0.000 0.000',
    'NH4OH': '7\nHidroxido de amonio\nN -1.200 0.000 0.000\nH -1.550 0.950 0.000\nH -1.550 -0.480 0.820\nH -1.550 -0.480 -0.820\nH -0.180 0.000 0.000\nO 1.450 0.000 0.000\nH 2.410 0.000 0.000',
    'NaCl': '8\nCloreto de sodio\nNa 0.0 0.0 0.0\nCl 2.2 0.0 0.0\nCl 0.0 2.2 0.0\nNa 2.2 2.2 0.0\nCl 0.0 0.0 2.2\nNa 2.2 0.0 2.2\nNa 0.0 2.2 2.2\nCl 2.2 2.2 2.2',
    'NaClO': '3\nHipoclorito de sodio\nNa -2.100 0.000 0.000\nO 0.000 0.450 0.000\nCl 1.680 0.000 0.000',
    'CaCO3': '5\nCarbonato de calcio\nC 0.000 0.000 0.000\nO 1.280 0.000 0.000\nO -0.640 1.110 0.000\nO -0.640 -1.110 0.000\nCa -2.600 0.000 0.000',
    'NaHCO3': '6\nBicarbonato de sodio\nC 0.000 0.000 0.000\nO 1.250 0.250 0.000\nO -0.550 1.150 0.000\nO -0.750 -1.120 0.000\nH -1.680 -0.860 0.000\nNa 2.850 0.000 0.000',
    'BaSO4': '6\nSulfato de bario\nS 0.000 0.000 0.000\nO 1.200 0.850 0.000\nO 1.200 -0.850 0.000\nO -0.850 0.000 1.200\nO -0.850 0.000 -1.200\nBa -2.950 0.000 0.000',
    'SiO2': '5\nDioxido de silicio\nSi 0.000 0.000 0.000\nO 1.320 0.930 0.000\nO -1.320 0.930 0.000\nO 0.000 -0.930 1.320\nO 0.000 -0.930 -1.320',
    'TiO2': '3\nDioxido de titanio\nTi 0.000 0.000 0.000\nO 1.620 0.450 0.000\nO -1.620 0.450 0.000',
    'Cr2O3': '5\nOxido de cromo III\nCr -1.450 0.000 0.000\nCr 1.450 0.000 0.000\nO 0.000 0.950 0.000\nO -2.750 -0.650 0.000\nO 2.750 -0.650 0.000',
    'Fe2O3': '5\nOxido de ferro III\nFe -1.500 0.000 0.000\nFe 1.500 0.000 0.000\nO 0.000 0.920 0.000\nO -2.800 -0.650 0.000\nO 2.800 -0.650 0.000',
    'Al2O3': '5\nOxido de aluminio\nAl -1.450 0.000 0.000\nAl 1.450 0.000 0.000\nO 0.000 0.850 0.000\nO -2.750 -0.550 0.000\nO 2.750 -0.550 0.000',
    'CaO': '2\nOxido de calcio\nCa -0.950 0.000 0.000\nO 0.950 0.000 0.000',
    'ZnO': '2\nOxido de zinco\nZn -0.920 0.000 0.000\nO 0.920 0.000 0.000',
    'HCl': '2\nAcido cloridrico\nCl -0.450 0.000 0.000\nH 0.830 0.000 0.000',
    'Mg(OH)2': '5\nHidroxido de magnesio\nMg 0.000 0.000 0.000\nO 1.920 0.000 0.000\nH 2.880 0.000 0.000\nO -1.920 0.000 0.000\nH -2.880 0.000 0.000'
  };

  var PUBCHEM_CID = {
    'C6H8O7': 311, 'CH3COOH': 176, 'C2H4O2': 176, 'H3PO4': 1004, 'C2H5OH': 702,
    'H2CO3': 767, 'C3H6O3': 612, 'C6H8O6': 54670067, 'H2O2': 784, 'NH3': 222,
    'Na2CO3': 10340, 'CaSO4': 24497, 'KCl': 4873, 'NaF': 5235, 'CuSO4': 24462
  };

  var CORES_CPK = {
    H: ['#ffffff', 'Hidrogênio'], C: ['#9ca3af', 'Carbono'], N: ['#3b82f6', 'Nitrogênio'],
    O: ['#ef4444', 'Oxigênio'], Na: ['#a855f7', 'Sódio'], Mg: ['#22c55e', 'Magnésio'],
    Al: ['#cbd5e1', 'Alumínio'], Si: ['#eab308', 'Silício'], P: ['#f97316', 'Fósforo'],
    S: ['#facc15', 'Enxofre'], Cl: ['#10b981', 'Cloro'], K: ['#8b5cf6', 'Potássio'],
    Ca: ['#38bdf8', 'Cálcio'], Ti: ['#94a3b8', 'Titânio'], Cr: ['#60a5fa', 'Cromo'],
    Fe: ['#ea580c', 'Ferro'], Cu: ['#d97706', 'Cobre'], Zn: ['#818cf8', 'Zinco'],
    Ba: ['#34d399', 'Bário'], F: ['#a3e635', 'Flúor']
  };

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

  function obterModelo(formulaLimpa) {
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
    if (XYZ_LOCAL[formulaLimpa]) {
      return Promise.resolve({ formato: 'xyz', dados: XYZ_LOCAL[formulaLimpa] });
    }
    return fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/' + encodeURIComponent(formulaLimpa) + '/SDF?record_type=3d')
      .then(function (r) { if (!r.ok) throw new Error('no3d'); return r.text(); })
      .then(function (txt) { return { formato: 'sdf', dados: txt }; })
      .catch(function () {
        return fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + encodeURIComponent(formulaLimpa) + '/SDF')
          .then(function (r) { if (!r.ok) throw new Error('no2d'); return r.text(); })
          .then(function (txt) { return { formato: 'sdf', dados: txt }; });
      });
  }

  fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
    var sub = null;
    dados.forEach(function (s) {
      (s.ocorrencias || []).forEach(function (o) {
        if (String(o.codigo).toUpperCase() === codAtual) sub = s;
      });
    });
    if (!sub) return;

    var formulaLimpa = normFormula(sub.formula);
    var elementos = Array.from(new Set((formulaLimpa.match(/[A-Z][a-z]?/g) || [])));

    var sec = document.createElement('section');
    sec.id = 'atq-mol3d-sec';
    sec.className = 'atq-glow-card';
    sec.style.cssText = 'max-width:960px;margin:22px auto;padding:18px;border-radius:16px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;';

    var legendaHtml = elementos.map(function (el) {
      var info = CORES_CPK[el] || ['#c084fc', el];
      return '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(192,132,252,0.12);border:1px solid rgba(200,162,77,0.35);font-size:12px;">' +
        '<span style="width:10px;height:10px;border-radius:50%;background:' + info[0] + ';border:1px solid rgba(0,0,0,0.3);"></span>' +
        '<strong>' + el + '</strong> ' + info[1] + '</span>';
    }).join('');

    sec.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<div>' +
          '<div style="font-size:11px;font-weight:800;letter-spacing:0.08em;color:#f5d37a;">ESTRUTURA INTERATIVA EM 3D</div>' +
          '<h3 style="margin:2px 0 0;font-size:20px;font-family:\'Playfair Display\',serif;">🧬 Molécula de ' + sub.nomeIupac + ' (' + sub.formula + ')</h3>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button type="button" id="mol-st-bs" class="btn ativo" style="padding:6px 10px;font-size:12px;">Esferas &amp; Ligações</button>' +
          '<button type="button" id="mol-st-sp" class="btn" style="padding:6px 10px;font-size:12px;">Nuvem (Espaço)</button>' +
          '<button type="button" id="mol-spin" class="btn ativo" style="padding:6px 10px;font-size:12px;">🔄 Girar</button>' +
        '</div>' +
      '</div>' +
      '<div id="atq-mol-viewport" style="position:relative;width:100%;height:340px;border-radius:14px;overflow:hidden;background:radial-gradient(circle at center,#1d1036,#090412);border:1px solid rgba(200,162,77,0.4);">' +
        '<div id="atq-mol-loading" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#d8ccf0;font-size:13px;">Montando modelo 3D da molécula...</div>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;">' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + legendaHtml + '</div>' +
        '<span style="font-size:11px;opacity:0.78;">Arraste com o dedo/mouse para girar • Pinça/scroll para zoom</span>' +
      '</div>';

    var guia = document.getElementById('atq-guia-voz');
    var alvo = document.querySelector('main') || document.body;
    if (guia && guia.parentNode) guia.parentNode.insertBefore(sec, guia);
    else alvo.appendChild(sec);

    Promise.all([carregar3Dmol(), obterModelo(formulaLimpa)]).then(function (res) {
      var modelo = res[1];
      var vp = document.getElementById('atq-mol-viewport');
      var ld = document.getElementById('atq-mol-loading');
      if (ld) ld.remove();

      var viewer = window.$3Dmol.createViewer(vp, { backgroundColor: '#0e071d' });
      viewer.addModel(modelo.dados, modelo.formato);

      var girando = true;
      function aplicarEstilo(tipo) {
        if (tipo === 'space') {
          viewer.setStyle({}, { sphere: { scale: 0.72, colorscheme: 'Jmol' } });
        } else {
          viewer.setStyle({}, { stick: { radius: 0.18, colorscheme: 'Jmol' }, sphere: { scale: 0.34, colorscheme: 'Jmol' } });
        }
        viewer.render();
      }

      aplicarEstilo('bs');
      viewer.zoomTo();
      viewer.spin('y', 0.7);
      viewer.render();

      document.getElementById('mol-st-bs').onclick = function () {
        this.classList.add('ativo');
        document.getElementById('mol-st-sp').classList.remove('ativo');
        aplicarEstilo('bs');
      };
      document.getElementById('mol-st-sp').onclick = function () {
        this.classList.add('ativo');
        document.getElementById('mol-st-bs').classList.remove('ativo');
        aplicarEstilo('space');
      };
      document.getElementById('mol-spin').onclick = function () {
        girando = !girando;
        this.classList.toggle('ativo', girando);
        viewer.spin(girando ? 'y' : false, 0.7);
      };
    }).catch(function () {
      var ld = document.getElementById('atq-mol-loading');
      if (ld) ld.innerHTML = 'Modelo 3D indisponível offline para <strong>' + sub.formula + '</strong>.';
    });
  }).catch(function () {});
})();