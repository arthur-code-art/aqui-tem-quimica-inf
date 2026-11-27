const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'substancias.json');
const fotosDir = path.join(__dirname, '..', 'public', 'assets', 'img', 'plaquinhas');
const dados = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const arquivos = fs.existsSync(fotosDir) ? fs.readdirSync(fotosDir) : [];

const mapaFotos = new Map();
for (const arq of arquivos) {
  const ext = path.extname(arq).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    const base = path.basename(arq, ext).trim().toUpperCase();
    mapaFotos.set(base, '/assets/img/plaquinhas/' + arq);
  }
}

let vinculadas = 0;
for (const sub of dados) {
  for (const oc of (sub.ocorrencias || [])) {
    const cod = String(oc.codigo || '').trim().toUpperCase();
    if (mapaFotos.has(cod)) {
      const urlFoto = mapaFotos.get(cod);
      oc.fotoPlaquinha = urlFoto;
      if (!sub.fotoPlaquinha || sub.fotoPlaquinha.includes('classe-')) {
        sub.fotoPlaquinha = urlFoto;
      }
      vinculadas++;
    }
  }
}

fs.writeFileSync(dataPath, JSON.stringify(dados, null, 2), 'utf8');
console.log(`Fotos reais vinculadas automaticamente: ${vinculadas}`);
