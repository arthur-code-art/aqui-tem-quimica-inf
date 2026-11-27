(function () {
  var p = window.location.pathname;
  if (p !== '/' && p !== '/index.html') return;

  function obterRoot() {
    var root = document.getElementById('atq-extras-root');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'atq-extras-root';
    root.style.cssText = 'max-width:1120px;margin:28px auto;padding:0 16px;font-family:system-ui,-apple-system,sans-serif;';
    var cred = document.getElementById('creditos') || document.querySelector('footer');
    if (cred && cred.parentNode) cred.parentNode.insertBefore(root, cred);
    else (document.querySelector('main') || document.body).appendChild(root);
    return root;
  }

  function embaralhar(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
    var sec = document.createElement('section');
    sec.id = 'atq-quiz';
    sec.style.cssText = 'background:#0f172a;color:#f8fafc;border-radius:16px;padding:22px;margin-bottom:24px;border:1px solid rgba(56,189,248,0.28);box-shadow:0 12px 30px rgba(0,0,0,0.22);';
    sec.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">' +
        '<div><h2 style="margin:0;font-size:20px;color:#38bdf8;">🎯 Quiz Relâmpago — Desafio Aqui Tem Química</h2>' +
        '<p style="margin:4px 0 0;font-size:13px;color:#cbd5e1;">8 perguntas sorteadas direto das plaquinhas do nosso campus.</p></div>' +
        '<span id="atq-quiz-placar" style="background:#1e293b;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;color:#fde047;"></span>' +
      '</div>' +
      '<div id="atq-quiz-corpo"></div>';
    obterRoot().appendChild(sec);

    var perguntas = [], atual = 0, pontos = 0;

    function montarPerguntas() {
      var sorteadas = embaralhar(dados).slice(0, 8);
      var todasZonas = Array.from(new Set(dados.flatMap(function (s) { return (s.ocorrencias || []).map(function (o) { return o.zona; }); })));
      var todasFormulas = Array.from(new Set(dados.map(function (s) { return s.formula; })));
      var classes = ['Ácido', 'Base', 'Sal', 'Óxido'];

      perguntas = sorteadas.map(function (s, idx) {
        var tipo = idx % 3;
        if (tipo === 0) {
          var erradas = embaralhar(todasFormulas.filter(function (f) { return f !== s.formula; })).slice(0, 3);
          return {
            enunciado: 'Qual é a fórmula química de "' + s.nomeIupac + '"?',
            opcoes: embaralhar([s.formula].concat(erradas)),
            correta: s.formula,
            explicacao: s.nomeIupac + ' tem fórmula ' + s.formula + ' e pertence à classe ' + s.classe + '.'
          };
        } else if (tipo === 1) {
          return {
            enunciado: 'A substância "' + s.nomeIupac + '" (' + s.formula + ') pertence a qual função química?',
            opcoes: embaralhar(classes),
            correta: s.classe,
            explicacao: s.justificativa || (s.nomeIupac + ' é classificada como ' + s.classe + '.')
          };
        } else {
          var zonaCerta = (s.ocorrencias && s.ocorrencias[0]) ? s.ocorrencias[0].zona : 'Restaurante';
          var zonasDoItem = (s.ocorrencias || []).map(function (o) { return o.zona; });
          var errZ = embaralhar(todasZonas.filter(function (z) { return zonasDoItem.indexOf(z) === -1; })).slice(0, 3);
          return {
            enunciado: 'Em qual zona da escola há uma plaquinha de "' + s.nomeIupac + '" (' + s.formula + ')?',
            opcoes: embaralhar([zonaCerta].concat(errZ)),
            correta: zonaCerta,
            explicacao: s.porQueEstaAqui || ('Encontrada em: ' + zonaCerta + '.')
          };
        }
      });
      atual = 0; pontos = 0;
      desenhar();
    }

    function desenhar() {
      var placar = document.getElementById('atq-quiz-placar');
      var corpo = document.getElementById('atq-quiz-corpo');

      if (atual >= perguntas.length) {
        placar.textContent = 'Finalizado • ' + pontos + '/' + perguntas.length;
        var msg = encodeURIComponent('Fiz ' + pontos + '/' + perguntas.length + ' pontos no Quiz do projeto AQUI TEM QUÍMICA! Tente bater meu recorde: ' + window.location.origin);
        corpo.innerHTML =
          '<div style="padding:16px;background:#1e293b;border-radius:12px;text-align:center;">' +
            '<div style="font-size:28px;font-weight:800;color:#22c55e;">' + pontos + ' de ' + perguntas.length + ' acertos!</div>' +
            '<p style="color:#cbd5e1;font-size:14px;">' + (pontos >= 6 ? 'Mandou muito bem! Você já domina a química do campus.' : 'Boa tentativa! Explore mais plaquinhas e tente novamente.') + '</p>' +
            '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px;">' +
              '<button id="atq-q-restart" style="background:#0284c7;color:#fff;border:0;border-radius:8px;padding:10px 16px;font-weight:700;cursor:pointer;">Jogar novamente</button>' +
              '<a target="_blank" href="https://wa.me/?text=' + msg + '" style="background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;padding:10px 16px;font-weight:700;">Compartilhar no WhatsApp</a>' +
            '</div>' +
          '</div>';
        document.getElementById('atq-q-restart').onclick = montarPerguntas;
        return;
      }

      var q = perguntas[atual];
      placar.textContent = 'Pergunta ' + (atual + 1) + '/' + perguntas.length + ' • Pontos: ' + pontos;
      corpo.innerHTML =
        '<div style="font-size:16px;font-weight:700;margin-bottom:12px;">' + q.enunciado + '</div>' +
        '<div id="atq-q-opts" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;"></div>' +
        '<div id="atq-q-fb" style="margin-top:12px;"></div>';

      var optsBox = document.getElementById('atq-q-opts');
      var respondeu = false;
      q.opcoes.forEach(function (op) {
        var b = document.createElement('button');
        b.textContent = op;
        b.style.cssText = 'text-align:left;padding:12px;border-radius:10px;border:1px solid rgba(148,163,184,0.28);background:#1e293b;color:#f8fafc;font-size:14px;cursor:pointer;font-weight:600;';
        b.onclick = function () {
          if (respondeu) return;
          respondeu = true;
          var acertou = op === q.correta;
          if (acertou) pontos++;
          Array.from(optsBox.children).forEach(function (btn) {
            if (btn.textContent === q.correta) btn.style.background = '#15803d';
            else if (btn === b && !acertou) btn.style.background = '#b91c1c';
          });
          document.getElementById('atq-q-fb').innerHTML =
            '<div style="padding:12px;border-radius:10px;background:' + (acertou ? 'rgba(21,128,61,0.28)' : 'rgba(185,28,28,0.28)') + ';font-size:13px;">' +
              '<strong>' + (acertou ? '✅ Correto! ' : '❌ Ops! Resposta certa: ' + q.correta + '. ') + '</strong>' + q.explicacao +
              '<div style="margin-top:10px;"><button id="atq-q-next" style="background:#0284c7;color:#fff;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;">' + (atual + 1 < perguntas.length ? 'Próxima pergunta →' : 'Ver resultado') + '</button></div>' +
            '</div>';
          document.getElementById('atq-q-next').onclick = function () { atual++; desenhar(); };
        };
        optsBox.appendChild(b);
      });
    }
    montarPerguntas();
  }).catch(function () {});
})();
