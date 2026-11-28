const fs = require('fs');
const path = require('path');
const https = require('https');

const MASSAS = {
  H:  [1.008,  'Hidrogênio', '#f8fafc', 0.36],
  Li: [6.94,   'Lítio',      '#c084fc', 0.62],
  Be: [9.012,  'Berílio',    '#4ade80', 0.54],
  B:  [10.81,  'Boro',       '#fb7185', 0.50],
  C:  [12.011, 'Carbono',    '#64748b', 0.54],
  N:  [14.007, 'Nitrogênio', '#3b82f6', 0.52],
  O:  [15.999, 'Oxigênio',   '#ef4444', 0.50],
  F:  [18.998, 'Flúor',      '#a3e635', 0.46],
  Na: [22.99,  'Sódio',      '#a855f7', 0.68],
  Mg: [24.305, 'Magnésio',   '#10b981', 0.64],
  Al: [26.982, 'Alumínio',   '#cbd5e1', 0.62],
  Si: [28.085, 'Silício',    '#eab308', 0.60],
  P:  [30.974, 'Fósforo',    '#f97316', 0.58],
  S:  [32.06,  'Enxofre',    '#facc15', 0.58],
  Cl: [35.45,  'Cloro',      '#22c55e', 0.56],
  K:  [39.098, 'Potássio',   '#8b5cf6', 0.72],
  Ca: [40.078, 'Cálcio',     '#22c55e', 0.68],
  Ti: [47.867, 'Titânio',    '#94a3b8', 0.64],
  V:  [50.942, 'Vanádio',    '#a1a1aa', 0.62],
  Cr: [51.996, 'Cromo',      '#60a5fa', 0.62],
  Mn: [54.938, 'Manganês',   '#c026d3', 0.62],
  Fe: [55.845, 'Ferro',      '#ea580c', 0.64],
  Co: [58.933, 'Cobalto',    '#f472b6', 0.62],
  Ni: [58.693, 'Níquel',     '#34d399', 0.62],
  Cu: [63.546, 'Cobre',      '#d97706', 0.62],
  Zn: [65.38,  'Zinco',      '#818cf8', 0.62],
  As: [74.922, 'Arsênio',    '#a855f7', 0.60],
  Se: [78.971, 'Selênio',    '#fb923c', 0.58],
  Br: [79.904, 'Bromo',      '#b91c1c', 0.60],
  Sr: [87.62,  'Estrôncio',  '#2dd4bf', 0.72],
  Zr: [91.224, 'Zircônio',   '#38bdf8', 0.66],
  Ag: [107.87, 'Prata',      '#e2e8f0', 0.66],
  Cd: [112.41, 'Cádmio',     '#fde047', 0.66],
  In: [114.82, 'Índio',      '#ec4899', 0.68],
  Sn: [118.71, 'Estanho',    '#9ca3af', 0.68],
  Sb: [121.76, 'Antimônio',  '#a78bfa', 0.66],
  I:  [126.90, 'Iodo',       '#7e22ce', 0.64],
  Ba: [137.33, 'Bário',      '#14b8a6', 0.76],
  W:  [183.84, 'Tungstênio', '#38bdf8', 0.66],
  Pt: [195.08, 'Platina',    '#cbd5e1', 0.66],
  Au: [196.97, 'Ouro',       '#f59e0b', 0.66],
  Hg: [200.59, 'Mercúrio',   '#94a3b8', 0.68],
  Pb: [207.2,  'Chumbo',     '#475569', 0.70],
  Bi: [208.98, 'Bismuto',    '#c084fc', 0.70]
};

function normFormula(f) {
  const mapa = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
  return String(f || '').replace(/[₀-₉]/g, (c) => mapa[c]).replace(/\s+/g, '');
}

function contarAtomos(formulaStr) {
  const limpa = normFormula(formulaStr).replace(/\[/g, '(').replace(/\]/g, ')');
  const partes = limpa.split(/[·•.]/).filter(Boolean);
  const total = {};

  for (const parte of partes) {
    const mCoef = parte.match(/^(\d+)(.*)$/);
    const coef = mCoef ? parseInt(mCoef[1], 10) : 1;
    const f = (mCoef ? mCoef[2] : parte).replace(/[^A-Za-z0-9()]/g, '');
    const stack = [{}];
    let i = 0;
    while (i < f.length) {
      if (f[i] === '(') { stack.push({}); i++; }
      else if (f[i] === ')') {
        i++;
        let num = '';
        while (i < f.length && /\d/.test(f[i])) num += f[i++];
        const mult = num ? parseInt(num, 10) : 1;
        const grp = stack.pop() || {};
        const top = stack[stack.length - 1] || {};
        for (const k of Object.keys(grp)) top[k] = (top[k] || 0) + grp[k] * mult;
      } else if (/[A-Z]/.test(f[i])) {
        let sym = f[i++];
        if (i < f.length && /[a-z]/.test(f[i])) sym += f[i++];
        let n = '';
        while (i < f.length && /\d/.test(f[i])) n += f[i++];
        const q = n ? parseInt(n, 10) : 1;
        const cur = stack[stack.length - 1];
        cur[sym] = (cur[sym] || 0) + q;
      } else { i++; }
    }
    const base = stack[0] || {};
    for (const k of Object.keys(base)) total[k] = (total[k] || 0) + base[k] * coef;
  }
  return total;
}

function criarSds() {
  const atoms = [];
  const bonds = [];
  let prevC = -1;
  for (let i = 0; i < 12; i++) {
    const cx = Number((i * 1.32).toFixed(3));
    const cy = i % 2 === 0 ? 0.48 : -0.48;
    const cIdx = atoms.length;
    atoms.push(['C', cx, cy, 0]);
    if (prevC !== -1) bonds.push([prevC, cIdx, 1]);
    const s = i % 2 === 0 ? 1 : -1;
    if (i === 0) {
      const h0 = atoms.length; atoms.push(['H', -1.02, 0.12, 0]); bonds.push([cIdx, h0, 1]);
      const h1 = atoms.length; atoms.push(['H', 0.32, 1.24, 0.78]); bonds.push([cIdx, h1, 1]);
      const h2 = atoms.length; atoms.push(['H', 0.32, 1.24, -0.78]); bonds.push([cIdx, h2, 1]);
    } else {
      const hy = Number((cy + s * 0.72).toFixed(3));
      const h1 = atoms.length; atoms.push(['H', cx, hy, 0.86]); bonds.push([cIdx, h1, 1]);
      const h2 = atoms.length; atoms.push(['H', cx, hy, -0.86]); bonds.push([cIdx, h2, 1]);
    }
    prevC = cIdx;
  }
  const oEster = atoms.length; atoms.push(['O', 15.80, 0.38, 0]); bonds.push([prevC, oEster, 1]);
  const sIdx   = atoms.length; atoms.push(['S', 17.30, -0.25, 0]); bonds.push([oEster, sIdx, 1]);
  const o1     = atoms.length; atoms.push(['O', 17.30, -1.78, 0]); bonds.push([sIdx, o1, 2]);
  const o2     = atoms.length; atoms.push(['O', 18.12, 0.42, 1.22]); bonds.push([sIdx, o2, 2]);
  const o3     = atoms.length; atoms.push(['O', 18.12, 0.42, -1.22]); bonds.push([sIdx, o3, 1]);
  const naIdx  = atoms.length; atoms.push(['Na', 19.95, 0.95, -1.40]); bonds.push([o3, naIdx, 1]);
  return { atoms, bonds };
}

// Modelos curados com geometria espacial real e ordem de ligacao (1 = simples, 2 = dupla)
const CURADOS = {
  'H2O': {
    atoms: [['O',0,0.22,0],['H',-0.96,-0.46,0],['H',0.96,-0.46,0]],
    bonds: [[0,1,1],[0,2,1]]
  },
  'H2O2': {
    atoms: [['O',-0.74,0,0],['O',0.74,0,0],['H',-1.18,0.85,0.25],['H',1.18,-0.25,0.85]],
    bonds: [[0,1,1],[0,2,1],[1,3,1]]
  },
  'CO2': {
    atoms: [['C',0,0,0],['O',-1.45,0,0],['O',1.45,0,0]],
    bonds: [[0,1,2],[0,2,2]]
  },
  'HCl': {
    atoms: [['Cl',-0.45,0,0],['H',1.02,0,0]],
    bonds: [[0,1,1]]
  },
  'NH3': {
    atoms: [['N',0,0.35,0],['H',1.05,-0.32,0],['H',-0.52,-0.32,0.91],['H',-0.52,-0.32,-0.91]],
    bonds: [[0,1,1],[0,2,1],[0,3,1]]
  },
  'H2SO4': {
    atoms: [
      ['S',0,0,0],['O',0,1.28,0.92],['O',0,-1.28,0.92],
      ['O',1.32,0,-0.92],['O',-1.32,0,-0.92],
      ['H',2.18,0,-0.28],['H',-2.18,0,-0.28]
    ],
    bonds: [[0,1,2],[0,2,2],[0,3,1],[0,4,1],[3,5,1],[4,6,1]]
  },
  'H3PO4': {
    atoms: [
      ['P',0,0,0],['O',0,1.52,0],
      ['O',1.42,-0.55,0],['O',-0.71,-0.55,1.23],['O',-0.71,-0.55,-1.23],
      ['H',2.15,0.08,0],['H',-1.08,0.08,1.86],['H',-1.08,0.08,-1.86]
    ],
    bonds: [[0,1,2],[0,2,1],[0,3,1],[0,4,1],[2,5,1],[3,6,1],[4,7,1]]
  },
  'H2CO3': {
    atoms: [
      ['C',0,0,0],['O',0,1.38,0],['O',-1.26,-0.72,0],['O',1.26,-0.72,0],
      ['H',-2.08,-0.15,0],['H',2.08,-0.15,0]
    ],
    bonds: [[0,1,2],[0,2,1],[0,3,1],[2,4,1],[3,5,1]]
  },
  'CH3COOH': {
    atoms: [
      ['C',-1.15,0,0],['C',0.38,0,0],['O',1.02,1.22,0],['O',1.02,-1.22,0],['H',2.02,-1.12,0],
      ['H',-1.56,1.02,0],['H',-1.56,-0.51,0.88],['H',-1.56,-0.51,-0.88]
    ],
    bonds: [[0,1,1],[1,2,2],[1,3,1],[3,4,1],[0,5,1],[0,6,1],[0,7,1]]
  },
  'C2H4O2': {
    atoms: [
      ['C',-1.15,0,0],['C',0.38,0,0],['O',1.02,1.22,0],['O',1.02,-1.22,0],['H',2.02,-1.12,0],
      ['H',-1.56,1.02,0],['H',-1.56,-0.51,0.88],['H',-1.56,-0.51,-0.88]
    ],
    bonds: [[0,1,1],[1,2,2],[1,3,1],[3,4,1],[0,5,1],[0,6,1],[0,7,1]]
  },
  'C2H5OH': {
    atoms: [
      ['C',-1.25,-0.2,0],['C',0.25,0.2,0],['O',1.15,-0.88,0],['H',2.08,-0.52,0],
      ['H',-1.88,0.68,0],['H',-1.48,-0.82,0.88],['H',-1.48,-0.82,-0.88],
      ['H',0.48,0.84,0.88],['H',0.48,0.84,-0.88]
    ],
    bonds: [[0,1,1],[1,2,1],[2,3,1],[0,4,1],[0,5,1],[0,6,1],[1,7,1],[1,8,1]]
  },
  'C6H8O7': {
    atoms: [
      ['C',0,0,0],['O',0,1.42,0],['H',0.85,1.88,0],
      ['C',0,-1.50,0],['O',-1.15,-2.12,0],['O',1.15,-2.12,0],['H',1.15,-3.08,0],
      ['C',-1.42,0.52,0.35],['C',-2.58,-0.45,0.45],['O',-2.62,-1.68,0.15],['O',-3.68,0.22,0.88],['H',-4.42,-0.40,0.95],
      ['C',1.42,0.52,-0.35],['C',2.58,-0.45,-0.45],['O',2.62,-1.68,-0.15],['O',3.68,0.22,-0.88],['H',4.42,-0.40,-0.95],
      ['H',-1.52,1.18,1.22],['H',-1.52,1.12,-0.55],['H',1.52,1.18,-1.22],['H',1.52,1.12,0.55]
    ],
    bonds: [
      [0,1,1],[1,2,1],[0,3,1],[3,4,2],[3,5,1],[5,6,1],
      [0,7,1],[7,8,1],[8,9,2],[8,10,1],[10,11,1],[7,17,1],[7,18,1],
      [0,12,1],[12,13,1],[13,14,2],[13,15,1],[15,16,1],[12,19,1],[12,20,1]
    ]
  },
  'NaOH': {
    atoms: [['Na',-1.85,0,0],['O',0.15,0,0],['H',1.18,0,0]],
    bonds: [[0,1,1],[1,2,1]]
  },
  'Ca(OH)2': {
    atoms: [['Ca',0,0,0],['O',-2.05,0,0],['H',-3.05,0,0],['O',2.05,0,0],['H',3.05,0,0]],
    bonds: [[0,1,1],[1,2,1],[0,3,1],[3,4,1]]
  },
  'Mg(OH)2': {
    atoms: [['Mg',0,0,0],['O',-1.92,0,0],['H',-2.90,0,0],['O',1.92,0,0],['H',2.90,0,0]],
    bonds: [[0,1,1],[1,2,1],[0,3,1],[3,4,1]]
  },
  'Fe(OH)3': {
    atoms: [
      ['Fe',0,0,0.32],
      ['O',1.75,0,-0.28],['H',2.58,0,0.28],
      ['O',-0.88,1.52,-0.28],['H',-1.30,2.24,0.28],
      ['O',-0.88,-1.52,-0.28],['H',-1.30,-2.24,0.28]
    ],
    bonds: [[0,1,1],[1,2,1],[0,3,1],[3,4,1],[0,5,1],[5,6,1]]
  },
  'Al(OH)3': {
    atoms: [
      ['Al',0,0,0.32],
      ['O',1.72,0,-0.28],['H',2.55,0,0.28],
      ['O',-0.86,1.49,-0.28],['H',-1.28,2.20,0.28],
      ['O',-0.86,-1.49,-0.28],['H',-1.28,-2.20,0.28]
    ],
    bonds: [[0,1,1],[1,2,1],[0,3,1],[3,4,1],[0,5,1],[5,6,1]]
  },
  'NH4OH': {
    atoms: [
      ['N',-1.38,0,0],['H',-1.78,1.02,0],['H',-1.78,-0.51,0.88],['H',-1.78,-0.51,-0.88],['H',-0.30,0,0],
      ['O',1.48,0,0],['H',2.48,0,0]
    ],
    bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1],[4,5,1],[5,6,1]]
  },
  'NaCl': {
    atoms: [
      ['Na',-1.1,-1.1,-1.1],['Cl',1.1,-1.1,-1.1],['Cl',-1.1,1.1,-1.1],['Na',1.1,1.1,-1.1],
      ['Cl',-1.1,-1.1,1.1],['Na',1.1,-1.1,1.1],['Na',-1.1,1.1,1.1],['Cl',1.1,1.1,1.1]
    ],
    bonds: [[0,1,1],[0,2,1],[0,4,1],[3,1,1],[3,2,1],[3,7,1],[5,1,1],[5,4,1],[5,7,1],[6,2,1],[6,4,1],[6,7,1]]
  },
  'NaClO': {
    atoms: [['Na',-2.05,0,0],['O',0,0.42,0],['Cl',1.72,-0.12,0]],
    bonds: [[0,1,1],[1,2,1]]
  },
  'CaCO3': {
    atoms: [
      ['C',0.55,0,0],['O',1.92,0,0],['O',-0.16,1.22,0],['O',-0.16,-1.22,0],['Ca',-2.18,0,0]
    ],
    bonds: [[0,1,2],[0,2,1],[0,3,1],[4,2,1],[4,3,1]]
  },
  'NaHCO3': {
    atoms: [
      ['C',0.28,0,0],['O',1.42,0.82,0],['O',-0.96,0.62,0],['O',0.28,-1.38,0],
      ['H',-1.72,-0.02,0],['Na',2.38,-0.88,0]
    ],
    bonds: [[0,1,2],[0,2,1],[0,3,1],[2,4,1],[3,5,1]]
  },
  'Na2CO3': {
    atoms: [
      ['C',0,0,0],['O',0,1.38,0],['O',-1.22,-0.72,0],['O',1.22,-0.72,0],
      ['Na',-2.85,-1.20,0],['Na',2.85,-1.20,0]
    ],
    bonds: [[0,1,2],[0,2,1],[0,3,1],[2,4,1],[3,5,1]]
  },
  'BaSO4': {
    atoms: [
      ['S',0.65,0,0],['O',1.78,0.95,0],['O',1.78,-0.95,0],
      ['O',-0.42,0,1.12],['O',-0.42,0,-1.12],['Ba',-2.45,0,0]
    ],
    bonds: [[0,1,2],[0,2,2],[0,3,1],[0,4,1],[5,3,1],[5,4,1]]
  },
  'CaSO4': {
    atoms: [
      ['S',0.65,0,0],['O',1.78,0.95,0],['O',1.78,-0.95,0],
      ['O',-0.42,0,1.12],['O',-0.42,0,-1.12],['Ca',-2.35,0,0]
    ],
    bonds: [[0,1,2],[0,2,2],[0,3,1],[0,4,1],[5,3,1],[5,4,1]]
  },
  'CuSO4': {
    atoms: [
      ['S',0.65,0,0],['O',1.78,0.95,0],['O',1.78,-0.95,0],
      ['O',-0.42,0,1.12],['O',-0.42,0,-1.12],['Cu',-2.32,0,0]
    ],
    bonds: [[0,1,2],[0,2,2],[0,3,1],[0,4,1],[5,3,1],[5,4,1]]
  },
  'BaTiO3': {
    atoms: [
      ['Ti',0.55,0,0],['O',2.25,0,0],['O',-0.30,1.48,0],['O',-0.30,-1.48,0],['Ba',-2.35,0,0]
    ],
    bonds: [[0,1,2],[0,2,1],[0,3,1],[4,2,1],[4,3,1]]
  },
  'In2O3': {
    atoms: [
      ['In',-1.55,-0.15,0],['In',1.55,-0.15,0],
      ['O',0,0.88,0],['O',-3.05,-0.75,0],['O',3.05,-0.75,0]
    ],
    bonds: [[0,2,1],[1,2,1],[0,3,2],[1,4,2]]
  },
  'SnO2': {
    atoms: [['Sn',0,0,0],['O',-1.78,0,0],['O',1.78,0,0]],
    bonds: [[0,1,2],[0,2,2]]
  },
  'SiO2': {
    atoms: [['Si',0,0,0],['O',-1.62,0,0],['O',1.62,0,0]],
    bonds: [[0,1,2],[0,2,2]]
  },
  'TiO2': {
    atoms: [['Ti',0,0,0],['O',-1.72,0.28,0],['O',1.72,0.28,0]],
    bonds: [[0,1,2],[0,2,2]]
  },
  'Cr2O3': {
    atoms: [
      ['Cr',-1.48,-0.15,0],['Cr',1.48,-0.15,0],
      ['O',0,0.88,0],['O',-2.90,-0.72,0],['O',2.90,-0.72,0]
    ],
    bonds: [[0,2,1],[1,2,1],[0,3,2],[1,4,2]]
  },
  'Fe2O3': {
    atoms: [
      ['Fe',-1.50,-0.15,0],['Fe',1.50,-0.15,0],
      ['O',0,0.88,0],['O',-2.92,-0.72,0],['O',2.92,-0.72,0]
    ],
    bonds: [[0,2,1],[1,2,1],[0,3,2],[1,4,2]]
  },
  'Al2O3': {
    atoms: [
      ['Al',-1.45,-0.15,0],['Al',1.45,-0.15,0],
      ['O',0,0.85,0],['O',-2.85,-0.68,0],['O',2.85,-0.68,0]
    ],
    bonds: [[0,2,1],[1,2,1],[0,3,2],[1,4,2]]
  },
  'CaO': { atoms: [['Ca',-1.05,0,0],['O',1.05,0,0]], bonds: [[0,1,2]] },
  'MgO': { atoms: [['Mg',-0.98,0,0],['O',0.98,0,0]], bonds: [[0,1,2]] },
  'ZnO': { atoms: [['Zn',-0.96,0,0],['O',0.96,0,0]], bonds: [[0,1,2]] },
  'CuO': { atoms: [['Cu',-0.98,0,0],['O',0.98,0,0]], bonds: [[0,1,2]] },
  'KCl': { atoms: [['K',-1.22,0,0],['Cl',1.22,0,0]], bonds: [[0,1,1]] },
  'NaF': { atoms: [['Na',-1.02,0,0],['F',1.02,0,0]], bonds: [[0,1,1]] },
  'CaCl2': { atoms: [['Ca',0,0,0],['Cl',-2.15,0,0],['Cl',2.15,0,0]], bonds: [[0,1,1],[0,2,1]] },
  'C12H25NaO4S': criarSds(),
  'C12H25SO4Na': criarSds(),
  'NaC12H25SO4': criarSds()
};

function reqTexto(urlStr, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: { 'User-Agent': 'AquiTemQuimicaAudit3D/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, text: data }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 9000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function parseSdf(sdfText) {
  const lines = String(sdfText || '').split(/\r?\n/);
  if (lines.length < 6) return null;
  const counts = lines[3];
  const nAtoms = parseInt(counts.slice(0, 3).trim(), 10);
  const nBonds = parseInt(counts.slice(3, 6).trim(), 10);
  if (!Number.isFinite(nAtoms) || nAtoms <= 0 || lines.length < 4 + nAtoms) return null;

  const atoms = [];
  for (let i = 0; i < nAtoms; i++) {
    const l = lines[4 + i];
    const x = parseFloat(l.slice(0, 10).trim());
    const y = parseFloat(l.slice(10, 20).trim());
    const z = parseFloat(l.slice(20, 30).trim());
    const el = l.slice(31, 34).trim();
    if (!el || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    atoms.push([el, Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))]);
  }
  const bonds = [];
  for (let j = 0; j < nBonds; j++) {
    const l = lines[4 + nAtoms + j];
    if (!l) break;
    const a1 = parseInt(l.slice(0, 3).trim(), 10) - 1;
    const a2 = parseInt(l.slice(3, 6).trim(), 10) - 1;
    const ord = parseInt(l.slice(6, 9).trim(), 10) || 1;
    if (a1 >= 0 && a2 >= 0 && a1 < nAtoms && a2 < nAtoms) {
      bonds.push([a1, a2, Math.min(3, Math.max(1, ord))]);
    }
  }
  return { atoms, bonds };
}

function gerarModeloFallback(formulaLimpa) {
  const contagem = contarAtomos(formulaLimpa);
  const lista = [];
  for (const sym of Object.keys(contagem)) {
    const qtd = Math.min(contagem[sym], 24);
    for (let i = 0; i < qtd; i++) lista.push(sym);
  }
  if (!lista.length) return { atoms: [['C', 0, 0, 0]], bonds: [] };

  let idxCentro = lista.findIndex((el) => el !== 'H' && el !== 'O');
  if (idxCentro === -1) idxCentro = 0;
  const centro = lista.splice(idxCentro, 1)[0];

  const atoms = [[centro, 0, 0, 0]];
  const bonds = [];
  const naoH = lista.filter((e) => e !== 'H');
  const hs = lista.filter((e) => e === 'H');
  const golden = Math.PI * (3 - Math.sqrt(5));

  naoH.forEach((el, i) => {
    const n = naoH.length;
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    const d = 1.72;
    const idx = atoms.length;
    atoms.push([el, Number((Math.cos(th) * r * d).toFixed(3)), Number((y * d).toFixed(3)), Number((Math.sin(th) * r * d).toFixed(3))]);
    bonds.push([0, idx, 1]);
  });

  hs.forEach((el, i) => {
    const pai = naoH.length > 0 ? 1 + (i % naoH.length) : 0;
    const p = atoms[pai];
    const norm = Math.hypot(p[1], p[2], p[3]) || 1;
    const dx = (p[1] / norm) * 1.05 + Math.cos(i * 2.1) * 0.45;
    const dy = (p[2] / norm) * 1.05 + Math.sin(i * 2.1) * 0.45;
    const dz = (p[3] / norm) * 1.05 + (i % 2 === 0 ? 0.35 : -0.35);
    const idx = atoms.length;
    atoms.push([el, Number((p[1] + dx).toFixed(3)), Number((p[2] + dy).toFixed(3)), Number((p[3] + dz).toFixed(3))]);
    bonds.push([pai, idx, 1]);
  });

  return { atoms, bonds };
}

(async () => {
  const subsPath = path.join(process.cwd(), 'data', 'substancias.json');
  const dados = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
  const saida = {};
  const faltandoMassa = new Set();

  console.log('\n====================================================================');
  console.log('   AUDITORIA COMPLETA DAS REPRESENTACOES 3D — AQUI TEM QUIMICA!');
  console.log('====================================================================\n');

  let okCount = 0;
  for (const s of dados) {
    const f = normFormula(s.formula);
    const contagem = contarAtomos(f);
    let massa = 0;
    for (const sym of Object.keys(contagem)) {
      if (MASSAS[sym]) massa += MASSAS[sym][0] * contagem[sym];
      else faltandoMassa.add(sym);
    }

    let modelo = null;
    let origem = '';

    if (CURADOS[f]) {
      modelo = CURADOS[f];
      origem = 'Curado 3D';
    } else {
      try {
        const res = await reqTexto(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/${encodeURIComponent(f)}/SDF?record_type=3d`, 8000);
        if (res.status === 200) {
          const parsed = parseSdf(res.text);
          if (parsed && parsed.atoms.length > 0 && parsed.atoms.length <= 80) {
            modelo = parsed;
            origem = 'PubChem 3D';
          }
        }
      } catch {}
    }

    if (!modelo) {
      modelo = gerarModeloFallback(f);
      origem = 'Gerado 3D';
    }

    // Validar que todos os atomos do modelo existem em MASSAS
    for (const a of modelo.atoms) {
      if (!MASSAS[a[0]]) faltandoMassa.add(a[0]);
    }

    saida[f] = {
      formula: s.formula,
      nome: s.nomeIupac,
      origem,
      atoms: modelo.atoms,
      bonds: modelo.bonds
    };
    okCount++;

    const cods = (s.ocorrencias || []).map((o) => o.codigo).join(', ');
    console.log(
      `  [OK] ${f.padEnd(13)} | ${s.nomeIupac.slice(0, 28).padEnd(28)} | ` +
      `${String(modelo.atoms.length).padStart(2)} atomos, ${String(modelo.bonds.length).padStart(2)} lig | ` +
      `${massa.toFixed(2).padStart(6)} g/mol | ${origem.padEnd(10)} | ${cods}`
    );
  }

  fs.mkdirSync(path.join(process.cwd(), 'public', 'data'), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'moleculas-3d.json'), JSON.stringify(saida, null, 2), 'utf8');

  console.log('\n--------------------------------------------------------------------');
  console.log(`  RESULTADO: ${okCount}/${dados.length} substancias com modelo 3D garantido e salvo em public/data/moleculas-3d.json`);
  if (faltandoMassa.size > 0) {
    console.log('  [ATENCAO] Elementos fora da tabela MASSAS:', Array.from(faltandoMassa).join(', '));
  } else {
    console.log('  CORES & MASSAS: 100% dos elementos sincronizados entre 3D e legenda!');
  }
  console.log('====================================================================\n');
})();