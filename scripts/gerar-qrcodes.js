require('dotenv').config();
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const rawUrl = process.env.BASE_URL || 'https://aqui-tem-quimica-inf.onrender.com';
const BASE_URL = rawUrl.replace(/['"\r\n\s]/g, '').replace(/\/+$/, '');

const dataPath = path.join(__dirname, '..', 'data', 'substancias.json');
const outDir = path.join(__dirname, '..', 'qrcodes');

if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

const dados = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const lerTexto = (v) => (typeof v === 'string' ? v.trim() : '');
const escaparHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const itens = new Map();

function extrairPlaquinhas(obj, contexto = {}) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((el) => extrairPlaquinhas(el, contexto));
    return;
  }

  const localAtual =
    [lerTexto(obj.zona), lerTexto(obj.localExato)].filter(Boolean).join(' — ') ||
    lerTexto(obj.local) ||
    contexto.local ||
    '';

  const novoContexto = {
    nome: lerTexto(obj.nomeIupac) || lerTexto(obj.nome) || contexto.nome || '',
    formula: lerTexto(obj.formula) || contexto.formula || '',
    local: localAtual
  };

  if (typeof obj.codigo === 'string' && obj.codigo.trim() !== '') {
    const codigo = obj.codigo.trim();
    if (!itens.has(codigo)) {
      itens.set(codigo, {
        codigo,
        nome: novoContexto.nome || `Plaquinha ${codigo}`,
        formula: novoContexto.formula,
        local: novoContexto.local
      });
    }
  }

  Object.values(obj).forEach((val) => extrairPlaquinhas(val, novoContexto));
}

extrairPlaquinhas(dados);

(async () => {
  const lista = Array.from(itens.values());
  const paginasHtml = [];

  for (const item of lista) {
    const url = `${BASE_URL}/plaquinha/${encodeURIComponent(item.codigo)}`;
    const filePath = path.join(outDir, `${item.codigo}.png`);

    await QRCode.toFile(filePath, url, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    paginasHtml.push(`
      <section class="pagina">
        <p class="projeto">AQUI TEM QUÍMICA! • 1º ANO DE INFORMÁTICA</p>
        <h1 class="codigo">${escaparHtml(item.codigo)}</h1>
        <h2 class="nome">${escaparHtml(item.nome)}${item.formula ? ` (${escaparHtml(item.formula)})` : ''}</h2>
        ${item.local ? `<p class="local">Local: ${escaparHtml(item.local)}</p>` : ''}
        <img class="qr" src="${qrDataUrl}" alt="QR Code ${escaparHtml(item.codigo)}" />
        <p class="instrucao">Aponte a câmera do celular para acessar a ficha completa</p>
        <p class="url">${escaparHtml(url)}</p>
      </section>
    `);

    console.log(`Gerado: ${item.codigo}.png -> ${url}`);
  }

  const htmlCompleto = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Plaquinhas QR Code - Aqui Tem Química</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: Arial, Helvetica, sans-serif; margin: 0; background: #ffffff; color: #0f172a; }
    .pagina {
      height: 250mm;
      box-sizing: border-box;
      border: 2px solid #1e293b;
      border-radius: 16px;
      padding: 24mm 16mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      page-break-after: always;
      break-after: page;
    }
    .pagina:last-child { page-break-after: auto; break-after: auto; }
    .projeto { font-size: 14pt; font-weight: bold; letter-spacing: 1px; color: #0369a1; margin: 0 0 10mm; }
    .codigo { font-size: 36pt; margin: 0 0 6mm; color: #0f172a; }
    .nome { font-size: 20pt; font-weight: 600; margin: 0 0 4mm; color: #334155; }
    .local { font-size: 13pt; color: #475569; margin: 0 0 10mm; }
    .qr { width: 115mm; height: 115mm; object-fit: contain; margin: 6mm 0 10mm; }
    .instrucao { font-size: 14pt; font-weight: bold; margin: 0 0 4mm; }
    .url { font-size: 10pt; color: #64748b; word-break: break-all; margin: 0; }
  </style>
</head>
<body>
  ${paginasHtml.join('\n')}
</body>
</html>`;

  fs.writeFileSync(path.join(outDir, 'plaquinhas-1-por-pagina.html'), htmlCompleto, 'utf-8');
  console.log(`\nTotal de QR Codes gerados: ${lista.length}`);
  console.log('Arquivo pronto para impressão (1 por página): qrcodes/plaquinhas-1-por-pagina.html');
})();