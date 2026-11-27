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

  var itens = [
    { id: 'NaClO', nome: 'Água sanitária (NaClO)' },
    { id: 'NH4OH', nome: 'Limpa-vidros / Amônia (NH₄OH)' },
    { id: 'H2SO4', nome: 'Ácido sulfúrico de bateria (H₂SO₄)' },
    { id: 'NaOH', nome: 'Soda cáustica (NaOH)' },
    { id: 'NaHCO3', nome: 'Bicarbonato de sódio (NaHCO₃)' },
    { id: 'C6H8O7', nome: 'Ácido cítrico / Ácido orgânico (C₆H₈O₇)' },
    { id: 'Ca(OH)2', nome: 'Cal hidratada (Ca(OH)₂)' },
    { id: 'NaCl', nome: 'Sal de cozinha (NaCl)' },
    { id: 'H2O', nome: 'Água (H₂O)' }
  ];

  var regras = {
    'NH4OH|NaClO': { nivel: 'perigo', titulo: '🔴 PERIGO EXTREMO — Nunca misture!', eq: 'NaClO + NH₃ → NH₂Cl (cloramina) + NaOH', desc: 'Misturar água sanitária com limpa-vidros à base de amônia libera gases cloraminas altamente tóxicos, causando falta de ar, irritação severa nos olhos e lesões pulmonares.' },
    'H2SO4|NaClO': { nivel: 'perigo', titulo: '🔴 PERIGO EXTREMO — Liberação de gás cloro (Cl₂)!', eq: 'NaClO + H⁺ + Cl⁻ → Cl₂(g) + H₂O', desc: 'Ácidos fortes decompõem o hipoclorito liberando gás cloro (Cl₂), asfixiante e corrosivo para as vias respiratórias.' },
    'C6H8O7|NaClO': { nivel: 'perigo', titulo: '🔴 PERIGO — Liberação de gás cloro!', eq: 'Meio ácido + ClO⁻ → liberação de Cl₂(g)', desc: 'Mesmo ácidos orgânicos (como limão ou vinagre) acidificam a água sanitária e liberam gás cloro irritante e perigoso em ambientes fechados.' },
    'H2SO4|NaOH': { nivel: 'perigo', titulo: '🔴 PERIGO EXTREMO — Neutralização violenta!', eq: 'H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O + muito calor', desc: 'Reação fortemente exotérmica entre ácido forte e base forte: pode ferver instantaneamente e projetar respingos corrosivos.' },
    'Ca(OH)2|H2SO4': { nivel: 'perigo', titulo: '🔴 PERIGO — Reação fortemente exotérmica!', eq: 'H₂SO₄ + Ca(OH)₂ → CaSO₄ + 2 H₂O + calor', desc: 'Neutralização rápida com intensa liberação de calor e risco de respingos corrosivos.' },
    'H2SO4|NH4OH': { nivel: 'perigo', titulo: '🔴 PERIGO — Vapores e calor intenso!', eq: 'H₂SO₄ + 2 NH₄OH → (NH₄)₂SO₄ + 2 H₂O + calor', desc: 'Libera grande quantidade de calor e vapores irritantes de amônia.' },
    'H2O|H2SO4': { nivel: 'atencao', titulo: '🟡 ATENÇÃO MÁXIMA — Regra de laboratório!', eq: 'H₂SO₄(l) + H₂O(l) → H₃O⁺ + HSO₄⁻ + muito calor', desc: 'Jamais jogue água sobre ácido sulfúrico concentrado (risco de explosão de vapor). Em laboratório, adiciona-se sempre o ácido lentamente sobre a água com EPI.' },
    'H2O|NaOH': { nivel: 'atencao', titulo: '🟡 ATENÇÃO — Dissolução exotérmica e cáustica!', eq: 'NaOH(s) → Na⁺(aq) + OH⁻(aq) + calor', desc: 'A soda cáustica esquenta muito ao dissolver em água e forma solução altamente corrosiva para pele e olhos.' },
    'C6H8O7|NaHCO3': { nivel: 'atencao', titulo: '🟡 REAÇÃO EFERVESCENTE CONTROLADA', eq: '3 NaHCO₃ + C₆H₈O₇ → Na₃C₆H₅O₇ + 3 H₂O + 3 CO₂(g)', desc: 'Neutralização segura que libera bolhas de gás carbônico (CO₂) — é o mesmo princípio de pastilhas efervescentes e fermentos.' },
    'H2SO4|NaHCO3': { nivel: 'atencao', titulo: '🟡 ATENÇÃO — Efervescência intensa de CO₂!', eq: 'H₂SO₄ + 2 NaHCO₃ → Na₂SO₄ + 2 H₂O + 2 CO₂(g)', desc: 'Reação vigorosa com espuma e calor; usada com cuidado em laboratório para neutralizar pequenos derramamentos ácidos.' },
    'NaClO|NaOH': { nivel: 'atencao', titulo: '🟡 ATENÇÃO — Solução altamente alcalina (já existe no frasco)', eq: 'Meio básico (OH⁻) estabiliza o íon ClO⁻', desc: 'A água sanitária comercial já contém pequena dose de NaOH para manter o cloro estável. Não adicione soda extra por risco de queimadura química.' },
    'H2O|NaCl': { nivel: 'seguro', titulo: '🟢 SEGURO — Dissociação iônica simples', eq: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)', desc: 'Forma solução aquosa salina neutra (pH ≈ 7,0), sem liberação de gases tóxicos nem calor perigoso.' },
    'H2O|NaHCO3': { nivel: 'seguro', titulo: '🟢 SEGURO — Solução levemente básica', eq: 'NaHCO₃(s) → Na⁺(aq) + HCO₃⁻(aq)', desc: 'Solução alcalina suave (pH ≈ 8,3), segura para limpeza leve e neutralização de odores.' }
  };

  function avaliar(a, b) {
    if (a === b) return { nivel: 'seguro', titulo: '🟢 Mesma substância selecionada', eq: a + ' + ' + b + ' (sem reação nova)', desc: 'Escolha duas substâncias diferentes para testar como elas interagem.' };
    var chave = [a, b].sort().join('|');
    if (regras[chave]) return regras[chave];
    if (a === 'H2SO4' || b === 'H2SO4') return { nivel: 'perigo', titulo: '🔴 PERIGO — Envolve ácido sulfúrico forte!', eq: 'Contato com H₂SO₄ exige supervisão técnica', desc: 'O ácido sulfúrico de baterias é extremamente corrosivo e não deve ser misturado com produtos domésticos.' };
    if (a === 'NaClO' || b === 'NaClO') return { nivel: 'atencao', titulo: '🟡 REGRA DE OURO — Nunca misture água sanitária!', eq: 'Use NaClO diluído apenas em água fria', desc: 'Para evitar reações imprevistas e gases tóxicos, a água sanitária só deve ser diluída em água limpa.' };
    return { nivel: 'seguro', titulo: '🟢 SEM REAÇÃO VIOLENTA CONHECIDA', eq: a + ' + ' + b, desc: 'Não há liberação de gases tóxicos críticos nesta combinação, mas produtos de limpeza nunca devem ser misturados sem indicação no rótulo.' };
  }

  var sec = document.createElement('section');
  sec.id = 'atq-simulador';
  sec.style.cssText = 'background:#0f172a;color:#f8fafc;border-radius:16px;padding:22px;margin-bottom:24px;border:1px solid rgba(56,189,248,0.28);box-shadow:0 12px 30px rgba(0,0,0,0.22);';

  var opts = itens.map(function (i) { return '<option value="' + i.id + '">' + i.nome + '</option>'; }).join('');
  sec.innerHTML =
    '<h2 style="margin:0;font-size:20px;color:#38bdf8;">⚠️ Simulador: Pode Misturar? (Segurança Química)</h2>' +
    '<p style="margin:4px 0 14px;font-size:13px;color:#cbd5e1;">Teste combinações entre substâncias presentes no projeto e descubra os riscos químicos no cotidiano.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
      '<button type="button" class="atq-preset" data-a="NaClO" data-b="NH4OH" style="background:#7f1d1d;color:#fecaca;border:0;border-radius:999px;padding:5px 10px;font-size:12px;cursor:pointer;">Água sanitária + Amônia</button>' +
      '<button type="button" class="atq-preset" data-a="NaHCO3" data-b="C6H8O7" style="background:#713f12;color:#fef08a;border:0;border-radius:999px;padding:5px 10px;font-size:12px;cursor:pointer;">Bicarbonato + Ácido cítrico</button>' +
      '<button type="button" class="atq-preset" data-a="H2SO4" data-b="NaOH" style="background:#7f1d1d;color:#fecaca;border:0;border-radius:999px;padding:5px 10px;font-size:12px;cursor:pointer;">Ácido de bateria + Soda cáustica</button>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;margin-bottom:14px;">' +
      '<div><label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;">Substância A</label><select id="atq-sim-a" style="width:100%;padding:10px;border-radius:8px;background:#1e293b;color:#f8fafc;border:1px solid #334155;">' + opts + '</select></div>' +
      '<div><label style="display:block;font-size:12px;color:#94a3b8;margin-bottom:4px;">Substância B</label><select id="atq-sim-b" style="width:100%;padding:10px;border-radius:8px;background:#1e293b;color:#f8fafc;border:1px solid #334155;">' + opts + '</select></div>' +
      '<button type="button" id="atq-sim-go" style="background:#0284c7;color:#fff;border:0;border-radius:8px;padding:11px 18px;font-weight:700;cursor:pointer;">Testar mistura</button>' +
    '</div>' +
    '<div id="atq-sim-res"></div>';

  obterRoot().appendChild(sec);
  var selA = document.getElementById('atq-sim-a');
  var selB = document.getElementById('atq-sim-b');
  selA.value = 'NaClO';
  selB.value = 'NH4OH';

  function mostrar() {
    var r = avaliar(selA.value, selB.value);
    var bg = r.nivel === 'perigo' ? 'rgba(185,28,28,0.28)' : (r.nivel === 'atencao' ? 'rgba(202,138,4,0.25)' : 'rgba(21,128,61,0.25)');
    var bd = r.nivel === 'perigo' ? '#ef4444' : (r.nivel === 'atencao' ? '#eab308' : '#22c55e');
    document.getElementById('atq-sim-res').innerHTML =
      '<div style="padding:14px;border-radius:12px;background:' + bg + ';border:1px solid ' + bd + ';">' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:6px;">' + r.titulo + '</div>' +
        '<div style="font-family:monospace;font-size:13px;background:rgba(15,23,42,0.7);padding:6px 10px;border-radius:6px;display:inline-block;margin-bottom:8px;">' + r.eq + '</div>' +
        '<div style="font-size:13px;color:#e2e8f0;">' + r.desc + '</div>' +
      '</div>';
  }

  document.getElementById('atq-sim-go').onclick = mostrar;
  Array.from(sec.querySelectorAll('.atq-preset')).forEach(function (b) {
    b.onclick = function () { selA.value = b.getAttribute('data-a'); selB.value = b.getAttribute('data-b'); mostrar(); };
  });
  mostrar();
})();
