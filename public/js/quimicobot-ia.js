(function () {
  if (document.getElementById('qbot-ia-root')) return;

  function ocultarBotAntigo() {
    document.querySelectorAll('img[src*="bot-avatar"]').forEach(function (img) {
      if (img.closest('#qbot-ia-root')) return;
      var el = img;
      while (el && el !== document.body) {
        if (el.id === 'qbot-ia-root') return;
        var st = window.getComputedStyle(el);
        if (st.position === 'fixed') {
          el.style.display = 'none';
          break;
        }
        el = el.parentElement;
      }
    });
    ['bot-fab', 'bot-widget', 'chat-widget', 'quimicobot-fab', 'quimicobot-panel'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n && !n.closest('#qbot-ia-root')) n.style.display = 'none';
    });
  }

  function detectarCodigoAtual() {
    var urlTxt = decodeURIComponent(window.location.pathname + ' ' + window.location.search);
    var mCod = urlTxt.match(/INF-G\d{2}-P\d+/i);
    if (mCod) return mCod[0].toUpperCase();
    var pill = document.querySelector('.sub-code-pill');
    if (pill) {
      var m2 = (pill.textContent || '').match(/INF-G\d{2}-P\d+/i);
      if (m2) return m2[0].toUpperCase();
    }
    return '';
  }

  var codigoAtual = detectarCodigoAtual();

  var style = document.createElement('style');
  style.textContent =
    '#qbot-ia-fab{position:fixed!important;right:16px!important;bottom:16px!important;z-index:9997!important;display:flex!important;visibility:visible!important;opacity:1!important;align-items:center;gap:9px;background:linear-gradient(135deg,#4a2c6d,#9333ea);color:#fff;border:1.5px solid #f5d37a;border-radius:999px;padding:8px 15px 8px 8px;cursor:pointer;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:13px;font-weight:800;box-shadow:0 10px 28px rgba(124,77,255,0.48),0 0 12px rgba(245,211,122,0.35);transition:transform 0.18s;}' +
    '#qbot-ia-fab:hover{transform:translateY(-2px) scale(1.03);}' +
    '#qbot-ia-fab img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #f5d37a;}' +
    '#qbot-ia-panel{position:fixed;right:16px;bottom:76px;z-index:9998;width:min(410px,calc(100vw - 24px));height:min(560px,calc(100vh - 108px));background:#120922;color:#f7f3ff;border:1.5px solid #c8a24d;border-radius:18px;box-shadow:0 22px 55px rgba(0,0,0,0.62);display:none;flex-direction:column;overflow:hidden;font-family:"Plus Jakarta Sans",system-ui,sans-serif;}' +
    '#qbot-ia-panel.aberto{display:flex!important;}' +
    '.qbot-hdr{background:linear-gradient(135deg,#321a52,#6d4aa3);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(200,162,77,0.35);color:#fff;}' +
    '.qbot-hdr-l{display:flex;align-items:center;gap:10px;}' +
    '.qbot-hdr-l img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #f5d37a;}' +
    '.qbot-badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:999px;background:rgba(34,197,94,0.22);color:#bbf7d0;border:1px solid rgba(34,197,94,0.5);margin-top:2px;}' +
    '.qbot-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;background:#0b0614;}' +
    '.qbot-m{max-width:88%;padding:10px 12px;border-radius:14px;font-size:13px;line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere;}' +
    '.qbot-m.bot{align-self:flex-start;background:#1f1336;color:#f7f3ff;border-bottom-left-radius:4px;border:1px solid rgba(200,162,77,0.28);}' +
    '.qbot-m.user{align-self:flex-end;background:linear-gradient(135deg,#6d4aa3,#9333ea);color:#fff;border-bottom-right-radius:4px;}' +
    '.qbot-fonte{font-size:10px;opacity:0.75;margin-top:6px;}' +
    '.qbot-chips{display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;background:#120922;border-top:1px solid rgba(200,162,77,0.2);}' +
    '.qbot-chip{background:#1f1336;color:#f5d37a;border:1px solid rgba(200,162,77,0.38);border-radius:999px;padding:4px 9px;font-size:11px;cursor:pointer;}' +
    '.qbot-form{display:flex;gap:8px;padding:10px;background:#120922;border-top:1px solid rgba(200,162,77,0.24);}' +
    '.qbot-form input{flex:1;background:#1f1336;color:#f7f3ff;border:1px solid rgba(200,162,77,0.4);border-radius:10px;padding:9px 11px;font-size:13px;outline:none;}' +
    '.qbot-form button{background:linear-gradient(135deg,#6d4aa3,#9333ea);color:#fff;border:1px solid #f5d37a;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer;font-size:13px;}' +
    '.qbot-form button:disabled{opacity:0.55;cursor:wait;}' +
    '@keyframes qbotBlink{0%,80%,100%{opacity:0.25;}40%{opacity:1;}}' +
    '.qbot-dots span{display:inline-block;animation:qbotBlink 1.2s infinite;margin-right:2px;}' +
    '.qbot-dots span:nth-child(2){animation-delay:0.2s;}.qbot-dots span:nth-child(3){animation-delay:0.4s;}' +
    '@media print{#qbot-ia-root{display:none!important;}}';
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.id = 'qbot-ia-root';
  root.innerHTML =
    '<button type="button" id="qbot-ia-fab" aria-label="Abrir QuímicoBot IA">' +
      '<img src="/assets/img/bot-avatar.jpg" alt="IA">' +
      '<span>QuímicoBot IA</span>' +
    '</button>' +
    '<div id="qbot-ia-panel" role="dialog" aria-label="QuímicoBot IA">' +
      '<div class="qbot-hdr">' +
        '<div class="qbot-hdr-l">' +
          '<img src="/assets/img/bot-avatar.jpg" alt="IA">' +
          '<div><div style="font-weight:800;font-size:14px;">QuímicoBot IA</div><span id="qbot-ia-status" class="qbot-badge">● Conectando...</span></div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button type="button" id="qbot-ia-clear" title="Limpar conversa" style="background:rgba(0,0,0,0.3);color:#fff;border:0;border-radius:8px;padding:5px 8px;cursor:pointer;font-size:12px;">🗑️</button>' +
          '<button type="button" id="qbot-ia-close" title="Fechar" style="background:rgba(0,0,0,0.3);color:#fff;border:0;border-radius:8px;padding:5px 9px;cursor:pointer;font-weight:700;">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="qbot-msgs" id="qbot-ia-msgs"></div>' +
      '<div class="qbot-chips" id="qbot-ia-chips"></div>' +
      '<form class="qbot-form" id="qbot-ia-form">' +
        '<input type="text" id="qbot-ia-input" placeholder="Pergunte sobre química ou qualquer tema..." autocomplete="off">' +
        '<button type="submit" id="qbot-ia-send">Enviar</button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  ocultarBotAntigo();
  setTimeout(ocultarBotAntigo, 700);

  var panel = document.getElementById('qbot-ia-panel');
  var msgsEl = document.getElementById('qbot-ia-msgs');
  var inputEl = document.getElementById('qbot-ia-input');
  var sendBtn = document.getElementById('qbot-ia-send');
  var statusEl = document.getElementById('qbot-ia-status');
  var chipsEl = document.getElementById('qbot-ia-chips');
  var historico = [];
  var enviando = false;

  function formatar(txt) {
    var safe = String(txt || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    var linhas = safe.split('\n');
    var out = [];
    for (var i = 0; i < linhas.length; i++) {
      var l = linhas[i];
      if (/^#{1,4}\s+/.test(l)) {
        l = '<strong>' + l.replace(/^#{1,4}\s+/, '') + '</strong>';
      } else if (/^\s*[-*•]\s+/.test(l)) {
        l = '• ' + l.replace(/^\s*[-*•]\s+/, '');
      }
      l = l
        .replace(/`([^`]+)`/g, '<code style="padding:1px 5px;border-radius:5px;background:rgba(200,162,77,0.18);font-family:monospace;font-size:12px;">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
        .replace(/(^|\s)_([^_\n]+)_(?=\s|[.,!?;:]|$)/g, '$1<em>$2</em>');
      out.push(l);
    }
    return out.join('<br>');
  }

  function addMsg(autor, texto, fonte, ehHtmlBruto) {
    var div = document.createElement('div');
    div.className = 'qbot-m ' + autor;
    div.innerHTML = (ehHtmlBruto ? texto : formatar(texto)) + (fonte ? '<div class="qbot-fonte">⚡ ' + fonte + '</div>' : '');
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return div;
  }

  function boasVindas() {
    msgsEl.innerHTML = '';
    historico = [];
    codigoAtual = detectarCodigoAtual();
    var intro = codigoAtual
      ? 'Olá! Vejo que você está na plaquinha **' + codigoAtual + '**. Pergunte sobre esta substância, outras plaquinhas do CEFET ou qualquer outro tema!'
      : 'Olá! Sou o **QuímicoBot IA** 🧪. Pergunte sobre as **38 plaquinhas** do CEFET-MG, Química ou qualquer assunto!';
    addMsg('bot', intro, 'Online');
  }

  var sugestoes = codigoAtual
    ? ['Resuma esta plaquinha', 'Qual a diferença entre ácido e base?', 'Posso misturar água sanitária e vinagre?', 'O que é pH?']
    : ['Qual a diferença entre ácido e base?', 'Quais plaquinhas tem no Laboratório?', 'Posso misturar água sanitária e amônia?', 'O que é fotossíntese?'];

  chipsEl.innerHTML = sugestoes.map(function (s) {
    return '<button type="button" class="qbot-chip">' + s + '</button>';
  }).join('');
  Array.from(chipsEl.querySelectorAll('.qbot-chip')).forEach(function (b) {
    b.onclick = function () { enviar(b.textContent); };
  });

  function chamarApi(payload, tentativasRestantes) {
    return fetch('/api/quimicobot-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).catch(function (err) {
      if (tentativasRestantes > 0) {
        return new Promise(function (res) { setTimeout(res, 1200); }).then(function () {
          return chamarApi(payload, tentativasRestantes - 1);
        });
      }
      throw err;
    });
  }

  function enviar(texto) {
    var msg = String(texto || '').trim();
    if (!msg || enviando) return;
    enviando = true;
    sendBtn.disabled = true;
    codigoAtual = detectarCodigoAtual();

    var histEnvio = historico.slice(-8);
    addMsg('user', msg);
    historico.push({ autor: 'user', texto: msg });
    inputEl.value = '';
    var loading = addMsg('bot', 'Pensando <span class="qbot-dots"><span>●</span><span>●</span><span>●</span></span>', '', true);

    chamarApi({ mensagem: msg, historico: histEnvio, codigoAtual: codigoAtual }, 1)
      .then(function (data) {
        loading.remove();
        var resp = (data && data.resposta) || 'Não consegui formular uma resposta agora. Tente perguntar de outro jeito!';
        addMsg('bot', resp, data && data.fonte);
        historico.push({ autor: 'bot', texto: resp });
      })
      .catch(function () {
        loading.remove();
        addMsg('bot', 'Erro temporário de conexão com o servidor. Tente enviar novamente em alguns segundos.', 'Offline');
      })
      .finally(function () {
        enviando = false;
        sendBtn.disabled = false;
        inputEl.focus();
      });
  }

  function toggleChat() {
    panel.classList.toggle('aberto');
    if (panel.classList.contains('aberto')) inputEl.focus();
  }

  window.abrirQuimicoBotIA = function () {
    panel.classList.add('aberto');
    inputEl.focus();
  };

  document.getElementById('qbot-ia-fab').onclick = toggleChat;
  document.getElementById('qbot-ia-close').onclick = function () { panel.classList.remove('aberto'); };
  document.getElementById('qbot-ia-clear').onclick = boasVindas;
  document.getElementById('qbot-ia-form').onsubmit = function (e) { e.preventDefault(); enviar(inputEl.value); };

  fetch('/api/quimicobot-ia/status')
    .then(function (r) { return r.json(); })
    .then(function (s) { statusEl.textContent = '● ' + (s.modo || 'Online'); })
    .catch(function () { statusEl.textContent = '● Online'; });

  boasVindas();
})();