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
          vizinhas.push({ codigo: o.codigo, localExato: o.localExato, nome: s.nomeIupac, formula: s.formula, classe: s.classe });
        }
      });
    });

    var alvo = document.querySelector('main') || document.body;
    var box = document.createElement('section');
    box.id = 'atq-guia-voz';
    box.style.cssText = 'max-width:960px;margin:24px auto 80px;padding:18px;border-radius:14px;background:#0f172a;color:#f8fafc;border:1px solid rgba(56,189,248,0.3);font-family:system-ui,-apple-system,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,0.22);';

    var cardsHtml = vizinhas.length
      ? vizinhas.map(function (v) {
          return '<a href="/plaquinha/' + encodeURIComponent(v.codigo) + '" style="display:block;padding:12px;border-radius:10px;background:#1e293b;color:#f8fafc;text-decoration:none;border:1px solid rgba(148,163,184,0.2);">' +
            '<div style="font-size:11px;color:#38bdf8;font-weight:700;">' + v.codigo + ' • ' + v.classe.toUpperCase() + '</div>' +
            '<div style="font-size:15px;font-weight:700;margin:3px 0;">' + v.nome + ' (' + v.formula + ')</div>' +
            '<div style="font-size:12px;color:#cbd5e1;">' + v.localExato + '</div></a>';
        }).join('')
      : '<p style="font-size:13px;color:#cbd5e1;margin:0;">Você já está vendo a única plaquinha cadastrada nesta zona.</p>';

    box.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(148,163,184,0.2);">' +
        '<div><strong style="font-size:15px;">🎧 Acessibilidade em Áudio</strong><div style="font-size:12px;color:#cbd5e1;">Ouça o resumo desta plaquinha enquanto observa o local.</div></div>' +
        '<button type="button" id="atq-falar-btn" style="background:#0284c7;color:#fff;border:0;border-radius:999px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;">🔊 Ouvir esta ficha</button>' +
      '</div>' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:10px;color:#38bdf8;">📍 Perto de você — Outras plaquinhas em: ' + ocAtual.zona + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">' + cardsHtml + '</div>';

    alvo.appendChild(box);

    var btn = document.getElementById('atq-falar-btn');
    var falando = false;
    btn.addEventListener('click', function () {
      if (!('speechSynthesis' in window)) {
        alert('Seu navegador não suporta leitura em voz alta.');
        return;
      }
      if (falando) {
        window.speechSynthesis.cancel();
        falando = false;
        btn.textContent = '🔊 Ouvir esta ficha';
        btn.style.background = '#0284c7';
        return;
      }
      window.speechSynthesis.cancel();
      var texto = 'Plaquinha ' + codAtual + ', em ' + ocAtual.zona + '. Substância: ' + subAtual.nomeIupac + ', classe ' + subAtual.classe + '. ' +
        (subAtual.justificativa || '') + ' Por que está aqui: ' + (subAtual.porQueEstaAqui || '') + ' Curiosidade: ' + (subAtual.curiosidade || '');
      var u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      u.rate = 1.0;
      u.onend = u.onerror = function () {
        falando = false;
        btn.textContent = '🔊 Ouvir esta ficha';
        btn.style.background = '#0284c7';
      };
      falando = true;
      btn.textContent = '⏹ Parar leitura';
      btn.style.background = '#dc2626';
      window.speechSynthesis.speak(u);
    });
  }).catch(function () {});
})();
