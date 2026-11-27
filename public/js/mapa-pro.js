(function () {
  var CAMPUS_CENTER = [-20.14542, -44.89118];
  var CORES = {
    'Ácido': { hex: '#ef4444', num: 0xef4444, bg: 'rgba(239,68,68,0.18)' },
    'Base':  { hex: '#3b82f6', num: 0x3b82f6, bg: 'rgba(59,130,246,0.18)' },
    'Sal':   { hex: '#22c55e', num: 0x22c55e, bg: 'rgba(34,197,94,0.18)' },
    'Óxido': { hex: '#f59e0b', num: 0xf59e0b, bg: 'rgba(245,158,11,0.18)' }
  };

  var ZONAS_3D = {
    'Portaria':                   { x: 0,   z: 24,  w: 12, d: 5,  h: 4.2, cor: 0x38bdf8, icone: '🚪', grupo: 'G05' },
    'Restaurante':                { x: -23, z: 18,  w: 16, d: 10, h: 5.0, cor: 0xf97316, icone: '🍽️', grupo: 'G01' },
    'Estacionamentos':            { x: 23,  z: 21,  w: 22, d: 12, h: 1.6, cor: 0x94a3b8, icone: '🚗', grupo: 'G08' },
    'Jardim':                     { x: 0,   z: 4,   w: 16, d: 14, h: 2.2, cor: 0x22c55e, icone: '🌿', grupo: 'G07' },
    'Corredores do prédio 1':     { x: -23, z: -1,  w: 18, d: 10, h: 9.2, cor: 0x60a5fa, icone: '🏫', grupo: 'G03' },
    'Corredores do prédio 6':     { x: 23,  z: 0,   w: 18, d: 10, h: 6.8, cor: 0xa78bfa, icone: '🏛️', grupo: 'G04' },
    'Banheiros do prédio 3':      { x: -2,  z: -16, w: 14, d: 8,  h: 6.0, cor: 0x2dd4bf, icone: '🚿', grupo: 'G02' },
    'Laboratório de informática': { x: 21,  z: -17, w: 18, d: 10, h: 7.4, cor: 0x06b6d4, icone: '💻', grupo: 'G06' },
    'Quadra':                     { x: -23, z: -19, w: 20, d: 13, h: 2.0, cor: 0x10b981, icone: '⚽', grupo: 'G09' }
  };

  var state = {
    raw: [],
    plaquinhas: [],
    filtradas: [],
    tab: '3d',
    classe: 'Todas',
    zona: 'Todas',
    busca: '',
    noite: false,
    tour: false,
    modoCoord: false,
    selecionada: null
  };

  // --- Variaveis 3D ---
  var scene, camera, renderer, raycaster, pointer;
  var pinMeshes = [], labelEls = [], lampLights = [], windowMats = [];
  var sunLight, hemiLight;
  var animId = null, hoveredPin = null, tourTimer = null, tourIndex = 0;
  var camCtrl = {
    theta: 0.62, phi: 0.92, radius: 66,
    tTheta: 0.62, tPhi: 0.92, tRadius: 66,
    look: null, tLook: null,
    drag: false, pan: false, lx: 0, ly: 0, downX: 0, downY: 0, pinchDist: 0
  };

  // --- Variaveis 2D ---
  var map2d = null, layerGroup2d = null, tileSat = null, tileRua = null, usandoSat = true;

  function corClasse(c) { return CORES[c] || { hex: '#38bdf8', num: 0x38bdf8, bg: 'rgba(56,189,248,0.18)' }; }

  function carregarDados() {
    return fetch('/api/extras-dados')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (dados) {
        state.raw = dados;
        var lista = [];
        dados.forEach(function (s) {
          (s.ocorrencias || []).forEach(function (o) {
            lista.push({
              codigo: o.codigo,
              zona: o.zona,
              localExato: o.localExato,
              grupo: o.grupo,
              lat: Number(o.lat) || CAMPUS_CENTER[0],
              lng: Number(o.lng) || CAMPUS_CENTER[1],
              autorizacao: o.autorizacao || { responsavel: 'Coordenação', data: '2026-11-27', aprovada: true },
              nomeIupac: s.nomeIupac,
              formula: s.formula,
              formulaHtml: s.formulaHtml || s.formula,
              classe: s.classe,
              subtipo: s.subtipo || '',
              phEstimado: s.phEstimado,
              porQueEstaAqui: s.porQueEstaAqui || '',
              curiosidade: s.curiosidade || '',
              autores: s.autores || [],
              fotoPlaquinha: o.fotoPlaquinha || s.fotoPlaquinha || ''
            });
          });
        });
        lista.sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });
        state.plaquinhas = lista;
        state.filtradas = lista.slice();
      });
  }

  function preencherSelects() {
    var selZona = document.getElementById('filtro-zona');
    var zonas = Object.keys(ZONAS_3D);
    state.plaquinhas.forEach(function (p) { if (zonas.indexOf(p.zona) === -1) zonas.push(p.zona); });
    selZona.innerHTML = '<option value="Todas">Todas as 9 zonas</option>' +
      zonas.map(function (z) {
        var ic = ZONAS_3D[z] ? ZONAS_3D[z].icone + ' ' : '📍 ';
        return '<option value="' + z + '">' + ic + z + '</option>';
      }).join('');

    var selCoord = document.getElementById('coord-select');
    selCoord.innerHTML = state.plaquinhas.map(function (p) {
      return '<option value="' + p.codigo + '">' + p.codigo + ' — ' + p.nomeIupac + ' (' + p.zona + ')</option>';
    }).join('');
  }

  function aplicarFiltros() {
    var q = state.busca.trim().toLowerCase();
    state.filtradas = state.plaquinhas.filter(function (p) {
      if (state.classe !== 'Todas' && p.classe !== state.classe) return false;
      if (state.zona !== 'Todas' && p.zona !== state.zona) return false;
      if (q) {
        var alvo = (p.codigo + ' ' + p.nomeIupac + ' ' + p.formula + ' ' + p.zona + ' ' + p.localExato + ' ' + p.classe).toLowerCase();
        if (alvo.indexOf(q) === -1) return false;
      }
      return true;
    });

    document.getElementById('stat-visiveis').textContent = state.filtradas.length + ' / ' + state.plaquinhas.length + ' plaquinhas visíveis';
    atualizarPins3D();
    atualizarMarcadores2D();
    renderTabela();

    if (state.zona !== 'Todas' && ZONAS_3D[state.zona] && state.tab === '3d') {
      voarParaZona(state.zona);
    }
  }

  function mostrarCardDetalhe(p) {
    state.selecionada = p;
    var card = document.getElementById('detalhe-card');
    if (!p) { card.style.display = 'none'; return; }
    var cor = corClasse(p.classe);
    card.style.display = 'block';
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
        '<div>' +
          '<span style="display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800;background:' + cor.bg + ';color:' + cor.hex + ';border:1px solid ' + cor.hex + ';">' + p.codigo + ' • ' + p.classe.toUpperCase() + '</span>' +
          '<h3 style="margin:6px 0 2px;font-size:18px;color:#f8fafc;">' + p.nomeIupac + ' <span style="color:#38bdf8;">(' + p.formulaHtml + ')</span></h3>' +
          '<div style="font-size:12px;color:#94a3b8;">📍 <strong>' + p.zona + '</strong> — ' + p.localExato + '</div>' +
        '</div>' +
        '<button type="button" id="fechar-detalhe" style="background:#334155;color:#fff;border:0;border-radius:8px;padding:5px 10px;cursor:pointer;font-weight:700;">✕</button>' +
      '</div>' +
      '<p style="margin:10px 0;font-size:13px;line-height:1.45;color:#cbd5e1;">' + p.porQueEstaAqui + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-top:10px;">' +
        '<span style="font-size:11px;color:#94a3b8;">Grupo ' + p.grupo + ' • pH ≈ ' + (typeof p.phEstimado === 'number' ? p.phEstimado.toFixed(1) : '7.0') + '</span>' +
        '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" style="background:#0284c7;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;">Abrir Ficha Completa →</a>' +
      '</div>';
    document.getElementById('fechar-detalhe').onclick = function () { mostrarCardDetalhe(null); };
  }

  // ==================== MOTOR 3D DO CAMPUS CEFET ====================
  function mat(color, rough, metal, extra) {
    var cfg = Object.assign({ color: color, roughness: rough != null ? rough : 0.78, metalness: metal != null ? metal : 0.08 }, extra || {});
    return new THREE.MeshStandardMaterial(cfg);
  }

  function addBox(parent, w, h, d, x, y, z, material, shadow) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    parent.add(m);
    return m;
  }

  function criarArvore(x, z, escala) {
    var g = new THREE.Group();
    var s = escala || 1;
    var tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * s, 0.42 * s, 2.4 * s, 7), mat(0x78350f, 0.9, 0));
    tronco.position.y = 1.2 * s; tronco.castShadow = true; g.add(tronco);
    var copa1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.65 * s, 0), mat(0x15803d, 0.85, 0));
    copa1.position.set(0, 3.1 * s, 0); copa1.castShadow = true; g.add(copa1);
    var copa2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15 * s, 0), mat(0x22c55e, 0.85, 0));
    copa2.position.set(0.55 * s, 3.8 * s, 0.35 * s); copa2.castShadow = true; g.add(copa2);
    g.position.set(x, 0, z);
    scene.add(g);
  }

  function criarPoste(x, z) {
    var g = new THREE.Group();
    var haste = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 5.2, 6), mat(0x475569, 0.5, 0.6));
    haste.position.y = 2.6; haste.castShadow = true; g.add(haste);
    var globoMat = mat(0xfef08a, 0.2, 0.1, { emissive: 0xfef08a, emissiveIntensity: 0.15 });
    var globo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), globoMat);
    globo.position.y = 5.3; g.add(globo);
    g.position.set(x, 0, z);
    scene.add(g);
    lampLights.push(globoMat);
  }

  function criarCarro(x, z, corHex) {
    var g = new THREE.Group();
    addBox(g, 2.2, 0.75, 4.1, 0, 0.55, 0, mat(corHex, 0.35, 0.35));
    addBox(g, 1.8, 0.62, 2.1, 0, 1.15, -0.15, mat(0x0f172a, 0.2, 0.5));
    var rodaMat = mat(0x111827, 0.9, 0.1);
    [[-1.05, 1.3], [1.05, 1.3], [-1.05, -1.3], [1.05, -1.3]].forEach(function (r) {
      var roda = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10), rodaMat);
      roda.rotation.z = Math.PI / 2;
      roda.position.set(r[0], 0.34, r[1]);
      g.add(roda);
    });
    g.position.set(x, 0.05, z);
    scene.add(g);
  }

  function criarPredioJanela(x, z, w, h, d, andares, corParede, corFaixa, temColunas) {
    var g = new THREE.Group();
    // Base/calçada do predio
    addBox(g, w + 1.4, 0.3, d + 1.4, 0, 0.15, 0, mat(0xcbd5e1, 0.9, 0));
    // Corpo principal
    addBox(g, w, h, d, 0, h / 2 + 0.3, 0, mat(corParede, 0.72, 0.06));
    // Platibanda e faixa institucional CEFET (azul)
    addBox(g, w + 0.5, 0.7, d + 0.5, 0, h + 0.55, 0, mat(corFaixa, 0.5, 0.18));
    addBox(g, w - 1.2, 0.35, d - 1.2, 0, h + 0.95, 0, mat(0x94a3b8, 0.85, 0.1));

    var winMat = mat(0x1e3a5f, 0.15, 0.55, { emissive: 0x38bdf8, emissiveIntensity: 0.06 });
    windowMats.push(winMat);
    var cols = Math.max(3, Math.floor(w / 2.6));
    var espX = (w - 2.4) / cols;
    for (var a = 0; a < andares; a++) {
      var wy = 1.6 + a * ((h - 1.6) / andares);
      for (var c = 0; c < cols; c++) {
        var wx = -w / 2 + 1.2 + espX * (c + 0.5);
        addBox(g, espX * 0.65, 1.15, 0.18, wx, wy, d / 2 + 0.05, winMat, false);
        addBox(g, espX * 0.65, 1.15, 0.18, wx, wy, -d / 2 - 0.05, winMat, false);
      }
    }
    if (temColunas) {
      addBox(g, w + 0.2, 0.32, 2.2, 0, 3.1, d / 2 + 1.0, mat(0xe2e8f0, 0.75, 0.08));
      for (var k = -w / 2 + 1.2; k <= w / 2 - 1.2; k += 4.2) {
        addBox(g, 0.42, 3.0, 0.42, k, 1.5, d / 2 + 1.85, mat(0xf8fafc, 0.7, 0.05));
      }
    }
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  }

  function construirCampusCEFET() {
    // Base principal e gramado do campus
    addBox(scene, 86, 1.4, 70, 0, -0.75, 0, mat(0x1e293b, 0.9, 0.05), false);
    var grama = new THREE.Mesh(new THREE.PlaneGeometry(82, 66), mat(0x3f7d44, 0.95, 0));
    grama.rotation.x = -Math.PI / 2; grama.receiveShadow = true; scene.add(grama);

    // Muro perimetral baixo
    var muroMat = mat(0xdbeafe, 0.85, 0.05);
    addBox(scene, 82, 1.2, 0.5, 0, 0.6, -33, muroMat);
    addBox(scene, 0.5, 1.2, 66, -41, 0.6, 0, muroMat);
    addBox(scene, 0.5, 1.2, 66, 41, 0.6, 0, muroMat);
    addBox(scene, 33, 1.2, 0.5, -24.5, 0.6, 33, muroMat);
    addBox(scene, 33, 1.2, 0.5, 24.5, 0.6, 33, muroMat);

    // Avenidas e calcadas pavimentadas conectando todas as 9 zonas
    var calcada = mat(0x94a3b8, 0.92, 0.02);
    addBox(scene, 8, 0.12, 54, 0, 0.06, 5, calcada, false);       // Eixo central N-S
    addBox(scene, 68, 0.12, 5.5, 0, 0.06, 11, calcada, false);    // Eixo horizontal sul
    addBox(scene, 68, 0.12, 5.5, 0, 0.06, -9.5, calcada, false);  // Eixo horizontal norte
    addBox(scene, 5, 0.12, 46, -11.5, 0.06, 0, calcada, false);   // Passarela oeste
    addBox(scene, 5, 0.12, 46, 10.5, 0.06, 0, calcada, false);    // Passarela leste

    // 1. PORTARIA (G05)
    var gPort = new THREE.Group();
    addBox(gPort, 12, 0.25, 5, 0, 0.12, 0, mat(0xcbd5e1, 0.85, 0.05));
    addBox(gPort, 4.4, 3.3, 3.6, -3.2, 1.75, 0, mat(0xf1f5f9, 0.7, 0.05));
    addBox(gPort, 4.5, 1.4, 0.2, -3.2, 2.0, 1.85, mat(0x38bdf8, 0.15, 0.6), false); // Porta de vidro
    addBox(gPort, 12.6, 0.55, 5.4, 0, 3.9, 0, mat(0x0369a1, 0.45, 0.25)); // Marquise CEFET
    addBox(gPort, 0.45, 3.8, 0.45, 5.2, 1.9, 1.8, mat(0xe2e8f0, 0.6, 0.2));
    addBox(gPort, 0.45, 3.8, 0.45, 5.2, 1.9, -1.8, mat(0xe2e8f0, 0.6, 0.2));
    // Catraca de inox
    addBox(gPort, 0.5, 1.1, 1.4, 2.1, 0.65, 0, mat(0xe2e8f0, 0.2, 0.9));
    // Totem CEFET
    addBox(gPort, 2.8, 4.2, 0.6, -8.2, 2.1, 2.2, mat(0x0f172a, 0.4, 0.3));
    addBox(gPort, 2.4, 1.0, 0.68, -8.2, 3.1, 2.2, mat(0x0284c7, 0.3, 0.2));
    gPort.position.set(0, 0, 24);
    scene.add(gPort);

    // 2. RESTAURANTE (G01)
    var gRest = criarPredioJanela(-23, 18, 16, 4.6, 10, 1, 0xfef3c7, 0xd97706, false);
    // Telhado inclinado
    var telhado = new THREE.Mesh(new THREE.ConeGeometry(11.4, 2.4, 4), mat(0xb45309, 0.8, 0.05));
    telhado.rotation.y = Math.PI / 4; telhado.position.set(0, 6.2, 0); telhado.castShadow = true; gRest.add(telhado);
    // Mesas externas com guarda-sol
    [[-5, 6.6], [0, 6.6], [5, 6.6]].forEach(function (m) {
      addBox(gRest, 1.5, 0.12, 1.5, m[0], 0.85, m[1], mat(0xf8fafc, 0.6, 0.1));
      var pe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.3, 6), mat(0x475569, 0.5, 0.5));
      pe.position.set(m[0], 1.15, m[1]); gRest.add(pe);
      var gs = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.55, 8), mat(0x0284c7, 0.6, 0.1));
      gs.position.set(m[0], 2.35, m[1]); gs.castShadow = true; gRest.add(gs);
    });

    // 3. PREDIO 1 - CORREDORES (G03) - Bloco principal 3 andares
    var gP1 = criarPredioJanela(-23, -1, 18, 8.8, 10, 3, 0xf8fafc, 0x0369a1, true);
    addBox(gP1, 4.2, 1.8, 3.2, -5, 10.3, -1.5, mat(0x64748b, 0.8, 0.15)); // Caixa d'agua / casa maquinas

    // 4. BANHEIROS DO PREDIO 3 (G02)
    criarPredioJanela(-2, -16, 14, 5.6, 8, 2, 0xe2e8f0, 0x0d9488, true);

    // 5. CORREDORES DO PREDIO 6 (G04)
    criarPredioJanela(23, 0, 18, 6.4, 10, 2, 0xf1f5f9, 0x4f46e5, true);

    // 6. LABORATORIO DE INFORMATICA (G06) - Bloco Tech moderno
    var gLab = criarPredioJanela(21, -17, 18, 7.0, 10, 2, 0x1e293b, 0x06b6d4, false);
    var ledMat = mat(0x22d3ee, 0.2, 0.2, { emissive: 0x06b6d4, emissiveIntensity: 0.75 });
    addBox(gLab, 18.4, 0.28, 10.4, 0, 7.0, 0, ledMat, false);
    // Unidades de ar-condicionado no teto
    [[-5, 0], [0, 0], [5, 0]].forEach(function (u) {
      addBox(gLab, 2.2, 1.0, 1.6, u[0], 8.2, u[1], mat(0x94a3b8, 0.6, 0.4));
    });

    // 7. JARDIM CENTRAL (G07)
    var gJar = new THREE.Group();
    addBox(gJar, 16, 0.22, 14, 0, 0.11, 0, mat(0x2e7d32, 0.95, 0), false);
    addBox(gJar, 16, 0.25, 2.4, 0, 0.14, 0, mat(0xd6d3d1, 0.9, 0), false);
    addBox(gJar, 2.4, 0.25, 14, 0, 0.14, 0, mat(0xd6d3d1, 0.9, 0), false);
    // Praca circular central + escultura molecular simbolica
    var praca = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.32, 20), mat(0xe2e8f0, 0.85, 0.05));
    praca.position.y = 0.16; praca.receiveShadow = true; gJar.add(praca);
    var atomo = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), mat(0x38bdf8, 0.25, 0.7, { emissive: 0x0284c7, emissiveIntensity: 0.35 }));
    atomo.position.y = 1.65; atomo.castShadow = true; gJar.add(atomo);
    // Bancos de madeira
    [[-3.8, 3.5], [3.8, 3.5], [-3.8, -3.5], [3.8, -3.5]].forEach(function (b) {
      addBox(gJar, 2.1, 0.45, 0.7, b[0], 0.35, b[1], mat(0x92400e, 0.85, 0));
    });
    gJar.position.set(0, 0, 4);
    scene.add(gJar);
    [[-5.5, 8.8], [5.5, 8.8], [-5.5, -0.8], [5.5, -0.8], [-34, 6], [34, 8], [-34, -10], [34, -9]].forEach(function (t, i) {
      criarArvore(t[0], t[1], i < 4 ? 0.95 : 1.15);
    });

    // 8. ESTACIONAMENTOS (G08)
    var gEst = new THREE.Group();
    addBox(gEst, 22, 0.16, 12, 0, 0.08, 0, mat(0x334155, 0.95, 0.05), false);
    // Guias pintadas de branco com cal (Ca(OH)2)
    var calMat = mat(0xffffff, 0.85, 0);
    addBox(gEst, 22.4, 0.32, 0.4, 0, 0.18, -6.1, calMat);
    addBox(gEst, 22.4, 0.32, 0.4, 0, 0.18, 6.1, calMat);
    for (var vx = -8.5; vx <= 8.5; vx += 3.4) {
      addBox(gEst, 0.16, 0.18, 4.6, vx, 0.09, -3.2, calMat, false);
      addBox(gEst, 0.16, 0.18, 4.6, vx, 0.09, 3.2, calMat, false);
    }
    gEst.position.set(23, 0, 21);
    scene.add(gEst);
    criarCarro(16.2, 17.8, 0xef4444);
    criarCarro(19.6, 17.8, 0xf8fafc);
    criarCarro(26.4, 17.8, 0x3b82f6);
    criarCarro(29.8, 24.2, 0x64748b);
    criarCarro(19.6, 24.2, 0xeab308);
    criarCarro(23.0, 24.2, 0x10b981);

    // 9. QUADRA POLIESPORTIVA (G09)
    var gQ = new THREE.Group();
    addBox(gQ, 20.6, 0.22, 13.6, 0, 0.11, 0, mat(0x166534, 0.9, 0), false); // Borda verde
    addBox(gQ, 17.8, 0.26, 10.6, 0, 0.13, 0, mat(0x1d4ed8, 0.82, 0.05), false); // Piso azul
    // Linhas brancas (Sulfato de bario BaSO4)
    var linMat = mat(0xffffff, 0.6, 0);
    addBox(gQ, 17.4, 0.28, 0.18, 0, 0.14, 5.1, linMat, false);
    addBox(gQ, 17.4, 0.28, 0.18, 0, 0.14, -5.1, linMat, false);
    addBox(gQ, 0.18, 0.28, 10.4, -8.7, 0.14, 0, linMat, false);
    addBox(gQ, 0.18, 0.28, 10.4, 8.7, 0.14, 0, linMat, false);
    addBox(gQ, 0.18, 0.28, 10.4, 0, 0.14, 0, linMat, false);
    var circ = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.9, 28), mat(0xffffff, 0.6, 0, { side: THREE.DoubleSide }));
    circ.rotation.x = -Math.PI / 2; circ.position.y = 0.29; gQ.add(circ);
    // Traves brancas (Dioxido de titanio TiO2)
    [-8.5, 8.5].forEach(function (tx) {
      addBox(gQ, 0.16, 2.2, 0.16, tx, 1.2, -1.6, linMat);
      addBox(gQ, 0.16, 2.2, 0.16, tx, 1.2, 1.6, linMat);
      addBox(gQ, 0.16, 0.16, 3.36, tx, 2.3, 0, linMat);
    });
    // Banco / arquibancada de cimento (Ca(OH)2)
    addBox(gQ, 14, 0.75, 1.2, 0, 0.5, -7.2, mat(0xcbd5e1, 0.9, 0.02));
    addBox(gQ, 14, 1.35, 1.1, 0, 0.8, -8.3, mat(0x94a3b8, 0.9, 0.02));
    gQ.position.set(-23, 0, -19);
    scene.add(gQ);

    // Postes de iluminacao pelo campus
    [[-10, 14], [10, 14], [-10, -8], [10, -8], [14, 26], [32, 26], [-33, -12], [-13, -26]].forEach(function (p) {
      criarPoste(p[0], p[1]);
    });
  }

  function criarPins3D() {
    var porZona = {};
    state.plaquinhas.forEach(function (p) {
      if (!porZona[p.zona]) porZona[p.zona] = [];
      porZona[p.zona].push(p);
    });

    Object.keys(porZona).forEach(function (zona) {
      var info = ZONAS_3D[zona] || { x: 0, z: 0, w: 10, d: 10, h: 4 };
      var itens = porZona[zona];
      var n = itens.length;
      itens.forEach(function (p, idx) {
        var frac = n === 1 ? 0 : (idx / (n - 1)) - 0.5;
        var px = info.x + frac * Math.min(info.w * 0.78, n * 3.1);
        var pz = info.z + (idx % 2 === 0 ? info.d * 0.24 : -info.d * 0.24);
        var baseY = info.h + 0.7;
        var cor = corClasse(p.classe);

        var group = new THREE.Group();
        group.position.set(px, baseY, pz);

        // Haste luminosa
        var haste = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8),
          mat(cor.num, 0.3, 0.3, { emissive: cor.num, emissiveIntensity: 0.45 })
        );
        haste.position.y = 1.1;
        group.add(haste);

        // Anel na base
        var anel = new THREE.Mesh(
          new THREE.RingGeometry(0.45, 0.72, 20),
          new THREE.MeshBasicMaterial({ color: cor.num, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
        );
        anel.rotation.x = -Math.PI / 2;
        anel.position.y = 0.05;
        group.add(anel);

        // Cabeca do pin (octaedro brilhante facil de clicar)
        var headMat = mat(cor.num, 0.22, 0.25, { emissive: cor.num, emissiveIntensity: 0.5 });
        var head = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), headMat);
        head.position.y = 2.6;
        head.castShadow = true;
        head.userData = { plaquinha: p, group: group, baseY: baseY, fase: idx * 1.1 };
        group.add(head);

        scene.add(group);
        pinMeshes.push(head);
      });
    });

    // Rotulos flutuantes das 9 zonas
    var containerLabels = document.getElementById('labels-3d');
    containerLabels.innerHTML = '';
    labelEls = [];
    Object.keys(ZONAS_3D).forEach(function (zona) {
      var info = ZONAS_3D[zona];
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'zona-label-3d';
      el.innerHTML = info.icone + ' ' + zona;
      el.onclick = function () {
        document.getElementById('filtro-zona').value = zona;
        state.zona = zona;
        aplicarFiltros();
        voarParaZona(zona);
      };
      containerLabels.appendChild(el);
      labelEls.push({ el: el, pos: new THREE.Vector3(info.x, info.h + 5.2, info.z), zona: zona });
    });
  }

  function atualizarPins3D() {
    var visiveis = new Set(state.filtradas.map(function (p) { return p.codigo; }));
    pinMeshes.forEach(function (mesh) {
      var show = visiveis.has(mesh.userData.plaquinha.codigo);
      mesh.userData.group.visible = show;
    });
  }

  function aplicarTema3D() {
    if (!scene) return;
    if (state.noite) {
      scene.background = new THREE.Color(0x091021);
      scene.fog = new THREE.FogExp2(0x091021, 0.0055);
      hemiLight.intensity = 0.45;
      sunLight.intensity = 0.55;
      sunLight.color.setHex(0x93c5fd);
      lampLights.forEach(function (m) { m.emissiveIntensity = 2.2; });
      windowMats.forEach(function (m) { m.emissiveIntensity = 0.55; });
    } else {
      scene.background = new THREE.Color(0xdbeafe);
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.0032);
      hemiLight.intensity = 0.92;
      sunLight.intensity = 1.05;
      sunLight.color.setHex(0xfffbeb);
      lampLights.forEach(function (m) { m.emissiveIntensity = 0.15; });
      windowMats.forEach(function (m) { m.emissiveIntensity = 0.06; });
    }
  }

  function voarParaPonto(x, y, z, dist) {
    if (!camCtrl.tLook) return;
    camCtrl.tLook.set(x, y, z);
    camCtrl.tRadius = dist || 26;
    camCtrl.tPhi = 0.92;
  }

  function voarParaZona(zona) {
    var info = ZONAS_3D[zona];
    if (!info) return;
    voarParaPonto(info.x, info.h * 0.5, info.z, 25);
  }

  function resetarCamera3D() {
    if (!camCtrl.tLook) return;
    camCtrl.tLook.set(0, 1.5, 2);
    camCtrl.tTheta = 0.62;
    camCtrl.tPhi = 0.92;
    camCtrl.tRadius = 66;
  }

  function alternarTour() {
    state.tour = !state.tour;
    var btn = document.getElementById('btn-tour');
    btn.textContent = state.tour ? '⏹ Parar Tour' : '🎬 Tour 3D';
    btn.classList.toggle('ativo', state.tour);
    if (tourTimer) { clearInterval(tourTimer); tourTimer = null; }
    if (state.tour) {
      var zonas = Object.keys(ZONAS_3D);
      var ir = function () {
        var z = zonas[tourIndex % zonas.length];
        tourIndex++;
        voarParaZona(z);
        camCtrl.tTheta += 0.65;
        var primeira = state.plaquinhas.find(function (p) { return p.zona === z; });
        if (primeira) mostrarCardDetalhe(primeira);
      };
      ir();
      tourTimer = setInterval(ir, 4800);
    }
  }

  function init3D() {
    var wrap = document.getElementById('canvas-3d-wrap');
    if (!window.THREE) {
      wrap.innerHTML = '<div style="padding:36px;text-align:center;color:#cbd5e1;">Não foi possível carregar o motor 3D agora. Use a aba <strong>Mapa Satélite 2D</strong> acima.</div>';
      return;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(44, wrap.clientWidth / Math.max(1, wrap.clientHeight), 0.5, 260);
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.insertBefore(renderer.domElement, wrap.firstChild);

    camCtrl.look = new THREE.Vector3(0, 1.5, 2);
    camCtrl.tLook = new THREE.Vector3(0, 1.5, 2);
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.9);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(0xfffbeb, 1.05);
    sunLight.position.set(38, 56, 32);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -52;
    sunLight.shadow.camera.right = 52;
    sunLight.shadow.camera.top = 46;
    sunLight.shadow.camera.bottom = -46;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 140;
    scene.add(sunLight);

    construirCampusCEFET();
    criarPins3D();
    aplicarTema3D();

    var dom = renderer.domElement;
    var tooltip = document.getElementById('tooltip-3d');

    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dom.addEventListener('pointerdown', function (e) {
      if (state.tour) alternarTour();
      camCtrl.drag = true;
      camCtrl.pan = (e.button === 2 || e.shiftKey);
      camCtrl.lx = camCtrl.downX = e.clientX;
      camCtrl.ly = camCtrl.downY = e.clientY;
    });

    window.addEventListener('pointerup', function (e) {
      if (camCtrl.drag) {
        var dist = Math.hypot(e.clientX - camCtrl.downX, e.clientY - camCtrl.downY);
        if (dist < 6 && e.target === dom) {
          var rect = dom.getBoundingClientRect();
          pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, camera);
          var vis = pinMeshes.filter(function (m) { return m.userData.group.visible; });
          var hits = raycaster.intersectObjects(vis, false);
          if (hits.length > 0) {
            var p = hits[0].object.userData.plaquinha;
            var pos = hits[0].object.userData.group.position;
            voarParaPonto(pos.x, pos.y, pos.z, 20);
            mostrarCardDetalhe(p);
          }
        }
      }
      camCtrl.drag = false;
      camCtrl.pan = false;
    });

    dom.addEventListener('pointermove', function (e) {
      var rect = dom.getBoundingClientRect();
      if (camCtrl.drag) {
        var dx = e.clientX - camCtrl.lx;
        var dy = e.clientY - camCtrl.ly;
        camCtrl.lx = e.clientX; camCtrl.ly = e.clientY;
        if (camCtrl.pan) {
          var s = camCtrl.tRadius * 0.0022;
          camCtrl.tLook.x -= (dx * Math.cos(camCtrl.theta) + dy * Math.sin(camCtrl.theta)) * s;
          camCtrl.tLook.z -= (-dx * Math.sin(camCtrl.theta) + dy * Math.cos(camCtrl.theta)) * s;
        } else {
          camCtrl.tTheta -= dx * 0.0075;
          camCtrl.tPhi = Math.max(0.28, Math.min(1.42, camCtrl.tPhi - dy * 0.0065));
        }
        tooltip.style.display = 'none';
        return;
      }
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      var vis = pinMeshes.filter(function (m) { return m.userData.group.visible; });
      var hits = raycaster.intersectObjects(vis, false);
      if (hits.length > 0) {
        hoveredPin = hits[0].object;
        dom.style.cursor = 'pointer';
        var p = hoveredPin.userData.plaquinha;
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX - rect.left + 14) + 'px';
        tooltip.style.top = (e.clientY - rect.top - 12) + 'px';
        tooltip.innerHTML = '<strong>' + p.codigo + '</strong> • ' + p.nomeIupac + ' (' + p.formula + ')<br><span style="color:#94a3b8;">' + p.zona + ' — clique para abrir</span>';
      } else {
        hoveredPin = null;
        dom.style.cursor = 'grab';
        tooltip.style.display = 'none';
      }
    });

    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      camCtrl.tRadius = Math.max(15, Math.min(110, camCtrl.tRadius + e.deltaY * 0.04));
    }, { passive: false });

    dom.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        camCtrl.drag = false;
        camCtrl.pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    dom.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        camCtrl.tRadius = Math.max(15, Math.min(110, camCtrl.tRadius - (d - camCtrl.pinchDist) * 0.12));
        camCtrl.pinchDist = d;
      }
    }, { passive: true });

    window.addEventListener('resize', redimensionar3D);

    var clock = new THREE.Clock();
    function loop() {
      animId = requestAnimationFrame(loop);
      if (state.tab !== '3d') return;
      var t = clock.getElapsedTime();

      camCtrl.theta += (camCtrl.tTheta - camCtrl.theta) * 0.09;
      camCtrl.phi += (camCtrl.tPhi - camCtrl.phi) * 0.09;
      camCtrl.radius += (camCtrl.tRadius - camCtrl.radius) * 0.09;
      camCtrl.look.lerp(camCtrl.tLook, 0.09);

      camera.position.set(
        camCtrl.look.x + camCtrl.radius * Math.sin(camCtrl.phi) * Math.sin(camCtrl.theta),
        camCtrl.look.y + camCtrl.radius * Math.cos(camCtrl.phi),
        camCtrl.look.z + camCtrl.radius * Math.sin(camCtrl.phi) * Math.cos(camCtrl.theta)
      );
      camera.lookAt(camCtrl.look);

      pinMeshes.forEach(function (mesh) {
        if (!mesh.userData.group.visible) return;
        mesh.rotation.y = t * 1.4 + mesh.userData.fase;
        mesh.position.y = 2.6 + Math.sin(t * 2.4 + mesh.userData.fase) * 0.28;
        var s = mesh === hoveredPin ? 1.38 : 1.0;
        mesh.scale.set(s, s, s);
      });

      // Projetar rotulos das zonas
      var w = wrap.clientWidth, h = wrap.clientHeight;
      labelEls.forEach(function (item) {
        var v = item.pos.clone().project(camera);
        if (v.z > 1) { item.el.style.display = 'none'; return; }
        var sx = (v.x * 0.5 + 0.5) * w;
        var sy = (-v.y * 0.5 + 0.5) * h;
        item.el.style.display = (sx > 10 && sx < w - 10 && sy > 10 && sy < h - 10) ? 'block' : 'none';
        item.el.style.left = sx + 'px';
        item.el.style.top = sy + 'px';
      });

      renderer.render(scene, camera);
    }
    loop();
  }

  function redimensionar3D() {
    if (!renderer || !camera) return;
    var wrap = document.getElementById('canvas-3d-wrap');
    if (!wrap || wrap.clientWidth === 0) return;
    camera.aspect = wrap.clientWidth / Math.max(1, wrap.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  }

  // ==================== MOTOR 2D REAL (LEAFLET SEM BUGS) ====================
  function init2D() {
    if (map2d || !window.L) return;
    map2d = L.map('mapa-2d-canvas', { zoomControl: true, maxZoom: 20 }).setView(CAMPUS_CENTER, 18);

    tileSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20, attribution: 'Satélite © Esri'
    });
    tileRua = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20, attribution: '© OpenStreetMap'
    });
    tileSat.addTo(map2d);
    layerGroup2d = L.layerGroup().addTo(map2d);

    map2d.on('click', function (ev) {
      if (!state.modoCoord) return;
      var cod = document.getElementById('coord-select').value;
      var lat = Number(ev.latlng.lat.toFixed(6));
      var lng = Number(ev.latlng.lng.toFixed(6));
      var item = state.plaquinhas.find(function (p) { return p.codigo === cod; });
      if (!item) return;
      item.lat = lat;
      item.lng = lng;
      state.raw.forEach(function (s) {
        (s.ocorrencias || []).forEach(function (o) {
          if (o.codigo === cod) { o.lat = lat; o.lng = lng; }
        });
      });
      document.getElementById('coord-status').textContent = '✅ ' + cod + ' movida para: ' + lat + ', ' + lng;
      atualizarMarcadores2D();
    });

    atualizarMarcadores2D();
  }

  function atualizarMarcadores2D() {
    if (!map2d || !layerGroup2d) return;
    layerGroup2d.clearLayers();
    var usados = {};

    state.filtradas.forEach(function (p) {
      var chave = p.lat.toFixed(5) + ',' + p.lng.toFixed(5);
      var rep = usados[chave] || 0;
      usados[chave] = rep + 1;
      var ang = rep * 1.4;
      var lat = p.lat + (rep > 0 ? Math.sin(ang) * 0.000045 : 0);
      var lng = p.lng + (rep > 0 ? Math.cos(ang) * 0.000045 : 0);
      var cor = corClasse(p.classe);

      var icon = L.divIcon({
        className: 'pin-2d-custom',
        html: '<div style="display:flex;align-items:center;gap:4px;background:#0f172a;color:#fff;padding:3px 7px;border-radius:999px;border:2px solid ' + cor.hex + ';font:700 10px system-ui,sans-serif;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.45);"><span style="width:8px;height:8px;border-radius:50%;background:' + cor.hex + ';"></span>' + p.codigo.replace('INF-', '') + '</div>',
        iconSize: [72, 22],
        iconAnchor: [36, 11]
      });

      var mk = L.marker([lat, lng], { icon: icon }).addTo(layerGroup2d);
      mk.bindPopup(
        '<div style="font-family:system-ui,sans-serif;min-width:210px;">' +
          '<div style="font-size:11px;font-weight:800;color:' + cor.hex + ';">' + p.codigo + ' • ' + p.classe.toUpperCase() + '</div>' +
          '<div style="font-size:15px;font-weight:800;margin:2px 0;">' + p.nomeIupac + ' (' + p.formulaHtml + ')</div>' +
          '<div style="font-size:12px;color:#475569;margin-bottom:8px;">📍 ' + p.zona + ' — ' + p.localExato + '</div>' +
          '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:700;">Abrir ficha →</a>' +
        '</div>'
      );
      mk.on('click', function () { mostrarCardDetalhe(p); });
    });
  }

  // ==================== TABELA OFICIAL ====================
  function renderTabela() {
    var tbody = document.getElementById('tabela-corpo');
    tbody.innerHTML = state.filtradas.map(function (p) {
      var cor = corClasse(p.classe);
      return '<tr>' +
        '<td><a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" style="color:#38bdf8;font-weight:700;text-decoration:none;">' + p.codigo + '</a></td>' +
        '<td><span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:' + cor.bg + ';color:' + cor.hex + ';">' + p.classe + '</span></td>' +
        '<td><strong>' + p.nomeIupac + '</strong></td>' +
        '<td style="font-family:monospace;">' + p.formulaHtml + '</td>' +
        '<td>' + p.zona + '</td>' +
        '<td>' + p.localExato + '</td>' +
        '<td>' + (p.autorizacao && p.autorizacao.aprovada ? '✅ Aprovada' : '⏳ Pendente') + '</td>' +
      '</tr>';
    }).join('');
  }

  function trocarAba(aba) {
    state.tab = aba;
    document.getElementById('painel-3d').style.display = aba === '3d' ? 'block' : 'none';
    document.getElementById('painel-2d').style.display = aba === '2d' ? 'block' : 'none';
    document.getElementById('tab-3d').classList.toggle('ativo', aba === '3d');
    document.getElementById('tab-2d').classList.toggle('ativo', aba === '2d');

    if (aba === '3d') {
      setTimeout(redimensionar3D, 50);
    } else {
      init2D();
      setTimeout(function () { if (map2d) map2d.invalidateSize(); }, 80);
      setTimeout(function () { if (map2d) map2d.invalidateSize(); }, 300);
    }
  }

  function bindEventos() {
    document.getElementById('tab-3d').onclick = function () { trocarAba('3d'); };
    document.getElementById('tab-2d').onclick = function () { trocarAba('2d'); };

    document.getElementById('filtro-classe').onchange = function (e) { state.classe = e.target.value; aplicarFiltros(); };
    document.getElementById('filtro-zona').onchange = function (e) { state.zona = e.target.value; aplicarFiltros(); };
    document.getElementById('filtro-busca').oninput = function (e) { state.busca = e.target.value; aplicarFiltros(); };

    document.getElementById('btn-dia-noite').onclick = function () {
      state.noite = !state.noite;
      this.textContent = state.noite ? '☀️ Modo Dia' : '🌙 Modo Noite';
      aplicarTema3D();
    };
    document.getElementById('btn-tour').onclick = alternarTour;
    document.getElementById('btn-reset-3d').onclick = function () {
      if (state.tour) alternarTour();
      resetarCamera3D();
    };
    document.getElementById('btn-zoom-in').onclick = function () { camCtrl.tRadius = Math.max(15, camCtrl.tRadius - 10); };
    document.getElementById('btn-zoom-out').onclick = function () { camCtrl.tRadius = Math.min(110, camCtrl.tRadius + 10); };

    document.getElementById('btn-camada-2d').onclick = function () {
      if (!map2d) return;
      usandoSat = !usandoSat;
      if (usandoSat) { map2d.removeLayer(tileRua); tileSat.addTo(map2d); this.textContent = '🗺️ Ver Ruas'; }
      else { map2d.removeLayer(tileSat); tileRua.addTo(map2d); this.textContent = '🛰️ Ver Satélite'; }
    };

    document.getElementById('btn-modo-coord').onclick = function () {
      state.modoCoord = !state.modoCoord;
      this.classList.toggle('ativo', state.modoCoord);
      document.getElementById('coord-bar').style.display = state.modoCoord ? 'flex' : 'none';
      if (state.tab !== '2d') trocarAba('2d');
    };

    document.getElementById('btn-baixar-json').onclick = function () {
      var blob = new Blob([JSON.stringify(state.raw, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'substancias.json';
      a.click();
    };

    document.getElementById('btn-imprimir').onclick = function () { window.print(); };
  }

  document.addEventListener('DOMContentLoaded', function () {
    carregarDados().then(function () {
      preencherSelects();
      bindEventos();
      init3D();
      aplicarFiltros();
    }).catch(function (err) {
      document.getElementById('canvas-3d-wrap').innerHTML = '<div style="padding:32px;color:#fca5a5;">Erro ao carregar os dados das plaquinhas: ' + err.message + '</div>';
    });
  });
})();