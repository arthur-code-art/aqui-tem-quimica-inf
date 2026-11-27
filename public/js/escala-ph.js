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

  function corPh(ph) {
    if (ph <= 2) return '#ef4444';
    if (ph <= 4.5) return '#f97316';
    if (ph < 6.5) return '#eab308';
    if (ph <= 7.5) return '#22c55e';
    if (ph <= 10) return '#06b6d4';
    if (ph <= 12) return '#3b82f6';
    return '#8b5cf6';
  }

  fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
    var lista = dados.slice().sort(function (a, b) { return (a.phEstimado || 7) - (b.phEstimado || 7); });
    var sec = document.createElement('section');
    sec.id = 'atq-escala-ph';
    sec.style.cssText = 'background:#0f172a;color:#f8fafc;border-radius:16px;padding:22px;margin-bottom:24px;border:1px solid rgba(56,189,248,0.28);box-shadow:0 12px 30px rgba(0,0,0,0.22);';

    sec.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<div><h2 style="margin:0;font-size:20px;color:#38bdf8;">🌈 Escala Interativa de pH do Campus (0 a 14)</h2>' +
        '<p style="margin:4px 0 0;font-size:13px;color:#cbd5e1;">Clique em qualquer substância da escola para comparar seu pH estimado e abrir a plaquinha.</p></div>' +
        '<div id="atq-ph-filtros" style="display:flex;gap:6px;flex-wrap:wrap;"></div>' +
      '</div>' +
      '<div style="height:18px;border-radius:999px;background:linear-gradient(90deg,#ef4444 0%,#f97316 20%,#eab308 38%,#22c55e 50%,#06b6d4 66%,#3b82f6 82%,#8b5cf6 100%);margin:12px 0 6px;"></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-bottom:14px;"><span>0 • Muito Ácido</span><span>7 • Neutro</span><span>14 • Muito Básico</span></div>' +
      '<div id="atq-ph-chips" style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px;"></div>' +
      '<div id="atq-ph-detalhe" style="padding:14px;border-radius:12px;background:#1e293b;border:1px solid rgba(148,163,184,0.22);font-size:13px;"></div>';

    obterRoot().appendChild(sec);

    var filtroAtual = 'todos';
    var filtros = [
      { id: 'todos', label: 'Todos (' + lista.length + ')' },
      { id: 'acido', label: 'Ácidos (pH < 6,5)' },
      { id: 'neutro', label: 'Neutros (6,5–7,5)' },
      { id: 'basico', label: 'Básicos (pH > 7,5)' }
    ];

    function mostrarDetalhe(s) {
      var ph = typeof s.phEstimado === 'number' ? s.phEstimado.toFixed(1) : '7.0';
      var primeira = (s.ocorrencias && s.ocorrencias[0]) ? s.ocorrencias[0] : null;
      var locais = (s.ocorrencias || []).map(function (o) { return o.zona + ' (' + o.codigo + ')'; }).join(' • ');
      var link = primeira ? '<a href="/plaquinha/' + encodeURIComponent(primeira.codigo) + '" style="display:inline-block;margin-top:8px;background:#0284c7;color:#fff;text-decoration:none;padding:7px 14px;border-radius:8px;font-weight:700;font-size:12px;">Abrir ficha completa →</a>' : '';
      document.getElementById('atq-ph-detalhe').innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
          '<span style="background:' + corPh(s.phEstimado || 7) + ';color:#0f172a;font-weight:800;padding:4px 10px;border-radius:999px;font-size:12px;">pH ≈ ' + ph + '</span>' +
          '<strong style="font-size:16px;">' + s.nomeIupac + ' (' + s.formula + ')</strong>' +
          '<span style="color:#38bdf8;font-size:12px;font-weight:700;">' + s.classe + '</span>' +
        '</div>' +
        '<div style="margin-top:6px;color:#cbd5e1;">' + (s.porQueEstaAqui || '') + '</div>' +
        '<div style="margin-top:6px;font-size:12px;color:#94a3b8;">📍 Onde encontrar: ' + locais + '</div>' + link;
    }

    function render() {
      var fBox = document.getElementById('atq-ph-filtros');
      fBox.innerHTML = '';
      filtros.forEach(function (f) {
        var b = document.createElement('button');
        b.textContent = f.label;
        b.style.cssText = 'border:0;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;background:' + (filtroAtual === f.id ? '#0284c7' : '#1e293b') + ';color:#f8fafc;';
        b.onclick = function () { filtroAtual = f.id; render(); };
        fBox.appendChild(b);
      });

      var filtrada = lista.filter(function (s) {
        var ph = typeof s.phEstimado === 'number' ? s.phEstimado : 7;
        if (filtroAtual === 'acido') return ph < 6.5;
        if (filtroAtual === 'neutro') return ph >= 6.5 && ph <= 7.5;
        if (filtroAtual === 'basico') return ph > 7.5;
        return true;
      });

      var cBox = document.getElementById('atq-ph-chips');
      cBox.innerHTML = '';
      filtrada.forEach(function (s) {
        var ph = typeof s.phEstimado === 'number' ? s.phEstimado : 7;
        var chip = document.createElement('button');
        chip.style.cssText = 'background:#1e293b;color:#f8fafc;border:2px solid ' + corPh(ph) + ';border-radius:10px;padding:6px 10px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;';
        chip.innerHTML = '<span style="width:10px;height:10px;border-radius:50%;background:' + corPh(ph) + ';display:inline-block;"></span><strong>' + s.formula + '</strong><span style="color:#94a3b8;">(' + ph.toFixed(1) + ')</span>';
        chip.onclick = function () { mostrarDetalhe(s); };
        cBox.appendChild(chip);
      });

      if (filtrada.length > 0) mostrarDetalhe(filtrada[0]);
    }
    render();
  }).catch(function () {});
})();
