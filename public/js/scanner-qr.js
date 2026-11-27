(function () {
  if (document.getElementById('atq-qr-fab')) return;

  // Garantir link rapido para a Tabela Periodica no menu do topo
  var nav = document.querySelector('header nav');
  if (nav && !nav.querySelector('a[href="/tabela"]')) {
    var linkTab = document.createElement('a');
    linkTab.href = '/tabela';
    linkTab.textContent = '⚛️ Tabela';
    var toggle = document.getElementById('atq-tema-toggle');
    if (toggle && toggle.parentNode === nav) nav.insertBefore(linkTab, toggle);
    else nav.appendChild(linkTab);
  }

  var st = document.createElement('style');
  st.textContent =
    '#atq-qr-fab{position:fixed;left:14px;bottom:62px;z-index:9993;display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#150c26,#4a2c6d);color:#f5d37a;border:1px solid #c8a24d;border-radius:999px;padding:7px 13px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 0 18px rgba(192,132,252,0.42);backdrop-filter:blur(8px);}' +
    '#atq-qr-modal{position:fixed;inset:0;z-index:10030;background:rgba(8,4,16,0.86);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:14px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;}' +
    '.atq-qr-box{background:linear-gradient(160deg,#120922,#1f1138);color:#f7f3ff;width:min(440px,100%);border-radius:20px;border:1px solid #f5d37a;box-shadow:0 24px 60px rgba(0,0,0,0.65),0 0 32px rgba(192,132,252,0.38);padding:18px;}' +
    '#atq-qr-reader{width:100%;border-radius:14px;overflow:hidden;border:1px solid rgba(200,162,77,0.45);background:#05020a;min-height:240px;}' +
    '@media(max-width:540px){#atq-qr-fab{left:10px;bottom:56px;padding:6px 11px;font-size:11px;}}' +
    '@media print{#atq-qr-fab,#atq-qr-modal{display:none!important;}}';
  document.head.appendChild(st);

  var fab = document.createElement('button');
  fab.type = 'button';
  fab.id = 'atq-qr-fab';
  fab.setAttribute('aria-label', 'Abrir leitor de QR Code');
  fab.innerHTML = '<span>📷</span><span>Escanear QR</span>';
  document.body.appendChild(fab);

  function carregarLibQr() {
    if (window.Html5Qrcode) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function processarCodigo(texto) {
    var m = String(texto || '').toUpperCase().match(/INF-G\d{2}-P\d+/);
    if (!m) return false;
    if (navigator.vibrate) navigator.vibrate([45, 30, 60]);
    window.location.href = '/plaquinha/' + encodeURIComponent(m[0]);
    return true;
  }

  fab.addEventListener('click', function () {
    var old = document.getElementById('atq-qr-modal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'atq-qr-modal';
    modal.innerHTML =
      '<div class="atq-qr-box">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
          '<div><div style="font-size:10px;font-weight:800;color:#f5d37a;letter-spacing:0.08em;">LEITOR INTEGRADO</div><h3 style="margin:2px 0 0;font-size:19px;font-family:\'Playfair Display\',serif;">Escanear Plaquinha</h3></div>' +
          '<button type="button" id="atq-qr-close" style="background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(200,162,77,0.4);border-radius:10px;padding:6px 11px;cursor:pointer;font-weight:700;">✕</button>' +
        '</div>' +
        '<div id="atq-qr-reader"></div>' +
        '<div id="atq-qr-status" style="margin:10px 0;font-size:12px;color:#c3b7dc;text-align:center;">Iniciando câmera traseira...</div>' +
        '<form id="atq-qr-manual" style="display:flex;gap:8px;margin-top:8px;">' +
          '<input id="atq-qr-input" placeholder="Ou digite o código (ex: INF-G01-P1)" style="flex:1;padding:9px 11px;border-radius:10px;border:1px solid rgba(200,162,77,0.4);background:#0b0614;color:#fff;font-size:12px;text-transform:uppercase;">' +
          '<button type="submit" style="background:linear-gradient(135deg,#6d4aa3,#9333ea);color:#fff;border:1px solid #f5d37a;border-radius:10px;padding:0 14px;font-weight:700;font-size:12px;cursor:pointer;">Abrir</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(modal);

    var scanner = null;
    var ativo = false;

    function fechar() {
      if (scanner && ativo) {
        ativo = false;
        scanner.stop().catch(function () {}).finally(function () { modal.remove(); });
      } else {
        modal.remove();
      }
    }

    document.getElementById('atq-qr-close').onclick = fechar;
    modal.addEventListener('click', function (ev) { if (ev.target === modal) fechar(); });

    document.getElementById('atq-qr-manual').onsubmit = function (ev) {
      ev.preventDefault();
      var val = document.getElementById('atq-qr-input').value.trim();
      if (!processarCodigo(val)) {
        document.getElementById('atq-qr-status').textContent = '⚠️ Código inválido. Use o padrão INF-G01-P1.';
      }
    };

    var statusEl = document.getElementById('atq-qr-status');
    carregarLibQr().then(function () {
      scanner = new window.Html5Qrcode('atq-qr-reader');
      return scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        function (decodedText) {
          if (processarCodigo(decodedText)) {
            statusEl.textContent = '✅ Plaquinha reconhecida! Abrindo...';
            ativo = false;
            scanner.stop().catch(function () {});
          } else {
            statusEl.textContent = 'QR lido não pertence ao projeto: ' + decodedText.slice(0, 40);
          }
        },
        function () {}
      );
    }).then(function () {
      ativo = true;
      statusEl.textContent = 'Aponte a câmera para qualquer QR Code do campus.';
    }).catch(function () {
      statusEl.textContent = 'Câmera indisponível ou sem permissão. Digite o código da plaquinha abaixo.';
    });
  });
})();