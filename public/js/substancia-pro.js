(function () {
  var CORES = {
    'Ácido': { hex: '#ef4444', soft: 'rgba(239,68,68,0.16)', icone: '🔴' },
    'Base':  { hex: '#2563eb', soft: 'rgba(37,99,235,0.16)', icone: '🔵' },
    'Sal':   { hex: '#16a34a', soft: 'rgba(22,163,74,0.16)', icone: '🟢' },
    'Óxido': { hex: '#d97706', soft: 'rgba(217,119,6,0.16)', icone: '🟠' }
  };

  // Paleta unica (massa, nome, cor hex sincronizada 3D + legenda, raio 3D)
  var MASSAS = {
    H:  [1.008,  'Hidrogênio', '#f8fafc', 0.34],
    Li: [6.94,   'Lítio',      '#c084fc', 0.58],
    Be: [9.012,  'Berílio',    '#4ade80', 0.50],
    B:  [10.81,  'Boro',       '#fb7185', 0.48],
    C:  [12.011, 'Carbono',    '#64748b', 0.50],
    N:  [14.007, 'Nitrogênio', '#3b82f6', 0.48],
    O:  [15.999, 'Oxigênio',   '#ef4444', 0.46],
    F:  [18.998, 'Flúor',      '#a3e635', 0.44],
    Na: [22.99,  'Sódio',      '#a855f7', 0.64],
    Mg: [24.305, 'Magnésio',   '#10b981', 0.60],
    Al: [26.982, 'Alumínio',   '#cbd5e1', 0.58],
    Si: [28.085, 'Silício',    '#eab308', 0.56],
    P:  [30.974, 'Fósforo',    '#f97316', 0.54],
    S:  [32.06,  'Enxofre',    '#facc15', 0.54],
    Cl: [35.45,  'Cloro',      '#22c55e', 0.52],
    K:  [39.098, 'Potássio',   '#8b5cf6', 0.68],
    Ca: [40.078, 'Cálcio',     '#22c55e', 0.64],
    Ti: [47.867, 'Titânio',    '#94a3b8', 0.60],
    V:  [50.942, 'Vanádio',    '#a1a1aa', 0.58],
    Cr: [51.996, 'Cromo',      '#60a5fa', 0.58],
    Mn: [54.938, 'Manganês',   '#c026d3', 0.58],
    Fe: [55.845, 'Ferro',      '#ea580c', 0.60],
    Co: [58.933, 'Cobalto',    '#f472b6', 0.58],
    Ni: [58.693, 'Níquel',     '#34d399', 0.58],
    Cu: [63.546, 'Cobre',      '#d97706', 0.58],
    Zn: [65.38,  'Zinco',      '#818cf8', 0.58],
    As: [74.922, 'Arsênio',    '#a855f7', 0.56],
    Se: [78.971, 'Selênio',    '#fb923c', 0.54],
    Br: [79.904, 'Bromo',      '#b91c1c', 0.56],
    Sr: [87.62,  'Estrôncio',  '#2dd4bf', 0.68],
    Zr: [91.224, 'Zircônio',   '#38bdf8', 0.62],
    Ag: [107.87, 'Prata',      '#e2e8f0', 0.62],
    Cd: [112.41, 'Cádmio',     '#fde047', 0.62],
    In: [114.82, 'Índio',      '#ec4899', 0.64],
    Sn: [118.71, 'Estanho',    '#9ca3af', 0.64],
    Sb: [121.76, 'Antimônio',  '#a78bfa', 0.62],
    I:  [126.90, 'Iodo',       '#7e22ce', 0.60],
    Ba: [137.33, 'Bário',      '#14b8a6', 0.72],
    W:  [183.84, 'Tungstênio', '#38bdf8', 0.62],
    Pt: [195.08, 'Platina',    '#cbd5e1', 0.62],
    Au: [196.97, 'Ouro',       '#f59e0b', 0.62],
    Hg: [200.59, 'Mercúrio',   '#94a3b8', 0.64],
    Pb: [207.2,  'Chumbo',     '#475569', 0.66],
    Bi: [208.98, 'Bismuto',    '#c084fc', 0.66]
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function normFormula(f) {
    var mapa = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
    return String(f || '').replace(/[₀-₉]/g, function (c) { return mapa[c]; }).replace(/\s+/g, '');
  }

  function contarAtomos(formulaStr) {
    var limpa = normFormula(formulaStr).replace(/\[/g, '(').replace(/\]/g, ')');
    var partes = limpa.split(/[·•.]/).filter(Boolean);
    var total = {};
    partes.forEach(function (parte) {
      var mc = parte.match(/^(\d+)(.*)$/);
      var coef = mc ? parseInt(mc[1], 10) : 1;
      var f = (mc ? mc[2] : parte).replace(/[^A-Za-z0-9()]/g, '');
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
      var base = stack[0] || {};
      Object.keys(base).forEach(function (k) { total[k] = (total[k] || 0) + base[k] * coef; });
    });
    return total;
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

  function carregarThree() {
    if (window.THREE) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      s.onload = resolve;
      s.onerror = function () {
        var s2 = document.createElement('script');
        s2.src = 'https://unpkg.com/three@0.128.0/build/three.min.js';
        s2.onload = resolve;
        s2.onerror = reject;
        document.head.appendChild(s2);
      };
      document.head.appendChild(s);
    });
  }

  var cacheBanco3D = null;
  function obterModeloVerificado(formulaLimpa) {
    var p = cacheBanco3D
      ? Promise.resolve(cacheBanco3D)
      : fetch('/data/moleculas-3d.json?v=1').then(function (r) { return r.json(); }).then(function (j) { cacheBanco3D = j; return j; });

    return p.then(function (banco) {
      if (banco && banco[formulaLimpa] && banco[formulaLimpa].atoms && banco[formulaLimpa].atoms.length) {
        return banco[formulaLimpa];
      }
      // Reserva garantida se surgir formula nova no JSON antes de rodar a auditoria
      var cont = contarAtomos(formulaLimpa);
      var lista = [];
      Object.keys(cont).forEach(function (sym) {
        for (var i = 0; i < Math.min(cont[sym], 20); i++) lista.push(sym);
      });
      var cIdx = lista.findIndex(function (e) { return e !== 'H' && e !== 'O'; });
      if (cIdx === -1) cIdx = 0;
      var centro = lista.splice(cIdx, 1)[0] || 'C';
      var atoms = [[centro, 0, 0, 0]], bonds = [];
      var golden = Math.PI * (3 - Math.sqrt(5));
      lista.forEach(function (el, i) {
        var n = lista.length;
        var y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
        var r = Math.sqrt(Math.max(0, 1 - y * y));
        var th = golden * i;
        atoms.push([el, Math.cos(th) * r * 1.65, y * 1.65, Math.sin(th) * r * 1.65]);
        bonds.push([0, i + 1, 1]);
      });
      return { atoms: atoms, bonds: bonds };
    });
  }

  // ==================== MOTOR 3D STUDIO 4K (THREE.JS PBR) ====================
  function criarVisualizador4K(container, modelo) {
    var THREE = window.THREE;
    container.innerHTML = '';

    // Fundo cinematografico radial de estudio (adapta-se ao Modo Neon e Branco & Dourado)
    function atualizarFundo() {
      var claro = document.documentElement.getAttribute('data-tema') === 'claro';
      container.style.background = claro
        ? 'radial-gradient(circle at 38% 30%, #ffffff 0%, #faf3e3 58%, #ebd9b0 100%)'
        : 'radial-gradient(circle at 38% 30%, #241345 0%, #110824 58%, #070310 100%)';
    }
    atualizarFundo();

    var w = Math.max(260, container.clientWidth);
    var h = Math.max(240, container.clientHeight);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);

    // Camada de rotulos atomicos 3D nitidos em resolucao nativa
    var labelsLayer = document.createElement('div');
    labelsLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:4;';
    container.appendChild(labelsLayer);

    // Iluminacao de Estudio 4K (4 pontos: hemisferio + principal + preenchimento frio + contorno dourado)
    var hemi = new THREE.HemisphereLight(0xffffff, 0x2b194d, 0.92);
    scene.add(hemi);

    var keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(8, 12, 11);
    scene.add(keyLight);

    var fillLight = new THREE.DirectionalLight(0xa5f3fc, 0.62);
    fillLight.position.set(-10, -4, 7);
    scene.add(fillLight);

    var rimLight = new THREE.DirectionalLight(0xf5d37a, 0.88);
    rimLight.position.set(2, 9, -11);
    scene.add(rimLight);

    var pivot = new THREE.Group();
    scene.add(pivot);

    // Centralizar e calcular raio da molecula
    var atoms = modelo.atoms || [];
    var bonds = modelo.bonds || [];
    var cx = 0, cy = 0, cz = 0;
    atoms.forEach(function (a) { cx += a[1]; cy += a[2]; cz += a[3]; });
    if (atoms.length) { cx /= atoms.length; cy /= atoms.length; cz /= atoms.length; }

    var posicoes = atoms.map(function (a) {
      return new THREE.Vector3(a[1] - cx, a[2] - cy, a[3] - cz);
    });

    var maxDist = 1.2;
    posicoes.forEach(function (v) { maxDist = Math.max(maxDist, v.length() + 0.8); });

    // Anel sutil de laboratorio abaixo da molecula
    var haloRing = new THREE.Mesh(
      new THREE.RingGeometry(maxDist * 0.72, maxDist * 0.755, 64),
      new THREE.MeshBasicMaterial({ color: 0xf5d37a, side: THREE.DoubleSide, transparent: true, opacity: 0.22 })
    );
    haloRing.rotation.x = -Math.PI / 2;
    haloRing.position.y = -maxDist * 0.78;
    pivot.add(haloRing);

    var sphereGeo = new THREE.SphereGeometry(1, 48, 36);
    var cylGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1);

    var atomMeshes = [];
    var bondMeshes = [];
    var labelItems = [];
    var matCache = {};

    function getMaterial(sym) {
      if (matCache[sym]) return matCache[sym];
      var info = MASSAS[sym] || [0, sym, '#c084fc', 0.52];
      var col = new THREE.Color(info[2]);
      var m = new THREE.MeshPhysicalMaterial({
        color: col,
        roughness: 0.16,
        metalness: sym === 'H' || sym === 'O' || sym === 'C' || sym === 'N' ? 0.08 : 0.26,
        clearcoat: 1.0,
        clearcoatRoughness: 0.07,
        reflectivity: 0.95,
        emissive: col.clone().multiplyScalar(0.08)
      });
      matCache[sym] = m;
      return m;
    }

    // Construir atomos em alta resolucao
    atoms.forEach(function (a, i) {
      var sym = a[0];
      var info = MASSAS[sym] || [0, sym, '#c084fc', 0.52];
      var baseR = info[3] || 0.52;
      var mesh = new THREE.Mesh(sphereGeo, getMaterial(sym));
      mesh.position.copy(posicoes[i]);
      mesh.scale.setScalar(baseR);
      mesh.userData = { baseR: baseR, sym: sym };
      pivot.add(mesh);
      atomMeshes.push(mesh);

      var lbl = document.createElement('span');
      lbl.textContent = sym;
      lbl.style.cssText =
        'position:absolute;transform:translate(-50%,-50%);padding:1px 6px;border-radius:999px;' +
        'font:800 10.5px "JetBrains Mono",monospace;letter-spacing:0.02em;' +
        'background:rgba(12,6,24,0.78);color:#fff;border:1px solid ' + info[2] + ';' +
        'box-shadow:0 2px 8px rgba(0,0,0,0.45);white-space:nowrap;';
      labelsLayer.appendChild(lbl);
      labelItems.push({ el: lbl, mesh: mesh });
    });

    // Construir ligacoes bicolores (simples, duplas e triplas)
    var upVec = new THREE.Vector3(0, 1, 0);
    function adicionarMeiaLigacao(pInicio, pFim, corSym, raio) {
      var dir = new THREE.Vector3().subVectors(pFim, pInicio);
      var len = dir.length();
      if (len < 0.001) return;
      var m = new THREE.Mesh(cylGeo, getMaterial(corSym));
      m.position.copy(pInicio).addScaledVector(dir, 0.5);
      m.quaternion.setFromUnitVectors(upVec, dir.clone().normalize());
      m.scale.set(raio, len, raio);
      pivot.add(m);
      bondMeshes.push(m);
    }

    bonds.forEach(function (b) {
      var i1 = b[0], i2 = b[1], ord = b[2] || 1;
      var p1 = posicoes[i1], p2 = posicoes[i2];
      if (!p1 || !p2) return;
      var dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      var perp = new THREE.Vector3(0, 0, 1).cross(dir);
      if (perp.lengthSq() < 0.01) perp = new THREE.Vector3(0, 1, 0).cross(dir);
      perp.normalize();

      var offsets = ord === 2 ? [-0.12, 0.12] : (ord >= 3 ? [-0.16, 0, 0.16] : [0]);
      var raio = ord >= 2 ? 0.085 : 0.115;

      offsets.forEach(function (off) {
        var shift = perp.clone().multiplyScalar(off);
        var a1 = p1.clone().add(shift);
        var a2 = p2.clone().add(shift);
        var meio = a1.clone().add(a2).multiplyScalar(0.5);
        adicionarMeiaLigacao(a1, meio, atoms[i1][0], raio);
        adicionarMeiaLigacao(meio, a2, atoms[i2][0], raio);
      });
    });

    // Camera inicial ajustada ao tamanho da molecula
    var distBase = Math.max(4.6, maxDist * 2.55);
    var distAlvo = distBase;
    var distAtual = distBase;
    camera.position.set(0, 0.4, distAtual);
    camera.lookAt(0, 0, 0);

    // Rotacao suave com inercia e toque mobile
    var rotY = 0.35, rotX = 0.24;
    var tRotY = 0.35, tRotX = 0.24;
    var girando = true;
    var mostrarRotulos = atoms.length <= 16;
    var drag = false, lx = 0, ly = 0, pinchDist = 0;

    labelsLayer.style.display = mostrarRotulos ? 'block' : 'none';

    var dom = renderer.domElement;
    dom.addEventListener('pointerdown', function (e) {
      drag = true;
      lx = e.clientX; ly = e.clientY;
      dom.style.cursor = 'grabbing';
    });
    window.addEventListener('pointerup', function () {
      drag = false;
      dom.style.cursor = 'grab';
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      tRotY += dx * 0.011;
      tRotX = Math.max(-1.4, Math.min(1.4, tRotX + dy * 0.011));
    });
    dom.addEventListener('wheel', function (e) {
      e.preventDefault();
      distAlvo = Math.max(2.4, Math.min(distBase * 2.2, distAlvo + e.deltaY * 0.008));
    }, { passive: false });
    dom.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        drag = false;
        pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    dom.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        distAlvo = Math.max(2.4, Math.min(distBase * 2.2, distAlvo - (d - pinchDist) * 0.025));
        pinchDist = d;
      }
    }, { passive: true });

    function resize() {
      var nw = container.clientWidth, nh = container.clientHeight;
      if (nw < 10 || nh < 10) return;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
      renderer.setSize(nw, nh);
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
    window.addEventListener('resize', resize);

    var tmpVec = new THREE.Vector3();
    function animar() {
      requestAnimationFrame(animar);
      if (container.offsetWidth === 0 || container.offsetHeight === 0) return;
      if (girando && !drag) tRotY += 0.008;

      rotY += (tRotY - rotY) * 0.12;
      rotX += (tRotX - rotX) * 0.12;
      distAtual += (distAlvo - distAtual) * 0.12;

      pivot.rotation.y = rotY;
      pivot.rotation.x = rotX;
      camera.position.z = distAtual;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);

      if (mostrarRotulos) {
        var cw = container.clientWidth, ch = container.clientHeight;
        for (var i = 0; i < labelItems.length; i++) {
          var it = labelItems[i];
          it.mesh.getWorldPosition(tmpVec);
          tmpVec.project(camera);
          var sx = (tmpVec.x * 0.5 + 0.5) * cw;
          var sy = (-tmpVec.y * 0.5 + 0.5) * ch;
          it.el.style.left = sx.toFixed(1) + 'px';
          it.el.style.top = sy.toFixed(1) + 'px';
          it.el.style.opacity = tmpVec.z < 1 ? '0.96' : '0';
        }
      }
    }
    animar();

    return {
      setEstilo: function (tipo) {
        var vdw = tipo === 'sp';
        atomMeshes.forEach(function (m) { m.scale.setScalar(m.userData.baseR * (vdw ? 2.05 : 1.0)); });
        bondMeshes.forEach(function (b) { b.visible = !vdw; });
      },
      setGirar: function (on) { girando = on; },
      setRotulos: function (on) {
        mostrarRotulos = on;
        labelsLayer.style.display = on ? 'block' : 'none';
      },
      getRotulos: function () { return mostrarRotulos; },
      resetar: function () { tRotY = 0.35; tRotX = 0.24; distAlvo = distBase; },
      atualizarTema: atualizarFundo,
      resize: resize
    };
  }

  function encontrarPlaquinha(dados) {
    var path = decodeURIComponent(window.location.pathname || '');
    var qs = new URLSearchParams(window.location.search || '');
    var todas = [];
    dados.forEach(function (s) {
      (s.ocorrencias || []).forEach(function (o) { todas.push({ sub: s, oc: o }); });
    });
    todas.sort(function (a, b) { return String(a.oc.codigo).localeCompare(String(b.oc.codigo)); });

    var mCod = (path + ' ' + window.location.search).match(/INF-G\d{2}-P\d+/i);
    if (mCod) {
      var cod = mCod[0].toUpperCase();
      var idx = todas.findIndex(function (x) { return String(x.oc.codigo).toUpperCase() === cod; });
      if (idx !== -1) return { atual: todas[idx], idx: idx, todas: todas };
    }

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
            '<a href="/">← Catálogo</a><span>·</span><a href="/mapa">Mapa do CEFET</a><span>·</span><span>' + esc(oc.zona) + '</span>' +
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
            '<section class="sub-panel ativo" id="panel-resumo">' +
              '<div class="sub-grid-2">' +
                '<div class="sub-info-box sub-card"><div class="sub-kicker">🔬 POR QUE ESTÁ AQUI?</div><p class="sub-body">' + esc(sub.porQueEstaAqui) + '</p></div>' +
                '<div class="sub-info-box sub-card"><div class="sub-kicker">📚 CLASSIFICAÇÃO QUÍMICA</div><p class="sub-body">' + esc(sub.justificativa) + '</p></div>' +
              '</div>' +
              '<div class="sub-info-box sub-card" style="margin-top:14px;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:8px;">' +
                  '<div class="sub-kicker" style="margin:0;">🌈 POSIÇÃO NA ESCALA DE pH (0 A 14)</div>' +
                  '<strong style="font-size:12px;color:' + phInfo.cor + ';">pH ≈ ' + ph.toFixed(1) + ' · ' + phInfo.txt + '</strong>' +
                '</div>' +
                '<div class="sub-ph-bar"><div class="sub-ph-marker" id="sub-ph-marker" style="left:50%;" data-alvo="' + phPct.toFixed(1) + '"></div></div>' +
                '<div class="sub-ph-legend"><span>0 · Ácido forte</span><span>7 · Neutro</span><span>14 · Base forte</span></div>' +
              '</div>' +
              equacaoHtml +
              '<div class="sub-grid-2" style="margin-top:14px;">' +
                '<details class="sub-acc sub-card" open><summary>💡 Curiosidade Científica</summary><p class="sub-body">' + esc(sub.curiosidade) + '</p></details>' +
                '<details class="sub-acc sub-card sub-warn" open><summary>⚠️ Segurança e Boas Práticas</summary><p class="sub-body">' + esc(segurancaTxt) + '</p></details>' +
              '</div>' +
            '</section>' +

            '<section class="sub-panel" id="panel-mol3d">' +
              '<div class="sub-card sub-info-box">' +
                '<div class="sub-mol-head">' +
                  '<div><div class="sub-kicker">🧬 VISUALIZADOR MOLECULAR STUDIO 4K</div><h2 class="sub-h2">' + esc(sub.nomeIupac) + ' (' + esc(sub.formula) + ')</h2></div>' +
                  '<div class="sub-mol-ctrls">' +
                    '<button type="button" id="s-mol-bs" class="btn ativo">Esferas</button>' +
                    '<button type="button" id="s-mol-sp" class="btn">Nuvem</button>' +
                    '<button type="button" id="s-mol-lbl" class="btn ativo">🏷️ Rótulos</button>' +
                    '<button type="button" id="s-mol-spin" class="btn ativo">🔄 Girar</button>' +
                    '<button type="button" id="s-mol-lock" class="btn">🔓 Toque Livre</button>' +
                  '</div>' +
                '</div>' +
                '<div class="sub-mol-stage">' +
                  '<div id="sub-mol-viewport"></div>' +
                  '<div id="sub-mol-shield" class="sub-mol-shield" style="display:none;">Toque bloqueado para facilitar rolagem no celular</div>' +
                  '<div id="sub-mol-loading" class="sub-mol-loading">Renderizando molécula em 4K...</div>' +
                '</div>' +
                '<div class="sub-mol-tip">Arraste para girar · Pinça/scroll para zoom · Cores 100% sincronizadas com a composição abaixo.</div>' +
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

            '<section class="sub-panel" id="panel-desafio">' +
              '<div class="sub-card sub-info-box"><div class="sub-kicker">⚡ DESAFIO RELÂMPAGO DESTA PLAQUINHA</div><div id="sub-quiz-area"></div></div>' +
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

        setTimeout(function () {
          var mk = document.getElementById('sub-ph-marker');
          if (mk) mk.style.left = mk.getAttribute('data-alvo') + '%';
        }, 120);

        var molCarregada = false;
        var molCtrl = null;
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
            } else if (id === 'mol3d' && molCtrl) {
              setTimeout(function () { molCtrl.resize(); }, 60);
            }
          };
        });

        function iniciarMol3D() {
          var vp = document.getElementById('sub-mol-viewport');
          var ld = document.getElementById('sub-mol-loading');
          Promise.all([carregarThree(), obterModeloVerificado(formulaLimpa)]).then(function (res) {
            if (ld) ld.style.display = 'none';
            molCtrl = criarVisualizador4K(vp, res[1]);

            var girando = true, travado = false;
            var btnLbl = document.getElementById('s-mol-lbl');
            var rotulosOn = molCtrl.getRotulos();
            btnLbl.classList.toggle('ativo', rotulosOn);

            document.getElementById('s-mol-bs').onclick = function () {
              this.classList.add('ativo'); document.getElementById('s-mol-sp').classList.remove('ativo'); molCtrl.setEstilo('bs');
            };
            document.getElementById('s-mol-sp').onclick = function () {
              this.classList.add('ativo'); document.getElementById('s-mol-bs').classList.remove('ativo'); molCtrl.setEstilo('sp');
            };
            btnLbl.onclick = function () {
              rotulosOn = !rotulosOn;
              this.classList.toggle('ativo', rotulosOn);
              molCtrl.setRotulos(rotulosOn);
            };
            document.getElementById('s-mol-spin').onclick = function () {
              girando = !girando; this.classList.toggle('ativo', girando); molCtrl.setGirar(girando);
            };
            document.getElementById('s-mol-lock').onclick = function () {
              travado = !travado;
              this.classList.toggle('ativo', travado);
              this.textContent = travado ? '🔒 Toque Travado' : '🔓 Toque Livre';
              document.getElementById('sub-mol-shield').style.display = travado ? 'flex' : 'none';
            };
            window.addEventListener('atq-tema-mudou', function () {
              if (molCtrl) molCtrl.atualizarTema();
            });
          }).catch(function () {
            if (ld) ld.innerHTML = 'WebGL indisponível neste aparelho para renderizar <strong>' + esc(sub.formula) + '</strong>.';
          });
        }

        var btnAudio = document.getElementById('sub-btn-audio');
        var falando = false;
        btnAudio.onclick = function () {
          if (!('speechSynthesis' in window)) { alert('Seu navegador não suporta leitura em voz alta.'); return; }
          if (falando) { window.speechSynthesis.cancel(); falando = false; btnAudio.textContent = '🔊 Ouvir ficha'; return; }
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

        document.getElementById('sub-btn-ia').onclick = function () {
          if (typeof window.abrirQuimicoBotIA === 'function') window.abrirQuimicoBotIA();
          else { var f = document.getElementById('qbot-ia-fab'); if (f) f.click(); }
        };

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

        var formulasOutras = embaralhar(Array.from(new Set(dados.map(function (s) { return s.formula; }).filter(function (f) { return f !== sub.formula; })))).slice(0, 3);
        var perguntas = [
          { enunciado: 'A substância "' + sub.nomeIupac + '" (' + sub.formula + ') pertence a qual função inorgânica?', opcoes: embaralhar(['Ácido', 'Base', 'Sal', 'Óxido']), correta: sub.classe, exp: sub.justificativa },
          { enunciado: 'Qual fórmula representa corretamente "' + sub.nomeIupac + '"?', opcoes: embaralhar([sub.formula].concat(formulasOutras)), correta: sub.formula, exp: sub.nomeIupac + ' tem fórmula ' + sub.formula + ' e aparece em ' + oc.zona + '.' }
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
            '<div class="sub-q-opts" id="sub-q-opts"></div><div id="sub-q-fb" style="margin-top:10px;"></div>';

          var optsEl = document.getElementById('sub-q-opts');
          var resp = false;
          q.opcoes.forEach(function (op) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'btn sub-q-opt'; b.textContent = op;
            b.onclick = function () {
              if (resp) return; resp = true;
              var ok = op === q.correta; if (ok) qPts++;
              Array.from(optsEl.children).forEach(function (x) {
                if (x.textContent === q.correta) x.classList.add('sub-opt-ok');
                else if (x === b && !ok) x.classList.add('sub-opt-err');
              });
              document.getElementById('sub-q-fb').innerHTML =
                '<div class="sub-q-feedback"><strong>' + (ok ? '✅ Correto! ' : '❌ Resposta certa: ' + esc(q.correta) + '. ') + '</strong>' + esc(q.exp) +
                '<div style="margin-top:10px;"><button type="button" id="sub-q-next" class="btn btn-primary">' + (qIdx + 1 < perguntas.length ? 'Próxima →' : 'Ver resultado') + '</button></div></div>';
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