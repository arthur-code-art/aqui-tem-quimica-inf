(function () {
  const STORAGE_KEY = 'atq_plaquinhas_visitadas_v1';
  const TOTAL = 38;

  function lerVisitadas() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function salvarVisitada(codigo) {
    try {
      const set = new Set(lerVisitadas());
      set.add(codigo.toUpperCase());
      const lista = Array.from(set);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      return lista;
    } catch { return []; }
  }

  const textoUrl = decodeURIComponent(window.location.pathname + ' ' + window.location.search);
  const match = textoUrl.match(/INF-G\d{2}-P\d+/i);
  const visitadas = match ? salvarVisitada(match[0]) : lerVisitadas();

  if (visitadas.length === 0 && !match) return;

  const bar = document.createElement('div');
  bar.id = 'atq-progresso-bar';
  bar.style.cssText = [
    'position:fixed', 'left:14px', 'bottom:14px', 'z-index:9990',
    'display:flex', 'align-items:center', 'gap:8px',
    'background:rgba(15,23,42,0.92)', 'color:#f8fafc',
    'padding:8px 12px', 'border-radius:999px',
    'font-family:system-ui,-apple-system,sans-serif', 'font-size:13px',
    'box-shadow:0 6px 20px rgba(0,0,0,0.28)', 'backdrop-filter:blur(6px)',
    'border:1px solid rgba(148,163,184,0.25)'
  ].join(';');

  const pct = Math.min(100, Math.round((visitadas.length / TOTAL) * 100));
  bar.innerHTML =
    '<span title="Plaquinhas descobertas neste celular">🧪 <strong>' + visitadas.length + '/' + TOTAL + '</strong> (' + pct + '%)</span>' +
    '<button type="button" id="atq-share-btn" style="background:#0284c7;color:#fff;border:0;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer;font-weight:600;">Compartilhar</button>';

  document.body.appendChild(bar);

  const btn = document.getElementById('atq-share-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      const shareData = { title: document.title, text: 'Olha essa plaquinha do projeto AQUI TEM QUÍMICA!', url: window.location.href };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(window.location.href);
          btn.textContent = 'Link copiado!';
          setTimeout(() => { btn.textContent = 'Compartilhar'; }, 2000);
        }
      } catch {}
    });
  }
})();
