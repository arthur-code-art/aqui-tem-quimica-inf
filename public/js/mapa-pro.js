(function () {
  var CEFET_CENTER = [-20.172405334255647, -44.90999115582297];

  var CORES = {
    'Ácido': { hex: '#ef4444', num: 0xef4444, bg: 'rgba(239,68,68,0.16)' },
    'Base':  { hex: '#2563eb', num: 0x3b82f6, bg: 'rgba(59,130,246,0.16)' },
    'Sal':   { hex: '#16a34a', num: 0x22c55e, bg: 'rgba(34,197,94,0.16)' },
    'Óxido': { hex: '#d97706', num: 0xf59e0b, bg: 'rgba(245,158,11,0.16)' }
  };

  // Posicoes 3D alinhadas exatamente a foto aerea do CEFET-MG Campus V
  var ZONAS_3D = {
    'Portaria':                   { x: -6,  z: 36,  w: 18, d: 6,  h: 6.2, icone: '🚪' },
    'Estacionamentos':            { x: -24, z: 20,  w: 14, d: 14, h: 2.2, icone: '🚗' },
    'Jardim':                     { x: -1,  z: 14,  w: 18, d: 14, h: 2.2, icone: '🌿' },
    'Corredores do prédio 1':     { x: -25, z: 3,   w: 12, d: 24, h: 7.4, icone: '🏫' },
    'Restaurante':                { x: -2,  z: -2,  w: 14, d: 12, h: 5.0, icone: '🍽️' },
    'Corredores do prédio 6':     { x: 20,  z: 1,   w: 22, d: 15, h: 6.8, icone: '🏛️' },
    'Laboratório de informática': { x: -13, z: -24, w: 22, d: 12, h: 7.4, icone: '💻' },
    'Banheiros do prédio 3':      { x: 13,  z: -18, w: 10, d: 10, h: 4.8, icone: '🚿' },
    'Quadra':                     { x: 35,  z: -15, w: 22, d: 15, h: 7.6, icone: '⚽' }
  };

  var state = {
    raw: [], plaquinhas: [], filtradas: [],
    tab: '3d', classe: 'Todas', zona: 'Todas', busca: '',
    noite: false,
    tour: false, modoCoord: false, usandoSat: true
  };

  var scene, camera, renderer, raycaster, pointer;
  var pinMeshes = [], pulseRings = [], labelEls = [], lampMats = [], winMats = [];
  var sunLight, hemiLight, fillLight, skyMesh = null, skyTexDia = null, skyTexNoite = null;
  var hoveredPin = null, tourTimer = null, tourIdx = 0;

  // Angulo padrao reproduzindo a perspectiva exata da foto aerea
  var cam = {
    theta: 0.10, phi: 1.04, radius: 78,
    tTheta: 0.10, tPhi: 1.04, tRadius: 78,
    look: null, tLook: null,
    drag: false, pan: false, lx: 0, ly: 0, dx0: 0, dy0: 0, pinch: 0
  };

  var map2d = null, markers2d = null, tileSat = null, tileRua = null, userMarker = null;
  var gpsWatchId = null, gpsLinha = null, gpsAlvoCircle = null, gpsPrimeiroAjuste = true;

  function corClasse(c) { return CORES[c] || { hex: '#d4a024', num: 0xd4a024, bg: 'rgba(212,160,36,0.16)' }; }
  function bindEl(id, prop, fn) { var e = document.getElementById(id); if (e) e[prop] = fn; }

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
    if (!card) return;
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
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" id="btn-guiar-detalhe" class="btn" style="font-weight:700;">🧭 Guiar até aqui (GPS)</button>' +
          '<a href="https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng + '&travelmode=walking" target="_blank" rel="noopener" class="btn" style="text-decoration:none;">🗺️ Google Maps</a>' +
          '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" class="btn btn-primary" style="text-decoration:none;">Abrir Ficha →</a>' +
        '</div>' +
      '</div>';
    bindEl('fechar-detalhe', 'onclick', function () { mostrarCardDetalhe(null); });
    bindEl('btn-guiar-detalhe', 'onclick', function () { iniciarNavegacaoGPS(p); });
  }

  // ==================== TEXTURAS PROCEDURAIS 4K (ZERO DEPENDENCIA EXTERNA) ====================
  function criarCanvasTex(w, h, drawFn, repX, repY) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    drawFn(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    if (repX || repY) {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(repX || 1, repY || 1);
    }
    if (renderer && renderer.capabilities) {
      t.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    }
    return t;
  }

  function texGramaTerreno() {
    return criarCanvasTex(1024, 1024, function (ctx, w, h) {
      // Base verde natural de gramado mineiro
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#4f7f38');
      g.addColorStop(0.5, '#5d9140');
      g.addColorStop(1, '#477231');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Manchas organicas de vegetacao e sombra de grama
      for (var i = 0; i < 420; i++) {
        var x = Math.random() * w, y = Math.random() * h;
        var r = 18 + Math.random() * 72;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(116,158,64,0.16)' : (i % 3 === 1 ? 'rgba(46,84,30,0.15)' : 'rgba(92,135,52,0.14)');
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      // Taludes de terra avermelhada nas bordas (frente direita, canto esquerdo e fundo direito como na foto)
      function manchaTerra(cx, cy, rx, ry, ang) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        var gr = ctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
        gr.addColorStop(0, 'rgba(154,96,62,0.78)');
        gr.addColorStop(0.65, 'rgba(138,88,58,0.45)');
        gr.addColorStop(1, 'rgba(138,88,58,0)');
        ctx.fillStyle = gr;
        ctx.scale(1, ry / rx);
        ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      manchaTerra(w * 0.72, h * 0.86, 220, 145, -0.2);
      manchaTerra(w * 0.16, h * 0.85, 130, 95, 0.3);
      manchaTerra(w * 0.90, h * 0.14, 175, 110, 0.15);

      // Granulacao fina de alta definicao
      for (var k = 0; k < 5500; k++) {
        ctx.fillStyle = k % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    }, 1, 1);
  }

  function texAsfalto() {
    return criarCanvasTex(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#aeb4ba';
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 6000; i++) {
        var v = 152 + Math.floor(Math.random() * 44);
        ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + (v + 3) + ')';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      // Trilha sutil de pneus
      ctx.fillStyle = 'rgba(70,76,82,0.09)';
      ctx.fillRect(w * 0.22, 0, w * 0.16, h);
      ctx.fillRect(w * 0.62, 0, w * 0.16, h);
      // Linha central tracejada clara
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (var y = 16; y < h; y += 96) {
        ctx.fillRect(w * 0.49, y, w * 0.02, 48);
      }
    }, 1, 1);
  }

  function texConcreto(baseHex, linhas) {
    return criarCanvasTex(512, 512, function (ctx, w, h) {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 4200; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.045)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      if (linhas) {
        ctx.strokeStyle = 'rgba(0,0,0,0.085)';
        ctx.lineWidth = 2;
        for (var y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
        for (var x = 0; x < w; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      }
    }, 2, 2);
  }

  function texPaineisSolares() {
    return criarCanvasTex(512, 512, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#10254a');
      g.addColorStop(0.5, '#1b3f7a');
      g.addColorStop(1, '#122952');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(186,214,255,0.34)';
      ctx.lineWidth = 1.5;
      for (var x = 0; x <= w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (var y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // Molduras metalicas dos modulos
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      for (var y2 = 0; y2 <= h; y2 += 128) { ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(w, y2); ctx.stroke(); }
    }, 1, 3);
  }

  function texTelhadoQuadra() {
    return criarCanvasTex(1024, 512, function (ctx, w, h) {
      // Chapa metalica vermelho-terracota fiel a quadra da foto
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#b9443e');
      g.addColorStop(0.5, '#d45952');
      g.addColorStop(1, '#a63a35');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Nervuras metalicas longitudinais
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 2;
      for (var x = 0; x < w; x += 12) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }

      // 8 faixas claras transversais (telhas translucidas de iluminacao natural)
      for (var i = 0; i < 8; i++) {
        var sx = 86 + i * 116;
        var gr = ctx.createLinearGradient(sx, 0, sx + 48, 0);
        gr.addColorStop(0, 'rgba(248,236,232,0.68)');
        gr.addColorStop(0.5, 'rgba(255,250,248,0.88)');
        gr.addColorStop(1, 'rgba(248,236,232,0.68)');
        ctx.fillStyle = gr;
        ctx.fillRect(sx, h * 0.14, 46, h * 0.72);
      }
    }, 1, 1);
  }

  function texLetreiroPortaria() {
    return criarCanvasTex(1024, 256, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#c2ccd6');
      g.addColorStop(1, '#9ba8b5');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Textura de concreto sutil
      for (var i = 0; i < 2000; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Letreiro azul institucional CEFET-MG CAMPUS V DIVINOPOLIS
      ctx.fillStyle = '#183a6d';
      ctx.font = '900 84px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('CEFET-MG', 135, 134);

      ctx.font = '800 36px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText('CAMPUS V', 610, 112);
      ctx.font = '700 30px "Plus Jakarta Sans", Arial, sans-serif';
      ctx.fillText('DIVINÓPOLIS', 610, 156);
    }, 1, 1);
  }

  function texTetoAuditorio() {
    return criarCanvasTex(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#d3d5d8';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(80,86,94,0.28)';
      ctx.lineWidth = 4;
      for (var y = 0; y < h; y += 22) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.strokeStyle = '#9aa1a8';
      ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2); ctx.stroke();
    }, 1, 1);
  }

  function texParePiso() {
    return criarCanvasTex(256, 128, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '900 76px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PARE', w / 2, h / 2);
    }, 1, 1);
  }

  function texSky(noite) {
    return criarCanvasTex(512, 512, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      if (noite) {
        g.addColorStop(0.0, '#070412');
        g.addColorStop(0.45, '#140b2a');
        g.addColorStop(0.70, '#2a164c');
        g.addColorStop(1.0, '#120822');
      } else {
        g.addColorStop(0.0, '#2c76c8');
        g.addColorStop(0.38, '#7ab8ee');
        g.addColorStop(0.62, '#d5e9f8');
        g.addColorStop(0.75, '#e8eef0');
        g.addColorStop(1.0, '#8ba878');
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (noite) {
        for (var i = 0; i < 240; i++) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + Math.random() * 0.65).toFixed(2) + ')';
          var r = Math.random() < 0.15 ? 1.8 : 1.0;
          ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h * 0.56, r, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        // Nuvens suaves no horizonte
        for (var c = 0; c < 18; c++) {
          var cx = Math.random() * w, cy = h * (0.28 + Math.random() * 0.22);
          var gr = ctx.createRadialGradient(cx, cy, 4, cx, cy, 48 + Math.random() * 44);
          gr.addColorStop(0, 'rgba(255,255,255,0.45)');
          gr.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gr;
          ctx.fillRect(cx - 100, cy - 50, 200, 100);
        }
      }
    }, 1, 1);
  }

  // ==================== CONSTRUTOR 3D REALISTA DO CEFET-MG CAMPUS V ====================
  function mat(color, rough, metal, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color: color, roughness: rough != null ? rough : 0.78, metalness: metal != null ? metal : 0.05
    }, extra || {}));
  }

  function addBox(parent, w, h, d, x, y, z, material, shadow) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    parent.add(m);
    return m;
  }

  // Faixa de estrada ou calcada curva com meio-fio integrado no plano XZ
  function criarEstradaCurva(ptsXZ, largura, yPos, matSuperficie, matMeioFio, segs) {
    var v3s = ptsXZ.map(function (p) { return new THREE.Vector3(p[0], yPos, p[1]); });
    var curve = new THREE.CatmullRomCurve3(v3s);
    var passos = segs || 44;
    var pts = curve.getSpacedPoints(passos);

    function construirFita(offsetA, offsetB, yAlvo, material, uvScale) {
      var pos = [], uvs = [], idx = [];
      var dist = 0;
      for (var i = 0; i < pts.length; i++) {
        var cur = pts[i];
        var prev = pts[Math.max(0, i - 1)];
        var next = pts[Math.min(pts.length - 1, i + 1)];
        if (i > 0) dist += cur.distanceTo(prev);
        var tx = next.x - prev.x, tz = next.z - prev.z;
        var len = Math.hypot(tx, tz) || 1;
        var px = -tz / len, pz = tx / len;

        pos.push(cur.x + px * offsetA, yAlvo, cur.z + pz * offsetA);
        pos.push(cur.x + px * offsetB, yAlvo, cur.z + pz * offsetB);
        uvs.push(0, dist / (uvScale || 7));
        uvs.push(1, dist / (uvScale || 7));

        if (i < pts.length - 1) {
          var b = i * 2;
          idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        }
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      var mesh = new THREE.Mesh(geo, material);
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }

    var meia = largura / 2;
    construirFita(-meia, meia, yPos, matSuperficie, 8);
    if (matMeioFio) {
      construirFita(-meia - 0.36, -meia, yPos + 0.05, matMeioFio, 10);
      construirFita(meia, meia + 0.36, yPos + 0.05, matMeioFio, 10);
    }
  }

  function criarFaixaPedestre(x, z, rotY, larg) {
    var g = new THREE.Group();
    var mBranco = mat(0xf8fafc, 0.72, 0.02);
    var n = 5;
    var span = larg || 4.2;
    for (var i = 0; i < n; i++) {
      var off = ((i / (n - 1)) - 0.5) * (span - 0.8);
      addBox(g, 0.44, 0.06, 2.3, off, 0.03, 0, mBranco, false);
    }
    g.position.set(x, 0.14, z);
    g.rotation.y = rotY || 0;
    scene.add(g);
  }

  var arvoreGeos = null, arvoreMats = null;
  function criarArvore(x, z, s, estilo) {
    if (!arvoreGeos) {
      arvoreGeos = {
        tronco: new THREE.CylinderGeometry(0.18, 0.34, 2.4, 7),
        copa1: new THREE.IcosahedronGeometry(1.65, 1),
        copa2: new THREE.IcosahedronGeometry(1.22, 1),
        copa3: new THREE.IcosahedronGeometry(1.05, 1)
      };
      arvoreMats = {
        tronco: mat(0x523624, 0.94, 0),
        folhas: [
          mat(0x1e5628, 0.90, 0),
          mat(0x2b6e32, 0.88, 0),
          mat(0x3a8238, 0.88, 0),
          mat(0x184722, 0.92, 0)
        ]
      };
    }
    var g = new THREE.Group();
    var k = s || 1;
    var seed = Math.abs(Math.sin(x * 12.9898 + z * 78.233));
    var fMat = arvoreMats.folhas[Math.floor(seed * 4) % 4];
    var fMat2 = arvoreMats.folhas[(Math.floor(seed * 4) + 1) % 4];

    var tronco = new THREE.Mesh(arvoreGeos.tronco, arvoreMats.tronco);
    tronco.scale.set(k, k, k);
    tronco.position.y = 1.15 * k;
    tronco.castShadow = true;
    g.add(tronco);

    var c1 = new THREE.Mesh(arvoreGeos.copa1, fMat);
    c1.scale.set(k * 1.08, k * (estilo === 'alta' ? 1.35 : 0.88), k * 1.04);
    c1.position.set(0, 3.05 * k, 0);
    c1.castShadow = true; c1.receiveShadow = true;
    g.add(c1);

    var c2 = new THREE.Mesh(arvoreGeos.copa2, fMat2);
    c2.scale.set(k, k * 0.92, k);
    c2.position.set(0.82 * k, 3.45 * k, 0.45 * k);
    c2.castShadow = true;
    g.add(c2);

    var c3 = new THREE.Mesh(arvoreGeos.copa3, fMat);
    c3.scale.set(k, k * 0.88, k);
    c3.position.set(-0.78 * k, 2.75 * k, -0.52 * k);
    c3.castShadow = true;
    g.add(c3);

    g.position.set(x, 0, z);
    g.rotation.y = seed * Math.PI * 2;
    scene.add(g);
  }

  function criarPoste(x, z) {
    var g = new THREE.Group();
    var haste = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 4.9, 8), mat(0xa8b3be, 0.35, 0.65));
    haste.position.y = 2.45; haste.castShadow = true; g.add(haste);
    var lm = mat(0xfffdf0, 0.15, 0.08, { emissive: 0xfde047, emissiveIntensity: 0.12 });
    lampMats.push(lm);
    var globo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), lm);
    globo.position.y = 5.0; g.add(globo);
    g.position.set(x, 0, z);
    scene.add(g);
  }

  function criarCarro(x, z, rotY, cor) {
    var g = new THREE.Group();
    addBox(g, 1.82, 0.56, 3.8, 0, 0.48, 0, mat(cor, 0.24, 0.42));
    addBox(g, 1.54, 0.50, 1.95, 0, 0.94, -0.16, mat(cor, 0.24, 0.42));
    addBox(g, 1.58, 0.38, 1.78, 0, 0.92, -0.14, mat(0x172538, 0.12, 0.72), false);
    var pneu = mat(0x18181b, 0.9, 0.05);
    [[-0.86, 1.15], [0.86, 1.15], [-0.86, -1.15], [0.86, -1.15]].forEach(function (w) {
      var r = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.24, 12), pneu);
      r.rotation.z = Math.PI / 2;
      r.position.set(w[0], 0.3, w[1]);
      g.add(r);
    });
    g.position.set(x, 0.08, z);
    g.rotation.y = rotY || 0;
    scene.add(g);
  }

  function criarTorreTerracota(parent, x, y, z, rotY, texTerra) {
    var shape = new THREE.Shape();
    shape.moveTo(-2.1, 0);
    shape.lineTo(2.1, 0);
    shape.lineTo(-2.1, 4.3);
    shape.closePath();
    var geo = new THREE.ExtrudeGeometry(shape, { depth: 2.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2 });
    geo.center();
    var mesh = new THREE.Mesh(geo, mat(0xffffff, 0.72, 0.05, { map: texTerra }));
    mesh.position.set(x, y + 2.05, z);
    mesh.rotation.y = rotY || 0;
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);

    var haste = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.6, 8), mat(0xdbe3ec, 0.35, 0.78));
    haste.position.set(x - 0.8 * Math.cos(rotY || 0), y + 4.9, z + 0.8 * Math.sin(rotY || 0));
    parent.add(haste);
  }

  // Bloco longo fiel do CEFET (Predio 1 e Predio Superior)
  function criarBlocoCefet(x, z, rotY, comp, larg, texParede, texTerra, texSolar, texTeto) {
    var g = new THREE.Group();
    var parede = mat(0xffffff, 0.76, 0.04, { map: texParede });
    var teto = mat(0xffffff, 0.82, 0.08, { map: texTeto });
    var win = mat(0x163252, 0.14, 0.72, { emissive: 0xfef08a, emissiveIntensity: 0.04 });
    winMats.push(win);
    var solarMat = mat(0xffffff, 0.16, 0.58, { map: texSolar });

    // Base + corpo principal + platibanda superior
    addBox(g, larg + 0.6, 0.55, comp + 0.8, 0, 0.28, 0, mat(0xd8d5ce, 0.86, 0.03));
    addBox(g, larg, 4.6, comp, 0, 2.55, 0, parede);
    addBox(g, larg + 0.55, 0.45, comp + 0.55, 0, 4.95, 0, teto);

    // Cumeeira central elevada do telhado + 2 fileiras de paineis solares azuis
    addBox(g, 1.5, 0.85, comp * 0.90, -1.1, 5.45, -0.4, mat(0xd6d3cd, 0.78, 0.08));
    var painel = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.16, comp * 0.74), solarMat);
    painel.position.set(1.65, 5.38, -0.6);
    painel.rotation.z = -0.14;
    painel.castShadow = true;
    g.add(painel);

    // Janelas com montantes ao longo das duas laterais
    for (var fz = -comp / 2 + 2.1; fz <= comp / 2 - 2.1; fz += 2.4) {
      addBox(g, 0.16, 1.45, 1.75, larg / 2 + 0.05, 2.75, fz, win, false);
      addBox(g, 0.16, 1.45, 1.75, -larg / 2 - 0.05, 2.75, fz, win, false);
      addBox(g, 0.22, 0.18, 1.9, larg / 2 + 0.08, 3.52, fz, mat(0xd6d3d1, 0.75, 0.08), false);
    }

    // Ponta semicircular branca na frente (SE) com faixa continua de janelas
    var semi = new THREE.Mesh(new THREE.CylinderGeometry(larg * 0.52, larg * 0.52, 4.6, 36), mat(0xf4f3ef, 0.70, 0.04));
    semi.position.set(0, 2.55, comp / 2);
    semi.castShadow = true; semi.receiveShadow = true;
    g.add(semi);

    var faixaWin = new THREE.Mesh(new THREE.CylinderGeometry(larg * 0.532, larg * 0.532, 1.05, 36, 1, true), win);
    faixaWin.position.set(0, 3.05, comp / 2);
    g.add(faixaWin);

    var bordaSemi = new THREE.Mesh(new THREE.CylinderGeometry(larg * 0.545, larg * 0.545, 0.42, 36), teto);
    bordaSemi.position.set(0, 4.95, comp / 2);
    g.add(bordaSemi);

    // Torre angular terracota frontal e torre traseira menor (como na foto)
    criarTorreTerracota(g, 0, 5.0, comp / 2 - 0.5, Math.PI / 2, texTerra);
    criarTorreTerracota(g, -0.4, 5.0, -comp / 2 + 1.2, -Math.PI / 2, texTerra);

    g.position.set(x, 0, z);
    g.rotation.y = rotY || 0;
    scene.add(g);
    return g;
  }

  function construirCampusCEFET4K() {
    var tGrama = texGramaTerreno();
    var tAsf = texAsfalto();
    var tConcretoClaro = texConcreto('#e7e5df', true);
    var tTetoCinza = texConcreto('#c8cdd2', true);
    var tTerra = texConcreto('#b96c54', true);
    var tSolar = texPaineisSolares();
    var tQuadra = texTelhadoQuadra();
    var tPortaria = texLetreiroPortaria();
    var tAudTeto = texTetoAuditorio();
    var tPare = texParePiso();

    var matAsfalto = mat(0xffffff, 0.90, 0.03, { map: tAsf });
    var matMeioFio = mat(0xeceae4, 0.82, 0.03);
    var matCalcada = mat(0xe6e4de, 0.85, 0.02, { map: tConcretoClaro });
    var winGlass = mat(0x163252, 0.14, 0.72, { emissive: 0xfef08a, emissiveIntensity: 0.04 });
    winMats.push(winGlass);

    // 1. Base de terreno + gramado real + borda arquitetonica de maquete
    addBox(scene, 134, 2.2, 114, 0, -1.15, 0, mat(0x1a1f2e, 0.92, 0.05), false);
    var grama = new THREE.Mesh(new THREE.PlaneGeometry(130, 110), mat(0xffffff, 0.96, 0.0, { map: tGrama }));
    grama.rotation.x = -Math.PI / 2;
    grama.receiveShadow = true;
    scene.add(grama);

    // 2. SISTEMA VIARIO CURVO FIEL A FOTO AEREA
    // Entrada principal pela portaria -> pista esquerda (diagonal NW ao lado do Predio 1)
    criarEstradaCurva([[-9, 46], [-8, 36], [-12, 27], [-23, 18], [-35, 7], [-44, -6]], 5.6, 0.11, matAsfalto, matMeioFio, 48);
    // Pista direita saindo da portaria em curva suave contornando a ilha verde
    criarEstradaCurva([[-3, 46], [-4, 36], [-5, 27], [-2, 19], [4, 15]], 5.4, 0.11, matAsfalto, matMeioFio, 36);
    // Avenida transversal principal (liga pista esquerda -> praca central -> frente do auditorio -> curva leste -> quadra)
    criarEstradaCurva([[-25, 17], [-12, 15], [4, 15], [22, 14], [38, 12], [44, 5], [41, -4], [36, -10]], 5.4, 0.12, matAsfalto, matMeioFio, 54);
    // Via interna entre Predio 1, Bloco Central e Predio Superior (estacionamento interno)
    criarEstradaCurva([[-16, 15], [-14, 2], [-15, -11], [-28, -18]], 4.4, 0.10, matAsfalto, matMeioFio, 32);

    // Calcadas diagonais geometricas cruzando os gramados centrais (identicas a foto)
    criarEstradaCurva([[-12, 15], [-7, 5], [-4, -1]], 2.6, 0.14, matCalcada, null, 18);
    criarEstradaCurva([[4, 15], [2, 6], [4, -1]], 2.6, 0.14, matCalcada, null, 18);
    criarEstradaCurva([[-14, -4], [-2, -7], [10, -5], [26, -10]], 3.2, 0.14, matCalcada, null, 24);
    // Piso da praca central em volta do Restaurante/Bloco Central
    addBox(scene, 20, 0.16, 18, -2, 0.08, -2, matCalcada, false);
    // Patio branco em frente a Quadra
    addBox(scene, 24, 0.15, 10, 33, 0.075, -6, matCalcada, false);

    // Faixas de pedestre + marca PARE na portaria
    criarFaixaPedestre(-6, 41.5, 0.16, 6.2);
    criarFaixaPedestre(-19, 21.5, 0.72, 4.6);
    criarFaixaPedestre(-9, 15.2, 1.57, 4.4);
    criarFaixaPedestre(4, 15.0, 1.57, 4.4);

    var mPare = new THREE.MeshBasicMaterial({ map: tPare, transparent: true, depthWrite: false });
    [[-8.2, 39.2, 0.16], [-3.8, 39.2, 0.16 + Math.PI]].forEach(function (pr) {
      var pl = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), mPare);
      pl.rotation.x = -Math.PI / 2;
      pl.rotation.z = pr[2];
      pl.position.set(pr[0], 0.17, pr[1]);
      scene.add(pl);
    });

    // 3. PORTARIA (G05) — Portico CEFET-MG Campus V com letreiro real
    var gPort = new THREE.Group();
    var mVigaLat = mat(0xa8b4c0, 0.68, 0.10);
    var mVigaFrente = mat(0xffffff, 0.65, 0.10, { map: tPortaria });
    var vigaMats = [mVigaLat, mVigaLat, mVigaLat, mVigaLat, mVigaFrente, mVigaFrente];
    var viga = new THREE.Mesh(new THREE.BoxGeometry(19.5, 2.5, 3.8), vigaMats);
    viga.position.set(0, 4.6, 0);
    viga.castShadow = true; viga.receiveShadow = true;
    gPort.add(viga);

    addBox(gPort, 20.0, 0.45, 4.2, 0, 5.95, 0, mat(0xd8d5ce, 0.75, 0.08));
    addBox(gPort, 2.6, 3.6, 3.4, -8.3, 1.8, 0, mat(0xcfd6dd, 0.72, 0.06)); // Pilar esquerdo
    addBox(gPort, 4.2, 3.6, 3.4, 7.5, 1.8, 0, mat(0xd8dfe6, 0.72, 0.06));  // Guarita direita
    addBox(gPort, 2.4, 2.2, 3.55, 7.5, 1.9, 0, winGlass, false);            // Vidro da guarita
    addBox(gPort, 1.0, 3.6, 2.0, -0.6, 1.8, 0, mat(0x788593, 0.74, 0.15)); // Pilar central entre pistas
    gPort.position.set(-6, 0, 36);
    gPort.rotation.y = 0.16;
    scene.add(gPort);

    // 4. PREDIO 1 (G03) — Bloco longo esquerdo inclinado NW-SE com paineis solares e torres terracota
    criarBlocoCefet(-26, 4, 0.66, 25, 9.2, tConcretoClaro, tTerra, tSolar, tTetoCinza);

    // 5. ANEXO BRANCO / GALPAO (extremo noroeste da foto)
    var gAnexo = new THREE.Group();
    addBox(gAnexo, 16.5, 4.0, 9.0, 0, 2.0, 0, mat(0xe6ebf0, 0.72, 0.08, { map: tConcretoClaro }));
    addBox(gAnexo, 17.1, 0.55, 9.5, 0, 4.2, 0, mat(0xf4f7fa, 0.58, 0.14));
    for (var ax = -6; ax <= 6; ax += 2.4) {
      addBox(gAnexo, 0.28, 0.45, 9.2, ax, 4.55, 0, mat(0xdbe2ea, 0.6, 0.12), false);
    }
    gAnexo.position.set(-41, 0, -17);
    gAnexo.rotation.y = 0.24;
    scene.add(gAnexo);

    // 6. LABORATORIO DE INFORMATICA / PREDIO SUPERIOR (G06) — Segundo bloco paralelo ao Predio 1
    criarBlocoCefet(-15, -24, 0.68, 26, 8.8, tConcretoClaro, tTerra, tSolar, tTetoCinza);

    // 7. RESTAURANTE / BLOCO CENTRAL (G01) — Bloco quadrado central com portico ocre e vidros
    var gRest = new THREE.Group();
    addBox(gRest, 13.4, 4.0, 12.2, 0, 2.0, 0, mat(0xffffff, 0.74, 0.04, { map: tConcretoClaro }));
    addBox(gRest, 14.0, 0.52, 12.8, 0, 4.18, 0, mat(0xffffff, 0.80, 0.06, { map: tTetoCinza }));
    addBox(gRest, 12.2, 0.25, 11.0, 0, 4.5, 0, mat(0xb8bec4, 0.85, 0.06), false); // Laje rebaixada
    addBox(gRest, 5.2, 3.0, 1.4, -2.8, 1.5, 5.9, mat(0xe0be86, 0.80, 0.03)); // Portico creme/ocre
    addBox(gRest, 8.8, 1.85, 0.22, 1.4, 1.85, 6.14, winGlass, false);
    addBox(gRest, 0.22, 1.85, 7.6, -6.75, 1.85, 0, winGlass, false);
    gRest.position.set(-2, 0, -2);
    gRest.rotation.y = -0.06;
    scene.add(gRest);

    // 8. CORREDORES DO PREDIO 6 + AUDITORIO CIRCULAR TERRACOTA (G04)
    var gAud = new THREE.Group();
    var mAla = mat(0xffffff, 0.74, 0.04, { map: tConcretoClaro });
    var mTetoA = mat(0xffffff, 0.80, 0.06, { map: tTetoCinza });

    // Ala principal branca/cinza atras e a direita do tambor
    addBox(gAud, 25, 4.4, 10.6, 2.8, 2.2, -1.6, mAla);
    addBox(gAud, 25.6, 0.45, 11.2, 2.8, 4.55, -1.6, mTetoA);

    // Brises verticais ritmados e janelas na ala direita (visiveis nas duas fotos)
    for (var bx = 3.2; bx <= 14.2; bx += 1.35) {
      addBox(gAud, 0.52, 2.75, 0.26, bx, 2.15, 3.74, winGlass, false);
      addBox(gAud, 0.24, 3.1, 0.42, bx + 0.65, 2.15, 3.78, mat(0xe5e3de, 0.72, 0.04));
    }

    // GRANDE AUDITORIO CILINDRICO TERRACOTA com cobertura nervurada
    var tambor = new THREE.Mesh(
      new THREE.CylinderGeometry(6.9, 6.9, 5.4, 48),
      mat(0xffffff, 0.72, 0.04, { map: tTerra })
    );
    tambor.position.set(-3.4, 2.7, 2.6);
    tambor.castShadow = true; tambor.receiveShadow = true;
    gAud.add(tambor);

    var anelTeto = new THREE.Mesh(new THREE.CylinderGeometry(7.15, 7.15, 0.45, 48), mTetoA);
    anelTeto.position.set(-3.4, 5.48, 2.6);
    gAud.add(anelTeto);

    var discoTeto = new THREE.Mesh(new THREE.CircleGeometry(6.85, 48), mat(0xffffff, 0.80, 0.08, { map: tAudTeto }));
    discoTeto.rotation.x = -Math.PI / 2;
    discoTeto.position.set(-3.4, 5.73, 2.6);
    gAud.add(discoTeto);

    // Torre angular terracota no fundo esquerdo da ala
    criarTorreTerracota(gAud, -8.8, 4.4, -5.2, 0.15, tTerra);

    gAud.position.set(20, 0, 1);
    gAud.rotation.y = -0.34;
    scene.add(gAud);

    // 9. BANHEIROS DO PREDIO 3 / ROTUNDA CIRCULAR BRANCA (G02)
    var gRot = new THREE.Group();
    var rotBase = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 2.9, 32), mat(0xf3f4f6, 0.70, 0.05));
    rotBase.position.y = 1.45; rotBase.castShadow = true; rotBase.receiveShadow = true; gRot.add(rotBase);
    var rotVidro = new THREE.Mesh(new THREE.CylinderGeometry(4.05, 4.05, 0.95, 32), winGlass);
    rotVidro.position.y = 3.2; gRot.add(rotVidro);
    var rotTeto = new THREE.Mesh(new THREE.CylinderGeometry(4.85, 4.85, 0.48, 32), mTetoA);
    rotTeto.position.y = 3.85; gRot.add(rotTeto);
    var rotMiolo = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.65, 24), mat(0x2d3748, 0.85, 0.12));
    rotMiolo.position.y = 4.22; gRot.add(rotMiolo);
    gRot.position.set(13, 0, -18);
    scene.add(gRot);

    // 10. QUADRA / GINASIO POLIESPORTIVO (G09) — Telhado curvo vermelho-terracota com faixas claras
    var gQuad = new THREE.Group();
    addBox(gQuad, 20.4, 4.2, 13.6, 0, 2.1, 0, mat(0xd8dde2, 0.80, 0.04));
    // Recuo escuro das paredes + colunata branca externa
    addBox(gQuad, 20.6, 3.2, 13.8, 0, 1.9, 0, mat(0x3a424d, 0.88, 0.05), false);
    var mCol = mat(0xf4f5f7, 0.70, 0.04);
    for (var qx = -9.6; qx <= 9.6; qx += 1.6) {
      addBox(gQuad, 0.42, 4.3, 0.52, qx, 2.15, 7.0, mCol);
      addBox(gQuad, 0.42, 4.3, 0.52, qx, 2.15, -7.0, mCol);
    }
    addBox(gQuad, 21.0, 0.52, 14.8, 0, 4.35, 0, mCol);

    var arcoGeo = new THREE.CylinderGeometry(7.7, 7.7, 21.4, 36, 1, false, 0, Math.PI);
    var arco = new THREE.Mesh(arcoGeo, mat(0xffffff, 0.56, 0.14, { map: tQuadra }));
    arco.rotation.z = Math.PI / 2;
    arco.scale.set(0.42, 1, 0.96);
    arco.position.y = 4.4;
    arco.castShadow = true; arco.receiveShadow = true;
    gQuad.add(arco);

    // Empenas laterais fechando o arco do ginasio
    var empShape = new THREE.Shape();
    empShape.absarc(0, 0, 7.35, 0, Math.PI, false);
    empShape.lineTo(-7.35, 0);
    var empGeo = new THREE.ShapeGeometry(empShape, 28);
    var mEmp = mat(0xe2e6ea, 0.76, 0.05, { side: THREE.DoubleSide });
    [-10.55, 10.55].forEach(function (ex) {
      var eMesh = new THREE.Mesh(empGeo, mEmp);
      eMesh.rotation.y = Math.PI / 2;
      eMesh.scale.set(1, 0.42, 1);
      eMesh.position.set(ex, 4.4, 0);
      gQuad.add(eMesh);
    });

    gQuad.position.set(35, 0, -15);
    gQuad.rotation.y = -0.34;
    scene.add(gQuad);

    // 11. ESTACIONAMENTOS (G08) — Carros nas alcas e bolsao entre blocos
    [
      [-21, 19.5, 0.66, 0xe2e8f0], [-23.8, 17.2, 0.66, 0x64748b], [-26.5, 14.8, 0.66, 0xdc2626],
      [-29.2, 12.2, 0.66, 0xf8fafc], [-18.5, -13.5, 0.68, 0x334155], [-21.2, -15.5, 0.68, 0xf1f5f9],
      [41.5, 9.5, -0.35, 0xf8fafc], [42.8, 6.2, -0.22, 0x475569], [10.5, 14.0, 1.54, 0xd1d5db]
    ].forEach(function (c) { criarCarro(c[0], c[1], c[2], c[3]); });

    // 12. PAISAGISMO REALISTA + MATA DENSAMENTE DISTRIBUIDA AO REDOR DO CAMPUS
    var arvores = [
      // Centro / Jardim (arborizacao pontual da foto)
      [-14, 17, 1.45], [-9, 10, 1.15, 'alta'], [-8, 3, 1.35, 'alta'], [-5, 18, 0.92],
      [6, 17, 1.15], [10, 11, 1.1], [9, -8, 1.05], [-16, 12, 1.25], [-14, -7, 1.0],
      // Bosque denso na frente direita (entre portaria e alca do auditorio)
      [11, 23, 1.55], [16, 26, 1.75], [22, 24, 1.65], [27, 29, 1.80], [19, 32, 1.65],
      [9, 32, 1.55], [32, 22, 1.60], [38, 26, 1.75], [25, 19, 1.40], [31, 16, 1.45],
      // Bosque esquerdo (ao lado da portaria e tras do Predio 1)
      [-22, 34, 1.65], [-29, 28, 1.75], [-36, 21, 1.80], [-42, 12, 1.70], [-48, 3, 1.85],
      [-51, -8, 1.75], [-48, -26, 1.85], [-34, -34, 1.80], [-22, -37, 1.70],
      // Mata de fundo atras dos predios superiores e da quadra
      [-6, -38, 1.75], [4, -36, 1.85], [14, -34, 1.75], [24, -32, 1.85], [34, -31, 1.75],
      [44, -28, 1.80], [50, -18, 1.75], [52, -5, 1.65], [50, 12, 1.70], [46, 24, 1.75]
    ];
    arvores.forEach(function (a) { criarArvore(a[0], a[1], a[2], a[3]); });

    [[-12, 24], [2, 22], [-10, 12], [8, 12], [24, 12], [38, 8], [-12, -8], [10, -10], [26, -8]].forEach(function (p) {
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
        var px = info.x + frac * Math.min(info.w * 0.72, n * 3.1);
        var pz = info.z + (idx % 2 === 0 ? info.d * 0.22 : -info.d * 0.22);
        var baseY = info.h + 0.55;
        var cor = corClasse(p.classe);

        var group = new THREE.Group();
        group.position.set(px, baseY, pz);

        var haste = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 2.4, 12),
          mat(cor.num, 0.22, 0.45, { emissive: cor.num, emissiveIntensity: 0.45 })
        );
        haste.position.y = 1.2;
        group.add(haste);

        var anel = new THREE.Mesh(
          new THREE.RingGeometry(0.50, 0.80, 28),
          new THREE.MeshBasicMaterial({ color: cor.num, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
        );
        anel.rotation.x = -Math.PI / 2;
        anel.position.y = 0.06;
        anel.userData = { fase: idx * 0.9 };
        group.add(anel);
        pulseRings.push(anel);

        var head = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.98, 0),
          new THREE.MeshPhysicalMaterial({
            color: cor.num, roughness: 0.14, metalness: 0.25, clearcoat: 1.0, clearcoatRoughness: 0.08,
            emissive: cor.num, emissiveIntensity: 0.42
          })
        );
        head.position.y = 2.8;
        head.castShadow = true;
        head.userData = { plaquinha: p, group: group, fase: idx * 1.1 };
        group.add(head);

        scene.add(group);
        pinMeshes.push(head);
      });
    });

    var container = document.getElementById('labels-3d');
    if (!container) return;
    container.innerHTML = '';
    labelEls = [];
    Object.keys(ZONAS_3D).forEach(function (zona) {
      var info = ZONAS_3D[zona];
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'zona-label-3d';
      el.innerHTML = info.icone + ' ' + zona;
      el.onclick = function () {
        var selZ = document.getElementById('filtro-zona');
        if (selZ) selZ.value = zona;
        state.zona = zona;
        aplicarFiltros();
        voarParaZona(zona);
      };
      container.appendChild(el);
      labelEls.push({ el: el, pos: new THREE.Vector3(info.x, info.h + 5.6, info.z) });
    });
  }

  function atualizarPins3D() {
    var vis = new Set(state.filtradas.map(function (p) { return p.codigo; }));
    pinMeshes.forEach(function (m) { m.userData.group.visible = vis.has(m.userData.plaquinha.codigo); });
  }

  function aplicarIluminacao3D() {
    if (!scene) return;
    if (state.noite) {
      scene.background = new THREE.Color(0x0b0618);
      scene.fog = new THREE.FogExp2(0x110924, 0.0036);
      if (skyMesh && skyTexNoite) { skyMesh.material.map = skyTexNoite; skyMesh.material.needsUpdate = true; }
      hemiLight.intensity = 0.58;
      hemiLight.color.setHex(0x8b7fd4);
      sunLight.intensity = 0.72;
      sunLight.color.setHex(0xc4b5fd);
      if (fillLight) fillLight.intensity = 0.35;
      if (renderer) renderer.toneMappingExposure = 1.05;
      lampMats.forEach(function (m) { m.emissiveIntensity = 2.4; });
      winMats.forEach(function (m) { m.emissiveIntensity = 0.65; });
    } else {
      scene.background = new THREE.Color(0x9bc8ee);
      scene.fog = new THREE.FogExp2(0xd8e8f4, 0.0018);
      if (skyMesh && skyTexDia) { skyMesh.material.map = skyTexDia; skyMesh.material.needsUpdate = true; }
      hemiLight.intensity = 0.88;
      hemiLight.color.setHex(0xeef7ff);
      sunLight.intensity = 1.42;
      sunLight.color.setHex(0xfff6e0);
      if (fillLight) fillLight.intensity = 0.42;
      if (renderer) renderer.toneMappingExposure = 1.12;
      lampMats.forEach(function (m) { m.emissiveIntensity = 0.08; });
      winMats.forEach(function (m) { m.emissiveIntensity = 0.04; });
    }
    var btnDn = document.getElementById('btn-dia-noite');
    if (btnDn) btnDn.textContent = state.noite ? '☀️ Dia 4K' : '🌙 Noite 4K';
  }

  function voarPara(x, y, z, dist) {
    if (!cam.tLook) return;
    cam.tLook.set(x, y, z);
    cam.tRadius = dist || 30;
    cam.tPhi = 0.96;
  }

  function voarParaZona(zona) {
    var i = ZONAS_3D[zona];
    if (i) voarPara(i.x, i.h * 0.45, i.z, 29);
  }

  function resetar3D() {
    if (!cam.tLook) return;
    cam.tLook.set(1, 2.0, 2);
    cam.tTheta = 0.10;
    cam.tPhi = 1.04;
    cam.tRadius = 78;
  }

  function redimensionar3D() {
    if (!renderer || !camera) return;
    var wrap = document.getElementById('canvas-3d-wrap');
    if (!wrap || wrap.clientWidth < 10 || wrap.clientHeight < 10) return;
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 2 : 3));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  }

  function init3D() {
    var wrap = document.getElementById('canvas-3d-wrap');
    if (!wrap) return;
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
    camera = new THREE.PerspectiveCamera(40, Math.max(1, wrap.clientWidth) / Math.max(1, wrap.clientHeight), 0.5, 420);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 2 : 3));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputEncoding = THREE.sRGBEncoding;
    wrap.insertBefore(renderer.domElement, wrap.firstChild);

    cam.look = new THREE.Vector3(1, 2.0, 2);
    cam.tLook = new THREE.Vector3(1, 2.0, 2);
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    // Sky Dome realista (Dia ensolarado / Noite estrelada)
    skyTexDia = texSky(false);
    skyTexNoite = texSky(true);
    skyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(230, 32, 20),
      new THREE.MeshBasicMaterial({ map: skyTexDia, side: THREE.BackSide, fog: false })
    );
    scene.add(skyMesh);

    hemiLight = new THREE.HemisphereLight(0xeef7ff, 0x3b4f32, 0.88);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(0xfff6e0, 1.42);
    sunLight.position.set(48, 72, 42);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.normalBias = 0.04;
    sunLight.shadow.camera.left = -74;
    sunLight.shadow.camera.right = 74;
    sunLight.shadow.camera.top = 66;
    sunLight.shadow.camera.bottom = -66;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 195;
    scene.add(sunLight);

    fillLight = new THREE.DirectionalLight(0xb8dcff, 0.42);
    fillLight.position.set(-45, 28, -32);
    scene.add(fillLight);

    construirCampusCEFET4K();
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
          voarPara(pos.x, pos.y, pos.z, 24);
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
          cam.tPhi = Math.max(0.24, Math.min(1.42, cam.tPhi - dy * 0.006));
        }
        if (tip) tip.style.display = 'none';
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
        if (tip) {
          tip.style.display = 'block';
          tip.style.left = Math.min(r.width - 210, e.clientX - r.left + 14) + 'px';
          tip.style.top = Math.max(10, e.clientY - r.top - 12) + 'px';
          tip.innerHTML = '<strong>' + p.codigo + '</strong> • ' + p.nomeIupac + ' (' + p.formula + ')<br><span style="opacity:0.8;">' + p.zona + '</span>';
        }
      } else {
        hoveredPin = null;
        dom.style.cursor = 'grab';
        if (tip) tip.style.display = 'none';
      }
    });

    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      cam.tRadius = Math.max(18, Math.min(138, cam.tRadius + e.deltaY * 0.045));
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
        cam.tRadius = Math.max(18, Math.min(138, cam.tRadius - (d - cam.pinch) * 0.14));
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
        m.rotation.y = t * 1.45 + m.userData.fase;
        m.position.y = 2.8 + Math.sin(t * 2.4 + m.userData.fase) * 0.25;
        var s = m === hoveredPin ? 1.36 : 1.0;
        m.scale.set(s, s, s);
      });

      pulseRings.forEach(function (rg) {
        var p = 0.88 + Math.sin(t * 2.8 + rg.userData.fase) * 0.22;
        rg.scale.set(p, p, 1);
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
      var sel = document.getElementById('coord-select');
      if (!sel) return;
      var cod = sel.value;
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
      var st = document.getElementById('coord-status');
      if (st) st.textContent = '✅ ' + cod + ' movida para: ' + lat + ', ' + lng;
      atualizarMarcadores2D();
    });

    var el2d = document.getElementById('mapa-2d-canvas');
    if (el2d && window.ResizeObserver) new ResizeObserver(function () { if (map2d) map2d.invalidateSize(true); }).observe(el2d);
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
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" style="display:inline-block;background:#b8860b;color:#fff;text-decoration:none;padding:6px 10px;border-radius:7px;font-size:12px;font-weight:700;">Ficha →</a>' +
            '<a href="/mapa?guiar=' + encodeURIComponent(p.codigo) + '" style="display:inline-block;background:#1f1a14;color:#f5d37a;text-decoration:none;padding:6px 10px;border-radius:7px;font-size:12px;font-weight:700;">🧭 GPS</a>' +
          '</div>' +
        '</div>'
      );
      mk.on('click', function () { mostrarCardDetalhe(p); });
    });
  }

  // ==================== NAVEGACAO GPS GUIADA ATE A PLAQUINHA ====================
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

    if (bar) bar.style.display = 'block';
    if (tit) tit.textContent = p.codigo + ' — ' + p.nomeIupac + ' (' + p.zona + ' · ' + p.localExato + ')';
    if (gLink) gLink.href = 'https://www.google.com/maps/dir/?api=1&destination=' + p.lat + ',' + p.lng + '&travelmode=walking';
    if (met) met.textContent = 'Obtendo sua localização GPS...';
    gpsPrimeiroAjuste = true;

    setTimeout(function () {
      if (map2d) {
        gpsAlvoCircle = L.circleMarker([p.lat, p.lng], { radius: 14, color: '#f5d37a', weight: 3, fillColor: '#c89b3c', fillOpacity: 0.35 }).addTo(map2d);
        map2d.flyTo([p.lat, p.lng], 19);
      }
    }, 180);

    if (!navigator.geolocation) {
      if (met) met.textContent = 'GPS não disponível neste dispositivo. Use o ponto destacado ou abra a rota no Google Maps.';
      return;
    }

    gpsWatchId = navigator.geolocation.watchPosition(function (pos) {
      var uLat = pos.coords.latitude, uLng = pos.coords.longitude;
      var dist = haversineMetros(uLat, uLng, p.lat, p.lng);
      var rumo = calcularRumo(uLat, uLng, p.lat, p.lng);
      var mins = Math.max(1, Math.round(dist / 78));
      var distTxt = dist >= 1000 ? (dist / 1000).toFixed(2) + ' km' : Math.round(dist) + ' m';

      if (seta) seta.style.transform = 'rotate(' + (rumo - 90).toFixed(0) + 'deg)';
      if (met) {
        if (dist <= 12) met.innerHTML = '<strong style="color:#22c55e;">🎉 Você chegou!</strong> Procure a plaquinha em: <strong>' + p.localExato + '</strong>';
        else met.innerHTML = 'Distância: <strong>' + distTxt + '</strong> (~' + mins + ' min a pé) • Siga para <strong>' + rumoTexto(rumo) + '</strong>';
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
      if (met) met.textContent = 'Permita o acesso à localização no navegador ou clique em "Rota no Google Maps" ao lado.';
    }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 });
  }

  window.atqGuiarPlaquinha = function (cod) {
    var p = state.plaquinhas.find(function (x) { return x.codigo.toUpperCase() === String(cod).toUpperCase(); });
    if (p) { iniciarNavegacaoGPS(p); window.scrollTo({ top: 120, behavior: 'smooth' }); }
  };

  function alternarTour() {
    state.tour = !state.tour;
    var b = document.getElementById('btn-tour');
    if (b) {
      b.textContent = state.tour ? '⏹ Parar Tour' : '🎬 Tour 3D';
      b.classList.toggle('ativo', state.tour);
    }
    if (tourTimer) { clearInterval(tourTimer); tourTimer = null; }
    if (state.tour) {
      var zonas = Object.keys(ZONAS_3D);
      var ir = function () {
        var z = zonas[tourIdx % zonas.length];
        tourIdx++;
        voarParaZona(z);
        cam.tTheta += 0.52;
        var p = state.plaquinhas.find(function (x) { return x.zona === z; });
        if (p) mostrarCardDetalhe(p);
      };
      ir();
      tourTimer = setInterval(ir, 4500);
    }
  }

  function trocarAba(aba) {
    state.tab = aba;
    var p3 = document.getElementById('painel-3d'), p2 = document.getElementById('painel-2d');
    var t3 = document.getElementById('tab-3d'), t2 = document.getElementById('tab-2d');
    if (p3) p3.style.display = aba === '3d' ? 'block' : 'none';
    if (p2) p2.style.display = aba === '2d' ? 'block' : 'none';
    if (t3) t3.classList.toggle('ativo', aba === '3d');
    if (t2) t2.classList.toggle('ativo', aba === '2d');

    if (aba === '3d') {
      setTimeout(redimensionar3D, 60);
    } else {
      init2D();
      setTimeout(function () { if (map2d) { map2d.invalidateSize(true); map2d.setView(CEFET_CENTER, 18); } }, 80);
      setTimeout(function () { if (map2d) map2d.invalidateSize(true); }, 320);
    }
  }

  function renderTabela() {
    var tb = document.getElementById('tabela-corpo');
    if (!tb) return;
    tb.innerHTML = state.filtradas.map(function (p) {
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
    var stVis = document.getElementById('stat-visiveis');
    if (stVis) stVis.textContent = state.filtradas.length + ' / ' + state.plaquinhas.length + ' plaquinhas visíveis';
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
    var fz = document.getElementById('filtro-zona');
    if (fz) {
      fz.innerHTML = '<option value="Todas">Todas as 9 zonas</option>' +
        zonas.map(function (z) { return '<option value="' + z + '">' + (ZONAS_3D[z] ? ZONAS_3D[z].icone + ' ' : '📍 ') + z + '</option>'; }).join('');
    }
    var cs = document.getElementById('coord-select');
    if (cs) {
      cs.innerHTML = state.plaquinhas.map(function (p) {
        return '<option value="' + p.codigo + '">' + p.codigo + ' — ' + p.nomeIupac + '</option>';
      }).join('');
    }
  }

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
    bindEl('btn-zoom-out', 'onclick', function () { cam.tRadius = Math.min(138, cam.tRadius + 10); });

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
  }

  document.addEventListener('DOMContentLoaded', function () {
    carregarDados().then(function () {
      preencherSelects();
      bindEventos();
      try { init3D(); } catch (e3d) { console.error(e3d); }
      aplicarFiltros();
      var qGps = new URLSearchParams(window.location.search).get('guiar');
      if (qGps) {
        var alvoGps = state.plaquinhas.find(function (x) { return x.codigo.toUpperCase() === qGps.toUpperCase(); });
        if (alvoGps) setTimeout(function () { iniciarNavegacaoGPS(alvoGps); }, 250);
      }
    }).catch(function (err) {
      var w = document.getElementById('canvas-3d-wrap');
      if (w) w.innerHTML = '<div style="padding:32px;color:#ef4444;">Erro ao carregar dados: ' + err.message + '</div>';
    });
  });
})();