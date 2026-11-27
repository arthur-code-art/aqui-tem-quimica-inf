(function () {
  var KEY = 'atq_plaquinhas_visitadas_v1';
  var TOTAL = 38;
  var MIN_CERT = 3;

  function ler() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function salvar(cod) {
    try {
      var s = new Set(ler());
      s.add(cod.toUpperCase());
      var arr = Array.from(s);
      localStorage.setItem(KEY, JSON.stringify(arr));
      return arr;
    } catch (e) { return []; }
  }

  var urlTxt = decodeURIComponent(window.location.pathname + ' ' + window.location.search);
  var m = urlTxt.match(/INF-G\d{2}-P\d+/i);
  var visitadas = m ? salvar(m[0]) : ler();

  var old = document.getElementById('atq-progresso-bar');
  if (old) old.remove();

  var bar = document.createElement('div');
  bar.id = 'atq-progresso-bar';
  bar.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:9990;display:flex;align-items:center;gap:8px;background:rgba(15,23,42,0.94);color:#f8fafc;padding:8px 12px;border-radius:999px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,0.32);backdrop-filter:blur(6px);border:1px solid rgba(56,189,248,0.35);';
  bar.innerHTML =
    '<button type="button" id="atq-open-pass" style="background:transparent;color:#f8fafc;border:0;cursor:pointer;font-size:13px;padding:0;display:flex;align-items:center;gap:6px;">🧪 <strong>' + visitadas.length + '/' + TOTAL + '</strong> <span style="color:#38bdf8;font-weight:600;">Passaporte</span></button>' +
    '<button type="button" id="atq-share-btn" style="background:#0284c7;color:#fff;border:0;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;font-weight:600;">Compartilhar</button>';
  document.body.appendChild(bar);

  document.getElementById('atq-share-btn').addEventListener('click', function () {
    var shareData = { title: document.title, text: 'Estou explorando o projeto AQUI TEM QUÍMICA! (' + visitadas.length + '/' + TOTAL + ' plaquinhas)', url: window.location.href };
    if (navigator.share) { navigator.share(shareData).catch(function () {}); }
    else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(function () {
        var b = document.getElementById('atq-share-btn');
        b.textContent = 'Copiado!';
        setTimeout(function () { b.textContent = 'Compartilhar'; }, 1800);
      });
    }
  });

  function gerarCertificado(nome, qtd) {
    var c = document.createElement('canvas');
    c.width = 1100; c.height = 700;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 1100, 700);
    g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1100, 700);
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 8; ctx.strokeRect(28, 28, 1044, 644);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.strokeRect(44, 44, 1012, 612);
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 26px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('AQUI TEM QUÍMICA! • 1º ANO DE INFORMÁTICA (UFCIMG)', 550, 115);
    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText('CERTIFICADO DE EXPLORADOR', 550, 200);
    ctx.fillStyle = '#cbd5e1'; ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('Certificamos que', 550, 275);
    ctx.fillStyle = '#fde047'; ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.fillText(nome.trim() || 'Visitante Curioso', 550, 345);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('explorou ' + qtd + ' de ' + TOTAL + ' plaquinhas químicas espalhadas pelo campus,', 550, 425);
    ctx.fillText('desvendando ácidos, bases, sais e óxidos no cotidiano escolar.', 550, 462);
    ctx.fillStyle = '#94a3b8'; ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Emitido em ' + new Date().toLocaleDateString('pt-BR') + ' • aqui-tem-quimica-inf.onrender.com', 550, 590);
    var a = document.createElement('a');
    a.download = 'certificado-aqui-tem-quimica.png';
    a.href = c.toDataURL('image/png');
    a.click();
  }

  document.getElementById('atq-open-pass').addEventListener('click', function () {
    fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
      var setVis = new Set(ler());
      var classes = { 'Ácido': [0, 0], 'Base': [0, 0], 'Sal': [0, 0], 'Óxido': [0, 0] };
      var zonas = {};
      dados.forEach(function (s) {
        (s.ocorrencias || []).forEach(function (o) {
          var ok = setVis.has(String(o.codigo).toUpperCase());
          if (classes[s.classe]) { classes[s.classe][1]++; if (ok) classes[s.classe][0]++; }
          if (!zonas[o.zona]) zonas[o.zona] = [];
          zonas[o.zona].push({ cod: o.codigo, nome: s.nomeIupac, ok: ok });
        });
      });

      var modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(2,6,23,0.78);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;';
      var pct = Math.min(100, Math.round((setVis.size / TOTAL) * 100));

      var selosHtml = Object.keys(classes).map(function (c) {
        var f = classes[c][0], t = classes[c][1];
        var cor = f > 0 ? '#0284c7' : '#334155';
        var ic = f === t && t > 0 ? '🏆' : (f > 0 ? '✅' : '🔒');
        return '<div style="background:' + cor + ';padding:8px 10px;border-radius:10px;text-align:center;font-size:12px;">' + ic + ' <strong>' + c + '</strong><br>' + f + '/' + t + '</div>';
      }).join('');

      var zonasHtml = Object.keys(zonas).map(function (z) {
        var lista = zonas[z];
        var okCount = lista.filter(function (x) { return x.ok; }).length;
        var chips = lista.map(function (x) {
          return '<a href="/plaquinha/' + encodeURIComponent(x.cod) + '" style="display:inline-block;margin:3px;padding:4px 8px;border-radius:6px;text-decoration:none;font-size:11px;background:' + (x.ok ? '#15803d' : '#1e293b') + ';color:#f8fafc;border:1px solid rgba(148,163,184,0.25);">' + (x.ok ? '✓ ' : '') + x.cod + '</a>';
        }).join('');
        return '<div style="margin-bottom:10px;padding:8px;background:rgba(30,41,59,0.7);border-radius:8px;"><div style="font-size:13px;font-weight:700;margin-bottom:4px;">📍 ' + z + ' (' + okCount + '/' + lista.length + ')</div>' + chips + '</div>';
      }).join('');

      var certHtml = setVis.size >= MIN_CERT
        ? '<div style="margin-top:12px;padding:12px;background:#0c4a6e;border-radius:10px;"><div style="font-weight:700;margin-bottom:6px;">🎓 Certificado desbloqueado!</div><div style="display:flex;gap:8px;flex-wrap:wrap;"><input id="atq-cert-nome" placeholder="Digite seu nome completo" style="flex:1;min-width:180px;padding:8px;border-radius:8px;border:0;"><button id="atq-cert-btn" style="background:#eab308;color:#0f172a;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;">Baixar PNG</button></div></div>'
        : '<div style="margin-top:12px;padding:10px;background:#1e293b;border-radius:10px;font-size:12px;color:#cbd5e1;">🔒 Escaneie pelo menos <strong>' + MIN_CERT + ' plaquinhas</strong> para desbloquear seu Certificado Digital (faltam ' + (MIN_CERT - setVis.size) + ').</div>';

      modal.innerHTML =
        '<div style="background:#0f172a;color:#f8fafc;max-width:620px;width:100%;max-height:86vh;overflow:auto;border-radius:16px;padding:20px;border:1px solid rgba(56,189,248,0.35);box-shadow:0 20px 50px rgba(0,0,0,0.5);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h3 style="margin:0;font-size:18px;">🧪 Passaporte Aqui Tem Química</h3><button id="atq-close-pass" style="background:#334155;color:#fff;border:0;border-radius:8px;padding:6px 10px;cursor:pointer;">✕</button></div>' +
          '<div style="font-size:13px;margin-bottom:6px;">Progresso da trilha: <strong>' + setVis.size + '/' + TOTAL + '</strong> (' + pct + '%)</div>' +
          '<div style="height:10px;background:#1e293b;border-radius:999px;overflow:hidden;margin-bottom:14px;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#0ea5e9,#22c55e);"></div></div>' +
          '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">' + selosHtml + '</div>' +
          certHtml +
          '<h4 style="margin:14px 0 8px;font-size:14px;color:#38bdf8;">Plaquinhas por Zona (clique para abrir)</h4>' +
          zonasHtml +
        '</div>';

      document.body.appendChild(modal);
      document.getElementById('atq-close-pass').onclick = function () { modal.remove(); };
      modal.addEventListener('click', function (ev) { if (ev.target === modal) modal.remove(); });
      var cBtn = document.getElementById('atq-cert-btn');
      if (cBtn) {
        cBtn.onclick = function () {
          var nome = (document.getElementById('atq-cert-nome').value || '').trim();
          gerarCertificado(nome, setVis.size);
        };
      }
    }).catch(function () { alert('Não foi possível carregar o passaporte agora.'); });
  });
})();
