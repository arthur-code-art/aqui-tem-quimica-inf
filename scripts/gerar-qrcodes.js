/* ==========================================================================
   Gerador em Lote de QR Codes — Padrão INF-GRUPO-PLACA (P1 a P8)
   Uso: BASE_URL=https://seu-site.onrender.com npm run qrcodes
   ========================================================================== */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const DATA_PATH = path.join(__dirname, '..', 'data', 'substancias.json');
const OUT_DIR = path.join(__dirname, '..', 'qrcodes');
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function gerarTodos() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const substancias = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  let count = 0;

  for (const sub of substancias) {
    for (const oc of sub.ocorrencias || []) {
      const codigo = String(oc.codigo).toUpperCase().trim();
      const url = `${BASE_URL}/plaquinha/${encodeURIComponent(codigo)}`;
      const outFile = path.join(OUT_DIR, `${codigo}.png`);

      await QRCode.toFile(outFile, url, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#0B0F19',
          light: '#FFFFFF'
        }
      });

      console.log(`✓ ${codigo}.png  ->  ${url}`);
      count += 1;
    }
  }

  console.log(`\nConcluído! ${count} QR Code(s) salvos na pasta ./qrcodes/`);
}

gerarTodos().catch((err) => {
  console.error('Erro ao gerar QR Codes:', err);
  process.exit(1);
});