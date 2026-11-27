const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://aqui-tem-quimica-inf.onrender.com';

function reqStatus(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      res.resume();
      resolve({ status: res.statusCode, location: res.headers.location || '' });
    });
    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    req.setTimeout(20000, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

(async () => {
  console.log('=== 1. VERIFICACAO LOCAL (JSON E IMAGENS) ===');
  const dataPath = path.join(__dirname, '..', 'data', 'substancias.json');
  const dados = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const codigosOficiais = [];
  let fotosFaltando = 0;

  for (const s of dados) {
    if (s.fotoPlaquinha && s.fotoPlaquinha.startsWith('/')) {
      const imgFile = path.join(__dirname, '..', 'public', s.fotoPlaquinha.replace(/^\//, ''));
      if (!fs.existsSync(imgFile)) {
        console.log('[FOTO FALTANDO]', s.slug, '->', s.fotoPlaquinha);
        fotosFaltando++;
      }
    }
    for (const oc of (s.ocorrencias || [])) {
      codigosOficiais.push(oc.codigo);
    }
  }
  console.log(`Substancias: ${dados.length} | Plaquinhas no JSON: ${codigosOficiais.length} | Fotos quebradas: ${fotosFaltando}`);

  console.log('\n=== 2. TESTE ONLINE NO RENDER (38 QR CODES IMPRESSOS) ===');
  const ping = await reqStatus(BASE + '/ping');
  console.log('/ping ->', ping.status);

  const aud = await reqStatus(BASE + '/api/auditoria');
  console.log('/api/auditoria ->', aud.status);

  const redirects = ['INF-G01-P6', 'INF-G01-P7'];
  for (const r of redirects) {
    const res = await reqStatus(`${BASE}/plaquinha/${r}`);
    const ok = res.status === 302 && /INF-G0[23]-P5/i.test(res.location);
    console.log(`[${ok ? 'OK' : 'ERRO'}] Redirect ${r} -> status ${res.status} (${res.location})`);
  }

  let erros = 0;
  for (const cod of codigosOficiais) {
    const res = await reqStatus(`${BASE}/plaquinha/${encodeURIComponent(cod)}`);
    if (res.status !== 200) {
      console.log(`[ERRO] ${cod} retornou status ${res.status}`);
      erros++;
    }
  }
  console.log(`\nResultado das ${codigosOficiais.length} rotas oficiais: ${codigosOficiais.length - erros} OK | ${erros} com erro.`);
})();
