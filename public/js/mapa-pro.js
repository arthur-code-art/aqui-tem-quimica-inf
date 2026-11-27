(function () {
  var CEFET_LNG_LAT = [-44.90610, -20.14190];
  var CORES = {
    'Ácido': { hex: '#ef4444', bg: 'rgba(239,68,68,0.18)' },
    'Base':  { hex: '#3b82f6', bg: 'rgba(59,130,246,0.18)' },
    'Sal':   { hex: '#22c55e', bg: 'rgba(34,197,94,0.18)' },
    'Óxido': { hex: '#f59e0b', bg: 'rgba(245,158,11,0.18)' }
  };

  var state = {
    raw: [], plaquinhas: [], filtradas: [],
    classe: 'Todas', zona: 'Todas', busca: '',
    modo3d: true, satelite: true, modoCoord: false, tour: false
  };

  var map = null, markers = [], tourTimer = null, tourIdx = 0;

  function corClasse(c) { return CORES[c] || { hex: '#38bdf8', bg: 'rgba(56,189,248,0.18)' }; }

  function carregarDados() {
    return fetch('/api/extras-dados').then(function (r) { return r.json(); }).then(function (dados) {
      state.raw = dados;
      var lista = [];
      dados.forEach(function (s) {
        (s.ocorrencias || []).forEach(function (o) {
          lista.push({
            codigo: o.codigo, zona: o.zona, localExato: o.localExato, grupo: o.grupo,
            lat: Number(o.lat) || CEFET_LNG_LAT[1], lng: Number(o.lng) || CEFET_LNG_LAT[0],
            autorizacao: o.autorizacao || { aprovada: true },
            nomeIupac: s.nomeIupac, formula: s.formula, formulaHtml: s.formulaHtml || s.formula,
            classe: s.classe, phEstimado: s.phEstimado, porQueEstaAqui: s.porQueEstaAqui || ''
          });
        });
      });
      lista.sort(function (a, b) { return a.codigo.localeCompare(b.codigo); });
      state.plaquinhas = lista;
      state.filtradas = lista.slice();
    });
  }

  function mostrarDetalhe(p) {
    var card = document.getElementById('detalhe-card');
    if (!p) { card.style.display = 'none'; return; }
    var cor = corClasse(p.classe);
    card.style.display = 'block';
    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
        '<div>' +
          '<span style="display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800;background:' + cor.bg + ';color:' + cor.hex + ';border:1px solid ' + cor.hex + ';">' + p.codigo + ' • ' + p.classe.toUpperCase() + '</span>' +
          '<h3 style="margin:6px 0 2px;font-size:18px;color:#f8fafc;">' + p.nomeIupac + ' <span style="color:#38bdf8;">(' + p.formulaHtml + ')</span></h3>' +
          '<div style="font-size:12px;color:#94a3b8;">📍 <strong>' + p.zona + '</strong> — ' + p.localExato + '</div>' +
        '</div>' +
        '<button type="button" id="fechar-detalhe" style="background:#334155;color:#fff;border:0;border-radius:8px;padding:5px 10px;cursor:pointer;font-weight:700;">✕</button>' +
      '</div>' +
      '<p style="margin:10px 0;font-size:13px;color:#cbd5e1;">' + p.porQueEstaAqui + '</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
        '<span style="font-size:11px;color:#94a3b8;">GPS: ' + p.lat.toFixed(5) + ', ' + p.lng.toFixed(5) + '</span>' +
        '<a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" style="background:#0284c7;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;">Abrir Ficha Completa →</a>' +
      '</div>';
    document.getElementById('fechar-detalhe').onclick = function () { mostrarDetalhe(null); };
  }

  function renderTabela() {
    document.getElementById('tabela-corpo').innerHTML = state.filtradas.map(function (p) {
      var cor = corClasse(p.classe);
      return '<tr>' +
        '<td><a href="/plaquinha/' + encodeURIComponent(p.codigo) + '" style="color:#38bdf8;font-weight:700;text-decoration:none;">' + p.codigo + '</a></td>' +
        '<td><span style="padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:' + cor.bg + ';color:' + cor.hex + ';">' + p.classe + '</span></td>' +
        '<td><strong>' + p.nomeIupac + '</strong></td>' +
        '<td style="font-family:monospace;">' + p.formulaHtml + '</td>' +
        '<td>' + p.zona + '</td>' +
        '<td>' + p.localExato + '</td>' +
        '<td>' + (p.autorizacao && p.autorizacao.aprovada ? '✅ Aprovada' : '⏳ Pendente') + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderMarkers() {
    if (!map) return;
    markers.forEach(function (m) { m.remove(); });
    markers = [];

    state.filtradas.forEach(function (p) {
      var cor = corClasse(p.classe);
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'pin-gl';
      el.style.borderColor = cor.hex;
      el.innerHTML = '<span class="pin-dot" style="background:' + cor.hex + ';box-shadow:0 0 8px ' + cor.hex + ';"></span><span>' + p.codigo.replace('INF-', '') + '</span>';
      el.title = p.codigo + ' — ' + p.nomeIupac + ' (' + p.zona + ')';
      el.onclick = function (ev) {
        ev.stopPropagation();
        map.flyTo({ center: [p.lng, p.lat], zoom: 19, pitch: state.modo3d ? 58 : 0, duration: 900 });
        mostrarDetalhe(p);
      };

      var mk = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markers.push(mk);
    });
  }

  function aplicarFiltros() {
    var q = state.busca.trim().toLowerCase();
    state.filtradas = state.plaquinhas.filter(function (p) {
      if (state.classe !== 'Todas' && p.classe !== state.classe) return false;
      if (state.zona !== 'Todas' && p.zona !== state.zona) return false;
      if (q && (p.codigo + ' ' + p.nomeIupac + ' ' + p.formula + ' ' + p.zona + ' ' + p.localExato).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    document.getElementById('stat-visiveis').textContent = state.filtradas.length + ' / ' + state.plaquinhas.length + ' plaquinhas visíveis';
    renderMarkers();
    renderTabela();

    if (map && state.zona !== 'Todas' && state.filtradas.length > 0) {
      var alvo = state.filtradas[0];
      map.flyTo({ center: [alvo.lng, alvo.lat], zoom: 18.6, pitch: state.modo3d ? 58 : 0, duration: 900 });
    }
  }

  function initMap() {
    map = new maplibregl.Map({
      container: 'mapa-gl',
      center: CEFET_LNG_LAT,
      zoom: 17.6,
      pitch: 56,
      bearing: -18,
      antialias: true,
      style: {
        version: 8,
        sources: {
          satelite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: 'Satélite © Esri'
          },
          ruas: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap'
          }
        },
        layers: [
          { id: 'layer-sat', type: 'raster', source: 'satelite', layout: { visibility: 'visible' } },
          { id: 'layer-ruas', type: 'raster', source: 'ruas', layout: { visibility: 'none' } }
        ]
      }
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('click', function (ev) {
      if (!state.modoCoord) return;
      var cod = document.getElementById('coord-select').value;
      var lat = Number(ev.lngLat.lat.toFixed(6));
      var lng = Number(ev.lngLat.lng.toFixed(6));
      var item = state.plaquinhas.find(function (p) { return p.codigo === cod; });
      if (!item) return;
      item.lat = lat;
      item.lng = lng;
      state.raw.forEach(function (s) {
        (s.ocorrencias || []).forEach(function (o) {
          if (o.codigo === cod) { o.lat = lat; o.lng = lng; }
        });
      });
      document.getElementById('coord-status').textContent = '✅ ' + cod + ' atualizada: ' + lat + ', ' + lng;
      renderMarkers();
    });

    map.on('load', function () { renderMarkers(); });
  }

  function preencherSelects() {
    var zonas = Array.from(new Set(state.plaquinhas.map(function (p) { return p.zona; })));
    document.getElementById('filtro-zona').innerHTML = '<option value="Todas">Todas as 9 zonas</option>' +
      zonas.map(function (z) { return '<option value="' + z + '">📍 ' + z + '</option>'; }).join('');
    document.getElementById('coord-select').innerHTML = state.plaquinhas.map(function (p) {
      return '<option value="' + p.codigo + '">' + p.codigo + ' — ' + p.nomeIupac + '</option>';
    }).join('');
  }

  function bindEventos() {
    document.getElementById('filtro-classe').onchange = function (e) { state.classe = e.target.value; aplicarFiltros(); };
    document.getElementById('filtro-zona').onchange = function (e) { state.zona = e.target.value; aplicarFiltros(); };
    document.getElementById('filtro-busca').oninput = function (e) { state.busca = e.target.value; aplicarFiltros(); };

    document.getElementById('btn-3d').onclick = function () {
      state.modo3d = !state.modo3d;
      this.textContent = state.modo3d ? '🏛️ Visão 3D (Ativa)' : '🗺️ Visão 2D (Topo)';
      this.classList.toggle('ativo', state.modo3d);
      if (map) map.easeTo({ pitch: state.modo3d ? 56 : 0, bearing: state.modo3d ? -18 : 0, duration: 700 });
    };

    document.getElementById('btn-camada').onclick = function () {
      state.satelite = !state.satelite;
      this.textContent = state.satelite ? '🗺️ Ver Ruas' : '🛰️ Ver Satélite';
      if (map) {
        map.setLayoutProperty('layer-sat', 'visibility', state.satelite ? 'visible' : 'none');
        map.setLayoutProperty('layer-ruas', 'visibility', state.satelite ? 'none' : 'visible');
      }
    };

    document.getElementById('btn-cefet').onclick = function () {
      if (map) map.flyTo({ center: CEFET_LNG_LAT, zoom: 17.6, pitch: state.modo3d ? 56 : 0, bearing: -18, duration: 900 });
    };

    document.getElementById('btn-tour').onclick = function () {
      state.tour = !state.tour;
      this.textContent = state.tour ? '⏹ Parar Tour' : '🎬 Tour CEFET';
      this.classList.toggle('ativo', state.tour);
      if (tourTimer) { clearInterval(tourTimer); tourTimer = null; }
      if (state.tour && state.filtradas.length > 0) {
        var ir = function () {
          var p = state.filtradas[tourIdx % state.filtradas.length];
          tourIdx++;
          map.flyTo({ center: [p.lng, p.lat], zoom: 19, pitch: 60, bearing: (tourIdx * 35) % 360, duration: 1500 });
          mostrarDetalhe(p);
        };
        ir();
        tourTimer = setInterval(ir, 4200);
      }
    };

    document.getElementById('btn-modo-coord').onclick = function () {
      state.modoCoord = !state.modoCoord;
      this.classList.toggle('ativo', state.modoCoord);
      document.getElementById('coord-bar').style.display = state.modoCoord ? 'flex' : 'none';
    };

    document.getElementById('btn-baixar-json').onclick = function () {
      var blob = new Blob([JSON.stringify(state.raw, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'substancias.json';
      a.click();
    };

    document.getElementById('btn-imprimir').onclick = function () { window.print(); };
  }

  document.addEventListener('DOMContentLoaded', function () {
    carregarDados().then(function () {
      preencherSelects();
      bindEventos();
      initMap();
      aplicarFiltros();
    });
  });
})();