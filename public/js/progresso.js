(function () {
  // =========================================================================
  // CONFIGURACAO RAPIDA DO PASSAPORTE (EDITE AQUI O @ DO INSTAGRAM E A META)
  // =========================================================================
  var CONFIG_PASSAPORTE = {
    instagramHandle: '@INSTAGRAM_DA_SALA', // Troque pelo @ real da turma (ex: '@1inf.cefet')
    metaBrinde: 38,                        // 38 = 100% das plaquinhas (altere se quiser liberar antes)
    tituloProjeto: 'AQUI TEM QUÍMICA!',
    subtituloSala: '1º Ano de Informática • CEFET-MG'
  };

  var KEY_VIS = 'atq_plaquinhas_visitadas_v1';
  var KEY_META = 'atq_passaporte_brinde_v2';

  function lerVisitadas() {
    try {
      var arr = JSON.parse(localStorage.getItem(KEY_VIS) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function salvarVisitadas(arr) {
    try { localStorage.setItem(KEY_VIS, JSON.stringify(arr)); } catch (e) {}
  }

  function lerMeta() {
    try { return JSON.parse(localStorage.getItem(KEY_META) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function salvarMeta(obj) {
    try { localStorage.setItem(KEY_META, JSON.stringify(obj)); } catch (e) {}
  }

  function gerarCodigoUnico() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    function bloco(n) {
      var s = '';
      for (var i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return s;
    }
    return 'ATQ-' + bloco(4) + '-' + bloco(4);
  }

  function garantirCodigoBrinde() {
    var meta = lerMeta();
    if (!meta.codigoValidacao) {
      var agora = new Date();
      meta.codigoValidacao = gerarCodigoUnico();
      meta.dataHora = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      salvarMeta(meta);
    }
    return meta;
  }

  // Detectar QR Code na URL (/plaquinha/INF-G01-P1 ou ?plaquinha=INF-G01-P1)
  var urlTxt = decodeURIComponent(window.location.pathname + ' ' + window.location.search);
  var matchCod = urlTxt.match(/INF-G\d{2}-P\d+/i);
  var visitadas = lerVisitadas();
  var novoCodigoDesbloqueado = null;

  if (matchCod) {
    var cod = matchCod[0].toUpperCase();
    if (visitadas.indexOf(cod) === -1) {
      visitadas.push(cod);
      salvarVisitadas(visitadas);
      novoCodigoDesbloqueado = cod;
    }
  }

  // Estilos dedicados do Passaporte + Toast + Vale-Brinde Mobile
  if (!document.getElementById('atq-pass-css')) {
    var st = document.createElement('style');
    st.id = 'atq-pass-css';
    st.textContent =
      '#atq-progresso-bar{position:fixed;left:14px;bottom:14px;z-index:9994;display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,rgba(20,11,36,0.96),rgba(74,44,109,0.94));color:#f7f3ff;padding:8px 14px;border-radius:999px;border:1px solid #c8a24d;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:13px;cursor:pointer;animation:atqNeonPulse 3.2s ease-in-out infinite;backdrop-filter:blur(8px);}' +
      '#atq-progresso-bar .atq-pill-dot{width:9px;height:9px;border-radius:50%;background:#f5d37a;box-shadow:0 0 10px #f5d37a;}' +
      '#atq-toast-selo{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:10020;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#190d2e,#4a2c6d);color:#fff;padding:12px 18px;border-radius:16px;border:1px solid #f5d37a;box-shadow:0 16px 40px rgba(0,0,0,0.55),0 0 26px rgba(192,132,252,0.55);font-family:"Plus Jakarta Sans",system-ui,sans-serif;max-width:92vw;}' +
      '.atq-stamp-badge{width:46px;height:46px;border-radius:50%;border:2px dashed #f5d37a;background:radial-gradient(circle,rgba(245,211,122,0.28),rgba(192,132,252,0.18));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;animation:atqStampDrop 0.55s cubic-bezier(0.22,1,0.36,1) forwards;}' +
      '.atq-modal-bg{position:fixed;inset:0;z-index:10010;background:rgba(8,4,16,0.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:12px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;}' +
      '.atq-modal-box{background:linear-gradient(160deg,#120922,#1c1033);color:#f7f3ff;width:min(760px,100%);max-height:92vh;overflow-y:auto;border-radius:20px;border:1px solid rgba(200,162,77,0.55);box-shadow:0 24px 64px rgba(0,0,0,0.65),0 0 36px rgba(168,85,247,0.35);padding:20px;}' +
      '[data-tema="claro"] .atq-modal-box{background:linear-gradient(160deg,#faf8fc,#f2ecfa);color:#221930;}' +
      '.atq-pass-tabs{display:flex;gap:8px;margin:12px 0 14px;flex-wrap:wrap;}' +
      '.atq-pass-tab{padding:8px 14px;border-radius:999px;border:1px solid rgba(200,162,77,0.45);background:rgba(74,44,109,0.28);color:inherit;font-weight:700;font-size:12px;cursor:pointer;}' +
      '.atq-pass-tab.ativo{background:linear-gradient(135deg,#6d4aa3,#9333ea);color:#fff;border-color:#f5d37a;box-shadow:0 0 16px rgba(192,132,252,0.5);}' +
      '.atq-selo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;}' +
      '.atq-selo-card{position:relative;padding:11px;border-radius:14px;text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:4px;transition:transform 0.2s ease,box-shadow 0.2s ease;}' +
      '.atq-selo-card.ok{background:linear-gradient(145deg,rgba(74,44,109,0.55),rgba(30,17,54,0.9));border:1px solid #f5d37a;box-shadow:0 0 16px rgba(245,211,122,0.22);}' +
      '[data-tema="claro"] .atq-selo-card.ok{background:linear-gradient(145deg,#fbf6ea,#f2ecfa);border:1px solid #c8a24d;color:#221930;}' +
      '.atq-selo-card.pendente{background:rgba(255,255,255,0.04);border:1px dashed rgba(192,132,252,0.32);opacity:0.82;}' +
      '[data-tema="claro"] .atq-selo-card.pendente{background:#f9eef4;border:1px dashed #c8a24d;color:#5c526d;}' +
      '.atq-selo-carimbo{display:inline-block;align-self:flex-start;font-size:10px;font-weight:800;letter-spacing:0.06em;padding:2px 8px;border-radius:999px;background:rgba(245,211,122,0.2);color:#f5d37a;border:1px solid #f5d37a;animation:atqStampDrop 0.45s ease;}' +
      '[data-tema="claro"] .atq-selo-carimbo{background:#fbf6ea;color:#8a681e;border-color:#c8a24d;}' +
      '.atq-brinde-card{max-width:390px;margin:6px auto;padding:22px 18px;border-radius:22px;background:radial-gradient(circle at top right,rgba(192,132,252,0.32),transparent 55%),linear-gradient(160deg,#160b2b,#2e1654 55%,#120822);color:#fff;border:2px solid #f5d37a;box-shadow:0 0 36px rgba(245,211,122,0.35),0 0 28px rgba(192,132,252,0.45);text-align:center;position:relative;overflow:hidden;}' +
      '.atq-brinde-selo{width:76px;height:76px;margin:0 auto 10px;border-radius:50%;border:2px solid #f5d37a;background:radial-gradient(circle,rgba(245,211,122,0.32),rgba(74,44,109,0.65));display:flex;align-items:center;justify-content:center;font-size:34px;box-shadow:0 0 24px rgba(245,211,122,0.55);animation:atqStampDrop 0.6s ease;}' +
      '.atq-brinde-cod{font-family:"JetBrains Mono",monospace;font-size:17px;font-weight:800;letter-spacing:0.12em;color:#f5d37a;background:rgba(0,0,0,0.38);padding:8px 14px;border-radius:10px;border:1px dashed rgba(245,211,122,0.7);display:inline-block;margin:8px 0 4px;}';
    document.head.appendChild(st);
  }

  // Motor de Confetes (Roxo + Dourado + Pastel + Ciano Neon)
  function dispararConfetes() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:10050;';
    document.body.appendChild(c);
    var ctx = c.getContext('2d');
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    var cores = ['#f5d37a', '#c8a24d', '#c084fc', '#e879f9', '#f2ecfa', '#22d3ee'];
    var pecas = [];
    for (var i = 0; i < 130; i++) {
      pecas.push({
        x: Math.random() * c.width,
        y: -20 - Math.random() * c.height * 0.6,
        w: 6 + Math.random() * 7,
        h: 4 + Math.random() * 5,
        vx: (Math.random() - 0.5) * 4,
        vy: 2.5 + Math.random() * 4.2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
        cor: cores[i % cores.length]
      });
    }
    var inicio = Date.now();
    function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      pecas.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.04;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.cor;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (Date.now() - inicio < 4200) requestAnimationFrame(tick);
      else c.remove();
    }
    requestAnimationFrame(tick);
  }

  // Toast animado ao desbloquear QR Code novo
  function mostrarToastSelo(cod, subNome, formula, qtd, total) {
    var oldT = document.getElementById('atq-toast-selo');
    if (oldT) oldT.remove();
    var t = document.createElement('div');
    t.id = 'atq-toast-selo';
    t.innerHTML =
      '<div class="atq-stamp-badge">🧪</div>' +
      '<div>' +
        '<div style="font-size:11px;font-weight:800;color:#f5d37a;letter-spacing:0.06em;">SELO DESBLOQUEADO • ' + qtd + '/' + total + '</div>' +
        '<div style="font-size:14px;font-weight:700;">' + cod + (subNome ? ' — ' + subNome + ' (' + formula + ')' : '') + '</div>' +
        '<div style="font-size:11px;color:#d8ccf0;">Carimbo registrado no seu Passaporte Químico!</div>' +
      '</div>';
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      t.style.opacity = '0';
      t.style.transform = 'translate(-50%, -14px)';
      setTimeout(function () { t.remove(); }, 520);
    }, 4400);
  }

  // Gerar PNG do Cartao de Vale-Brinde para download/Instagram
  function baixarCartaoPng(nome, codVal, dataHora, qtd, total) {
    var c = document.createElement('canvas');
    c.width = 1080; c.height = 1350;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 1080, 1350);
    g.addColorStop(0, '#120724'); g.addColorStop(0.55, '#34185c'); g.addColorStop(1, '#120724');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1350);

    ctx.strokeStyle = '#f5d37a'; ctx.lineWidth = 10; ctx.strokeRect(46, 46, 988, 1258);
    ctx.strokeStyle = 'rgba(192,132,252,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(68, 68, 944, 1214);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5d37a'; ctx.font = 'bold 30px sans-serif';
    ctx.fillText(CONFIG_PASSAPORTE.tituloProjeto + ' • ' + CONFIG_PASSAPORTE.subtituloSala, 540, 170);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('PASSAPORTE COMPLETO', 540, 310);

    ctx.fillStyle = '#c084fc'; ctx.font = 'bold 32px sans-serif';
    ctx.fillText('VALE-BRINDE OFICIAL • ' + qtd + '/' + total + ' QR CODES', 540, 380);

    ctx.fillStyle = '#e9d5ff'; ctx.font = '28px sans-serif';
    ctx.fillText('Explorador(a):', 540, 520);
    ctx.fillStyle = '#f5d37a'; ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText((nome || 'Visitante Químico').slice(0, 28), 540, 595);

    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(210, 680, 660, 145);
    ctx.strokeStyle = '#f5d37a'; ctx.lineWidth = 3; ctx.strokeRect(210, 680, 660, 145);
    ctx.fillStyle = '#f5d37a'; ctx.font = 'bold 48px monospace';
    ctx.fillText(codVal, 540, 755);
    ctx.fillStyle = '#cbd5e1'; ctx.font = '24px sans-serif';
    ctx.fillText('Validado em ' + dataHora, 540, 802);

    ctx.fillStyle = '#ffffff'; ctx.font = '30px sans-serif';
    ctx.fillText('Envie este print no Direct de ' + CONFIG_PASSAPORTE.instagramHandle, 540, 990);
    ctx.fillText('para retirar seu brinde na hora!', 540, 1038);

    ctx.fillStyle = '#c084fc'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText('aqui-tem-quimica-inf.onrender.com', 540, 1210);

    var a = document.createElement('a');
    a.download = 'vale-brinde-aqui-tem-quimica.png';
    a.href = c.toDataURL('image/png');
    a.click();
  }

  // Criar Botao Flutuante do Passaporte
  var oldBar = document.getElementById('atq-progresso-bar');
  if (oldBar) oldBar.remove();

  var completoAgora = visitadas.length >= CONFIG_PASSAPORTE.metaBrinde;
  var bar = document.createElement('button');
  bar.type = 'button';
  bar.id = 'atq-progresso-bar';
  bar.innerHTML =
    '<span class="atq-pill-dot"></span>' +
    '<span>Passaporte • <strong>' + visitadas.length + '/' + CONFIG_PASSAPORTE.metaBrinde + '</strong></span>' +
    (completoAgora ? '<span style="background:#f5d37a;color:#140b24;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:800;">🏆 Brinde</span>' : '');
  document.body.appendChild(bar);

  var cacheDados = null;
  function obterDados() {
    if (cacheDados) return Promise.resolve(cacheDados);
    return fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (d) {
      cacheDados = d;
      return d;
    });
  }

  function abrirModal(abaInicial) {
    obterDados().then(function (dados) {
      var visSet = new Set(lerVisitadas());
      var todas = [];
      dados.forEach(function (s) {
        (s.ocorrencias || []).forEach(function (o) {
          todas.push({
            codigo: String(o.codigo).toUpperCase(),
            zona: o.zona,
            localExato: o.localExato,
            nome: s.nomeIupac,
            formula: s.formula,
            classe: s.classe,
            ok: visSet.has(String(o.codigo).toUpperCase())
          });
        });
      });
      todas.sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });

      var totalReal = todas.length || CONFIG_PASSAPORTE.metaBrinde;
      var metaAlvo = Math.min(CONFIG_PASSAPORTE.metaBrinde, totalReal);
      var qtd = visSet.size;
      var pct = Math.min(100, Math.round((qtd / metaAlvo) * 100));
      var desbloqueado = qtd >= metaAlvo;
      var aba = abaInicial || (desbloqueado ? 'brinde' : 'selos');
      var filtro = 'todos';

      var bg = document.createElement('div');
      bg.className = 'atq-modal-bg';
      bg.id = 'atq-passaporte-modal';
      bg.innerHTML = '<div class="atq-modal-box" id="atq-pass-conteudo"></div>';
      document.body.appendChild(bg);
      bg.addEventListener('click', function (ev) { if (ev.target === bg) bg.remove(); });

      function renderModal() {
        var box = document.getElementById('atq-pass-conteudo');
        var igLimpo = CONFIG_PASSAPORTE.instagramHandle.replace(/^@/, '');
        var igUrl = 'https://instagram.com/' + encodeURIComponent(igLimpo);

        var cabecalho =
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">' +
            '<div>' +
              '<div style="font-size:11px;font-weight:800;letter-spacing:0.08em;color:#f5d37a;">CADERNO DE CAMPO • ' + CONFIG_PASSAPORTE.tituloProjeto + '</div>' +
              '<h3 style="margin:2px 0 0;font-size:22px;font-family:\'Playfair Display\',serif;">Passaporte Químico</h3>' +
            '</div>' +
            '<button type="button" id="atq-close-m" style="background:rgba(255,255,255,0.12);color:inherit;border:1px solid rgba(200,162,77,0.4);border-radius:10px;padding:7px 12px;cursor:pointer;font-weight:700;">✕</button>' +
          '</div>' +
          '<div style="margin-top:12px;display:flex;justify-content:space-between;font-size:12px;">' +
            '<span>Progresso para o Vale-Brinde: <strong>' + qtd + '/' + metaAlvo + '</strong></span>' +
            '<strong style="color:#f5d37a;">' + pct + '%</strong>' +
          '</div>' +
          '<div style="height:10px;background:rgba(255,255,255,0.12);border-radius:999px;overflow:hidden;margin-top:5px;border:1px solid rgba(200,162,77,0.3);">' +
            '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#6d4aa3,#c084fc,#f5d37a);box-shadow:0 0 14px #f5d37a;transition:width 0.4s ease;"></div>' +
          '</div>' +
          '<div class="atq-pass-tabs">' +
            '<button type="button" class="atq-pass-tab ' + (aba === 'selos' ? 'ativo' : '') + '" data-aba="selos">📖 Meus Selos (' + qtd + '/' + totalReal + ')</button>' +
            '<button type="button" class="atq-pass-tab ' + (aba === 'brinde' ? 'ativo' : '') + '" data-aba="brinde">' + (desbloqueado ? '🏆 Vale-Brinde Liberado!' : '🔒 Vale-Brinde (' + (metaAlvo - qtd) + ' restantes)') + '</button>' +
          '</div>';

        var corpo = '';
        if (aba === 'selos') {
          var filtrados = todas.filter(function (x) {
            if (filtro === 'ok') return x.ok;
            if (filtro === 'falta') return !x.ok;
            return true;
          });
          var filtrosHtml =
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">' +
              '<button type="button" class="atq-pass-tab ' + (filtro === 'todos' ? 'ativo' : '') + '" data-flt="todos">Todos (' + todas.length + ')</button>' +
              '<button type="button" class="atq-pass-tab ' + (filtro === 'ok' ? 'ativo' : '') + '" data-flt="ok">Carimbados (' + qtd + ')</button>' +
              '<button type="button" class="atq-pass-tab ' + (filtro === 'falta' ? 'ativo' : '') + '" data-flt="falta">Pendentes (' + (todas.length - qtd) + ')</button>' +
            '</div>';

          var gridHtml = filtrados.map(function (item) {
            if (item.ok) {
              return '<a href="/plaquinha/' + encodeURIComponent(item.codigo) + '" class="atq-selo-card ok">' +
                '<span class="atq-selo-carimbo">✓ CARIMBADO</span>' +
                '<strong style="font-size:13px;margin-top:4px;">' + item.nome + '</strong>' +
                '<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#c084fc;">' + item.codigo + ' • ' + item.formula + '</span>' +
                '<span style="font-size:11px;opacity:0.85;">📍 ' + item.zona + '</span>' +
              '</a>';
            }
            return '<a href="/mapa?guiar=' + encodeURIComponent(item.codigo) + '" class="atq-selo-card pendente">' +
              '<span style="font-size:10px;font-weight:700;opacity:0.75;">🔒 ' + item.codigo + '</span>' +
              '<strong style="font-size:12px;">Dica: ' + item.zona + '</strong>' +
              '<span style="font-size:11px;opacity:0.78;">Procure em: ' + item.localExato + '</span>' +
              '<span style="margin-top:4px;font-size:11px;font-weight:700;color:#c89b3c;">🧭 Toque para abrir GPS →</span>' +
            '</a>';
          }).join('');

          corpo = filtrosHtml + '<div class="atq-selo-grid">' + gridHtml + '</div>';
        } else if (desbloqueado) {
          var meta = garantirCodigoBrinde();
          var nomeAtual = meta.nomeVisitante || '';
          corpo =
            '<div class="atq-brinde-card" id="atq-cartao-print">' +
              '<div class="atq-brinde-selo">🏆</div>' +
              '<div style="font-size:11px;letter-spacing:0.12em;font-weight:800;color:#f5d37a;">PASSAPORTE COMPLETO • 100%</div>' +
              '<h3 style="margin:6px 0 4px;font-size:24px;color:#fff;font-family:\'Playfair Display\',serif;">Vale-Brinde Oficial</h3>' +
              '<div style="font-size:12px;color:#d8ccf0;">' + CONFIG_PASSAPORTE.tituloProjeto + ' • ' + CONFIG_PASSAPORTE.subtituloSala + '</div>' +
              '<div id="atq-nome-preview" style="margin:12px 0 4px;font-size:19px;font-weight:800;color:#f5d37a;font-family:\'Playfair Display\',serif;">' + (nomeAtual ? nomeAtual : 'Explorador(a) Químico(a)') + '</div>' +
              '<div class="atq-brinde-cod">' + meta.codigoValidacao + '</div>' +
              '<div style="font-size:11px;color:#c3b7dc;margin-bottom:12px;">Validado em ' + meta.dataHora + ' • ' + qtd + '/' + totalReal + ' selos</div>' +
              '<p style="margin:0;padding:10px 12px;border-radius:12px;background:rgba(245,211,122,0.12);border:1px solid rgba(245,211,122,0.35);font-size:12px;line-height:1.45;color:#fff;">' +
                '📸 <strong>Tire um print desta tela</strong> e envie no Direct do <strong>' + CONFIG_PASSAPORTE.instagramHandle + '</strong> para retirar seu brinde na hora!' +
              '</p>' +
            '</div>' +
            '<div style="max-width:390px;margin:12px auto 0;display:flex;flex-direction:column;gap:8px;">' +
              '<input type="text" id="atq-brinde-nome" value="' + nomeAtual.replace(/"/g, '&quot;') + '" placeholder="Seu nome (opcional, aparece no cartão acima)" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid rgba(200,162,77,0.45);background:rgba(0,0,0,0.22);color:inherit;font-size:13px;">' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                '<a href="' + igUrl + '" target="_blank" rel="noopener" style="flex:1;text-align:center;text-decoration:none;padding:10px 14px;border-radius:10px;background:linear-gradient(135deg,#c026d3,#7c3aed);color:#fff;font-weight:800;font-size:13px;border:1px solid #f5d37a;">📲 Abrir Instagram</a>' +
                '<button type="button" id="atq-dl-brinde" style="flex:1;padding:10px 14px;border-radius:10px;background:linear-gradient(135deg,#c8a24d,#f5d37a);color:#140b24;font-weight:800;font-size:13px;border:0;cursor:pointer;">💾 Baixar Cartão PNG</button>' +
              '</div>' +
            '</div>';
        } else {
          corpo =
            '<div style="text-align:center;padding:24px 14px;">' +
              '<div style="font-size:42px;margin-bottom:8px;">🔒</div>' +
              '<h4 style="margin:0 0 6px;font-size:18px;font-family:\'Playfair Display\',serif;">Quase lá! Faltam ' + (metaAlvo - qtd) + ' plaquinhas</h4>' +
              '<p style="font-size:13px;opacity:0.85;max-width:440px;margin:0 auto 14px;">Escaneie os QR Codes espalhados pelas 9 zonas do campus para completar seu Passaporte e desbloquear o <strong>Cartão de Vale-Brinde</strong> com código exclusivo para o Instagram <strong>' + CONFIG_PASSAPORTE.instagramHandle + '</strong>.</p>' +
              '<button type="button" id="atq-ver-pistas" class="atq-pass-tab ativo">Ver pistas dos QR Codes que faltam</button>' +
            '</div>';
        }

        box.innerHTML = cabecalho + corpo;
        document.getElementById('atq-close-m').onclick = function () { bg.remove(); };

        Array.from(box.querySelectorAll('[data-aba]')).forEach(function (b) {
          b.onclick = function () { aba = b.getAttribute('data-aba'); renderModal(); };
        });
        Array.from(box.querySelectorAll('[data-flt]')).forEach(function (b) {
          b.onclick = function () { filtro = b.getAttribute('data-flt'); renderModal(); };
        });

        var btnPistas = document.getElementById('atq-ver-pistas');
        if (btnPistas) btnPistas.onclick = function () { aba = 'selos'; filtro = 'falta'; renderModal(); };

        var inpNome = document.getElementById('atq-brinde-nome');
        if (inpNome) {
          inpNome.addEventListener('input', function () {
            var m = garantirCodigoBrinde();
            m.nomeVisitante = inpNome.value.trim();
            salvarMeta(m);
            document.getElementById('atq-nome-preview').textContent = m.nomeVisitante || 'Explorador(a) Químico(a)';
          });
        }
        var btnDl = document.getElementById('atq-dl-brinde');
        if (btnDl) {
          btnDl.onclick = function () {
            var m = garantirCodigoBrinde();
            baixarCartaoPng(m.nomeVisitante, m.codigoValidacao, m.dataHora, qtd, totalReal);
          };
        }
      }

      renderModal();
    }).catch(function () { alert('Não foi possível abrir o Passaporte agora.'); });
  }

  bar.addEventListener('click', function () { abrirModal(); });

  // Disparar toast + carimbo se acabou de escanear QR Code novo
  if (novoCodigoDesbloqueado) {
    obterDados().then(function (dados) {
      var nome = '', formula = '';
      dados.forEach(function (s) {
        (s.ocorrencias || []).forEach(function (o) {
          if (String(o.codigo).toUpperCase() === novoCodigoDesbloqueado) {
            nome = s.nomeIupac;
            formula = s.formula;
          }
        });
      });
      mostrarToastSelo(novoCodigoDesbloqueado, nome, formula, visitadas.length, CONFIG_PASSAPORTE.metaBrinde);

      if (visitadas.length >= CONFIG_PASSAPORTE.metaBrinde) {
        var meta = garantirCodigoBrinde();
        if (!meta.jaCelebrou) {
          meta.jaCelebrou = true;
          salvarMeta(meta);
          dispararConfetes();
          setTimeout(function () { abrirModal('brinde'); }, 1200);
        }
      }
    }).catch(function () {
      mostrarToastSelo(novoCodigoDesbloqueado, '', '', visitadas.length, CONFIG_PASSAPORTE.metaBrinde);
    });
  }
})();