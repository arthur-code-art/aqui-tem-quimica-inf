(function () {
  var THEME_KEY = 'atq_tema_visual_v1';
  var reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function temaAtual() {
    return document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'neon';
  }

  var salvo = 'neon';
  try { salvo = localStorage.getItem(THEME_KEY) || 'neon'; } catch (e) {}
  if (salvo === 'claro') document.documentElement.setAttribute('data-tema', 'claro');
  else document.documentElement.removeAttribute('data-tema');

  function iniciarParticulas() {
    if (reduzido || document.getElementById('atq-fx-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'atq-fx-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0;
    var qtd = window.innerWidth < 640 ? 18 : 36;
    var nos = [];

    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < qtd; i++) {
      nos.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: 1.8 + Math.random() * 2.2, idx: i
      });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      var claro = temaAtual() === 'claro';
      var cores = claro ? ['#b8860b', '#d4a024', '#c89b3c', '#e6c675'] : ['#c084fc', '#f5d37a', '#22d3ee', '#e879f9'];
      var lineRgb = claro ? '200, 155, 60' : '192, 132, 252';

      for (var i = 0; i < nos.length; i++) {
        var a = nos[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        for (var j = i + 1; j < nos.length; j++) {
          var b = nos[j];
          var d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(' + lineRgb + ',' + ((1 - d / 130) * (claro ? 0.25 : 0.20)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        var cor = cores[a.idx % cores.length];
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = cor;
        ctx.shadowColor = cor;
        ctx.shadowBlur = claro ? 5 : 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function ativarInteracoes() {
    var alvos = document.querySelectorAll('section, article, .card, #atq-escala-ph, #atq-quiz, #atq-simulador, #atq-guia-voz, #atq-mol3d-sec, .tabela-sec, .toolbar');
    var obs = null;
    if (!reduzido && 'IntersectionObserver' in window) {
      obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('atq-visivel');
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.01, rootMargin: '120px 0px 120px 0px' });
    }

    alvos.forEach(function (el) {
      if (el.dataset.atqBound) return;
      el.dataset.atqBound = '1';
      el.classList.add('atq-glow-card');
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        el.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });

      // Nunca esconde secoes muito altas (evita listas grandes ficarem invisiveis)
      var rect = el.getBoundingClientRect();
      var muitoAlto = rect.height > window.innerHeight * 0.72;
      var jaNaTela = rect.top < window.innerHeight + 80;
      if (obs && !muitoAlto && !jaNaTela && !el.closest('#canvas-3d-wrap') && !el.closest('#mapa-2d-canvas')) {
        el.classList.add('atq-reveal');
        obs.observe(el);
      } else {
        el.classList.remove('atq-reveal');
        el.classList.add('atq-visivel');
      }
    });
  }

  // Garantia absoluta: nenhum bloco permanece oculto
  function revelarTodosPresos() {
    document.querySelectorAll('.atq-reveal:not(.atq-visivel)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 160 || r.height > window.innerHeight * 0.7) {
        el.classList.add('atq-visivel');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    iniciarParticulas();
    ativarInteracoes();
    setTimeout(function () { ativarInteracoes(); revelarTodosPresos(); }, 700);
    setTimeout(function () {
      document.querySelectorAll('.atq-reveal').forEach(function (el) { el.classList.add('atq-visivel'); });
    }, 1800);
  });
  window.addEventListener('scroll', revelarTodosPresos, { passive: true });
})();

/* ATQ_CONTRASTE_JS_INICIO */
(function () {
  var SKIP_SEL = 'svg, svg *, script, style, canvas, img, video, iframe, #atq-fx-canvas, #mapa-2d-canvas, #mapa-2d-canvas *, #canvas-3d-wrap, #canvas-3d-wrap *, #atq-mol-viewport, #atq-mol-viewport *, .leaflet-container, .leaflet-container *, .btn-primary, .btn.ativo, .atq-nav-link.ativo, .atq-nav-ia, .el-cell.no-campus';

  function parseRgba(str) {
    var m = String(str || '').match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  }

  function mediaGradiente(bgImg) {
    if (!bgImg || bgImg === 'none' || bgImg.indexOf('gradient') === -1) return null;
    var matches = bgImg.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g);
    if (!matches || !matches.length) return null;
    var r = 0, g = 0, b = 0, aSum = 0, count = 0;
    for (var i = 0; i < matches.length; i++) {
      var c = parseRgba(matches[i]);
      if (c && c.a > 0.05) {
        r += c.r; g += c.g; b += c.b; aSum += c.a; count++;
      }
    }
    if (!count) return null;
    return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count), a: Math.min(1, aSum / count) };
  }

  function blend(fg, bg) {
    var a = fg.a;
    return {
      r: Math.round(fg.r * a + bg.r * (1 - a)),
      g: Math.round(fg.g * a + bg.g * (1 - a)),
      b: Math.round(fg.b * a + bg.b * (1 - a)),
      a: 1
    };
  }

  function lum(c) {
    var vals = [c.r, c.g, c.b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2];
  }

  function contraste(c1, c2) {
    var l1 = lum(c1), l2 = lum(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  function fundoEfetivo(el) {
    var camadas = [];
    var cur = el;
    while (cur && cur.nodeType === 1) {
      var cs = window.getComputedStyle(cur);
      var grad = mediaGradiente(cs.backgroundImage);
      var solid = parseRgba(cs.backgroundColor);
      var layer = grad || (solid && solid.a > 0.03 ? solid : null);
      if (layer) {
        camadas.push(layer);
        if (layer.a >= 0.96) break;
      }
      cur = cur.parentElement;
    }
    var claro = document.documentElement.getAttribute('data-tema') === 'claro';
    var cor = claro ? { r: 253, g: 251, b: 247, a: 1 } : { r: 11, g: 6, b: 20, a: 1 };
    for (var i = camadas.length - 1; i >= 0; i--) {
      cor = blend(camadas[i], cor);
    }
    return cor;
  }

  function temTextoDireto(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim().length > 0) return true;
    }
    return false;
  }

  var rodando = false;
  var timer = null;

  function auditarContrasteTela() {
    if (rodando) return;
    rodando = true;
    try {
      document.querySelectorAll('[data-atq-ink]').forEach(function (n) {
        n.removeAttribute('data-atq-ink');
        n.removeAttribute('data-atq-pill');
      });

      var nos = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,button,label,strong,small,span,td,th,dt,dd,figcaption,div');
      for (var i = 0; i < nos.length; i++) {
        var el = nos[i];
        if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
        if (el.matches && el.matches(SKIP_SEL)) continue;

        var tag = el.tagName;
        var ehTitulo = /^H[1-6]$/.test(tag);
        var ehLinkOuBotao = tag === 'A' || tag === 'BUTTON';
        if (!ehTitulo && !ehLinkOuBotao && !temTextoDireto(el)) continue;

        var cs = window.getComputedStyle(el);
        var fg = parseRgba(cs.color);
        if (!fg) continue;

        var fillCol = cs.webkitTextFillColor ? parseRgba(cs.webkitTextFillColor) : null;
        var gradTextoTransparente = fillCol && fillCol.a < 0.1;

        var bg = fundoEfetivo(el);
        var bgLum = lum(bg);
        var ratio = contraste(fg, bg);
        if (gradTextoTransparente) {
          var tGrad = mediaGradiente(cs.backgroundImage);
          ratio = tGrad ? contraste(tGrad, bg) : 4.5;
        }

        var limite = (ehTitulo || ehLinkOuBotao || tag === 'P' || tag === 'LI' || tag === 'TD' || tag === 'TH' || tag === 'LABEL') ? 3.8 : 2.9;

        if (ratio < limite) {
          if (bgLum > 0.36) {
            el.setAttribute('data-atq-ink', 'dark');
            if (ehLinkOuBotao) {
              var ownBg = parseRgba(cs.backgroundColor);
              if (ownBg && ownBg.a > 0.6 && lum(ownBg) > 0.7) {
                el.setAttribute('data-atq-pill', '1');
              }
            }
          } else {
            el.setAttribute('data-atq-ink', 'light');
          }
        }
      }
    } finally {
      rodando = false;
    }
  }

  function agendarAuditoria(ms) {
    clearTimeout(timer);
    timer = setTimeout(auditarContrasteTela, ms || 160);
  }

  document.addEventListener('DOMContentLoaded', function () {
    agendarAuditoria(80);
    setTimeout(auditarContrasteTela, 600);
    setTimeout(auditarContrasteTela, 1600);
    if (window.MutationObserver && document.body) {
      var mo = new MutationObserver(function () { agendarAuditoria(220); });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  });

  window.addEventListener('load', function () { agendarAuditoria(120); });
  window.addEventListener('atq-tema-mudou', function () { agendarAuditoria(60); });
})();
/* ATQ_CONTRASTE_JS_FIM */
