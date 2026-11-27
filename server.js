/* ==========================================================================
   AQUI TEM QUÍMICA! — 1º Ano de Informática (UFCIMG — Divinópolis)
   ETAPA 4: Back-end Express, Rotas QR Code, Auditoria, QR Generator & QuímicoBot
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const app = express();

app.use((req, res, next) => {
  let p = decodeURIComponent(req.path).toUpperCase();
  while (p.endsWith('/')) p = p.slice(0, -1);
  if (p === '/PLAQUINHA/INF-G01-P6') return res.redirect(302, '/plaquinha/INF-G02-P5');
  if (p === '/PLAQUINHA/INF-G01-P7') return res.redirect(302, '/plaquinha/INF-G03-P5');
  next();
});

const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join(__dirname, 'data', 'substancias.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const OFFICIAL_ZONES = [
  'Restaurante',
  'Banheiros do prédio 3',
  'Corredores do prédio 1',
  'Corredores do prédio 6',
  'Portaria',
  'Laboratório de informática',
  'Jardim',
  'Estacionamentos',
  'Quadra'
];

const OFFICIAL_CLASSES = ['Ácido', 'Base', 'Sal', 'Óxido'];
const CODE_REGEX = /^INF-G0[1-9]-P[1-8]$/i;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

// --------------------------------------------------------------------------
// UTILITÁRIOS DE DADOS E SEGURANÇA
// --------------------------------------------------------------------------
function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function readSubstances() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[ERRO] Falha ao ler data/substancias.json:', err.message);
    return [];
  }
}

function flattenPlaquinhas(substancias) {
  const list = [];
  substancias.forEach((sub) => {
    (sub.ocorrencias || []).forEach((oc) => {
      list.push({
        codigo: oc.codigo,
        zona: oc.zona,
        localExato: oc.localExato,
        grupo: oc.grupo || sub.grupo,
        autorizacao: oc.autorizacao || null,
        slug: sub.slug,
        nomeIupac: sub.nomeIupac,
        formula: sub.formula,
        classe: sub.classe,
        subtipo: sub.subtipo || ''
      });
    });
  });
  return list;
}

function computeAudit(substancias) {
  const all = flattenPlaquinhas(substancias);
  const valid = all.filter((p) => !p.autorizacao || p.autorizacao.aprovada !== false);
  const invalidCodes = all.filter((p) => !CODE_REGEX.test(p.codigo)).map((p) => p.codigo);

  const porClasse = OFFICIAL_CLASSES.map((classe) => {
    const subset = valid.filter((p) => normalize(p.classe) === normalize(classe));
    const unicas = new Set(subset.map((p) => p.slug)).size;
    return {
      classe,
      totalPlaquinhas: subset.length,
      substanciasUnicas: unicas,
      metaPlaquinhasOk: subset.length >= 6,
      metaUnicasOk: unicas >= 4
    };
  });

  const porZona = OFFICIAL_ZONES.map((zona) => {
    const count = valid.filter((p) => normalize(p.zona) === normalize(zona)).length;
    return { zona, totalPlaquinhas: count, metaOk: count >= 3 };
  });

  const tudoConforme =
    valid.length >= 30 &&
    porClasse.every((c) => c.metaPlaquinhasOk && c.metaUnicasOk) &&
    porZona.every((z) => z.metaOk) &&
    invalidCodes.length === 0;

  return {
    totalGeral: valid.length,
    metaTotalOk: valid.length >= 30,
    tudoConforme,
    codigosForaDoPadrao: invalidCodes,
    porClasse,
    porZona
  };
}

function isDangerousSafetyQuery(message) {
  const q = normalize(message);
  const blockedPhrases = [
    'misturar agua sanitaria',
    'mistura de agua sanitaria',
    'como misturar',
    'mistura caseira',
    'experimento caseiro',
    'teste caseiro',
    'fazer gas cloro',
    'produzir gas cloro',
    'fazer bomba',
    'receita de produto de limpeza',
    'misturar vinagre com'
  ];

  if (blockedPhrases.some((p) => q.includes(p))) return true;
  const asksRecipe = q.includes('mistur') || q.includes('fazer') || q.includes('receita') || q.includes('testar em casa');
  const riskyChem = q.includes('agua sanitaria') || q.includes('amonia') || q.includes('soda caustica') || q.includes('acido muriatico');
  const asksWhyDanger = q.includes('por que') || q.includes('porque') || q.includes('perigo') || q.includes('risco') || q.includes('nao devo');

  return asksRecipe && riskyChem && !asksWhyDanger;
}

// --------------------------------------------------------------------------
// MOTOR LOCAL INTELIGENTE DO QUÍMICOBOT INF (FALLBACK 100% OFFLINE)
// --------------------------------------------------------------------------
const AS_QUESTIONS = [
  '🎯 Pergunta AS (Arrhenius): Qual é o único cátion liberado por um ácido em água e qual é o único ânion liberado por uma base?',
  '🎯 Pergunta AS (Óxidos): O ZnO (pasta térmica do Lab de Informática) reage tanto com HCl quanto com NaOH formando sal e água. Qual é a classificação desse óxido?',
  '🎯 Pergunta AS (Condutividade): Por que o NaCl sólido não acende uma lâmpada em circuito elétrico, mas a solução aquosa de NaCl acende com brilho intenso?',
  '🎯 Pergunta AS (Indicadores): Se gotejarmos fenolftaleína em uma solução básica de NaOH (pH 13), qual cor ela assume? E se for vinagre (pH 2,8)?',
  '🎯 Pergunta AS (Neutralização): Complete e balanceie: CaO(s) + 2 HCl(aq) → ___ + H₂O(l).'
];

function localBotResponder(message, substancias, contextSlug) {
  const q = normalize(message);

  if (q.includes('por que') && (q.includes('agua sanitaria') || q.includes('vinagre') || q.includes('amonia'))) {
    return '⚠️ Excelente pergunta de segurança! A água sanitária contém hipoclorito de sódio (NaClO). Quando entra em contato com ácidos (como o ácido acético do vinagre), ocorre reação liberando gás cloro (Cl₂); com amônia, forma cloraminas. Ambos são gases altamente tóxicos que causam queimaduras nas vias respiratórias. Por isso, NUNCA misture produtos de limpeza.';
  }

  if ((q.includes('pergunta') || q.includes('quiz') || q.includes('revis')) && (q.includes('as') || q.includes('surpresa') || q.includes('prova'))) {
    const chosen = AS_QUESTIONS[Math.floor(Math.random() * AS_QUESTIONS.length)];
    return `${chosen}\n\nResponda aqui ou pratique mais na aba "Lab Virtual & AS"!`;
  }

  if (q.includes('equacao') && contextSlug) {
    const current = substancias.find((s) => normalize(s.slug) === normalize(contextSlug));
    if (current) {
      return `⚗️ Sobre ${current.nomeIupac} (${current.formula}): ${current.equacaoTipo}. ${current.equacaoExplicacao}`;
    }
  }

  if (q.includes('arrhenius')) {
    return '📘 Teoria de Arrhenius (em meio aquoso):\n• Ácido: substância molecular que sofre ionização liberando exclusivamente o cátion H⁺ (ou H₃O⁺).\n• Base: substância que sofre dissociação iônica liberando exclusivamente o ânion OH⁻.\n• Sal: composto iônico que libera ao menos um cátion ≠ H⁺ e um ânion ≠ OH⁻.';
  }

  if (q.includes('ionizacao') && q.includes('dissociacao')) {
    return '⚡ Diferença chave para a AS:\n• Ionização (Ácidos): compostos moleculares formam íons novos ao reagir com a água (ex.: HCl + H₂O → H₃O⁺ + Cl⁻).\n• Dissociação (Bases e Sais): compostos iônicos já possuem íons no cristal, que apenas se separam na água (ex.: NaOH → Na⁺ + OH⁻).';
  }

  if (q.includes('anfotero')) {
    return '🟣 Óxidos anfóteros (como ZnO da pasta térmica no Lab de Informática e Al₂O₃) comportam-se como base diante de ácidos fortes e como ácido diante de bases fortes, gerando sal + água em ambos os casos.';
  }

  if (q.includes('fenolftaleina') || q.includes('bromotimol') || q.includes('indicador')) {
    return '🧪 Indicadores ácido-base:\n• Fenolftaleína: incolor em meio ácido/neutro e rosa-magenta em meio básico (pH > 8,2).\n• Azul de bromotimol: amarelo (ácido), verde (neutro) e azul (básico).\n• Papel tornassol: vermelho em meio ácido e azul em meio básico.';
  }

  if (q.includes('nacl') && (q.includes('conduz') || q.includes('eletricidade'))) {
    return '💡 No estado sólido, os íons Na⁺ e Cl⁻ estão presos em um retículo cristalino rígido. Ao dissolver o sal em água (ou fundi-lo), os íons ficam livres para migrar até os eletrodos, conduzindo corrente elétrica.';
  }

  // Busca inteligente na base das 9 zonas e substâncias cadastradas
  const plaquinhas = flattenPlaquinhas(substancias);
  const words = q.split(/\s+/).filter((w) => w.length >= 2 && !['onde', 'encontro', 'quais', 'temos', 'qual', 'esta', 'como', 'para', 'sobre', 'nos', 'nas', 'dos', 'das'].includes(w));

  const scored = plaquinhas
    .map((p) => {
      const hay = normalize(`${p.codigo} ${p.zona} ${p.localExato} ${p.nomeIupac} ${p.formula} ${p.classe} ${p.subtipo} ${p.grupo}`);
      let hits = 0;
      words.forEach((w) => {
        if (hay.includes(w)) hits += 1;
      });
      return { item: p, hits };
    })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (scored.length > 0) {
    const top = scored.slice(0, 4).map(({ item }) => {
      const labelClasse = normalize(item.classe) === 'oxido' && item.subtipo ? item.subtipo : item.classe;
      return `• ${item.codigo} — ${item.nomeIupac} (${item.formula}) [${labelClasse}]\n  Local: ${item.zona} (${item.localExato})`;
    });
    return `🔎 Encontrei na base do 1º Ano de Informática:\n\n${top.join('\n')}\n\nAcesse o Mapa ou clique no código para abrir os 11 blocos completos!`;
  }

  return '🧪 Sou o QuímicoBot INF! Posso explicar ácidos, bases, sais, óxidos (Arrhenius, pH, indicadores, balanceamento), localizar plaquinhas nas 9 zonas do 1º INF ou enviar uma pergunta surpresa para a AS de 30/11. Como posso ajudar?';
}

async function askGeminiIfConfigured(message, substancias, contextSlug) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const plaquinhasResumo = flattenPlaquinhas(substancias)
    .map((p) => `${p.codigo} | ${p.nomeIupac} (${p.formula}) | ${p.classe} ${p.subtipo} | ${p.zona} - ${p.localExato}`)
    .join('\n');

  const systemPrompt = [
    'Você é o QuímicoBot INF, assistente educacional da turma do 1º ano de Informática (UFCIMG — Escola de Aplicação, Divinópolis) para o projeto "AQUI TEM QUÍMICA!".',
    'Responda em português do Brasil, de forma clara, didática, objetiva (máximo 120 palavras) e cientificamente rigorosa.',
    'Use obrigatoriamente a definição de Arrhenius para ácidos e bases.',
    'REGRA DE SEGURANÇA INVIOLÁVEL: Nunca sugira testes caseiros, experimentos domésticos ou misturas de produtos químicos (especialmente água sanitária com ácidos ou amônia). Se o aluno pedir isso, recuse educadamente e explique o risco.',
    contextSlug ? `O usuário está atualmente visualizando a página da substância slug="${contextSlug}".` : '',
    'Base atual de plaquinhas cadastradas pela turma:',
    plaquinhasResumo
  ].filter(Boolean).join('\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 350 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : null;
}

// --------------------------------------------------------------------------
// ROTAS DE PÁGINAS HTML (INCLUINDO ROTAS DIRETAS DE QR CODE)
// --------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.get('/classes', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'classes.html'));
});

app.get('/mapa', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'mapa.html'));
});

app.get('/laboratorio', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'laboratorio.html'));
});

// ROTAS CRÍTICAS DOS QR CODES: abrem SEMPRE direto a página da substância
app.get('/substancia/:slug', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'substancia.html'));
});

app.get('/plaquinha/:codigo', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'substancia.html'));
});

// --------------------------------------------------------------------------
// ROTAS DE API (DADOS, AUDITORIA, GERADOR DE QR CODE E CHATBOT)
// --------------------------------------------------------------------------
app.get('/api/substancias', (_req, res) => {
  res.json(readSubstances());
});

app.get('/api/substancias/:identificador', (req, res) => {
  const id = normalize(req.params.identificador);
  const substancias = readSubstances();

  const found = substancias.find(
    (s) =>
      normalize(s.slug) === id ||
      (s.ocorrencias || []).some((oc) => normalize(oc.codigo) === id)
  );

  if (!found) {
    return res.status(404).json({ error: 'Substância ou plaquinha não encontrada.' });
  }
  return res.json(found);
});

app.get('/api/auditoria', (_req, res) => {
  const substancias = readSubstances();
  res.json(computeAudit(substancias));
});

// Bônus: Gerador de QR Code sob demanda em alta resolução (ex: /api/qrcode/INF-G01-P1)
app.get('/api/qrcode/:codigo', async (req, res) => {
  const codigo = String(req.params.codigo || '').toUpperCase().trim();
  const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const targetUrl = `${baseUrl}/plaquinha/${encodeURIComponent(codigo)}`;

  try {
    const pngBuffer = await QRCode.toBuffer(targetUrl, {
      type: 'png',
      width: 600,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${codigo}.png"`);
    res.send(pngBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao gerar QR Code.', details: err.message });
  }
});

// Endpoint do QuímicoBot INF (Gemini + Fallback Local + Trava de Segurança)
app.post('/api/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const contextSlug = req.body?.contextSlug || null;

  if (!message) {
    return res.status(400).json({ reply: 'Digite uma pergunta sobre Química Inorgânica ou sobre as plaquinhas da escola.' });
  }

  if (isDangerousSafetyQuery(message)) {
    return res.json({
      mode: 'safety-guard',
      reply: '🚫 Por norma inviolável de segurança do projeto AQUI TEM QUÍMICA!, não posso sugerir misturas de produtos de limpeza ou testes caseiros. Misturar água sanitária (NaClO) com vinagre, ácidos ou amônia libera gás cloro (Cl₂) e cloraminas, que são altamente tóxicos. Se quiser, posso explicar a química por trás desse risco!'
    });
  }

  const substancias = readSubstances();

  try {
    const aiReply = await askGeminiIfConfigured(message, substancias, contextSlug);
    if (aiReply) {
      return res.json({ mode: 'gemini', reply: aiReply });
    }
  } catch (err) {
    console.warn('[QuímicoBot] Fallback local acionado:', err.message);
  }

  return res.json({
    mode: 'local-fallback',
    reply: localBotResponder(message, substancias, contextSlug)
  });
});

// Fallback 404 amigável
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Rota de API não encontrada.' });
  }
  return res.status(404).sendFile(path.join(PUBLIC_DIR, 'substancia.html'));
});

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`  AQUI TEM QUÍMICA! — 1º Ano de Informática (UFCIMG)`);
  console.log(`  Servidor rodando em: http://localhost:${PORT}`);
  console.log(`  Auditoria JSON:      http://localhost:${PORT}/api/auditoria`);
  console.log(`  Exemplo QR Direto:   http://localhost:${PORT}/plaquinha/INF-G01-P1`);
  console.log(`========================================================`);
});