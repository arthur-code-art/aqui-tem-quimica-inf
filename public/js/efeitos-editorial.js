(function () {
  var THEME_KEY = 'atq_tema_visual_v1';
  var reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Aplicar tema salvo (padrao: neon escuro, com opcao editorial claro alabastro)
  function aplicarTema(tema) {
    if (tema === 'claro') document.documentElement.setAttribute('data-tema', 'claro');
    else document.documentElement.removeAttribute('data-tema');
    try { localStorage.setItem(THEME_KEY, tema); } catch (e) {}
    var btn = document.getElementById('atq-tema-toggle');
    if (btn) {
      btn.innerHTML = tema === 'claro' ? '✨ Modo Neon' : '☀️ Modo Alabastro';
      btn.setAttribute('aria-label', tema === 'claro' ? 'Ativar modo neon escuro' : 'Ativar modo editorial claro');
    }
  }

  var salvo = 'neon';
  try { salvo = localStorage.getItem(THEME_KEY) || 'neon'; } catch (e) {}
  aplicarTema(salvo);

  // 2. Inserir alternador de tema no header ou topo direito
  function montarToggle() {
    if (document.getElementById('atq-tema-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'atq-tema-toggle';
    btn.onclick = function () {
      var atual = document.documentElement.getAttribute('data-tema') === 'claro' ? 'claro' : 'neon';
      aplicarTema(atual === 'claro' ? 'neon' : 'claro');
    };

    var nav = document.querySelector('header nav');
    if (nav) {
      nav.appendChild(btn);
    } else {
      btn.style.position = 'fixed';
      btn.style.top = '12px';
      btn.style.right = '12px';
      document.body.appendChild(btn);
    }
    aplicarTema(salvo);
  }

  // 3. Fundo animado de particulas moleculares neon (espectroscopia)
  function iniciarParticulas() {
    if (reduzido || document.getElementById('atq-fx-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'atq-fx-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0;
    var qtd = window.innerWidth < 640 ? 22 : 42;
    var cores = ['#c084fc', '#f5d37a', '#22d3ee', '#e879f9'];
    var nos = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < qtd; i++) {
      nos.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: 1.8 + Math.random() * 2.4,
        cor: cores[i % cores.length]
      });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nos.length; i++) {
        var a = nos[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        for (var j = i + 1; j < nos.length; j++) {
          var b = nos[j];
          var d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 135) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(192, 132, 252,' + ((1 - d / 135) * 0.22).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = a.cor;
        ctx.shadowColor = a.cor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // 4. Scroll Reveal + Brilho interativo nos cards
  function ativarInteracoes() {
    var alvos = document.querySelectorAll('section, article, .card, #atq-escala-ph, #atq-quiz, #atq-simulador, #atq-guia-voz, .tabela-sec, .toolbar');
    var obs = null;
    if (!reduzido && 'IntersectionObserver' in window) {
      obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('atq-visivel');
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });
    }

    alvos.forEach(function (el, idx) {
      if (el.dataset.atqBound) return;
      el.dataset.atqBound = '1';
      el.classList.add('atq-glow-card');

      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        el.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });

      if (obs && !el.closest('#mapa-gl')) {
        el.classList.add('atq-reveal');
        el.style.transitionDelay = Math.min(idx * 45, 220) + 'ms';
        obs.observe(el);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    montarToggle();
    iniciarParticulas();
    ativarInteracoes();
    // Re-observar secoes injetadas dinamicamente por outros scripts
    setTimeout(ativarInteracoes, 700);
    setTimeout(ativarInteracoes, 1800);
  });
})();