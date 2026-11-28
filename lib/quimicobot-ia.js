const fs = require('fs');
const path = require('path');
const https = require('https');

const estadoGemini = {
  modeloAtivo: null,
  ultimoStatus: null,
  ultimoErro: null,
  ultimaChamada: null
};

function normalizar(txt) {
  const sub = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
  return String(txt || '')
    .replace(/[₀-₉]/g, (c) => sub[c])
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escaparRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function contemTermo(textoNorm, termoNorm) {
  if (!termoNorm || termoNorm.length < 2) return false;
  const rx = new RegExp('(^|[^a-z0-9])' + escaparRegex(termoNorm) + '($|[^a-z0-9])');
  return rx.test(textoNorm);
}

function reqHttpsJson(urlStr, method, bodyObj, timeoutMs) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const headers = {
      'User-Agent': 'AquiTemQuimicaBot/3.0 (CEFET-MG Divinopolis)',
      'Accept': 'application/json'
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data), raw: data }); }
        catch { resolve({ status: res.statusCode, json: null, raw: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs || 18000, () => { req.destroy(); reject(new Error('timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

function carregarDados() {
  const p = path.join(process.cwd(), 'data', 'substancias.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function montarSystemPrompt(dados, codigoAtual) {
  const totalPlacas = dados.reduce((acc, s) => acc + (s.ocorrencias || []).length, 0);
  const resumo = dados.map((s) => {
    const locs = (s.ocorrencias || []).map((o) => `${o.codigo} (${o.zona}: ${o.localExato})`).join('; ');
    const pops = (s.nomesPopulares || []).length ? ` | Popular: ${s.nomesPopulares.join(', ')}` : '';
    return `- ${s.nomeIupac} [${s.formula}]${pops} | Classe: ${s.classe} | pH~${s.phEstimado ?? 7} | Plaquinhas: ${locs} | Uso: ${s.porQueEstaAqui}`;
  }).join('\n');

  let contextoTela = '';
  if (codigoAtual) {
    for (const s of dados) {
      const oc = (s.ocorrencias || []).find((o) => String(o.codigo).toUpperCase() === codigoAtual.toUpperCase());
      if (oc) {
        contextoTela = `\nPLAQUINHA ABERTA AGORA PELO USUÁRIO: ${oc.codigo} em "${oc.zona}" (${oc.localExato}) — ${s.nomeIupac} (${s.formula}), classe ${s.classe}, pH~${s.phEstimado ?? 7}.`;
        break;
      }
    }
  }

  return `Você é o QuímicoBot IA, assistente oficial do projeto "AQUI TEM QUÍMICA!" do 1º Ano de Informática do CEFET-MG Campus V (Divinópolis).
Regras obrigatórias:
1. Responda sempre em português do Brasil, de forma clara, direta, simpática e sem cortar frases no meio.
2. Prefira respostas objetivas (entre 3 e 10 linhas), usando **negrito** e marcadores simples ("• ") quando ajudar na leitura. Evite tabelas Markdown longas ou títulos com "###".
3. Use os dados oficiais abaixo quando a pergunta for sobre as ${totalPlacas} plaquinhas (${dados.length} substâncias) nas 9 zonas do CEFET-MG Divinópolis. Nunca invente códigos ou locais.
4. Em perguntas sobre misturas perigosas (ex.: água sanitária / hipoclorito com vinagre, ácidos ou amônia), alerte sempre logo no início sobre os gases tóxicos (gás cloro Cl2 ou cloraminas) e reforce que o projeto é apenas observacional.
5. Você também responde normalmente perguntas gerais de Química, outras disciplinas escolares e curiosidades científicas.${contextoTela}

BASE OFICIAL DO PROJETO (${dados.length} substâncias / ${totalPlacas} plaquinhas):
${resumo}`;
}

async function chamarGemini(apiKey, mensagem, historico, dados, codigoAtual) {
  const systemText = montarSystemPrompt(dados, codigoAtual);
  const contents = [];

  if (Array.isArray(historico)) {
    for (const h of historico.slice(-8)) {
      if (!h || !h.texto) continue;
      const role = h.autor === 'bot' ? 'model' : 'user';
      if (contents.length === 0 && role === 'model') continue;
      if (contents.length > 0 && contents[contents.length - 1].role === role) continue;
      contents.push({ role, parts: [{ text: String(h.texto).slice(0, 1200) }] });
    }
  }
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents.pop();
  }
  contents.push({ role: 'user', parts: [{ text: String(mensagem).slice(0, 1500) }] });

  const modelos = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  for (const modelo of modelos) {
    const genConfig = { temperature: 0.65, maxOutputTokens: 1400 };
    if (modelo.startsWith('gemini-2.5')) {
      genConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    const body = {
      systemInstruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: genConfig
    };

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;
      let r = await reqHttpsJson(url, 'POST', body, 20000);

      // Se a API rejeitar thinkingConfig com HTTP 400, tenta novamente sem esse campo
      if (r.status === 400 && body.generationConfig.thinkingConfig) {
        delete body.generationConfig.thinkingConfig;
        r = await reqHttpsJson(url, 'POST', body, 20000);
      }

      estadoGemini.ultimoStatus = r.status;
      estadoGemini.ultimaChamada = new Date().toISOString();

      const cand = r.json && r.json.candidates && r.json.candidates[0];
      const txt = cand && cand.content && cand.content.parts &&
        cand.content.parts.map((p) => p.text || '').join('').trim();

      if (r.status === 200 && txt) {
        estadoGemini.modeloAtivo = modelo;
        estadoGemini.ultimoErro = null;
        return { resposta: txt, fonte: 'IA Gemini' };
      }

      const msgErr = (r.json && r.json.error && r.json.error.message) || `HTTP ${r.status}`;
      estadoGemini.ultimoErro = `${modelo}: ${String(msgErr).slice(0, 140)}`;
    } catch (e) {
      estadoGemini.ultimoStatus = 0;
      estadoGemini.ultimoErro = `${modelo}: ${e.message}`;
    }
  }
  return null;
}

async function buscarWikipediaPt(pergunta) {
  const termo = String(pergunta || '')
    .replace(/^(o que e|o que são|o que sao|quem foi|quem e|como funciona|me explique|explique|fale sobre|me diga sobre|qual e|quais sao|defina|significado de|o que significa)\s+/i, '')
    .replace(/[?!.,;:]+$/g, '')
    .trim();
  if (termo.length < 2) return null;

  try {
    const sUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&utf8=1&format=json&srlimit=1`;
    const s = await reqHttpsJson(sUrl, 'GET', null, 8000);
    const hit = s.json && s.json.query && s.json.query.search && s.json.query.search[0];
    if (!hit || !hit.title) return null;

    const exUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(hit.title)}&format=json`;
    const ex = await reqHttpsJson(exUrl, 'GET', null, 8000);
    const pages = ex.json && ex.json.query && ex.json.query.pages;
    if (!pages) return null;
    const firstKey = Object.keys(pages)[0];
    const page = pages[firstKey];
    if (page && page.extract) {
      let texto = String(page.extract).replace(/\n{2,}/g, '\n\n').trim();
      if (texto.length > 680) {
        const corte = texto.slice(0, 680);
        const fim = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('.\n'));
        texto = (fim > 260 ? corte.slice(0, fim + 1) : corte + '...');
      }
      return { resposta: `**${page.title}**\n\n${texto}`, fonte: 'Wikipédia PT' };
    }
  } catch {}
  return null;
}

function encontrarZonaNaPergunta(q, dados) {
  const zonas = [...new Set(dados.flatMap((s) => (s.ocorrencias || []).map((o) => o.zona)))];
  for (const z of zonas) {
    if (q.includes(normalizar(z))) return z;
  }
  const apelidos = [
    ['laboratorio', /laborat[oó]rio|informatica|\blab\b/],
    ['predio 1', /pr[eé]dio\s*1|corredor.*1/],
    ['predio 6', /pr[eé]dio\s*6|corredor.*6|audit[oó]rio/],
    ['predio 3', /banheiro|pr[eé]dio\s*3/],
    ['estacionamento', /estacionamento/],
    ['restaurante', /restaurante|cantina|refeit[oó]rio/],
    ['portaria', /portaria|entrada/],
    ['jardim', /jardim|gramado/],
    ['quadra', /quadra|gin[aá]sio/]
  ];
  for (const [chave, rx] of apelidos) {
    if (rx.test(q)) {
      const z = zonas.find((item) => normalizar(item).includes(chave));
      if (z) return z;
    }
  }
  return null;
}

async function respostaInteligenteLocal(mensagem, dados, codigoAtual) {
  const q = normalizar(mensagem);
  const totalPlacas = dados.reduce((acc, s) => acc + (s.ocorrencias || []).length, 0);

  // 1. Saudacoes curtas
  if (/^(oi|ola|e ai|eae|bom dia|boa tarde|boa noite|hey|opa|tudo bem|salve)\b/.test(q) && q.length < 36) {
    return {
      resposta: `Olá! 👋 Sou o **QuímicoBot IA** do projeto **AQUI TEM QUÍMICA!** (CEFET-MG Divinópolis).\n\nPosso ajudar com as **${totalPlacas} plaquinhas**, explicar **ácidos, bases, sais, óxidos e pH**, ou responder dúvidas gerais de Química. O que você quer saber?`,
      fonte: 'Modo Inteligente'
    };
  }

  // 2. Seguranca quimica (SEMPRE antes da busca por substancias!)
  if (
    (q.includes('agua sanitaria') || q.includes('hipoclorito') || contemTermo(q, 'naclo') || q.includes('cloro')) &&
    (q.includes('vinagre') || q.includes('amonia') || q.includes('acido') || q.includes('limpa') || q.includes('misturar') || q.includes('mistura') || q.includes('perigo'))
  ) {
    return {
      resposta: '⚠️ **Nunca misture água sanitária (NaClO) com outros produtos de limpeza!**\n\n• Com **vinagre ou ácidos**: libera **gás cloro (Cl₂)**, altamente tóxico e irritante para as vias respiratórias.\n• Com **amônia / limpa-vidros (NH₄OH)**: libera **cloraminas**, gases tóxicos prejudiciais aos olhos e pulmões.\n\nO projeto AQUI TEM QUÍMICA! é estritamente observacional — nunca faça testes caseiros.',
      fonte: 'Segurança Química'
    };
  }

  // 3. Calculadora matematica simples
  const calc = mensagem.match(/(?:quanto\s+[eé]\s+|calcule\s+)?(-?\d+(?:[.,]\d+)?)\s*([+\-*/x×^])\s*(-?\d+(?:[.,]\d+)?)/i);
  if (calc && q.length < 48 && !/inf-g\d+/i.test(mensagem)) {
    const a = parseFloat(calc[1].replace(',', '.'));
    const b = parseFloat(calc[3].replace(',', '.'));
    const op = calc[2].toLowerCase();
    let r = null;
    if (op === '+') r = a + b;
    else if (op === '-') r = a - b;
    else if (op === '*' || op === 'x' || op === '×') r = a * b;
    else if (op === '/' && b !== 0) r = a / b;
    else if (op === '^') r = Math.pow(a, b);
    if (r !== null && Number.isFinite(r)) {
      return { resposta: `🧮 **${calc[1]} ${calc[2]} ${calc[3]} = ${Number(r.toFixed(6))}**`, fonte: 'Calculadora' };
    }
  }

  // 4. Codigo explicito de plaquinha (INF-GXX-PX) ou plaquinha aberta na tela
  const codMatch = mensagem.match(/INF-G\d{2}-P\d+/i);
  const alvoCod = codMatch
    ? codMatch[0].toUpperCase()
    : (codigoAtual && /(essa|esta|aqui|atual|plaquinha|resuma|explique essa|sobre esta)/.test(q) ? codigoAtual.toUpperCase() : '');

  if (alvoCod) {
    for (const s of dados) {
      const oc = (s.ocorrencias || []).find((o) => String(o.codigo).toUpperCase() === alvoCod);
      if (oc) {
        return {
          resposta: `🧪 **${oc.codigo} — ${s.nomeIupac} (${s.formula})**\n\n• **Função:** ${s.classe} (pH ≈ ${s.phEstimado ?? 7})\n• **Local:** ${oc.zona} — ${oc.localExato}\n• **Por que está aqui:** ${s.porQueEstaAqui}\n• **Curiosidade:** ${s.curiosidade}`,
          fonte: 'Ficha do Campus'
        };
      }
    }
  }

  // 5. Conceitos essenciais de Quimica Inorganica
  if ((q.includes('diferenca') || q.includes('diferenca entre')) && q.includes('acido') && q.includes('base')) {
    return {
      resposta: '⚖️ **Diferença entre Ácidos e Bases (Teoria de Arrhenius):**\n\n• **Ácidos (pH < 7):** liberam íons **H⁺** (H₃O⁺) em água, têm sabor azedo e neutralizam bases. Ex.: ácido sulfúrico (H₂SO₄), ácido acético do vinagre.\n• **Bases / Hidróxidos (pH > 7):** liberam íons **OH⁻** em água, têm sabor adstringente e tato escorregadio. Ex.: hidróxido de sódio (NaOH), hidróxido de cálcio (Ca(OH)₂).\n• Quando reagem entre si, ocorre **neutralização**, formando **sal + água**.',
      fonte: 'Química Inorgânica'
    };
  }

  if (/(o que e|oque e|explique|como funciona|escala de)\s+(o\s+)?ph\b/.test(q) || q === 'ph') {
    return {
      resposta: '🌈 **O que é pH (Potencial Hidrogeniônico)?**\n\nÉ uma escala de **0 a 14** que mede o grau de acidez ou alcalinidade de uma solução:\n• **pH < 7:** meio **ácido** (maior concentração de íons H⁺).\n• **pH = 7:** meio **neutro** (como a água pura).\n• **pH > 7:** meio **básico / alcalino** (maior concentração de íons OH⁻).',
      fonte: 'Química Inorgânica'
    };
  }

  // 6. Perguntas sobre zonas do campus ("Quais plaquinhas tem no Laboratorio?")
  const zonaEncontrada = encontrarZonaNaPergunta(q, dados);
  if (zonaEncontrada && /(plaquinha|placa|zona|tem|fica|onde|quais|quais sao|lista|mostrar)/.test(q)) {
    const itens = [];
    dados.forEach((s) => (s.ocorrencias || []).forEach((o) => {
      if (o.zona === zonaEncontrada) {
        itens.push(`• **${o.codigo}**: ${s.nomeIupac} (${s.formula}) — ${o.localExato}`);
      }
    }));
    return {
      resposta: `📍 **Plaquinhas em ${zonaEncontrada} (${itens.length}):**\n\n${itens.join('\n')}`,
      fonte: 'Mapa do Campus'
    };
  }

  // 7. Listar por funcao inorganica ("quais acidos/bases/sais/oxidos tem na escola?")
  if (/(quais|liste|listar|mostrar|quantos|quantas|exemplos)/.test(q)) {
    const mapaClasse = [
      ['Ácido', /\bacid[oa]s?\b/],
      ['Base', /\bbases?\b|\bhidroxidos?\b/],
      ['Sal', /\bsais\b|\bsal\b/],
      ['Óxido', /\boxidos?\b/]
    ];
    for (const [cls, rx] of mapaClasse) {
      if (rx.test(q) && !q.includes('diferenca')) {
        const subs = dados.filter((s) => s.classe === cls);
        const linhas = subs.map((s) => `• **${s.nomeIupac} (${s.formula})** — ${(s.ocorrencias || []).map((o) => o.codigo).join(', ')}`);
        return {
          resposta: `🧪 **${cls}s mapeados no CEFET-MG (${subs.length} substâncias):**\n\n${linhas.join('\n')}`,
          fonte: 'Base do Projeto'
        };
      }
    }
  }

  // 8. Resumo geral do projeto / quantas plaquinhas / zonas
  if (/(quantas plaquinhas|quantas substancias|quais zonas|sobre o projeto|aqui tem quimica)/.test(q)) {
    const zonas = [...new Set(dados.flatMap((s) => (s.ocorrencias || []).map((o) => o.zona)))];
    return {
      resposta: `⚗️ **AQUI TEM QUÍMICA! — CEFET-MG Campus V (Divinópolis)**\n\n• **Acervo:** ${dados.length} substâncias distribuídas em **${totalPlacas} plaquinhas** com QR Code.\n• **9 Zonas:** ${zonas.join(', ')}.\n• **Funções:** Ácidos, Bases, Sais e Óxidos encontrados no cotidiano escolar.`,
      fonte: 'Base do Projeto'
    };
  }

  // 9. Busca por substancia com fronteira de palavra (evita "cal" em "local" e "sal" em "sala")
  let melhorSub = null;
  let melhorScore = 0;
  for (const s of dados) {
    const fNorm = normalizar(s.formula);
    const iupacNorm = normalizar(s.nomeIupac);
    const popsNorm = (s.nomesPopulares || []).map(normalizar).filter((t) => t.length >= 3);

    let score = 0;
    if (fNorm && contemTermo(q, fNorm)) score = Math.max(score, 100 + fNorm.length);
    if (iupacNorm && q.includes(iupacNorm)) score = Math.max(score, 90 + iupacNorm.length);
    for (const pop of popsNorm) {
      if (contemTermo(q, pop)) score = Math.max(score, 70 + pop.length);
    }
    if (score > melhorScore) {
      melhorScore = score;
      melhorSub = s;
    }
  }

  if (melhorSub) {
    const locs = (melhorSub.ocorrencias || []).map((o) => `${o.codigo} (${o.zona})`).join(', ');
    return {
      resposta: `🧪 **${melhorSub.nomeIupac} (${melhorSub.formula})** — **${melhorSub.classe}**\n\n• **pH estimado:** ≈ ${melhorSub.phEstimado ?? 7}\n• **Classificação:** ${melhorSub.justificativa}\n• **Onde está:** ${locs}\n• **Por que está aqui:** ${melhorSub.porQueEstaAqui}`,
      fonte: 'Base do Projeto'
    };
  }

  // 10. Zona citada diretamente sem verbo auxiliar
  if (zonaEncontrada) {
    const itens = [];
    dados.forEach((s) => (s.ocorrencias || []).forEach((o) => {
      if (o.zona === zonaEncontrada) itens.push(`• **${o.codigo}**: ${s.nomeIupac} (${s.formula}) — ${o.localExato}`);
    }));
    return { resposta: `📍 **Plaquinhas em ${zonaEncontrada}:**\n\n${itens.join('\n')}`, fonte: 'Mapa do Campus' };
  }

  // 11. Wikipedia PT para temas gerais
  const wiki = await buscarWikipediaPt(mensagem);
  if (wiki) return wiki;

  return {
    resposta: 'Posso ajudar com dúvidas sobre as **38 plaquinhas do CEFET**, **Química Inorgânica** ou temas científicos gerais.\n\nExemplos: *"Quais plaquinhas tem no Laboratório?"*, *"Explique H2SO4"*, *"Qual a diferença entre ácido e base?"* ou *"O que é osmose?"*.',
    fonte: 'Modo Inteligente'
  };
}

module.exports = function registrarQuimicoBotIA(app) {
  const express = require('express');
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/quimicobot-ia/status', (req, res) => {
    const temChave = Boolean((process.env.GEMINI_API_KEY || '').trim());
    res.json({
      ok: true,
      iaAvancada: temChave,
      modo: temChave ? 'IA Gemini Online' : 'Modo Inteligente + Wikipédia',
      diagnostico: temChave ? estadoGemini : { nota: 'GEMINI_API_KEY não configurada (usando base local + Wikipédia)' }
    });
  });

  app.post('/api/quimicobot-ia', async (req, res) => {
    try {
      const mensagem = String((req.body && req.body.mensagem) || '').trim();
      const historico = (req.body && req.body.historico) || [];
      const codigoAtual = String((req.body && req.body.codigoAtual) || '').trim();
      if (!mensagem) return res.status(400).json({ erro: 'Digite uma pergunta.' });

      const dados = carregarDados();
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();

      if (apiKey) {
        const ia = await chamarGemini(apiKey, mensagem, historico, dados, codigoAtual);
        if (ia) return res.json(ia);
      }

      const local = await respostaInteligenteLocal(mensagem, dados, codigoAtual);
      return res.json(local);
    } catch {
      return res.json({
        resposta: 'Tive uma falha momentânea ao responder. Tente enviar sua pergunta novamente!',
        fonte: 'Modo Inteligente'
      });
    }
  });
};

if (require.main === module) {
  (async () => {
    const dados = carregarDados();
    console.log('\n=== TESTE AUTOMATICO DO QUIMICOBOT IA ===');
    console.log('Substancias carregadas:', dados.length);
    const perguntas = [
      'Qual o local da plaquinha INF-G01-P1?',
      'Posso misturar agua sanitaria e vinagre?',
      'Quais plaquinhas tem no Laboratorio?',
      'Qual a diferenca entre acido e base?',
      'O que e fotossintese?',
      'Quais acidos tem na escola?'
    ];
    for (const p of perguntas) {
      const r = await respostaInteligenteLocal(p, dados, '');
      console.log(`> ${p}\n  [${r.fonte}] ${r.resposta.replace(/\n+/g, ' ').slice(0, 120)}...`);
    }
    console.log('=========================================\n');
  })();
}