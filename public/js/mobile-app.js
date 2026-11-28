(function () {
  function lerQtdPassaporte() {
    try {
      var arr = JSON.parse(localStorage.getItem('atq_plaquinhas_visitadas_v1') || '[]');
      return Array.isArray(arr) ? arr.length : 0;
    } catch (e) {
      return 0;
    }
  }

  function atualizarBadgeDock() {
    var b = document.getElementById('atq-dock-badge');
    if (b) b.textContent = String(lerQtdPassaporte());
  }

  function ajustarBotaoTemaMobile() {
    var btn = document.getElementById('atq-tema-toggle');
    if (!btn) return;
    var ehMob = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    var claro = document.documentElement.getAttribute('data-tema') === 'claro';
    if (ehMob) {
      btn.innerHTML = claro ? '✨ Neon' : '☀️ Claro';
    } else {
      btn.innerHTML = claro ? '✨ Modo Neon' : '☀️ Branco & Dourado';
    }
  }

  function montarDockMobile() {
    if (document.getElementById('atq-mob-dock')) return;

    var p = window.location.pathname.toLowerCase();
    var isHome = p === '/' || p === '/index.html';
    var isPlacas = p.indexOf('/plaquinha') === 0 || p.indexOf('/substancia') === 0;
    var isMapa = p.indexOf('/mapa') === 0;

    var dock = document.createElement('nav');
    dock.id = 'atq-mob-dock';
    dock.setAttribute('aria-label', 'Navegação rápida mobile');
    dock.innerHTML =
      '<a href="/" class="atq-dock-item ' + (isHome ? 'ativo' : '') + '">' +
        '<span class="atq-di-ic">🏠</span><span>Início</span>' +
      '</a>' +
      '<a href="/plaquinhas" class="atq-dock-item ' + (isPlacas ? 'ativo' : '') + '">' +
        '<span class="atq-di-ic">🧪</span><span>Plaquinhas</span>' +
      '</a>' +
      '<button type="button" id="atq-dock-qr-btn" class="atq-dock-item atq-dock-qr" aria-label="Escanear QR Code">' +
        '<span class="atq-di-ic">📷</span><span>QR</span>' +
      '</button>' +
      '<a href="/mapa" class="atq-dock-item ' + (isMapa ? 'ativo' : '') + '">' +
        '<span class="atq-di-ic">🗺️</span><span>Mapa</span>' +
      '</a>' +
      '<button type="button" id="atq-dock-pass-btn" class="atq-dock-item" aria-label="Abrir Passaporte">' +
        '<span class="atq-dock-badge" id="atq-dock-badge">' + lerQtdPassaporte() + '</span>' +
        '<span class="atq-di-ic">🎫</span><span>Passaporte</span>' +
      '</button>';

    document.body.appendChild(dock);

    document.getElementById('atq-dock-qr-btn').onclick = function () {
      var qrFab = document.getElementById('atq-qr-fab');
      if (qrFab) qrFab.click();
    };

    document.getElementById('atq-dock-pass-btn').onclick = function () {
      var passBtn = document.getElementById('atq-progresso-bar');
      if (passBtn) passBtn.click();
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    montarDockMobile();
    setTimeout(atualizarBadgeDock, 350);
    setTimeout(ajustarBotaoTemaMobile, 150);
    setTimeout(ajustarBotaoTemaMobile, 700);
  });

  window.addEventListener('resize', ajustarBotaoTemaMobile);
  window.addEventListener('atq-tema-mudou', function () {
    setTimeout(ajustarBotaoTemaMobile, 20);
  });
})();