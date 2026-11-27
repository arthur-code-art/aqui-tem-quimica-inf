(function () {
  var urlTxt = decodeURIComponent(window.location.pathname + ' ' + window.location.search);
  var m = urlTxt.match(/INF-G\d{2}-P\d+/i);
  if (!m) return;
  var codAtual = m[0].toUpperCase();

  fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
    var subAtual = null, ocAtual = null;
    dados.forEach(function (s) {
      (s.ocorrencias || []).forEach(function (o) {
        if (String(o.codigo).toUpperCase() === codAtual) { subAtual = s; ocAtual = o; }
      });
    });
    if (!subAtual || !ocAtual) return;

    var vizinhas = [];
    dados.forEach(function (s) {
      (s.ocorrencias || []).forEach(function (o) {
        if (o.zona === ocAtual.zona && String(o.codigo).toUpperCase() !== codAtual) {
          vizinhas.push({ codigo: o.codigo, localExato: o.localExato, nome: s.nomeIupac, formula: s.formula, classe: s.classe, lat: o.lat, lng: o.lng });
        }
      });
    });

    var alvo = document.querySelector('main') || document.body;
    var box = document.createElement('section');
    box.id = 'atq-guia-voz';
    box.className = 'atq-glow-card';
    box.style.cssText = 'max-width:960px;margin:24px auto 86px;padding:18px;border-radius:16px;font-family:"Plus Jakarta Sans",system-ui,sans-serif;';

    var cardsHtml = vizinhas.length
      ? vizinhas.map(function (v) {
          return '<div style="padding:12px;border-radius:12px;border:1px solid rgba(200,162,77,0.34);display:flex;flex-direction:column;justify-content:space-between;gap:8px;">' +
            '<a href="/plaquinha/' + encodeURIComponent(v.codigo) + '" style="text-decoration:none;color:inherit;">' +
              '<div style="font-size:11px;font-weight:800;color:#c89b3c;">' + v.codigo + ' • ' + v.classe.toUpperCase() + '</div>' +
              '<div style="font-size:15px;font-weight:700;margin:3px 0;">' + v.nome + ' (' + v.formula + ')</div>' +
              '<div style="font-size:12px;opacity:0.84;">' + v.localExato + '</div>' +
            '</a>' +
            '<a href="/mapa?guiar=' + encodeURIComponent(v.codigo) + '" class="btn" style="text-align:center;text-decoration:none;padding:6px 10px;font-size:12px;">🧭 Ir até esta plaquinha (GPS)</a>' +
          '</div>';
        }).join('')
      : '<p style="font-size:13px;opacity:0.85;margin:0;">Esta é a única plaquinha cadastrada nesta zona.</p>';

    var gmapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + ocAtual.lat + ',' + ocAtual.lng + '&travelmode=walking';

    box.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(200,162,77,0.28);">' +
        '<div><strong style="font-size:15px;">🎧 Áudio &amp; Navegação GPS</strong><div style="font-size:12px;opacity:0.82;">Ouça a ficha em voz alta ou abra o GPS para chegar até este ponto no CEFET.</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" id="atq-falar-btn" class="btn btn-primary" style="border-radius:999px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;">🔊 Ouvir ficha</button>' +
          '<a href="/mapa?guiar=' + encodeURIComponent(codAtual) + '" class="btn" style="border-radius:999px;padding:9px 15px;font-size:13px;text-decoration:none;">🧭 GPS no Mapa</a>' +
          '<a href="' + gmapsUrl + '" target="_blank" rel="noopener" class="btn" style="border-radius:999px;padding:9px 15px;font-size:13px;text-decoration:none;">🗺️ Rota Google Maps</a>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:10px;">📍 Perto de você — Outras plaquinhas em: ' + ocAtual.zona + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;">' + cardsHtml + '</div>';

    alvo.appendChild(box);

    var btn = document.getElementById('atq-falar-btn');
    var falando = false;
    btn.addEventListener('click', function () {
      if (!('speechSynthesis' in window)) { alert('Seu navegador não suporta leitura em voz alta.'); return; }
      if (falando) {
        window.speechSynthesis.cancel();
        falando = false;
        btn.textContent = '🔊 Ouvir ficha';
        return;
      }
      window.speechSynthesis.cancel();
      var texto = 'Plaquinha ' + codAtual + ', em ' + ocAtual.zona + '. Substância: ' + subAtual.nomeIupac + ', classe ' + subAtual.classe + '. ' +
        (subAtual.justificativa || '') + ' Por que está aqui: ' + (subAtual.porQueEstaAqui || '') + ' Curiosidade: ' + (subAtual.curiosidade || '');
      var u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      u.onend = u.onerror = function () { falando = false; btn.textContent = '🔊 Ouvir ficha'; };
      falando = true;
      btn.textContent = '⏹ Parar leitura';
      window.speechSynthesis.speak(u);
    });
  }).catch(function () {});
})();
