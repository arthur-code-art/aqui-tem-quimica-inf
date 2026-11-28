(function () {
  var CEFET_CENTER = [-20.172405334255647, -44.90999115582297];

  var CORES = {
    'Ácido': { hex: '#ef4444', num: 0xef4444, bg: 'rgba(239,68,68,0.16)' },
    'Base':  { hex: '#2563eb', num: 0x3b82f6, bg: 'rgba(59,130,246,0.16)' },
    'Sal':   { hex: '#16a34a', num: 0x22c55e, bg: 'rgba(34,197,94,0.16)' },
    'Óxido': { hex: '#d97706', num: 0xf59e0b, bg: 'rgba(245,158,11,0.16)' }
  };

  // Layout 3D fiel a foto aerea do CEFET-MG Campus V (Divinopolis)
  var ZONAS_3D = {
    'Portaria':                   { x: -5,  z: 31,  w: 16, d: 5,  h: 5.5, icone: '🚪' },
    'Estacionamentos':            { x: -24, z: 16,  w: 14, d: 16, h: 2.0, icone: '🚗' },
    'Jardim':                     { x: -1,  z: 10,  w: 16, d: 14, h: 2.0, icone: '🌿' },
    'Corredores do prédio 1':     { x: -25, z: -2,  w: 10, d: 24, h: 6.4, icone: '🏫' },
    'Restaurante':                { x: -2,  z: -2,  w: 13, d: 12, h: 4.5, icone: '🍽️' },
    'Corredores do prédio 6':     { x: 18,  z: 1,   w: 22, d: 14, h: 6.2, icone: '🏛️' },
    'Laboratório de informática': { x: -12, z: -23, w: 22, d: 10, h: 6.6, icone: '💻' },
    'Banheiros do prédio 3':      { x: 11,  z: -15, w: 9,  d: 9,  h: 4.4, icone: '🚿' },
    'Quadra':                     { x: 29,  z: -16, w: 20, d: 14, h: 6.6, icone: '⚽' }
  };

  var state = {
    raw: [], plaquinhas: [], filtradas: [],
    tab: '3d', classe: 'Todas', zona: 'Todas', busca: '',
    noite: document.documentElement.getAttribute('data-tema') !== 'claro',
    tour: false, modoCoord: false, usandoSat: true
  };

  var scene, camera, renderer, raycaster, pointer;
  var pinMeshes = [], labelEls = [], lampMats = [], winMats = [];
  var sunLight, hemiLight, hoveredPin = null, tourTimer = null, tourIdx = 0;
  var cam = {
    theta: 0.22, phi: 0.96, radius: 74,
    tTheta: 0.22, tPhi: 0.96, tRadius: 74,
    look: null, tLook: null,
    drag: false, pan: false, lx: 0, ly: 0, dx0: 0, dy0: 0, pinch: 0
  };

  var map2d = null, markers2d = null, tileSat = null, tileRua = null, userMarker = null;

  function corClasse(c) { return CORES[c] || { hex: '#d4a024', num: 0xd4a024, bg: 'rgba(212,160,36,0.16)' }; }

  function carregarDados() {
    return fetch('/api/extras-dados')
      .then(function (r) { if (!r.ok) throw new Error('Erro HTTP ' + r.status); return r.json(); })
      .then(function (dados) {
        state.raw = dados;
        var lista = [];
        dados.forEach(function (s) {
          (s.ocorrencias || []).forEach(function (o) {
            lista.push({
              codigo: o.codigo, zona: o.zona, localExato: o.localExato, grupo: o.grupo,
              lat: Number(o.lat) || CEFET_CENTER[0], lng: Number(o.lng) || CEFET_CENTER[1],
              autorizacao: o.autorizacao || { aprovada: true },
              nomeIupac: s.nomeIupac, formula: s.formula, formulaHtml: s.formulaHtml || s.formula,
              classe: s.classe, phEstimado: s.phEstimado, porQueEstaAqui: s.porQueEstaAqui || ''
            });
          });
        });
        lista.sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });
        state.plaquinhas = lista;
        state.filtradas = lista.slice();
      });
  }

  function mostrarCardDetalhe(p) {
    var card = document.getElementById('detalhe-card');
    if (!p) { card.style.display = 'none'; return; }
    var cor = corClasse(p.classe);
    card.style.display = 'block';
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
        '<div>' +
          '<span style="display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800;background:' + cor.bg + ';color:' + cor.hex + ';border:1px solid ' + cor.hex + ';">' + p.codigo + ' • ' + p.classe.toUpperCase() + '</span>' +
          '<h3 style="margin:6px 0 2px;font-size:19px;">' + p.nomeIupac + ' <span style="font-family:\'JetBrains Mono\',monospace;font-size:15px;">(' + p.formulaHtml + ')</span></h3>' +
          '<div style="font-size:12px;opacity:0.85;">📍 <strong>' + p.zona + '</strong> — ' + p.localExato + '</div>' +
        '</div>' +
        '<button type="button" id="fechar-detalhe" class="btn" style="padding:5px 10px;">✕</button>' +
      '</div>' +
      '<p style="margin:10px 0;font-size:13px;line-height:1.45;">' + p.porQueEstaAqui + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;">' +
        '<span style="font-size:11px;opacity:0.78;">Grupo ' + p.grupo + ' • GPS: ' + p.lat.toFixed(5) + ', ' + p.lng.toFixed(5) + '</span>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + '<button type="button" id="btn-guiar-detalhe" class="btn" style="font-weight:700;">🧭 Guiar até aqui (GPS)</button>' + '<a href="https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng + '&travelmode=walking" target="_blank" rel="noopener" class="btn" style="text-decoration:none;">🗺️ Google Maps</a>' + '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" class="btn btn-primary" style="text-decoration:none;">Abrir Ficha →</a></div>' +
      '</div>';
    bindEl('fechar-detalhe', 'onclick', function () { mostrarCardDetalhe(null); });
    var bgd = document.getElementById('btn-guiar-detalhe');
    if (bgd) bgd.onclick = function () { iniciarNavegacaoGPS(p); };
  }

  // ==================== MAQUETE 3D FIEL DO CEFET-MG CAMPUS V ====================
  function mat(color, rough, metal, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color: color, roughness: rough != null ? rough : 0.78, metalness: metal != null ? metal : 0.06
    }, extra || {}));
  }

  function addBox(parent, w, h, d, x, y, z, material, shadow) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    parent.add(m);
    return m;
  }

  function criarArvore(x, z, s) {
    var g = new THREE.Group();
    var k = s || 1;
    var tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * k, 0.38 * k, 2.2 * k, 6), mat(0x5c3a21, 0.92, 0));
    tronco.position.y = 1.1 * k; tronco.castShadow = true; g.add(tronco);
    var c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.7 * k, 1), mat(0x1f6b2e, 0.88, 0));
    c1.position.y = 3.0 * k; c1.castShadow = true; g.add(c1);
    var c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 * k, 1), mat(0x2e8540, 0.88, 0));
    c2.position.set(0.55 * k, 3.7 * k, 0.3 * k); c2.castShadow = true; g.add(c2);
    g.position.set(x, 0, z);
    scene.add(g);
  }

  function criarPoste(x, z) {
    var g = new THREE.Group();
    var haste = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 4.6, 6), mat(0x94a3b8, 0.4, 0.6));
    haste.position.y = 2.3; g.add(haste);
    var lm = mat(0xfffbeb, 0.2, 0.1, { emissive: 0xfde047, emissiveIntensity: 0.2 });
    lampMats.push(lm);
    var globo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), lm);
    globo.position.y = 4.7; g.add(globo);
    g.position.set(x, 0, z);
    scene.add(g);
  }

  function criarCarro(x, z, rotY, cor) {
    var g = new THREE.Group();
    addBox(g, 1.8, 0.62, 3.6, 0, 0.48, 0, mat(cor, 0.32, 0.35));
    addBox(g, 1.5, 0.52, 1.8, 0, 0.98, -0.15, mat(0x1e293b, 0.2, 0.5));
    g.position.set(x, 0.05, z);
    g.rotation.y = rotY || 0;
    scene.add(g);
  }

  // Torre triangular terracota caracteristica dos predios do CEFET Divinopolis
  function criarTorreTerracota(parent, x, y, z, rotY) {
    var shape = new THREE.Shape();
    shape.moveTo(-1.8, 0);
    shape.lineTo(1.8, 0);
    shape.lineTo(-1.8, 3.8);
    shape.closePath();
    var geo = new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false });
    geo.center();
    var mesh = new THREE.Mesh(geo, mat(0xb8654e, 0.72, 0.05));
    mesh.position.set(x, y + 1.8, z);
    mesh.rotation.y = rotY || 0;
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);

    // Para-raios no topo da torre
    var haste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), mat(0xcbd5e1, 0.4, 0.7));
    haste.position.set(x, y + 4.4, z);
    parent.add(haste);
  }

  // Bloco longo do CEFET com paineis solares, ponta semicircular branca e torre terracota
  function criarBlocoCefet(x, z, rotY, comp, larg) {
    var g = new THREE.Group();
    var parede = mat(0xe7e5e0, 0.76, 0.04);
    var teto = mat(0xcfd4d8, 0.85, 0.06);
    var win = mat(0x1e3a5f, 0.18, 0.55, { emissive: 0xfef08a, emissiveIntensity: 0.04 });
    winMats.push(win);

    // Corpo principal
    addBox(g, larg, 4.4, comp, 0, 2.2, 0, parede);
    addBox(g, larg + 0.4, 0.35, comp + 0.4, 0, 4.5, 0, teto);

    // Faixa de janelas laterais
    for (var fz = -comp / 2 + 2; fz <= comp / 2 - 2; fz += 2.6) {
      addBox(g, 0.16, 1.3, 1.8, larg / 2 + 0.04, 2.4, fz, win, false);
      addBox(g, 0.16, 1.3, 1.8, -larg / 2 - 0.04, 2.4, fz, win, false);
    }

    // Paineis solares azuis no telhado (como na foto aerea)
    var solar = mat(0x1d4ed8, 0.25, 0.55);
    addBox(g, 3.2, 0.18, comp * 0.68, 1.5, 4.82, -1.0, solar, false);
    addBox(g, 1.4, 0.55, comp * 0.85, -1.8, 4.95, 0, mat(0xd6d3d1, 0.8, 0.08));

    // Ponta semicircular branca (frente)
    var semi = new THREE.Mesh(new THREE.CylinderGeometry(larg * 0.52, larg * 0.52, 4.4, 24), mat(0xf3f2ef, 0.72, 0.04));
    semi.position.set(0, 2.2, comp / 2);
    semi.castShadow = true; semi.receiveShadow = true;
    g.add(semi);

    // Faixa de janelas curvas na ponta circular
    var faixaWin = new THREE.Mesh(new THREE.CylinderGeometry(larg * 0.535, larg * 0.535, 0.9, 24, 1, true), win);
    faixaWin.position.set(0, 2.6, comp / 2);
    g.add(faixaWin);

    // Torre angular terracota sobre a ponta circular
    criarTorreTerracota(g, 0, 4.4, comp / 2 - 0.4, Math.PI / 2);

    g.position.set(x, 0, z);
    g.rotation.y = rotY || 0;
    scene.add(g);
    return g;
  }

  function construirCampusCEFET() {
    // Base do terreno + gramado verde natural
    addBox(scene, 110, 1.8, 92, 0, -0.95, 0, mat(0x1e293b, 0.92, 0.04), false);
    var grama = new THREE.Mesh(new THREE.PlaneGeometry(106, 88), mat(0x4b8b3b, 0.95, 0));
    grama.rotation.x = -Math.PI / 2; grama.receiveShadow = true; scene.add(grama);

    // Asfalto e calcadas cinza-claro (pistas da portaria, eixo central e alca do auditorio)
    var asfalto = mat(0x9ca3af, 0.92, 0.02);
    var calcada = mat(0xe5e7eb, 0.88, 0.02);

    // Via da portaria + bifurcacacao
    addBox(scene, 14, 0.14, 16, -5, 0.07, 32, asfalto, false);
    addBox(scene, 6, 0.14, 34, -15, 0.07, 13, asfalto, false);   // Via esquerda (Predio 1)
    addBox(scene, 6, 0.14, 24, 2, 0.07, 18, asfalto, false);     // Via direita da portaria
    addBox(scene, 58, 0.14, 5.5, 4, 0.07, 12, asfalto, false);   // Avenida transversal frontal
    addBox(scene, 5.5, 0.14, 34, 35, 0.07, -1, asfalto, false);  // Alca leste (auditorio -> quadra)
    addBox(scene, 64, 0.14, 5.5, 2, 0.07, -11, calcada, false);  // Passarela central norte

    // Calcadas geometricas no jardim central + faixas de pedestre brancas
    addBox(scene, 4.2, 0.16, 20, -2, 0.08, 4, calcada, false);
    addBox(scene, 24, 0.16, 3.6, -3, 0.08, 4, calcada, false);
    var branco = mat(0xffffff, 0.7, 0);
    [[-15, 13], [-5, 26], [3, 12], [11, 12]].forEach(function (fx) {
      for (var k = -1.5; k <= 1.5; k += 0.75) {
        addBox(scene, 2.4, 0.18, 0.35, fx[0], 0.09, fx[1] + k, branco, false);
      }
    });

    // 1. PORTARIA (G05) — Portico cinza-azulado CEFET-MG Campus V
    var gPort = new THREE.Group();
    addBox(gPort, 17, 2.2, 3.4, 0, 4.4, 0, mat(0x9aa9b8, 0.68, 0.12)); // Viga superior
    addBox(gPort, 17.4, 0.45, 3.8, 0, 5.6, 0, mat(0xd6d3d1, 0.75, 0.08));
    addBox(gPort, 3.2, 3.6, 3.0, -6.9, 1.8, 0, mat(0xcbd5e1, 0.72, 0.06)); // Guarita esq
    addBox(gPort, 3.2, 3.6, 3.0, 6.9, 1.8, 0, mat(0xcbd5e1, 0.72, 0.06));  // Guarita dir
    addBox(gPort, 1.1, 3.6, 1.8, 0, 1.8, 0, mat(0x64748b, 0.75, 0.15));    // Pilar central entre pistas
    // Letreiro azul institucional na viga
    addBox(gPort, 10.5, 0.65, 0.18, 0, 4.5, 1.76, mat(0x1d4ed8, 0.4, 0.2), false);
    gPort.position.set(-5, 0, 31);
    gPort.rotation.y = 0.14;
    scene.add(gPort);

    // 2. PREDIO 1 (G03) — Bloco longo esquerdo com paineis solares e torre terracota
    criarBlocoCefet(-25, -2, 0.36, 23, 8.6);

    // 3. LABORATORIO DE INFORMATICA (G06) — Segundo bloco longo ao fundo esquerdo + anexo branco
    criarBlocoCefet(-11, -23, 1.24, 22, 8.2);
    // Galpao branco no extremo noroeste (como na foto)
    var gAnexo = new THREE.Group();
    addBox(gAnexo, 15, 3.8, 8.5, 0, 1.9, 0, mat(0xe2e8f0, 0.75, 0.08));
    addBox(gAnexo, 15.6, 0.5, 9.0, 0, 4.0, 0, mat(0xf8fafc, 0.65, 0.1));
    gAnexo.position.set(-34, 0, -24);
    gAnexo.rotation.y = 0.18;
    scene.add(gAnexo);

    // 4. RESTAURANTE / BLOCO CENTRAL (G01) — Bloco quadrado central com portico ocre
    var gRest = new THREE.Group();
    addBox(gRest, 12.6, 3.8, 11.4, 0, 1.9, 0, mat(0xebe9e4, 0.76, 0.04));
    addBox(gRest, 13.2, 0.45, 12.0, 0, 3.95, 0, mat(0xcbd5e1, 0.82, 0.06));
    addBox(gRest, 5.4, 3.0, 1.4, -2.2, 1.5, 5.6, mat(0xe3c28d, 0.8, 0.03)); // Portico creme/ocre
    var winR = mat(0x1e3a5f, 0.2, 0.5, { emissive: 0xfef08a, emissiveIntensity: 0.05 });
    winMats.push(winR);
    addBox(gRest, 8.5, 1.6, 0.2, 1.5, 1.8, 5.75, winR, false);
    gRest.position.set(-2, 0, -2);
    scene.add(gRest);

    // 5. CORREDORES DO PREDIO 6 + AUDITORIO CIRCULAR TERRACOTA (G04)
    var gAud = new THREE.Group();
    // Ala branca retangular atras do cilindro
    addBox(gAud, 22, 4.2, 9.6, 2.5, 2.1, -1.8, mat(0xe8e6e1, 0.75, 0.04));
    addBox(gAud, 22.6, 0.4, 10.2, 2.5, 4.3, -1.8, mat(0xc7ccd1, 0.82, 0.06));
    // Brises/janelas verticais na ala branca
    for (var bx = -7; bx <= 12; bx += 1.6) {
      addBox(gAud, 0.55, 2.6, 0.25, bx, 2.0, 3.1, winR, false);
    }
    // GRANDE CILINDRO TERRACOTA (marco visual principal das duas fotos!)
    var tambor = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 6.4, 5.2, 32), mat(0xb8654e, 0.72, 0.05));
    tambor.position.set(-2.5, 2.6, 2.2);
    tambor.castShadow = true; tambor.receiveShadow = true;
    gAud.add(tambor);
    var tetoTambor = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.6, 0.35, 32), mat(0xd6d3d1, 0.8, 0.06));
    tetoTambor.position.set(-2.5, 5.25, 2.2);
    gAud.add(tetoTambor);
    // Pequena torre terracota no fundo da ala
    criarTorreTerracota(gAud, -7.2, 4.2, -5.0, 0);
    gAud.position.set(18, 0, 1);
    gAud.rotation.y = -0.22;
    scene.add(gAud);

    // 6. BANHEIROS DO PREDIO 3 / ROTUNDA CIRCULAR BRANCA (G02)
    var gRot = new THREE.Group();
    var rotBase = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 2.8, 24), mat(0xf1f5f9, 0.72, 0.05));
    rotBase.position.y = 1.4; rotBase.castShadow = true; rotBase.receiveShadow = true; gRot.add(rotBase);
    var rotVidro = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.9, 24), winR);
    rotVidro.position.y = 3.1; gRot.add(rotVidro);
    var rotTeto = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.4, 24), mat(0xcbd5e1, 0.8, 0.08));
    rotTeto.position.y = 3.7; gRot.add(rotTeto);
    gRot.position.set(11, 0, -15);
    scene.add(gRot);

    // 7. QUADRA / GINASIO COBERTO (G09) — Telhado curvo vermelho-terracota + pilares brancos
    var gQuad = new THREE.Group();
    addBox(gQuad, 18.6, 4.0, 12.6, 0, 2.0, 0, mat(0xe2e8f0, 0.8, 0.04));
    // Pilares brancos externos
    for (var qx = -8.5; qx <= 8.5; qx += 2.1) {
      addBox(gQuad, 0.45, 4.2, 0.45, qx, 2.1, 6.4, branco);
      addBox(gQuad, 0.45, 4.2, 0.45, qx, 2.1, -6.4, branco);
    }
    // Telhado arqueado vermelho-terracota (exatamente como na foto aerea)
    var arcoGeo = new THREE.CylinderGeometry(7.2, 7.2, 19.6, 24, 1, false, 0, Math.PI);
    var arco = new THREE.Mesh(arcoGeo, mat(0xc0483e, 0.62, 0.12));
    arco.rotation.z = Math.PI / 2;
    arco.scale.set(0.42, 1, 0.96);
    arco.position.y = 4.0;
    arco.castShadow = true; arco.receiveShadow = true;
    gQuad.add(arco);
    // Faixas claras de iluminacao no telhado curvo
    [-5.5, -1.8, 1.8, 5.5].forEach(function (fx) {
      var rib = new THREE.Mesh(new THREE.CylinderGeometry(7.28, 7.28, 0.6, 24, 1, true, 0.35, Math.PI - 0.7), mat(0xf8fafc, 0.5, 0.05));
      rib.rotation.z = Math.PI / 2;
      rib.scale.set(0.42, 1, 0.96);
      rib.position.set(fx, 4.02, 0);
      gQuad.add(rib);
    });
    gQuad.position.set(29, 0, -16);
    gQuad.rotation.y = -0.26;
    scene.add(gQuad);

    // 8. ESTACIONAMENTOS (G08) — Carros ao longo das alcas e bolsao frontal
    criarCarro(-19, 19, 0.35, 0xe2e8f0);
    criarCarro(-21.5, 16.5, 0.35, 0x64748b);
    criarCarro(-23.5, 13.5, 0.35, 0xef4444);
    criarCarro(-25, 10.5, 0.35, 0xf8fafc);
    criarCarro(35.5, 9.5, -0.3, 0xf8fafc);
    criarCarro(37, 6.5, -0.3, 0x334155);
    criarCarro(11, 11.2, 1.57, 0xd1d5db);

    // 9. JARDIM (G07) + MATA AO REDOR DO CAMPUS (como na foto aerea)
    var arvores = [
      [-12, 14, 1.3], [-4, 16, 0.9], [7, 15, 1.1], [16, 17, 1.4], [24, 21, 1.5], [14, 26, 1.6], [28, 28, 1.5],
      [-26, 26, 1.4], [-36, 18, 1.5], [-40, 4, 1.6], [-42, -10, 1.4], [-30, -34, 1.5],
      [-4, -34, 1.4], [14, -32, 1.5], [32, -32, 1.4], [44, -18, 1.5], [44, 2, 1.4], [42, 20, 1.5],
      [-7, 4, 0.85], [4, 2, 0.8], [6, -7, 0.9]
    ];
    arvores.forEach(function (a) { criarArvore(a[0], a[1], a[2]); });

    [[-10, 20], [5, 20], [-8, 8], [8, 8], [26, 10], [-14, -10], [8, -10]].forEach(function (p) {
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
        var px = info.x + frac * Math.min(info.w * 0.72, n * 3.0);
        var pz = info.z + (idx % 2 === 0 ? info.d * 0.22 : -info.d * 0.22);
        var baseY = info.h + 0.6;
        var cor = corClasse(p.classe);

        var group = new THREE.Group();
        group.position.set(px, baseY, pz);

        var haste = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8),
          mat(cor.num, 0.3, 0.3, { emissive: cor.num, emissiveIntensity: 0.45 })
        );
        haste.position.y = 1.1;
        group.add(haste);

        var anel = new THREE.Mesh(
          new THREE.RingGeometry(0.48, 0.74, 20),
          new THREE.MeshBasicMaterial({ color: cor.num, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        );
        anel.rotation.x = -Math.PI / 2;
        anel.position.y = 0.05;
        group.add(anel);

        var head = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.95, 0),
          mat(cor.num, 0.22, 0.22, { emissive: cor.num, emissiveIntensity: 0.5 })
        );
        head.position.y = 2.6;
        head.castShadow = true;
        head.userData = { plaquinha: p, group: group, fase: idx * 1.1 };
        group.add(head);

        scene.add(group);
        pinMeshes.push(head);
      });
    });

    var container = document.getElementById('labels-3d');
    container.innerHTML = '';
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
      container.appendChild(el);
      labelEls.push({ el: el, pos: new THREE.Vector3(info.x, info.h + 5.2, info.z) });
    });
  }

  function atualizarPins3D() {
    var vis = new Set(state.filtradas.map(function (p) { return p.codigo; }));
    pinMeshes.forEach(function (m) { m.userData.group.visible = vis.has(m.userData.plaquinha.codigo); });
  }

  function aplicarIluminacao3D() {
    if (!scene) return;
    if (state.noite) {
      scene.background = new THREE.Color(0x0c0718);
      scene.fog = new THREE.FogExp2(0x0c0718, 0.0046);
      hemiLight.intensity = 0.55;
      sunLight.intensity = 0.65;
      sunLight.color.setHex(0xc4b5fd);
      lampMats.forEach(function (m) { m.emissiveIntensity = 2.2; });
      winMats.forEach(function (m) { m.emissiveIntensity = 0.6; });
    } else {
      scene.background = new THREE.Color(0xdbeafe);
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.0024);
      hemiLight.intensity = 0.98;
      sunLight.intensity = 1.15;
      sunLight.color.setHex(0xfffbeb);
      lampMats.forEach(function (m) { m.emissiveIntensity = 0.1; });
      winMats.forEach(function (m) { m.emissiveIntensity = 0.05; });
    }
    var btnDn = document.getElementById('btn-dia-noite');
    if (btnDn) btnDn.textContent = state.noite ? '☀️ Dia no 3D' : '🌙 Noite no 3D';
  }

  function voarPara(x, y, z, dist) {
    if (!cam.tLook) return;
    cam.tLook.set(x, y, z);
    cam.tRadius = dist || 28;
    cam.tPhi = 0.94;
  }

  function voarParaZona(zona) {
    var i = ZONAS_3D[zona];
    if (i) voarPara(i.x, i.h * 0.5, i.z, 27);
  }

  function resetar3D() {
    if (!cam.tLook) return;
    cam.tLook.set(2, 1.5, 2);
    cam.tTheta = 0.22;
    cam.tPhi = 0.96;
    cam.tRadius = 74;
  }

  function redimensionar3D() {
    if (!renderer || !camera) return;
    var wrap = document.getElementById('canvas-3d-wrap');
    if (!wrap || wrap.clientWidth < 10 || wrap.clientHeight < 10) return;
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  }

  function init3D() {
    var wrap = document.getElementById('canvas-3d-wrap');
    if (!window.THREE) {
      wrap.innerHTML = '<div style="padding:32px;text-align:center;">Motor 3D indisponível neste navegador. Use a aba <strong>Satélite GPS Real</strong> acima.</div>';
      return;
    }

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      wrap.innerHTML = '<div style="padding:32px;text-align:center;">WebGL indisponível neste aparelho. Use a aba <strong>Satélite GPS Real</strong> acima.</div>';
      return;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, Math.max(1, wrap.clientWidth) / Math.max(1, wrap.clientHeight), 0.5, 320);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.insertBefore(renderer.domElement, wrap.firstChild);

    cam.look = new THREE.Vector3(2, 1.5, 2);
    cam.tLook = new THREE.Vector3(2, 1.5, 2);
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.95);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(0xfffbeb, 1.1);
    sunLight.position.set(42, 64, 38);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -62;
    sunLight.shadow.camera.right = 62;
    sunLight.shadow.camera.top = 56;
    sunLight.shadow.camera.bottom = -56;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 165;
    scene.add(sunLight);

    construirCampusCEFET();
    criarPins3D();
    aplicarIluminacao3D();

    var dom = renderer.domElement;
    var tip = document.getElementById('tooltip-3d');

    dom.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dom.addEventListener('pointerdown', function (e) {
      if (state.tour) alternarTour();
      cam.drag = true;
      cam.pan = (e.button === 2 || e.shiftKey);
      cam.lx = cam.dx0 = e.clientX;
      cam.ly = cam.dy0 = e.clientY;
    });

    window.addEventListener('pointerup', function (e) {
      if (cam.drag && Math.hypot(e.clientX - cam.dx0, e.clientY - cam.dy0) < 6 && e.target === dom) {
        var r = dom.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        var hits = raycaster.intersectObjects(pinMeshes.filter(function (m) { return m.userData.group.visible; }), false);
        if (hits.length > 0) {
          var p = hits[0].object.userData.plaquinha;
          var pos = hits[0].object.userData.group.position;
          voarPara(pos.x, pos.y, pos.z, 22);
          mostrarCardDetalhe(p);
        }
      }
      cam.drag = false;
      cam.pan = false;
    });

    dom.addEventListener('pointermove', function (e) {
      var r = dom.getBoundingClientRect();
      if (cam.drag) {
        var dx = e.clientX - cam.lx, dy = e.clientY - cam.ly;
        cam.lx = e.clientX; cam.ly = e.clientY;
        if (cam.pan) {
          var s = cam.tRadius * 0.0022;
          cam.tLook.x -= (dx * Math.cos(cam.theta) + dy * Math.sin(cam.theta)) * s;
          cam.tLook.z -= (-dx * Math.sin(cam.theta) + dy * Math.cos(cam.theta)) * s;
        } else {
          cam.tTheta -= dx * 0.007;
          cam.tPhi = Math.max(0.26, Math.min(1.42, cam.tPhi - dy * 0.006));
        }
        tip.style.display = 'none';
        return;
      }
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      var hits = raycaster.intersectObjects(pinMeshes.filter(function (m) { return m.userData.group.visible; }), false);
      if (hits.length > 0) {
        hoveredPin = hits[0].object;
        dom.style.cursor = 'pointer';
        var p = hoveredPin.userData.plaquinha;
        tip.style.display = 'block';
        tip.style.left = Math.min(r.width - 210, e.clientX - r.left + 14) + 'px';
        tip.style.top = Math.max(10, e.clientY - r.top - 12) + 'px';
        tip.innerHTML = '<strong>' + p.codigo + '</strong> • ' + p.nomeIupac + ' (' + p.formula + ')<br><span style="opacity:0.8;">' + p.zona + '</span>';
      } else {
        hoveredPin = null;
        dom.style.cursor = 'grab';
        tip.style.display = 'none';
      }
    });

    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      cam.tRadius = Math.max(18, Math.min(125, cam.tRadius + e.deltaY * 0.045));
    }, { passive: false });

    dom.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        cam.drag = false;
        cam.pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    dom.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        cam.tRadius = Math.max(18, Math.min(125, cam.tRadius - (d - cam.pinch) * 0.14));
        cam.pinch = d;
      }
    }, { passive: true });

    if (window.ResizeObserver) new ResizeObserver(redimensionar3D).observe(wrap);
    window.addEventListener('resize', redimensionar3D);

    var clock = new THREE.Clock();
    function loop() {
      requestAnimationFrame(loop);
      if (state.tab !== '3d') return;
      var t = clock.getElapsedTime();

      cam.theta += (cam.tTheta - cam.theta) * 0.09;
      cam.phi += (cam.tPhi - cam.phi) * 0.09;
      cam.radius += (cam.tRadius - cam.radius) * 0.09;
      cam.look.lerp(cam.tLook, 0.09);

      camera.position.set(
        cam.look.x + cam.radius * Math.sin(cam.phi) * Math.sin(cam.theta),
        cam.look.y + cam.radius * Math.cos(cam.phi),
        cam.look.z + cam.radius * Math.sin(cam.phi) * Math.cos(cam.theta)
      );
      camera.lookAt(cam.look);

      pinMeshes.forEach(function (m) {
        if (!m.userData.group.visible) return;
        m.rotation.y = t * 1.4 + m.userData.fase;
        m.position.y = 2.6 + Math.sin(t * 2.4 + m.userData.fase) * 0.26;
        var s = m === hoveredPin ? 1.35 : 1.0;
        m.scale.set(s, s, s);
      });

      var w = wrap.clientWidth, h = wrap.clientHeight;
      labelEls.forEach(function (item) {
        var v = item.pos.clone().project(camera);
        if (v.z > 1) { item.el.style.display = 'none'; return; }
        var sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
        item.el.style.display = (sx > 14 && sx < w - 14 && sy > 14 && sy < h - 14) ? 'block' : 'none';
        item.el.style.left = sx + 'px';
        item.el.style.top = sy + 'px';
      });

      renderer.render(scene, camera);
    }
    loop();
  }

  // ==================== MAPA SATELITE 2D REAL (CEFET-MG CAMPUS V) ====================
  function init2D() {
    if (map2d || !window.L) return;
    map2d = L.map('mapa-2d-canvas', { zoomControl: true, maxZoom: 20 }).setView(CEFET_CENTER, 18);

    tileSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20, attribution: 'Satélite © Esri'
    });
    tileRua = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20, attribution: '© OpenStreetMap'
    });
    tileSat.addTo(map2d);
    markers2d = L.layerGroup().addTo(map2d);

    map2d.on('click', function (ev) {
      if (!state.modoCoord) return;
      var cod = document.getElementById('coord-select').value;
      var lat = Number(ev.latlng.lat.toFixed(6));
      var lng = Number(ev.latlng.lng.toFixed(6));
      var item = state.plaquinhas.find(function (p) { return p.codigo === cod; });
      if (!item) return;
      item.lat = lat; item.lng = lng;
      state.raw.forEach(function (s) {
        (s.ocorrencias || []).forEach(function (o) {
          if (o.codigo === cod) { o.lat = lat; o.lng = lng; }
        });
      });
      document.getElementById('coord-status').textContent = '✅ ' + cod + ' movida para: ' + lat + ', ' + lng;
      atualizarMarcadores2D();
    });

    var el2d = document.getElementById('mapa-2d-canvas');
    if (window.ResizeObserver) new ResizeObserver(function () { if (map2d) map2d.invalidateSize(true); }).observe(el2d);
    atualizarMarcadores2D();
  }

  function atualizarMarcadores2D() {
    if (!map2d || !markers2d) return;
    markers2d.clearLayers();
    var usados = {};

    state.filtradas.forEach(function (p) {
      var k = p.lat.toFixed(5) + ',' + p.lng.toFixed(5);
      var rep = usados[k] || 0;
      usados[k] = rep + 1;
      var lat = p.lat + (rep > 0 ? Math.sin(rep * 1.4) * 0.00004 : 0);
      var lng = p.lng + (rep > 0 ? Math.cos(rep * 1.4) * 0.00004 : 0);
      var cor = corClasse(p.classe);

      var icon = L.divIcon({
        className: 'pin-2d-atq',
        html: '<div style="display:flex;align-items:center;gap:4px;background:#140b24;color:#fff;padding:3px 8px;border-radius:999px;border:2px solid ' + cor.hex + ';font:700 10px \'Plus Jakarta Sans\',sans-serif;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.45);"><span style="width:7px;height:7px;border-radius:50%;background:' + cor.hex + ';"></span>' + p.codigo.replace('INF-', '') + '</div>',
        iconSize: [74, 22], iconAnchor: [37, 11]
      });

      var mk = L.marker([lat, lng], { icon: icon }).addTo(markers2d);
      mk.bindPopup(
        '<div style="font-family:\'Plus Jakarta Sans\',sans-serif;min-width:210px;color:#1f1a14;">' +
          '<div style="font-size:11px;font-weight:800;color:' + cor.hex + ';">' + p.codigo + ' • ' + p.classe.toUpperCase() + '</div>' +
          '<div style="font-size:15px;font-weight:800;margin:2px 0;">' + p.nomeIupac + ' (' + p.formulaHtml + ')</div>' +
          '<div style="font-size:12px;color:#5c5040;margin-bottom:8px;">📍 ' + p.zona + ' — ' + p.localExato + '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;"><a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" style="display:inline-block;background:#b8860b;color:#fff;text-decoration:none;padding:6px 10px;border-radius:7px;font-size:12px;font-weight:700;">Ficha →</a><a href="/mapa?guiar=' + encodeURIComponent(p.codigo) + '" style="display:inline-block;background:#1f1a14;color:#f5d37a;text-decoration:none;padding:6px 10px;border-radius:7px;font-size:12px;font-weight:700;">🧭 GPS</a></div>' +
        '</div>'
      );
      mk.on('click', function () { mostrarCardDetalhe(p); });
    });
  }

  function alternarTour() {
    state.tour = !state.tour;
    var b = document.getElementById('btn-tour');
    b.textContent = state.tour ? '⏹ Parar Tour' : '🎬 Tour 3D';
    b.classList.toggle('ativo', state.tour);
    if (tourTimer) { clearInterval(tourTimer); tourTimer = null; }
    if (state.tour) {
      var zonas = Object.keys(ZONAS_3D);
      var ir = function () {
        var z = zonas[tourIdx % zonas.length];
        tourIdx++;
        voarParaZona(z);
        cam.tTheta += 0.55;
        var p = state.plaquinhas.find(function (x) { return x.zona === z; });
        if (p) mostrarCardDetalhe(p);
      };
      ir();
      tourTimer = setInterval(ir, 4500);
    }
  }

  function trocarAba(aba) {
    state.tab = aba;
    document.getElementById('painel-3d').style.display = aba === '3d' ? 'block' : 'none';
    document.getElementById('painel-2d').style.display = aba === '2d' ? 'block' : 'none';
    document.getElementById('tab-3d').classList.toggle('ativo', aba === '3d');
    document.getElementById('tab-2d').classList.toggle('ativo', aba === '2d');

    if (aba === '3d') {
      setTimeout(redimensionar3D, 60);
    } else {
      init2D();
      setTimeout(function () { if (map2d) { map2d.invalidateSize(true); map2d.setView(CEFET_CENTER, 18); } }, 80);
      setTimeout(function () { if (map2d) map2d.invalidateSize(true); }, 320);
    }
  }

  function renderTabela() {
    document.getElementById('tabela-corpo').innerHTML = state.filtradas.map(function (p) {
      var cor = corClasse(p.classe);
      return '<tr>' +
        '<td><a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" style="font-weight:700;text-decoration:none;">' + p.codigo + '</a></td>' +
        '<td><span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:' + cor.bg + ';color:' + cor.hex + ';">' + p.classe + '</span></td>' +
        '<td><strong>' + p.nomeIupac + '</strong></td>' +
        '<td>' + p.formulaHtml + '</td>' +
        '<td>' + p.zona + '</td>' +
        '<td>' + p.localExato + '</td>' +
        '<td>' + (p.autorizacao && p.autorizacao.aprovada ? '✅ Aprovada' : '⏳ Pendente') + '</td>' +
        '<td style="white-space:nowrap;"><a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" class="btn" style="padding:4px 8px;font-size:11px;margin-right:4px;text-decoration:none;">Ficha</a><button type="button" class="btn" onclick="window.atqGuiarPlaquinha(\'' + p.codigo + '\')" style="padding:4px 8px;font-size:11px;">🧭 GPS</button></td>' +
      '</tr>';
    }).join('');
  }

  function aplicarFiltros() {
    var q = state.busca.trim().toLowerCase();
    state.filtradas = state.plaquinhas.filter(function (p) {
      if (state.classe !== 'Todas' && p.classe !== state.classe) return false;
      if (state.zona !== 'Todas' && p.zona !== state.zona) return false;
      if (q && (p.codigo + ' ' + p.nomeIupac + ' ' + p.formula + ' ' + p.zona + ' ' + p.localExato).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    document.getElementById('stat-visiveis').textContent = state.filtradas.length + ' / ' + state.plaquinhas.length + ' plaquinhas visíveis';
    atualizarPins3D();
    atualizarMarcadores2D();
    renderTabela();

    if (state.zona !== 'Todas') {
      if (state.tab === '3d') voarParaZona(state.zona);
      else if (map2d && state.filtradas[0]) map2d.flyTo([state.filtradas[0].lat, state.filtradas[0].lng], 19);
    }
  }

  function preencherSelects() {
    var zonas = Object.keys(ZONAS_3D);
    state.plaquinhas.forEach(function (p) { if (zonas.indexOf(p.zona) === -1) zonas.push(p.zona); });
    document.getElementById('filtro-zona').innerHTML = '<option value="Todas">Todas as 9 zonas</option>' +
      zonas.map(function (z) { return '<option value="' + z + '">' + (ZONAS_3D[z] ? ZONAS_3D[z].icone + ' ' : '📍 ') + z + '</option>'; }).join('');
    document.getElementById('coord-select').innerHTML = state.plaquinhas.map(function (p) {
      return '<option value="' + p.codigo + '">' + p.codigo + ' — ' + p.nomeIupac + '</option>';
    }).join('');
  }


  // ==================== NAVEGACAO GPS GUIADA ATE A PLAQUINHA ====================
  var gpsWatchId = null, gpsLinha = null, gpsAlvoCircle = null, gpsPrimeiroAjuste = true;

  function haversineMetros(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var toRad = function (v) { return v * Math.PI / 180; };
    var dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function calcularRumo(lat1, lon1, lat2, lon2) {
    var toRad = function (v) { return v * Math.PI / 180; };
    var y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
    var x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  function rumoTexto(deg) {
    var dirs = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function pararNavegacaoGPS() {
    if (gpsWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }
    if (gpsLinha && map2d) { gpsLinha.remove(); gpsLinha = null; }
    if (gpsAlvoCircle && map2d) { gpsAlvoCircle.remove(); gpsAlvoCircle = null; }
    var bar = document.getElementById('gps-nav-bar');
    if (bar) bar.style.display = 'none';
  }

  function iniciarNavegacaoGPS(p) {
    if (!p) return;
    pararNavegacaoGPS();
    if (state.tab !== '2d') trocarAba('2d');
    mostrarCardDetalhe(p);

    var bar = document.getElementById('gps-nav-bar');
    var tit = document.getElementById('gps-destino-titulo');
    var met = document.getElementById('gps-metricas');
    var seta = document.getElementById('gps-seta');
    var gLink = document.getElementById('gps-gmaps-link');

    bar.style.display = 'block';
    tit.textContent = p.codigo + ' — ' + p.nomeIupac + ' (' + p.zona + ' · ' + p.localExato + ')';
    gLink.href = 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng + '&travelmode=walking';
    met.textContent = 'Obtendo sua localização GPS...';
    gpsPrimeiroAjuste = true;

    setTimeout(function () {
      if (map2d) {
        gpsAlvoCircle = L.circleMarker([p.lat, p.lng], { radius: 14, color: '#f5d37a', weight: 3, fillColor: '#c89b3c', fillOpacity: 0.35 }).addTo(map2d);
        map2d.flyTo([p.lat, p.lng], 19);
      }
    }, 180);

    if (!navigator.geolocation) {
      met.textContent = 'GPS não disponível neste dispositivo. Use o ponto destacado ou abra a rota no Google Maps.';
      return;
    }

    gpsWatchId = navigator.geolocation.watchPosition(function (pos) {
      var uLat = pos.coords.latitude;
      var uLng = pos.coords.longitude;
      var dist = haversineMetros(uLat, uLng, p.lat, p.lng);
      var rumo = calcularRumo(uLat, uLng, p.lat, p.lng);
      var mins = Math.max(1, Math.round(dist / 78));
      var distTxt = dist >= 1000 ? (dist / 1000).toFixed(2) + ' km' : Math.round(dist) + ' m';

      seta.style.transform = 'rotate(' + (rumo - 90).toFixed(0) + 'deg)';
      if (dist <= 12) {
        met.innerHTML = '<strong style="color:#22c55e;">🎉 Você chegou!</strong> Procure a plaquinha em: <strong>' + p.localExato + '</strong>';
      } else {
        met.innerHTML = 'Distância: <strong>' + distTxt + '</strong> (~' + mins + ' min a pé) • Siga para <strong>' + rumoTexto(rumo) + '</strong>';
      }

      if (map2d) {
        if (userMarker) userMarker.setLatLng([uLat, uLng]);
        else userMarker = L.circleMarker([uLat, uLng], { radius: 8, color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }).addTo(map2d).bindPopup('📍 Você está aqui');

        if (gpsLinha) gpsLinha.setLatLngs([[uLat, uLng], [p.lat, p.lng]]);
        else gpsLinha = L.polyline([[uLat, uLng], [p.lat, p.lng]], { color: '#f5d37a', weight: 4, dashArray: '8, 8' }).addTo(map2d);

        if (gpsPrimeiroAjuste) {
          gpsPrimeiroAjuste = false;
          map2d.fitBounds([[uLat, uLng], [p.lat, p.lng]], { padding: [55, 55], maxZoom: 19 });
        }
      }
    }, function () {
      met.textContent = 'Permita o acesso à localização no navegador ou clique em "Rota no Google Maps" ao lado.';
    }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 });
  }

  function bindEl(id, prop, fn) { var e = document.getElementById(id); if (e) e[prop] = fn; }
  window.atqGuiarPlaquinha = function (cod) { var p = state.plaquinhas.find(function (x) { return x.codigo.toUpperCase() === String(cod).toUpperCase(); }); if (p) { iniciarNavegacaoGPS(p); window.scrollTo({ top: 120, behavior: 'smooth' }); } };

  function bindEventos() {
    bindEl('tab-3d', 'onclick', function () { trocarAba('3d'); });
    bindEl('tab-2d', 'onclick', function () { trocarAba('2d'); });
    bindEl('filtro-classe', 'onchange', function (e) { state.classe = e.target.value; aplicarFiltros(); });
    bindEl('filtro-zona', 'onchange', function (e) { state.zona = e.target.value; aplicarFiltros(); });
    bindEl('filtro-busca', 'oninput', function (e) { state.busca = e.target.value; aplicarFiltros(); });

    bindEl('btn-dia-noite', 'onclick', function () { state.noite = !state.noite; aplicarIluminacao3D(); });
    bindEl('btn-tour', 'onclick', alternarTour);
    bindEl('btn-reset-3d', 'onclick', function () { if (state.tour) alternarTour(); resetar3D(); });
    bindEl('btn-zoom-in', 'onclick', function () { cam.tRadius = Math.max(18, cam.tRadius - 10); });
    bindEl('btn-zoom-out', 'onclick', function () { cam.tRadius = Math.min(125, cam.tRadius + 10); });

    bindEl('btn-camada-2d', 'onclick', function () {
      if (!map2d) return;
      state.usandoSat = !state.usandoSat;
      if (state.usandoSat) { map2d.removeLayer(tileRua); tileSat.addTo(map2d); this.textContent = '🗺️ Ver Ruas'; }
      else { map2d.removeLayer(tileSat); tileRua.addTo(map2d); this.textContent = '🛰️ Ver Satélite'; }
    });

    bindEl('btn-centralizar-cefet', 'onclick', function () {
      if (map2d) map2d.flyTo(CEFET_CENTER, 18);
    });

    bindEl('btn-meu-gps', 'onclick', function () {
      if (!navigator.geolocation) { alert('Seu navegador não suporta GPS.'); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (!map2d) return;
        var ll = [pos.coords.latitude, pos.coords.longitude];
        if (userMarker) userMarker.remove();
        userMarker = L.circleMarker(ll, { radius: 8, color: '#ffffff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 })
          .addTo(map2d).bindPopup('📍 Você está aqui').openPopup();
        map2d.flyTo(ll, 19);
      }, function () { alert('Não foi possível obter sua localização. Libere o GPS no navegador.'); }, { enableHighAccuracy: true, timeout: 10000 });
    });

    bindEl('btn-modo-coord', 'onclick', function () {
      state.modoCoord = !state.modoCoord;
      this.classList.toggle('ativo', state.modoCoord);
      var cb = document.getElementById('coord-bar');
      if (cb) cb.style.display = state.modoCoord ? 'flex' : 'none';
      if (state.tab !== '2d') trocarAba('2d');
    });

    bindEl('btn-baixar-json', 'onclick', function () {
      var blob = new Blob([JSON.stringify(state.raw, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'substancias.json';
      a.click();
    });

    bindEl('btn-imprimir', 'onclick', function () { window.print(); });
    bindEl('btn-imprimir-tabela', 'onclick', function () { window.print(); });
    bindEl('gps-parar-btn', 'onclick', pararNavegacaoGPS);
    bindEl('btn-guiar-seletor', 'onclick', function () {
      var alvo = state.filtradas[0] || state.plaquinhas[0];
      if (alvo) iniciarNavegacaoGPS(alvo);
    });

    window.addEventListener('atq-tema-mudou', function (ev) {
      state.noite = ev.detail && ev.detail.tema !== 'claro';
      aplicarIluminacao3D();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    carregarDados().then(function () {
      preencherSelects();
      bindEventos();
      try { init3D(); } catch (e3d) { console.error(e3d); }
      aplicarFiltros();
      var qGps = new URLSearchParams(window.location.search).get('guiar');
      if (qGps) { var alvoGps = state.plaquinhas.find(function (x) { return x.codigo.toUpperCase() === qGps.toUpperCase(); }); if (alvoGps) setTimeout(function () { iniciarNavegacaoGPS(alvoGps); }, 250); }
    }).catch(function (err) {
      document.getElementById('canvas-3d-wrap').innerHTML = '<div style="padding:32px;color:#ef4444;">Erro ao carregar dados: ' + err.message + '</div>';
    });
  });
})();