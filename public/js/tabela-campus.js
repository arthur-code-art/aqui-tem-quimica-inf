(function () {
  var ELEMENTOS = [
    [1,'H','Hidrogênio',1.008,1,1,'nao-metal'],[2,'He','Hélio',4.0026,18,1,'gas-nobre'],
    [3,'Li','Lítio',6.94,1,2,'alcalino'],[4,'Be','Berílio',9.0122,2,2,'alcalino-terroso'],
    [5,'B','Boro',10.81,13,2,'semimetal'],[6,'C','Carbono',12.011,14,2,'nao-metal'],
    [7,'N','Nitrogênio',14.007,15,2,'nao-metal'],[8,'O','Oxigênio',15.999,16,2,'nao-metal'],
    [9,'F','Flúor',18.998,17,2,'halogenio'],[10,'Ne','Neônio',20.18,18,2,'gas-nobre'],
    [11,'Na','Sódio',22.99,1,3,'alcalino'],[12,'Mg','Magnésio',24.305,2,3,'alcalino-terroso'],
    [13,'Al','Alumínio',26.982,13,3,'outros-metais'],[14,'Si','Silício',28.085,14,3,'semimetal'],
    [15,'P','Fósforo',30.974,15,3,'nao-metal'],[16,'S','Enxofre',32.06,16,3,'nao-metal'],
    [17,'Cl','Cloro',35.45,17,3,'halogenio'],[18,'Ar','Argônio',39.948,18,3,'gas-nobre'],
    [19,'K','Potássio',39.098,1,4,'alcalino'],[20,'Ca','Cálcio',40.078,2,4,'alcalino-terroso'],
    [21,'Sc','Escândio',44.956,3,4,'transicao'],[22,'Ti','Titânio',47.867,4,4,'transicao'],
    [23,'V','Vanádio',50.942,5,4,'transicao'],[24,'Cr','Cromo',51.996,6,4,'transicao'],
    [25,'Mn','Manganês',54.938,7,4,'transicao'],[26,'Fe','Ferro',55.845,8,4,'transicao'],
    [27,'Co','Cobalto',58.933,9,4,'transicao'],[28,'Ni','Níquel',58.693,10,4,'transicao'],
    [29,'Cu','Cobre',63.546,11,4,'transicao'],[30,'Zn','Zinco',65.38,12,4,'transicao'],
    [31,'Ga','Gálio',69.723,13,4,'outros-metais'],[32,'Ge','Germânio',72.63,14,4,'semimetal'],
    [33,'As','Arsênio',74.922,15,4,'semimetal'],[34,'Se','Selênio',78.971,16,4,'nao-metal'],
    [35,'Br','Bromo',79.904,17,4,'halogenio'],[36,'Kr','Criptônio',83.798,18,4,'gas-nobre'],
    [37,'Rb','Rubídio',85.468,1,5,'alcalino'],[38,'Sr','Estrôncio',87.62,2,5,'alcalino-terroso'],
    [39,'Y','Ítrio',88.906,3,5,'transicao'],[40,'Zr','Zircônio',91.224,4,5,'transicao'],
    [41,'Nb','Nióbio',92.906,5,5,'transicao'],[42,'Mo','Molibdênio',95.95,6,5,'transicao'],
    [43,'Tc','Tecnécio',98,7,5,'transicao'],[44,'Ru','Rutênio',101.07,8,5,'transicao'],
    [45,'Rh','Ródio',102.91,9,5,'transicao'],[46,'Pd','Paládio',106.42,10,5,'transicao'],
    [47,'Ag','Prata',107.87,11,5,'transicao'],[48,'Cd','Cádmio',112.41,12,5,'transicao'],
    [49,'In','Índio',114.82,13,5,'outros-metais'],[50,'Sn','Estanho',118.71,14,5,'outros-metais'],
    [51,'Sb','Antimônio',121.76,15,5,'semimetal'],[52,'Te','Telúrio',127.6,16,5,'semimetal'],
    [53,'I','Iodo',126.9,17,5,'halogenio'],[54,'Xe','Xenônio',131.29,18,5,'gas-nobre'],
    [55,'Cs','Césio',132.91,1,6,'alcalino'],[56,'Ba','Bário',137.33,2,6,'alcalino-terroso'],
    [72,'Hf','Háfnio',178.49,4,6,'transicao'],[73,'Ta','Tântalo',180.95,5,6,'transicao'],
    [74,'W','Tungstênio',183.84,6,6,'transicao'],[75,'Re','Rênio',186.21,7,6,'transicao'],
    [76,'Os','Ósmio',190.23,8,6,'transicao'],[77,'Ir','Irídio',192.22,9,6,'transicao'],
    [78,'Pt','Platina',195.08,10,6,'transicao'],[79,'Au','Ouro',196.97,11,6,'transicao'],
    [80,'Hg','Mercúrio',200.59,12,6,'transicao'],[81,'Tl','Tálio',204.38,13,6,'outros-metais'],
    [82,'Pb','Chumbo',207.2,14,6,'outros-metais'],[83,'Bi','Bismuto',208.98,15,6,'outros-metais'],
    [84,'Po','Polônio',209,16,6,'semimetal'],[85,'At','Astato',210,17,6,'halogenio'],
    [86,'Rn','Radônio',222,18,6,'gas-nobre'],
    [87,'Fr','Frâncio',223,1,7,'alcalino'],[88,'Ra','Rádio',226,2,7,'alcalino-terroso'],
    [104,'Rf','Rutherfórdio',267,4,7,'transicao'],[105,'Db','Dúbnio',268,5,7,'transicao'],
    [106,'Sg','Seabórgio',269,6,7,'transicao'],[107,'Bh','Bóhrio',270,7,7,'transicao'],
    [108,'Hs','Hássio',277,8,7,'transicao'],[109,'Mt','Meitnério',278,9,7,'transicao'],
    [110,'Ds','Darmstádio',281,10,7,'transicao'],[111,'Rg','Roentgênio',282,11,7,'transicao'],
    [112,'Cn','Copernício',285,12,7,'transicao'],[113,'Nh','Nihônio',286,13,7,'outros-metais'],
    [114,'Fl','Fleróvio',289,14,7,'outros-metais'],[115,'Mc','Moscóvio',290,15,7,'outros-metais'],
    [116,'Lv','Livermório',293,16,7,'outros-metais'],[117,'Ts','Tenessino',294,17,7,'halogenio'],
    [118,'Og','Oganessônio',294,18,7,'gas-nobre'],
    [57,'La','Lantânio',138.91,4,9,'lantanideo'],[58,'Ce','Cério',140.12,5,9,'lantanideo'],
    [59,'Pr','Praseodímio',140.91,6,9,'lantanideo'],[60,'Nd','Neodímio',144.24,7,9,'lantanideo'],
    [61,'Pm','Promécio',145,8,9,'lantanideo'],[62,'Sm','Samário',150.36,9,9,'lantanideo'],
    [63,'Eu','Európio',151.96,10,9,'lantanideo'],[64,'Gd','Gadolínio',157.25,11,9,'lantanideo'],
    [65,'Tb','Térbio',158.93,12,9,'lantanideo'],[66,'Dy','Disprósio',162.5,13,9,'lantanideo'],
    [67,'Ho','Hólmio',164.93,14,9,'lantanideo'],[68,'Er','Érbio',167.26,15,9,'lantanideo'],
    [69,'Tm','Túlio',168.93,16,9,'lantanideo'],[70,'Yb','Itérbio',173.05,17,9,'lantanideo'],
    [71,'Lu','Lutécio',174.97,18,9,'lantanideo'],
    [89,'Ac','Actínio',227,4,10,'actinideo'],[90,'Th','Tório',232.04,5,10,'actinideo'],
    [91,'Pa','Protactínio',231.04,6,10,'actinideo'],[92,'U','Urânio',238.03,7,10,'actinideo'],
    [93,'Np','Netúnio',237,8,10,'actinideo'],[94,'Pu','Plutônio',244,9,10,'actinideo'],
    [95,'Am','Amerício',243,10,10,'actinideo'],[96,'Cm','Cúrio',247,11,10,'actinideo'],
    [97,'Bk','Berquélio',247,12,10,'actinideo'],[98,'Cf','Califórnio',251,13,10,'actinideo'],
    [99,'Es','Einstênio',252,14,10,'actinideo'],[100,'Fm','Férmio',257,15,10,'actinideo'],
    [101,'Md','Mendelévio',258,16,10,'actinideo'],[102,'No','Nobélio',259,17,10,'actinideo'],
    [103,'Lr','Laurêncio',266,18,10,'actinideo']
  ];

  var POR_SIMBOLO = {};
  ELEMENTOS.forEach(function (e) { POR_SIMBOLO[e[1]] = { z: e[0], sym: e[1], nome: e[2], massa: e[3], col: e[4], row: e[5], cat: e[6] }; });

  function normFormula(f) {
    var mapa = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
    return String(f || '').replace(/[₀-₉]/g, function (c) { return mapa[c]; }).replace(/\s+/g, '');
  }

  function contarAtomos(formulaStr) {
    var f = normFormula(formulaStr).replace(/[^A-Za-z0-9()\[\]]/g, '').replace(/\[/g, '(').replace(/\]/g, ')');
    var stack = [{}];
    var i = 0;
    while (i < f.length) {
      if (f[i] === '(') { stack.push({}); i++; }
      else if (f[i] === ')') {
        i++;
        var numStr = '';
        while (i < f.length && /\d/.test(f[i])) { numStr += f[i++]; }
        var mult = numStr ? parseInt(numStr, 10) : 1;
        var grupo = stack.pop() || {};
        var topo = stack[stack.length - 1] || {};
        Object.keys(grupo).forEach(function (k) { topo[k] = (topo[k] || 0) + grupo[k] * mult; });
      } else if (/[A-Z]/.test(f[i])) {
        var sym = f[i++];
        if (i < f.length && /[a-z]/.test(f[i])) sym += f[i++];
        var nStr = '';
        while (i < f.length && /\d/.test(f[i])) { nStr += f[i++]; }
        var qtd = nStr ? parseInt(nStr, 10) : 1;
        var atual = stack[stack.length - 1];
        atual[sym] = (atual[sym] || 0) + qtd;
      } else { i++; }
    }
    return stack[0] || {};
  }

  fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
    var mapaCampus = {};
    dados.forEach(function (s) {
      var atomos = contarAtomos(s.formula);
      Object.keys(atomos).forEach(function (sym) {
        if (!mapaCampus[sym]) mapaCampus[sym] = [];
        mapaCampus[sym].push(s);
      });
    });

    var qtdEncontrados = Object.keys(mapaCampus).filter(function (k) { return POR_SIMBOLO[k]; }).length;
    document.getElementById('stat-elementos').textContent = qtdEncontrados + ' elementos químicos presentes nas 25 substâncias da escola';

    var grid = document.getElementById('tabela-grid');
    grid.innerHTML = '';

    function selecionarElemento(el) {
      Array.from(grid.querySelectorAll('.el-cell.selecionado')).forEach(function (n) { n.classList.remove('selecionado'); });
      var cel = grid.querySelector('[data-sym="' + el.sym + '"]');
      if (cel) cel.classList.add('selecionado');

      var subs = mapaCampus[el.sym] || [];
      var box = document.getElementById('elemento-detalhe');
      var cards = subs.length
        ? subs.map(function (s) {
            var p1 = (s.ocorrencias && s.ocorrencias[0]) ? s.ocorrencias[0] : null;
            var link = p1 ? '/plaquinha/' + encodeURIComponent(p1.codigo) : '/';
            var locais = (s.ocorrencias || []).map(function (o) { return o.codigo + ' (' + o.zona + ')'; }).join(' • ');
            return '<a href="' + link + '" style="display:block;padding:11px;border-radius:12px;background:rgba(192,132,252,0.12);border:1px solid rgba(200,162,77,0.38);text-decoration:none;color:inherit;">' +
              '<div style="font-size:11px;font-weight:800;color:#f5d37a;">' + s.classe.toUpperCase() + ' • ' + s.formula + '</div>' +
              '<div style="font-size:15px;font-weight:700;margin:2px 0;">' + s.nomeIupac + '</div>' +
              '<div style="font-size:11px;opacity:0.82;">📍 ' + locais + '</div></a>';
          }).join('')
        : '<div style="font-size:13px;opacity:0.8;">Este elemento não aparece diretamente nas 25 fórmulas das plaquinhas do campus.</div>';

      box.innerHTML =
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-bottom:14px;">' +
          '<div style="width:68px;height:68px;border-radius:14px;border:2px solid #f5d37a;background:linear-gradient(135deg,#4a2c6d,#1b0d30);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;box-shadow:0 0 20px rgba(192,132,252,0.45);">' +
            '<span style="font-size:10px;opacity:0.8;">' + el.z + '</span>' +
            '<strong style="font-size:26px;line-height:1;">' + el.sym + '</strong>' +
          '</div>' +
          '<div>' +
            '<h3 style="margin:0;font-size:22px;">' + el.nome + ' (' + el.sym + ')</h3>' +
            '<div style="font-size:13px;opacity:0.85;">Número atômico: <strong>' + el.z + '</strong> • Massa atômica: <strong>' + el.massa + ' u</strong> • Presente em <strong>' + subs.length + '</strong> substância(s) do CEFET</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;">' + cards + '</div>';
    }

    ELEMENTOS.forEach(function (raw) {
      var el = POR_SIMBOLO[raw[1]];
      var subs = mapaCampus[el.sym] || [];
      var ativo = subs.length > 0;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'el-cell ' + (ativo ? 'no-campus' : 'apagado');
      btn.setAttribute('data-sym', el.sym);
      btn.style.gridColumn = el.col;
      btn.style.gridRow = el.row;
      btn.innerHTML =
        '<span class="el-z">' + el.z + '</span>' +
        '<strong class="el-sym">' + el.sym + '</strong>' +
        '<span class="el-nome">' + el.nome + '</span>' +
        (ativo ? '<span class="el-qtd">' + subs.length + '</span>' : '');
      btn.onclick = function () { selecionarElemento(el); };
      grid.appendChild(btn);
    });

    // Selecionar Oxigenio (O) por padrao
    if (POR_SIMBOLO.O) selecionarElemento(POR_SIMBOLO.O);

    // ===== CALCULADORA DE MASSA MOLAR =====
    var presets = document.getElementById('calc-presets');
    presets.innerHTML = dados.slice(0, 10).map(function (s) {
      return '<button type="button" class="btn" data-f="' + normFormula(s.formula) + '" style="padding:5px 10px;font-size:12px;">' + s.formula + '</button>';
    }).join('');

    var inp = document.getElementById('calc-input');
    function calcular() {
      var formula = inp.value.trim();
      var resBox = document.getElementById('calc-res');
      if (!formula) { resBox.innerHTML = ''; return; }
      var atomos = contarAtomos(formula);
      var chaves = Object.keys(atomos);
      if (chaves.length === 0) {
        resBox.innerHTML = '<div style="color:#fca5a5;">Digite uma fórmula válida (ex.: H2SO4, Ca(OH)2, NaHCO3).</div>';
        return;
      }
      var total = 0;
      var invalidos = [];
      var partes = chaves.map(function (sym) {
        var info = POR_SIMBOLO[sym];
        if (!info) { invalidos.push(sym); return null; }
        var subMassa = info.massa * atomos[sym];
        total += subMassa;
        return { sym: sym, nome: info.nome, qtd: atomos[sym], massaAtomica: info.massa, subtotal: subMassa };
      }).filter(Boolean);

      if (invalidos.length > 0) {
        resBox.innerHTML = '<div style="color:#fca5a5;">Elemento(s) não reconhecido(s): <strong>' + invalidos.join(', ') + '</strong> (atenção às letras maiúsculas/minúsculas, como Ca, Na, Cl).</div>';
        return;
      }

      var barras = partes.map(function (p) {
        var pct = (p.subtotal / total) * 100;
        return '<div style="margin-bottom:8px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">' +
            '<span><strong>' + p.sym + '</strong> (' + p.nome + ') × ' + p.qtd + ' = ' + p.subtotal.toFixed(2) + ' g/mol</span>' +
            '<strong style="color:#f5d37a;">' + pct.toFixed(1) + '%</strong>' +
          '</div>' +
          '<div style="height:8px;border-radius:999px;background:rgba(255,255,255,0.12);overflow:hidden;">' +
            '<div style="height:100%;width:' + pct.toFixed(1) + '%;background:linear-gradient(90deg,#6d4aa3,#c084fc,#f5d37a);"></div>' +
          '</div></div>';
      }).join('');

      resBox.innerHTML =
        '<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin-bottom:12px;">' +
          '<span style="font-size:13px;opacity:0.85;">Massa molar de <strong style="font-family:\'JetBrains Mono\',monospace;">' + formula + '</strong>:</span>' +
          '<strong style="font-size:26px;color:#f5d37a;font-family:\'JetBrains Mono\',monospace;">' + total.toFixed(2) + ' g/mol</strong>' +
        '</div>' + barras;
    }

    document.getElementById('calc-btn').onclick = calcular;
    inp.addEventListener('input', calcular);
    Array.from(presets.querySelectorAll('button')).forEach(function (b) {
      b.onclick = function () { inp.value = b.getAttribute('data-f'); calcular(); };
    });
    inp.value = 'Ca(OH)2';
    calcular();
  });
})();