(function () {
  if (document.getElementById('qbot-ia-root')) return;

  // Ocultar widget antigo se existir (evita dois botoes sobrepostos no canto direito)
  function ocultarBotAntigo() {
    var imgs = document.querySelectorAll('img[src*="bot-avatar"]');
    imgs.forEach(function (img) {
      var el = img;
      while (el && el !== document.body) {
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
      if (n) n.style.display = 'none';
    });
  }
  ocultarBotAntigo();
  setTimeout(ocultarBotAntigo, 600);

  var urlTxt = decodeURIComponent(window.location.pathname + ' ' + window.location.search);
  var mCod = urlTxt.match(/INF-G\d{2}-P\d+/i);
  var codigoAtual = mCod ? mCod[0].toUpperCase() : '';

  var style = document.createElement('style');
  style.textContent =
    '#qbot-ia-fab{position:fixed;right:16px;bottom:16px;z-index:9995;display:flex;align-items:center;gap:9px;background:linear-gradient(135deg,#0284c7,#1d4ed8);color:#fff;border:1px solid rgba(125,211,252,0.55);border-radius:999px;padding:8px 14px 8px 8px;cursor:pointer;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:700;box-shadow:0 10px 28px rgba(2,132,199,0.45);transition:transform 0.18s;}' +
    '#qbot-ia-fab:hover{transform:translateY(-2px) scale(1.02);}' +
    '#qbot-ia-fab img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #bae6fd;}' +
    '#qbot-ia-panel{position:fixed;right:16px;bottom:74px;z-index:9996;width:min(395px,calc(100vw - 24px));height:min(560px,calc(100vh - 104px));background:#0f172a;color:#f8fafc;border:1px solid rgba(56,189,248,0.42);border-radius:18px;box-shadow:0 22px 55px rgba(0,0,0,0.58);display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;}' +
    '#qbot-ia-panel.aberto{display:flex;}' +
    '.qbot-hdr{background:linear-gradient(135deg,#0c4a6e,#1e3a8a);padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(148,163,184,0.22);}' +
    '.qbot-hdr-l{display:flex;align-items:center;gap:10px;}' +
    '.qbot-hdr-l img{width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #38bdf8;}' +
    '.qbot-badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:999px;background:rgba(34,197,94,0.2);color:#86efac;border:1px solid rgba(34,197,94,0.45);margin-top:2px;}' +
    '.qbot-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;background:#020617;}' +
    '.qbot-m{max-width:86%;padding:10px 12px;border-radius:14px;font-size:13px;line-height:1.48;word-wrap:break-word;}' +
    '.qbot-m.bot{align-self:flex-start;background:#1e293b;color:#f1f5f9;border-bottom-left-radius:4px;border:1px solid rgba(148,163,184,0.18);}' +
    '.qbot-m.user{align-self:flex-end;background:#0284c7;color:#fff;border-bottom-right-radius:4px;}' +
    '.qbot-fonte{font-size:10px;color:#94a3b8;margin-top:5px;}' +
    '.qbot-chips{display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;background:#0f172a;border-top:1px solid rgba(148,163,184,0.15);}' +
    '.qbot-chip{background:#1e293b;color:#bae6fd;border:1px solid rgba(56,189,248,0.3);border-radius:999px;padding:4px 9px;font-size:11px;cursor:pointer;}' +
    '.qbot-chip:hover{background:#0284c7;color:#fff;}' +
    '.qbot-form{display:flex;gap:8px;padding:10px;background:#0f172a;border-top:1px solid rgba(148,163,184,0.18);}' +
    '.qbot-form input{flex:1;background:#1e293b;color:#f8fafc;border:1px solid #334155;border-radius:10px;padding:9px 11px;font-size:13px;outline:none;}' +
    '.qbot-form input:focus{border-color:#38bdf8;}' +
    '.qbot-form button{background:#0284c7;color:#fff;border:0;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer;font-size:13px;}' +
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
          '<button type="button" id="qbot-ia-clear" title="Limpar conversa" style="background:rgba(15,23,42,0.5);color:#cbd5e1;border:0;border-radius:8px;padding:5px 8px;cursor:pointer;font-size:12px;">🗑️</button>' +
          '<button type="button" id="qbot-ia-close" title="Fechar" style="background:rgba(15,23,42,0.5);color:#fff;border:0;border-radius:8px;padding:5px 9px;cursor:pointer;font-weight:700;">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="qbot-msgs" id="qbot-ia-msgs"></div>' +
      '<div class="qbot-chips" id="qbot-ia-chips"></div>' +
      '<form class="qbot-form" id="qbot-ia-form">' +
        '<input type="text" id="qbot-ia-input" placeholder="Pergunte sobre química ou qualquer tema..." autocomplete="off">' +
        '<button type="submit">Enviar</button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  var panel = document.getElementById('qbot-ia-panel');
  var msgsEl = document.getElementById('qbot-ia-msgs');
  var inputEl = document.getElementById('qbot-ia-input');
  var statusEl = document.getElementById('qbot-ia-status');
  var chipsEl = document.getElementById('qbot-ia-chips');
  var historico = [];

  function formatarTexto(txt) {
    var esc = String(txt || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    esc = esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    esc = esc.replace(/_(.+?)_/g, '<em>$1</em>');
    esc = esc.replace(/\n/g, '<br>');
    return esc;
  }

  function addMsg(autor, texto, fonte) {
    var div = document.createElement('div');
    div.className = 'qbot-m ' + autor;
    div.innerHTML = formatarTexto(texto) + (fonte ? '<div class="qbot-fonte">⚡ ' + fonte + '</div>' : '');
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return div;
  }

  function boasVindas() {
    msgsEl.innerHTML = '';
    historico = [];
    var intro = codigoAtual
      ? 'Olá! Vejo que você está na plaquinha **' + codigoAtual + '**. Pergunte sobre esta substância, outras plaquinhas do campus ou qualquer outro assunto!'
      : 'Olá! Sou o **QuímicoBot IA** 🧪. Pode perguntar sobre as **38 plaquinhas** da escola, tirar dúvidas de Química ou fazer perguntas sobre qualquer outro tema!';
    addMsg('bot', intro, 'Pronto para ajudar');
  }

  var sugestoes = codigoAtual
    ? ['Resuma esta plaquinha', 'Qual a diferença entre ácido e base?', 'Posso misturar água sanitária e vinagre?', 'O que é tabela periódica?']
    : ['Qual a diferença entre ácido e base?', 'Quais plaquinhas tem no Laboratório?', 'Posso misturar água sanitária e amônia?', 'O que é fotossíntese?'];

  chipsEl.innerHTML = sugestoes.map(function (s) {
    return '<button type="button" class="qbot-chip">' + s + '</button>';
  }).join('');

  Array.from(chipsEl.querySelectorAll('.qbot-chip')).forEach(function (b) {
    b.onclick = function () { enviar(b.textContent); };
  });

  function enviar(texto) {
    var msg = String(texto || '').trim();
    if (!msg) return;
    addMsg('user', msg);
    historico.push({ autor: 'user', texto: msg });
    inputEl.value = '';

    var loading = addMsg('bot', 'Pensando...', '');
    fetch('/api/quimicobot-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: msg, historico: historico.slice(-8), codigoAtual: codigoAtual })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        loading.remove();
        var resp = (data && data.resposta) || 'Não consegui responder agora. Tente novamente.';
        addMsg('bot', resp, data && data.fonte);
        historico.push({ autor: 'bot', texto: resp });
      })
      .catch(function () {
        loading.remove();
        addMsg('bot', 'Erro de conexão com o servidor. Tente novamente em instantes.', 'Offline');
      });
  }

  document.getElementById('qbot-ia-fab').onclick = function () {
    panel.classList.toggle('aberto');
    if (panel.classList.contains('aberto')) inputEl.focus();
  };
  document.getElementById('qbot-ia-close').onclick = function () { panel.classList.remove('aberto'); };
  document.getElementById('qbot-ia-clear').onclick = boasVindas;
  document.getElementById('qbot-ia-form').onsubmit = function (e) { e.preventDefault(); enviar(inputEl.value); };

  fetch('/api/quimicobot-ia/status')
    .then(function (r) { return r.json(); })
    .then(function (s) { statusEl.textContent = '● ' + (s.modo || 'Online'); })
    .catch(function () { statusEl.textContent = '● Online'; });

  boasVindas();
})();